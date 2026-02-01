# EODHD Data Provider Scaling Milestones

> Internal documentation for ChartingPath infrastructure scaling decisions

## Current Status

| Plan | Cost | Daily API Calls | Status |
|------|------|-----------------|--------|
| **All-World** | $79/mo | 100,000 | ✅ Active |

## Data Resolution by Tier

| Universe | Timeframe | Refresh Rate | API Calls/Day |
|----------|-----------|--------------|---------------|
| Premium 300 | 15m | Every 15 min | ~29,000 |
| Core 1,100 | 1H | Every hour | ~26,400 |
| Full 8,500+ | 4H/1D/1W | Every 4 hours | ~51,000 |

**Total:** ~106,000 calls/day (at capacity)

---

## Upgrade Milestones

### Milestone 1: Extended Plan ($249/mo)
**Trigger:** 10+ paying users

| Metric | Break-even Users |
|--------|------------------|
| LITE ($12) | 21 users |
| PLUS ($29) | 9 users |
| PRO ($79) | 4 users |
| TEAM ($199) | 2 users |

**Enables:**
- 500,000 API calls/day
- Full 1-hour resolution for 8,500+ instruments
- Hourly refresh for entire universe

---

### Milestone 2: Enterprise Plan (~$2,499/mo)
**Trigger:** 100+ paying users

| Metric | Break-even Users |
|--------|------------------|
| LITE ($12) | 208 users |
| PLUS ($29) | 86 users |
| PRO ($79) | 32 users |
| TEAM ($199) | 13 users |

**Enables:**
- Unlimited API calls
- Full 15-minute resolution for 8,500+ instruments
- ~816,000 calls/day requirement met

---

## Technical Requirements for 15m Full Universe

```
8,500 instruments × 96 intervals/day = 816,000 API calls/day
```

Only achievable with Enterprise tier or custom negotiated plan.

---

## Alternative Providers Comparison

| Provider | Plan | Cost | Calls/Day | Notes |
|----------|------|------|-----------|-------|
| EODHD Enterprise | ~$2,499/mo | Unlimited | No code changes |
| Twelve Data Growth | $1,999/mo | 565,000 | Insufficient |
| Polygon Starter | $99/mo | 500M/mo | Complex integration |
| Alpha Vantage Premium | $249/mo | Unlimited | Rate limited |

**Recommendation:** EODHD Enterprise remains best option for full 15m coverage.

---

## Custom Plan Negotiation

Contact EODHD for custom pricing:
- Email: support@eodhd.com
- Target: ~1M calls/day
- Estimated: €399-€999/mo (negotiable)

---

## Revenue Tracking Formula

```
Paying Users = SUM(LITE + PLUS + PRO + TEAM)
Monthly Revenue = (LITE×12) + (PLUS×29) + (PRO×79) + (TEAM×199)

Upgrade to Extended when: Monthly Revenue > $249
Upgrade to Enterprise when: Monthly Revenue > $2,499
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02 | Start with All-World | Sufficient for beta, ~100k calls covers tiered refresh |
| TBD | Upgrade to Extended | When 10+ paying users, enables 1H full universe |
| TBD | Upgrade to Enterprise | When 100+ paying users, enables 15m full universe |

---

*Last updated: 2026-02-01*
