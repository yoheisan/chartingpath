

## Add Asset Class & Instrument Universe to Master Plan

### Problem
The Trading Plan Builder has no way to specify **which asset classes and sub-categories** the Copilot should trade. Users need to scope their plan to specific markets (e.g., "only NYSE stocks" or "only major FX pairs").

### What Changes

**1. Database — new columns on `master_plans`**

```sql
ALTER TABLE public.master_plans
  ADD COLUMN IF NOT EXISTS asset_classes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fx_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS crypto_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stock_exchanges text[] DEFAULT '{}';
```

- `asset_classes`: e.g. `['stocks', 'forex', 'crypto']`
- `fx_categories`: e.g. `['major', 'minor']` (reuses existing `FXPairCategory` types)
- `crypto_categories`: e.g. `['major']` or `['alt']` (reuses `CRYPTO_MAJORS` logic)
- `stock_exchanges`: e.g. `['NYSE', 'NASDAQ', 'S&P 500', 'Russell 2000']`

**2. TradingPlanBuilder — new "Instrument Universe" section (after Plan Name, before Patterns)**

New section with:
- **Asset class multi-select chips**: Stocks, Forex, Crypto, Commodities, Indices, ETFs
- **Conditional sub-filters** (same pattern as `InstrumentSubFilters.tsx`):
  - If Stocks selected → show exchange chips: NYSE, NASDAQ, S&P 500, Russell 2000, LSE, TSX
  - If Forex selected → show pair category chips: Major, Minor, Exotic
  - If Crypto selected → show coin category chips: Major (Top 10), Altcoins
- Empty selection = "All assets" (no filter applied)

**3. MasterPlan interface & rules display**

- Add the 4 new fields to `MasterPlan` interface in `useMasterPlan.ts`
- Add rules to `planToRules()`: "Stocks (NYSE, NASDAQ)", "FX Majors", "Crypto Alts", etc.

**4. Save logic update**

- Include `asset_classes`, `fx_categories`, `crypto_categories`, `stock_exchanges` in the save payload
- Pre-fill from `existingPlan` on edit
- Include in the summary text

**5. AI Gate / scan-setups integration**

- When evaluating a setup, check if the instrument's asset type and sub-category match the plan's universe filters
- No match → `conflict` with reason "Outside instrument universe"

### Files to create/modify
- **New migration**: add 4 columns to `master_plans`
- **Modify**: `src/hooks/useMasterPlan.ts` — add fields to interface + `planToRules()`
- **Modify**: `src/components/copilot/TradingPlanBuilder.tsx` — add instrument universe section with state, UI, save logic, pre-fill, and summary text

