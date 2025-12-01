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

const stats: Map<string, MonitorStats> = new Map();
const resultHistory: MonitorResult[] = [];
const MAX_HISTORY = 1000;

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
