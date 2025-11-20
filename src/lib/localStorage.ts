export const loadState = <T,>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('Failed to load state', e);
    return undefined;
  }
};

export const saveState = (key: string, state: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
};
