#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Spike {
  endpoint: string;
  latency: number;
  timestamp: string;
}

const logPath = process.argv[2] ?? path.join('test-results', 'qa-monitor.log');
if (!fs.existsSync(logPath)) {
  console.error(`[latency] Log file not found: ${logPath}`);
  process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf-8').split('\n');
const spikes: Spike[] = [];
const threshold = parseInt(process.env.QA_LATENCY_SPIKE || '200', 10);

for (const line of lines) {
  if (!line.includes('latency')) continue;
  try {
    const parsed = JSON.parse(line.replace(/^[^{]+/, ''));
    if (parsed.latency && parsed.latency > threshold) {
      spikes.push({
        endpoint: parsed.endpoint || 'unknown',
        latency: parsed.latency,
        timestamp: parsed.timestamp || new Date().toISOString(),
      });
    }
  } catch {
    // Ignore malformed lines
  }
}

if (spikes.length === 0) {
  console.info('[latency] No spikes detected.');
  process.exit(0);
}

console.info('[latency] Spikes detected:');
spikes.forEach((spike) => {
  console.info(`- ${spike.timestamp}: ${spike.endpoint} ${spike.latency}ms`);
});
