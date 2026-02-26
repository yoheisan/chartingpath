

# Landing Page Restructure to Reduce 89% Bounce Rate

## Problem

Visitors land on a page with a vague headline ("Discover signals. Research. Execute. Automate.") followed immediately by two dense data tables (Edge Atlas rankings + Live Screener). A first-time visitor has no idea what chart patterns are, why they matter, or what this product does -- so they leave.

## Root Causes

1. **Hero says nothing specific** -- no concrete value proposition, no numbers, no outcome
2. **No visual proof** -- no screenshot, animation, or demo showing the product in action
3. **Data tables too early** -- Edge Atlas and Screener Teaser are powerful for returning users but meaningless to newcomers
4. **"How It Works" is buried** -- it's the 6th section, after most visitors have already bounced
5. **No social proof** -- no user counts, no testimonials, no trust signals beyond generic checkmarks
6. **Too many sections** -- 8 sections competing for attention; cognitive overload

## Proposed New Section Order

```text
1. Hero (rewritten -- specific value prop + product screenshot/mockup)
2. How It Works (moved UP -- explains the workflow in 10 seconds)
3. Live Screener Teaser (proof the product works -- live data)
4. Edge Atlas (data credibility -- "backed by 320K+ trades")
5. Action Cards (choose your path)
6. Copilot Showcase (differentiator)
7. Pricing Teaser
8. Disclaimer
```

## Detailed Changes

### 1. Rewrite Hero Copy (Index.tsx)

**Current**: "Discover signals. Research. Execute. Automate."
**New**: "Find Chart Pattern Setups Before They Break Out" with a subheadline like "Scan 1,100+ instruments. Validate with 320,000+ historical trades. Get entry, stop-loss, and target -- in seconds."

- Replace abstract verbs with a concrete outcome
- Add a key metric strip below CTAs: "1,100+ instruments | 17 patterns | 320K+ backtested trades | Updated every hour"
- Keep existing CTAs (Open Screener + Create Alert)

### 2. Move "How It Works" to Position 2 (Index.tsx)

Simply reorder the JSX -- move `<HowItWorks />` from after CopilotShowcase to immediately after the Hero. No component changes needed.

### 3. Add a Metric Strip Component (new: MetricStrip.tsx)

A simple horizontal bar with 4 key numbers:
- "1,100+ Instruments Scanned"
- "17 Pattern Types"
- "320K+ Historical Trades"
- "Updated Every Hour"

Placed inside the Hero section below the trust signals. Animated count-up on scroll into view.

### 4. Reorder Sections in Index.tsx

Move the section rendering order to match the new flow. No changes to individual section components -- just reordering JSX elements.

### 5. Add Scroll-Depth Analytics

Track how far users scroll to validate whether the new order improves engagement. Add a simple `IntersectionObserver` hook that fires `trackEvent('landing.section_viewed', { section: 'how_it_works' })` when each section enters the viewport.

## Files to Create/Modify

| File | Action | Details |
|------|--------|---------|
| `src/pages/Index.tsx` | Modify | Rewrite hero copy, reorder sections, add metric strip |
| `src/components/landing/MetricStrip.tsx` | Create | New component with 4 animated key metrics |
| `src/hooks/useSectionTracking.ts` | Create | IntersectionObserver hook for scroll-depth analytics |

## What This Does NOT Change

- No changes to EdgeAtlasSection, PatternScreenerTeaser, ActionCard, CopilotShowcase, HowItWorks, or PricingTeaser components
- No backend changes
- No new dependencies

## Success Metrics

- Bounce rate drops from 89% to below 70% within 2 weeks
- Scroll depth: >50% of visitors see the Screener Teaser section
- Screener CTA clicks increase (tracked via existing `landing.cta_click` events)

