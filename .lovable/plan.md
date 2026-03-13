

# Landing Page Redesign — Intuitive Guidance + i18n

## Problem
The current landing page has 4+ competing CTAs in the hero, abstract "How It Works" text steps, and the 6 Action Cards section is buried below fold. First-time visitors can't quickly understand what they can do. 95% bounce rate confirms this.

## Changes

### 1. Simplify Hero (`src/pages/Index.tsx`)
- Remove the ticker search bar and "Try a Free Backtest" button from hero
- Keep only **one primary CTA** ("See Live Patterns Free") and **one secondary** ("Create Free Account" for guests)
- Add a platform descriptor badge above headline: "Chart Pattern Backtesting Platform"
- Keep MetricStrip and trust signals

### 2. Replace "How It Works" with 3 Visual Use-Case Cards (`src/components/landing/HowItWorks.tsx`)
Transform 4 abstract text steps into 3 outcome-focused cards with icons and clear value props:

```text
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  🔍 Find Setups │  │  📊 Validate    │  │  🔔 Act on It   │
│                 │  │                 │  │                 │
│ See which       │  │ Check win rates │  │ Get alerts,     │
│ patterns are    │  │ & expect