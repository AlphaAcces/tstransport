#!/usr/bin/env npx tsx
/**
 * TS24 War Room Watchdog (Stage 1 - Passive Monitoring)
 *
 * Read-only watchdog that periodically checks key endpoints.
 */

const WATCHDOG_BASE_URL = process.env.QA_BASE_URL || 'https://intel24.blackbox.codes';
const VERIFY_INTERVAL = parseInt(process.env.WATCHDOG_VERIFY_INTERVAL || '20000', 10);
const SSO_INTERVAL = parseInt(process.env.WATCHDOG_SSO_INTERVAL || '30000', 10);
const COOKIE_INTERVAL = parseInt(process.env.WATCHDOG_COOKIE_INTERVAL || '15000', 10);

interface WatchdogResult {
  status: number | 'ERROR';
  latency: number;
  details?: Record<string, unknown>;
}

const logWatchdog = (channel: string, result: WatchdogResult) => {
  const timestamp = new Date().toISOString();
  console.log(`[watchdog:${channel}]`, { timestamp, ...result });
};

const logWarRoomAlert = (type: string) => {
  const timestamp = new Date().toISOString();
  console.info(`[war-room] anomaly detected: ${type} ${timestamp}`);
};

async function runVerifyCheck(): Promise<void> {
  const url = `${WATCHDOG_BASE_URL}/api/auth/verify`;
  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'TS24-Watchdog/1.0',
      },
    });
    const latency = Math.round(performance.now() - start);
    logWatchdog('verify', {
      status: response.status,
      latency,
      details: { expected: '401 or 200' },
    });
    if (![200, 401].includes(response.status)) {
      logWarRoomAlert('verify-flow');
    }
  } catch (error) {
    logWatchdog('verify', {
      status: 'ERROR',
      latency: Math.round(performance.now() - start),
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    logWarRoomAlert('verify-error');
  }
}

async function runSsoLoginCheck(): Promise<void> {
  const url = `${WATCHDOG_BASE_URL}/sso-login?watchdog=1`;
  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'TS24-Watchdog/1.0',
      },
    });
    const latency = Math.round(performance.now() - start);
    const redirectLocation = response.headers.get('location');
    logWatchdog('sso-login', {
      status: response.status,
      latency,
      details: {
        redirectLocation,
        cookie: response.headers.get('set-cookie')?.includes('ts24_sso_session') ?? false,
      },
    });
    const cookiePresent = response.headers.get('set-cookie')?.includes('ts24_sso_session') ?? false;
    if (response.status !== 302 || !redirectLocation) {
      logWarRoomAlert('routing-flow');
    } else if (!cookiePresent) {
      logWarRoomAlert('cookie-flow');
    }
  } catch (error) {
    logWatchdog('sso-login', {
      status: 'ERROR',
      latency: Math.round(performance.now() - start),
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    logWarRoomAlert('sso-login-error');
  }
}

async function runCookiePresenceCheck(): Promise<void> {
  const url = `${WATCHDOG_BASE_URL}/`;
  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'TS24-Watchdog/1.0',
      },
    });
    const latency = Math.round(performance.now() - start);
    const setCookie = response.headers.get('set-cookie') || '';
    logWatchdog('session-cookie', {
      status: response.status,
      latency,
      details: {
        cookiePresent: setCookie.includes('ts24_sso_session'),
        setCookie,
      },
    });
    if (response.status !== 200) {
      logWarRoomAlert('dashboard-status');
    }
    if (!setCookie.includes('ts24_sso_session')) {
      logWarRoomAlert('cookie-integrity');
    }
  } catch (error) {
    logWatchdog('session-cookie', {
      status: 'ERROR',
      latency: Math.round(performance.now() - start),
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    logWarRoomAlert('cookie-check-error');
  }
}

function startWatchdog(): void {
  console.log('\n[watchdog] TS24 War Room Watchdog started');
  console.log(`Base URL: ${WATCHDOG_BASE_URL}`);
  console.log(`Verify interval: ${VERIFY_INTERVAL}ms`);
  console.log(`SSO interval: ${SSO_INTERVAL}ms`);
  console.log(`Cookie interval: ${COOKIE_INTERVAL}ms`);

  runVerifyCheck();
  runSsoLoginCheck();
  runCookiePresenceCheck();

  setInterval(runVerifyCheck, VERIFY_INTERVAL);
  setInterval(runSsoLoginCheck, SSO_INTERVAL);
  setInterval(runCookiePresenceCheck, COOKIE_INTERVAL);
}

startWatchdog();

export {};
