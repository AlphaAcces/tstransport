# Intel24 Palette Rollout Plan

## Objectives

- Ensure every module consumes ThemeContext-driven tokens for palette consistency.
- Remove legacy GreyEYE/BlackboxEYE styling entry points except when explicitly switching systems.
- Provide an incremental rollout order so QA can validate per tranche.

## Rollout Order

1. **Analysis Suite**
   - Person & Network, Companies, Financials, Hypotheses, Cashflow, Sector.
   - Goals: Replace inline hex/Tailwind colors with CSS variables or `useTheme()` values; align charts/cards with Intel24 gold/copper/deep-blue tokens.
2. **Risk & Actions**
   - Timeline, Risk Matrix, Actions/Tasks.
   - Goals: Use ThemeContext danger/warning tokens, unify badges/progress indicators, ensure overlays keep Intel24 shadows.
3. **Operations & Intelligence**
   - Counterparties, Scenarios, Dashboards, Executive.
   - Goals: Harmonize surfaces, gradients, and status pills with Intel24 palette, including focus/hover states.
4. **Settings & API Surfaces**
   - Settings, AI Keys, Access Requests, Vault/API consoles.
   - Goals: Apply Intel24 tokens to tables, forms, logs; ensure focus rings and button states rely on ThemeContext variables.

## Implementation Notes

- Extend `TenantColorScheme` to include copper/deep-blue/shadow/border tokens and write them to CSS variables in `ThemeContext`.
- Keep `index.css` values as defaults, but rely on ThemeProvider to override at runtime.
- Export a shared palette helper for charts and inline styling to avoid hard-coded colors.
- Update modules per the order above, keeping commits scoped for easier QA.
