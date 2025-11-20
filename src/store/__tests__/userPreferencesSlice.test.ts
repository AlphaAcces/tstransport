import reducer, { setCompactMode, saveView, removeView, clearSavedViews } from '../userPreferencesSlice';

describe('userPreferencesSlice', () => {
  test('should handle initial state', () => {
    const initial = reducer(undefined as any, { type: '@@INIT' } as any);
    expect(initial.compactMode).toBe(false);
    expect(Array.isArray(initial.savedViews)).toBe(true);
  });

  test('setCompactMode toggles flag', () => {
    const state = reducer(undefined as any, setCompactMode(true));
    expect(state.compactMode).toBe(true);
  });

  test('saveView and removeView behave correctly', () => {
    let state = reducer(undefined as any, saveView({ id: 'v1', payload: { view: 'dashboard' } }));
    expect(state.savedViews.length).toBe(1);
    state = reducer(state, saveView({ id: 'v2', payload: { view: 'executive' } }));
    expect(state.savedViews.length).toBe(2);
    state = reducer(state, removeView('v1'));
    expect(state.savedViews.find(s => s.id === 'v1')).toBeUndefined();
    state = reducer(state, clearSavedViews());
    expect(state.savedViews.length).toBe(0);
  });
});
