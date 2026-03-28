

# Plan: Generate Pattern Identification Methodology Audit Document

## What
Create a comprehensive PDF audit note documenting all pattern detection methodologies, quality scoring, agent scoring, bracket level computation, and known issues across Dashboard, Screener, Pattern Lab, and Agent Scoring — formatted for a data scientist to review.

## Document Structure
1. **Executive Summary** — scope, purpose, systems covered
2. **Pattern Registry** — all 17 active patterns with detection logic parameters
3. **Detection Methodology per Pattern** — pivot detection, tolerances, confirmation rules, trend gating
4. **Bracket Levels (SL/TP)** — ATR-based computation, flooring, R:R guards
5. **Quality Scoring System** — 9 factors with weights, grade thresholds, repeatability gate
6. **Agent Scoring Pipeline** — 4 agents (Analyst, Risk, Timing, Portfolio), scoring math, verdict cutoffs
7. **Known Issues & Audit Flags** — identified weaknesses for data scientist review
8. **Data Source Routing** — EODHD primary, Binance for crypto, Yahoo fallback

## Implementation
- Single script generating a PDF via Python (`reportlab`) to `/mnt/documents/`
- Content sourced from codebase analysis above
- No codebase changes needed

## Technical Details
- All detection parameters extracted from `patternDetectors.ts` (1087 lines)
- Quality scorer from `patternQualityScorer.ts` (919 lines, 9 weighted factors)
- Bracket levels from `bracketLevels.ts` (v1.1.0, ATR floor + min R:R)
- Agent scoring from `engine/backtester-v2/agents/` (4 agents, 0-25 each, 0-100 composite)

