

## Increase Header & Footer Text Sizes to Match TradingView

### Analysis
TradingView's header nav items render at **16px (1rem)** with medium font weight. Their footer links are also **16px**. ChartingPath currently uses:
- **Header nav**: `text-[13px]` — 3px smaller than TradingView
- **Footer links**: `text-sm` (14px) — 2px smaller than TradingView

### What Changes

**Navigation.tsx** — bump all desktop nav text from `text-[13px]` to `text-base` (16px):
- Products dropdown trigger (line 201)
- Learning dropdown trigger (line 257)
- Pricing link (line 296) via `navLinkClass`
- More dropdown trigger (line 303)
- Copilot link (line 359)
- Update `navLinkClass` helper if it uses `text-[13px]`

**Footer.tsx** — bump footer links from `text-sm` to `text-base` (16px):
- All `<Link>` elements in both wedge and full footer modes
- Footer section headers stay `font-semibold` but also bump to `text-base`
- Copyright/legal row stays `text-sm` (it's fine smaller)

### Files to modify
- `src/components/Navigation.tsx` — replace `text-[13px]` with `text-base` on all desktop nav items
- `src/components/Footer.tsx` — replace `text-sm` with `text-base` on footer link elements

