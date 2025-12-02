#!/usr/bin/env npx tsx
/**
 * TS24 QA Monitor Script
 *
 * Real-time monitoring of critical QA endpoints.
 * Tracks: status codes, latency, cookie presence, fail/success rate.
 *
 * Usage: npm run qa:monitor
 * Env: QA_BASE_URL (default: https://intel24.blackbox.codes)
 */

interface EndpointConfig {
  name: string;
  path: string;
  method: 'GET' | 'POST';
  expectedStatus: number[];
  checkCookie?: string;
  timeout: number;
}

interface MonitorResult {
  endpoint: string;
  status: number | 'ERROR';
  latency: number;
  cookiePresent: boolean | null;
  success: boolean;
  error?: string;
  timestamp: Date;
}

interface MonitorStats {
  total: number;
  success: number;
  failed: number;
  avgLatency: number;
  successRate: number;
}

// Extended tracking for QA Standby Mode
interface LatencyLogEntry {
  timestamp: string;
  endpoint: string;
  latency: number;
  status: number | 'ERROR';
}

interface CookieConsistencyLog {
  timestamp: string;
  present: boolean;
  consecutive: number;
}

interface VerifyCounters {
  success: number;
  fail: number;
  lastSuccess: string | null;
  lastFail: string | null;
}

interface SsoLoginObservation {
  timestamp: string;
  status: number | 'ERROR';
  redirectLocation: string | null;
  cookieSet: boolean;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: 'SSO Verify',
    path: '/api/auth/verify',
    method: 'GET',
    expectedStatus: [200, 401], // Both valid responses
    timeout: 5000,
  },
  {
    name: 'SSO Login',
    path: '/sso-login',
    method: 'GET',
    expectedStatus: [302, 400], // Redirect or missing token
    timeout: 5000,
  },
  {
    name: 'Health Check',
    path: '/api/health',
    method: 'GET',
    expectedStatus: [200],
    timeout: 3000,
  },
  {
    name: 'Dashboard Load',
    path: '/',
    method: 'GET',
    expectedStatus: [200],
    checkCookie: 'ts24_sso_session',
    timeout: 10000,
  },
];

const BASE_URL = process.env.QA_BASE_URL || 'https://intel24.blackbox.codes';
const POLL_INTERVAL = parseInt(process.env.QA_POLL_INTERVAL || '10000', 10);
const VERBOSE = process.env.QA_VERBOSE === '1';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

type WarRoomEventType =
  | 'latency-spike'
  | 'verify-fail'
  | 'cookie-desync'
  | 'redirect-anomaly'
  | 'health-degraded'
  | 'health-recovered';

const WAR_ROOM_CONFIG = {
  latencySpikeMs: parseInt(process.env.QA_LATENCY_SPIKE || '200', 10),
  healthSuccessFloor: parseFloat(process.env.QA_HEALTH_SUCCESS || '99'),
};

const warRoomState = {
  healthDegraded: false,
};

const stats: Map<string, MonitorStats> = new Map();
const resultHistory: MonitorResult[] = [];
const MAX_HISTORY = 1000;

// QA Standby Mode: Extended logging (read-only)
const latencyLog: LatencyLogEntry[] = [];
const cookieConsistencyLog: CookieConsistencyLog[] = [];
const verifyCounters: VerifyCounters = {
  success: 0,
  fail: 0,
  lastSuccess: null,
  lastFail: null,
};
const ssoLoginObservations: SsoLoginObservation[] = [];
let consecutiveCookiePresent = 0;
let consecutiveCookieMissing = 0;
const MAX_LOG_ENTRIES = 500;

const logWarRoomEvent = (type: WarRoomEventType, details: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  console.info(`[war-room] ${type}`, { timestamp, ...details });
};

function initStats(): void {
  ENDPOINTS.forEach((ep) => {
    stats.set(ep.name, {
      total: 0,
      success: 0,
      failed: 0,
      avgLatency: 0,
      successRate: 100,
    });
  });
}

function updateStats(result: MonitorResult): void {
  const stat = stats.get(result.endpoint);
  if (!stat) return;

  stat.total++;
  if (result.success) {
    stat.success++;
  } else {
    stat.failed++;
  }

  // Rolling average latency
  stat.avgLatency = Math.round(
    (stat.avgLatency * (stat.total - 1) + result.latency) / stat.total
  );
  stat.successRate = Math.round((stat.success / stat.total) * 100);

  // Store in history (limited)
  resultHistory.push(result);
  if (resultHistory.length > MAX_HISTORY) {
    resultHistory.shift();
  }

  // QA Standby: Extended logging (read-only observations)
  logLatencyEntry(result);
  if (result.endpoint === 'SSO Verify') {
    updateVerifyCounters(result);
  }
  if (result.cookiePresent !== null) {
    logCookieConsistency(result.cookiePresent);
  }

  monitorHealthDegradation();
}

// QA Standby: Timestamped latency logging
function logLatencyEntry(result: MonitorResult): void {
  const entry: LatencyLogEntry = {
    timestamp: new Date().toISOString(),
    endpoint: result.endpoint,
    latency: result.latency,
    status: result.status,
  };
  latencyLog.push(entry);
  if (latencyLog.length > MAX_LOG_ENTRIES) {
    latencyLog.shift();
  }

  if (result.latency > WAR_ROOM_CONFIG.latencySpikeMs) {
    logWarRoomEvent('latency-spike', {
      endpoint: result.endpoint,
      latency: result.latency,
      status: result.status,
    });
  }
}

// QA Standby: Verify success/fail counters
function updateVerifyCounters(result: MonitorResult): void {
  const timestamp = new Date().toISOString();
  if (result.status === 200) {
    verifyCounters.success++;
    verifyCounters.lastSuccess = timestamp;
  } else if (result.status === 401 || result.status === 'ERROR') {
    verifyCounters.fail++;
    verifyCounters.lastFail = timestamp;
    logWarRoomEvent('verify-fail', {
      status: result.status,
      latency: result.latency,
    });
  }
}

// QA Standby: Cookie consistency tracking
function logCookieConsistency(present: boolean): void {
  if (present) {
    consecutiveCookiePresent++;
    consecutiveCookieMissing = 0;
  } else {
    consecutiveCookieMissing++;
    consecutiveCookiePresent = 0;
  }

  const entry: CookieConsistencyLog = {
    timestamp: new Date().toISOString(),
    present,
    consecutive: present ? consecutiveCookiePresent : -consecutiveCookieMissing,
  };
  cookieConsistencyLog.push(entry);
  if (cookieConsistencyLog.length > MAX_LOG_ENTRIES) {
    cookieConsistencyLog.shift();
  }

  if (!present && consecutiveCookieMissing === 1) {
    logWarRoomEvent('cookie-desync', {
      consecutiveMissing: consecutiveCookieMissing,
    });
  }
}

// QA Standby: SSO Login flow observation
function observeSsoLogin(
  status: number | 'ERROR',
  redirectLocation: string | null,
  cookieSet: boolean
): void {
  const observation: SsoLoginObservation = {
    timestamp: new Date().toISOString(),
    status,
    redirectLocation,
    cookieSet,
  };
  ssoLoginObservations.push(observation);
  if (ssoLoginObservations.length > MAX_LOG_ENTRIES) {
    ssoLoginObservations.shift();
  }

  if (!cookieSet) {
    logWarRoomEvent('cookie-desync', {
      context: 'sso-login-response',
      status,
      redirectLocation,
    });
  }
}

// QA Standby: Health success-rate monitoring
function monitorHealthDegradation(): void {
  const healthStat = stats.get('Health Check');
  if (!healthStat || healthStat.total === 0) {
    return;
  }

  const successRate = Math.round((healthStat.success / healthStat.total) * 100);

  if (successRate < WAR_ROOM_CONFIG.healthSuccessFloor) {
    if (!warRoomState.healthDegraded) {
      warRoomState.healthDegraded = true;
      logWarRoomEvent('health-degraded', { successRate });
    }
  } else if (warRoomState.healthDegraded) {
    warRoomState.healthDegraded = false;
    logWarRoomEvent('health-recovered', { successRate });
  }
}

async function checkEndpoint(config: EndpointConfig): Promise<MonitorResult> {
  const url = `${BASE_URL}${config.path}`;
  const start = performance.now();
  let result: MonitorResult = {
    endpoint: config.name,
    status: 'ERROR',
    latency: 0,
    cookiePresent: null,
    success: false,
    timestamp: new Date(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      method: config.method,
      redirect: 'manual', // Don't follow redirects automatically
      signal: controller.signal,
      headers: {
        'User-Agent': 'TS24-QA-Monitor/1.0',
        Accept: 'application/json, text/html',
      },
    });

    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - start);

    // Check for cookie in response headers
    let cookiePresent: boolean | null = null;
    if (config.checkCookie) {
      const setCookie = response.headers.get('set-cookie') || '';
      cookiePresent = setCookie.includes(config.checkCookie);
    }

    const success = config.expectedStatus.includes(response.status);

    result = {
      endpoint: config.name,
      status: response.status,
      latency,
      cookiePresent,
      success,
      timestamp: new Date(),
    };

    if (!success) {
      result.error = `Unexpected status: ${response.status}`;
    }

    // QA Standby: Observe SSO Login flow
    if (config.name === 'SSO Login') {
      const redirectLocation = response.headers.get('location');
      const setCookie = response.headers.get('set-cookie') || '';
      const cookieSet = setCookie.includes('ts24_sso_session');
      observeSsoLogin(response.status, redirectLocation, cookieSet);

       const redirectOk = response.status === 302 && typeof redirectLocation === 'string';
       if (!redirectOk) {
         logWarRoomEvent('redirect-anomaly', {
           status: response.status,
           redirectLocation,
         });
       }
    }
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    result = {
      endpoint: config.name,
      status: 'ERROR',
      latency,
      cookiePresent: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }

  updateStats(result);
  return result;
}

function formatStatus(status: number | 'ERROR'): string {
  if (status === 'ERROR') {
    return `${colors.bgRed}${colors.white} ERR ${colors.reset}`;
  }
  if (status >= 200 && status < 300) {
    return `${colors.green}${status}${colors.reset}`;
  }
  if (status >= 300 && status < 400) {
    return `${colors.yellow}${status}${colors.reset}`;
  }
  if (status >= 400 && status < 500) {
    return `${colors.yellow}${status}${colors.reset}`;
  }
  return `${colors.red}${status}${colors.reset}`;
}

function formatLatency(ms: number): string {
  if (ms < 100) return `${colors.green}${ms}ms${colors.reset}`;
  if (ms < 500) return `${colors.yellow}${ms}ms${colors.reset}`;
  return `${colors.red}${ms}ms${colors.reset}`;
}

function formatCookie(present: boolean | null): string {
  if (present === null) return `${colors.dim}N/A${colors.reset}`;
  if (present) return `${colors.green}✓${colors.reset}`;
  return `${colors.red}✗${colors.reset}`;
}

function formatSuccess(success: boolean): string {
  return success
    ? `${colors.bgGreen}${colors.white} PASS ${colors.reset}`
    : `${colors.bgRed}${colors.white} FAIL ${colors.reset}`;
}

function printHeader(): void {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         TS24 QA MONITOR MODE                                  ║
║                                                                               ║
║  Base URL: ${BASE_URL.padEnd(54)}     ║
║  Interval: ${(POLL_INTERVAL / 1000).toString().padEnd(4)}s                                                            ║
╚═══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);
}

function printResults(results: MonitorResult[]): void {
  const now = new Date().toISOString();
  console.log(`\n${colors.dim}[${now}]${colors.reset} Endpoint Status:\n`);

  console.log(
    `  ${'Endpoint'.padEnd(16)} ${'Status'.padEnd(10)} ${'Latency'.padEnd(12)} ${'Cookie'.padEnd(8)} ${'Result'.padEnd(10)}`
  );
  console.log(`  ${'-'.repeat(60)}`);

  results.forEach((r) => {
    const endpoint = r.endpoint.padEnd(16);
    const status = formatStatus(r.status).padEnd(19); // Account for ANSI codes
    const latency = formatLatency(r.latency).padEnd(21);
    const cookie = formatCookie(r.cookiePresent).padEnd(17);
    const success = formatSuccess(r.success);

    console.log(`  ${endpoint} ${status} ${latency} ${cookie} ${success}`);

    if (VERBOSE && r.error) {
      console.log(`    ${colors.dim}└─ Error: ${r.error}${colors.reset}`);
    }
  });
}

function printStats(): void {
  console.log(`\n${colors.bright}Cumulative Stats:${colors.reset}\n`);

  console.log(
    `  ${'Endpoint'.padEnd(16)} ${'Total'.padEnd(8)} ${'Pass'.padEnd(8)} ${'Fail'.padEnd(8)} ${'Avg Lat'.padEnd(10)} ${'Success %'.padEnd(10)}`
  );
  console.log(`  ${'-'.repeat(64)}`);

  stats.forEach((stat, name) => {
    const endpoint = name.padEnd(16);
    const total = stat.total.toString().padEnd(8);
    const success = stat.success.toString().padEnd(8);
    const failed =
      stat.failed > 0
        ? `${colors.red}${stat.failed}${colors.reset}`.padEnd(17)
        : stat.failed.toString().padEnd(8);
    const avgLat = `${stat.avgLatency}ms`.padEnd(10);
    const rate =
      stat.successRate >= 95
        ? `${colors.green}${stat.successRate}%${colors.reset}`
        : stat.successRate >= 80
          ? `${colors.yellow}${stat.successRate}%${colors.reset}`
          : `${colors.red}${stat.successRate}%${colors.reset}`;

    console.log(`  ${endpoint} ${total} ${success} ${failed} ${avgLat} ${rate}`);
  });

  // QA Standby: Print extended metrics
  printQaStandbyMetrics();
}

// QA Standby: Display extended monitoring metrics
function printQaStandbyMetrics(): void {
  console.log(`\n${colors.bright}QA Standby Metrics:${colors.reset}\n`);

  // Verify counters
  const verifySuccess = verifyCounters.success;
  const verifyFail = verifyCounters.fail;
  const verifyTotal = verifySuccess + verifyFail;
  const verifyRate = verifyTotal > 0 ? Math.round((verifySuccess / verifyTotal) * 100) : 100;

  console.log(`  ${colors.cyan}Verify Endpoint:${colors.reset}`);
  console.log(`    Success: ${colors.green}${verifySuccess}${colors.reset}  Fail: ${verifyFail > 0 ? colors.red : ''}${verifyFail}${colors.reset}  Rate: ${verifyRate >= 95 ? colors.green : colors.yellow}${verifyRate}%${colors.reset}`);
  if (verifyCounters.lastSuccess) {
    console.log(`    ${colors.dim}Last success: ${verifyCounters.lastSuccess}${colors.reset}`);
  }
  if (verifyCounters.lastFail) {
    console.log(`    ${colors.dim}Last fail: ${verifyCounters.lastFail}${colors.reset}`);
  }

  // Cookie consistency
  console.log(`\n  ${colors.cyan}Cookie Consistency:${colors.reset}`);
  if (consecutiveCookiePresent > 0) {
    console.log(`    ${colors.green}✓${colors.reset} Present for ${consecutiveCookiePresent} consecutive checks`);
  } else if (consecutiveCookieMissing > 0) {
    console.log(`    ${colors.red}✗${colors.reset} Missing for ${consecutiveCookieMissing} consecutive checks`);
  } else {
    console.log(`    ${colors.dim}No cookie checks yet${colors.reset}`);
  }

  // SSO Login observations
  const recentSsoObs = ssoLoginObservations.slice(-5);
  if (recentSsoObs.length > 0) {
    console.log(`\n  ${colors.cyan}Recent SSO Login Observations:${colors.reset}`);
    recentSsoObs.forEach((obs) => {
      const statusColor = obs.status === 302 ? colors.green : obs.status === 400 ? colors.yellow : colors.red;
      const cookieIcon = obs.cookieSet ? `${colors.green}🍪${colors.reset}` : '';
      const redirect = obs.redirectLocation ? `→ ${obs.redirectLocation.substring(0, 30)}` : '';
      console.log(`    ${colors.dim}${obs.timestamp.substring(11, 19)}${colors.reset} ${statusColor}${obs.status}${colors.reset} ${redirect} ${cookieIcon}`);
    });
  }

  // Latency trend (last 10)
  const recentLatency = latencyLog.slice(-10);
  if (recentLatency.length > 0) {
    const avgRecent = Math.round(recentLatency.reduce((sum, e) => sum + e.latency, 0) / recentLatency.length);
    const maxRecent = Math.max(...recentLatency.map((e) => e.latency));
    const minRecent = Math.min(...recentLatency.map((e) => e.latency));
    console.log(`\n  ${colors.cyan}Recent Latency (last ${recentLatency.length}):${colors.reset}`);
    console.log(`    Avg: ${avgRecent}ms  Min: ${minRecent}ms  Max: ${maxRecent}ms`);
  }
}

function printFooter(): void {
  console.log(`
${colors.dim}
  Press Ctrl+C to stop monitoring
  Set QA_VERBOSE=1 for detailed error output
  Set QA_POLL_INTERVAL=<ms> to change poll frequency
${colors.reset}`);
}

async function runMonitorCycle(): Promise<void> {
  const results = await Promise.all(ENDPOINTS.map(checkEndpoint));
  printHeader();
  printResults(results);
  printStats();
  printFooter();
}

async function main(): Promise<void> {
  console.log(`${colors.cyan}Starting TS24 QA Monitor...${colors.reset}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Poll interval: ${POLL_INTERVAL}ms\n`);

  initStats();

  // Initial run
  await runMonitorCycle();

  // Continuous monitoring
  setInterval(runMonitorCycle, POLL_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down QA Monitor...${colors.reset}`);
  console.log(`\n${colors.bright}Final Stats:${colors.reset}`);
  printStats();
  console.log(`\nTotal checks: ${resultHistory.length}`);
  process.exit(0);
});

main().catch((err) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
