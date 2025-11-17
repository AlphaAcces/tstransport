import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL_ID = 'gemini-2.5-flash';

function getEnv(key: string) {
    // Vite exposes env vars on import.meta.env when prefixed with VITE_
    // fall back to process.env when available (e.g., during SSR or build)
    const importMetaEnv = (import.meta as any)?.env ?? {};
    const processEnv = (globalThis as any)?.process?.env ?? {};
    return importMetaEnv[key] ?? processEnv[key];
}

export async function generateGeminiContent(prompt: string): Promise<string> {
    const apiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY') || getEnv('API_KEY');
    if (!apiKey) {
        throw new Error('Gemini API-nøgle mangler. Tilføj VITE_GEMINI_API_KEY til .env.local');
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: GEMINI_MODEL_ID });
    const response = await model.generateContent(prompt);
    return response.response?.text?.() ?? JSON.stringify(response);
}

export { GEMINI_MODEL_ID };
