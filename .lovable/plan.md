

## Add "Products" Dropdown Menu to Header Navigation

### Problem
The header has 6 individual product links (Dashboard, Screener, Agent Scoring, Pattern Lab, Alerts, Scripts) as top-level items, making it crowded. These should be grouped under a single "Products" parent dropdown.

### What Changes

**Desktop nav (lines 197–234 in Navigation.tsx)**

Replace the 6 individual top-level links with a single "Products" `DropdownMenu`:

```text
Before:  Dashboard | Screener | Agent Scoring | Pattern Lab | Alerts | Scripts | Learning ▾ | Pricing | More ▾ | Copilot
After:   Products ▾ | Learning ▾ | Pricing | More ▾ | Copilot
```

The "Products" dropdown contains:
- **Dashboard** — `/members/dashboard` (BarChart3 icon, blue)
- **Screener** — `/patterns/live` (Activity icon, amber)
- **Agent Scoring** — `/tools/agent-scoring` (Bot icon, amber)
- **Pattern Lab** — `/projects/pattern-lab/new` (FlaskConical icon, violet)
- **Alerts** — `/members/alerts` (Bell icon, emerald, with notification badge)
- **Scripts** — `/members/scripts` (FileCode icon, cyan)

The trigger highlights when any product route is active. Uses the same `DropdownMenu` pattern already used by Learning and More menus.

**Mobile nav** — no change needed (already has the right structure).

**i18n** — add `navigation.products` key: `"Products"`.

### Files to modify
- `src/components/Navigation.tsx` — replace 6 top-level links with Products dropdown (desktop section only)
- `src/i18n/locales/en.json` — add `navigation.products` string

