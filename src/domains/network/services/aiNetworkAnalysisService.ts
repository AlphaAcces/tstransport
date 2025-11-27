/**
 * AI Network Analysis Service
 *
 * Provides simple caching (localStorage) and a subscription mechanism so
 * components (like NetworkGraph) can receive live updates when analyses
 * complete. Integrates with `lib/ai` (Gemini) when an API key is available.
 */

import type { NetworkNode, NetworkEdge } from '../../../types/network';

const CACHE_KEY = 'ai:network:cache:v1';

type AiEntry = {
  id: string; // node or edge id
  raw: string;
  score?: number;
  sentiment?: string;
  category?: string;
  source: string;
  generatedAt: string;
};

type AiCache = Record<string, AiEntry>;

const listeners = new Set<(entry: AiEntry) => void>();

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function readCache(): AiCache {
  if (!isBrowser) return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AiCache;
  } catch (e) {
    console.warn('Failed to read AI network cache', e);
    try { window.localStorage.removeItem(CACHE_KEY); } catch {};
    return {};
  }
}

function writeCache(cache: AiCache) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to write AI network cache', e);
  }
}

export function getCachedAnalysis(id: string): AiEntry | null {
  const cache = readCache();
  return cache[id] ?? null;
}

export function setCachedAnalysis(entry: AiEntry) {
  const cache = readCache();
  cache[entry.id] = entry;
  writeCache(cache);
  // notify listeners
  listeners.forEach(l => {
    try { l(entry); } catch (e) { console.error('AI listener error', e); }
  });
}

export function subscribeToNetworkAnalysis(listener: (entry: AiEntry) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

interface AnalyzeOptions {
  node?: NetworkNode;
  edge?: NetworkEdge;
  apiKey?: string;
}

export async function analyzeNetworkItem({ node, edge, apiKey }: AnalyzeOptions): Promise<AiEntry | null> {
  // Build a short prompt for analysis. If no apiKey provided, return cached if exists.
  const id = node?.id ?? (edge ? `${edge.from}->${edge.to}` : 'unknown');

  const cached = getCachedAnalysis(id);
  if (!apiKey && cached) return cached;

  if (!apiKey) return null;

  try {
    // dynamic import to keep bundle cost low
    const { generateGeminiContent } = await import('../../../lib/ai');
    const subject = node ? `Node: ${node.label} (${node.type})` : edge ? `Edge from ${edge.from} to ${edge.to} (${edge.type})` : '';
    const prompt = `Analyze the following network element for risk and category. Return a compact JSON with keys: score (0-100), sentiment (positive|neutral|negative), category (economy|risk|legal|social|other), summary.` + `\n\n${subject}\nNotes: ${node?.notes ?? edge?.label ?? ''}`;

    const raw = await generateGeminiContent(prompt, apiKey);

    // attempt to parse JSON from model, fallback to heuristic
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // model may return plain text; try to extract numbers heuristically
      parsed = { score: undefined, sentiment: undefined, category: undefined };
    }

    const entry: AiEntry = {
      id,
      raw,
      score: typeof parsed?.score === 'number' ? parsed.score : parsed?.score ? Number(parsed.score) : undefined,
      sentiment: parsed?.sentiment ?? undefined,
      category: parsed?.category ?? undefined,
      source: 'gemini',
      generatedAt: new Date().toISOString(),
    };

    setCachedAnalysis(entry);
    return entry;
  } catch (error) {
    console.error('AI network analysis failed', error);
    return cached ?? null;
  }
}

export async function analyzeWholeGraph(nodes: NetworkNode[], _edges: NetworkEdge[], apiKey?: string | null) {
  // For performance, analyze only nodes with size, high risk, or sample set; keep it simple for now
  const toAnalyze = nodes.slice(0, 50);
  await Promise.all(toAnalyze.map(n => analyzeNetworkItem({ node: n, apiKey: apiKey ?? undefined })));
}

export default {
  getCachedAnalysis,
  setCachedAnalysis,
  subscribeToNetworkAnalysis,
  analyzeNetworkItem,
  analyzeWholeGraph,
};
