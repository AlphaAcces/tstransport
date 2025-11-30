export type SsoMetricKey = 'invalidSignature' | 'expired' | 'malformed' | 'unknownAgent';

export type SsoMetricsSnapshot = Record<SsoMetricKey, number>;

const counters: SsoMetricsSnapshot = {
  invalidSignature: 0,
  expired: 0,
  malformed: 0,
  unknownAgent: 0,
};

const shouldRecordMetrics = () => {
  const isNodeTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  if (isNodeTest && process.env?.SSO_METRICS_IN_TEST !== 'true') {
    return false;
  }

  if (typeof import.meta !== 'undefined') {
    const mode = (import.meta as any)?.env?.MODE;
    const allowInTest = (import.meta as any)?.env?.VITE_SSO_METRICS_IN_TEST === 'true';
    if (mode === 'test' && !allowInTest) {
      return false;
    }
  }

  return true;
};

export const recordSsoMetric = (key: SsoMetricKey, _details?: Record<string, unknown>) => {
  if (!shouldRecordMetrics()) {
    return;
  }
  counters[key] += 1;
  // TODO: Persist SSO metrics to centralized telemetry (Redis/Prometheus) instead of in-memory counters.
};

export const getSsoMetricsSnapshot = (): SsoMetricsSnapshot => ({ ...counters });

export const resetSsoMetrics = () => {
  counters.invalidSignature = 0;
  counters.expired = 0;
  counters.malformed = 0;
  counters.unknownAgent = 0;
};
