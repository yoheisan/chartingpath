# Seasonality: tested, not supportable. Do not add it.

**Status: settled. Do not re-litigate without new data.**

## What was tested
Pooled monthly expectancy across all pattern occurrences appears to vary by
calendar month — for example July **+0.017R** and October **−0.129R**. Taken at
face value this looks like a calendar effect worth trading around.

## Why it is not real
Splitting the same data by year removes the effect:

- 2024 and 2025 **disagree on the sign** of monthly expectancy in **5 of 12**
  calendar months.
- Only **July** agrees across both years — one month out of twelve, which is
  what chance alone produces.

The apparent seasonality is a **level shift between years**, not a calendar
effect. 2024 and 2025 have different overall expectancy, so months that happen
to be more heavily weighted by one year inherit that year's level.

## Why more data will not fix this soon
Only occurrences from **2024-01-01 onward** are measurement-homogeneous (see the
comment on `public.get_pattern_edge`: timeframe count went 4 → 6 and the timeout
rate collapsed from ~44% to ~12%). That leaves roughly 2.5 years of usable
history, i.e. **2–3 independent observations per calendar month**. No seasonal
claim is supportable at that sample size.

## Consequence
No seasonality logic anywhere: not in `get_pattern_edge`, not in the alert
dispatch filter, not in scoring, not in the UI. Revisit only when there are at
least ~10 homogeneous years per calendar month.
