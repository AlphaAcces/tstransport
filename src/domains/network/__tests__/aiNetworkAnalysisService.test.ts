import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCachedAnalysis, setCachedAnalysis, subscribeToNetworkAnalysis } from '../services/aiNetworkAnalysisService';

describe('AI Network Analysis Service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    try { localStorage.removeItem('ai:network:cache:v1'); } catch {}
  });

  it('should store and retrieve cached entries', () => {
    const entry = {
      id: 'node-1',
      raw: '{"score":80}',
      score: 80,
      sentiment: 'neutral',
      category: 'risk',
      source: 'test',
      generatedAt: new Date().toISOString(),
    };

    setCachedAnalysis(entry as any);
    const cached = getCachedAnalysis('node-1');
    expect(cached).not.toBeNull();
    expect(cached?.score).toBe(80);
  });

  it('should notify subscribers when new entry is set', (done) => {
    const entry = {
      id: 'node-2',
      raw: '{}',
      score: 10,
      sentiment: 'negative',
      category: 'legal',
      source: 'test',
      generatedAt: new Date().toISOString(),
    };

    const unsub = subscribeToNetworkAnalysis((e) => {
      try {
        expect(e.id).toBe('node-2');
        unsub();
        done();
      } catch (err) { done(err as any); }
    });

    setCachedAnalysis(entry as any);
  });
});
