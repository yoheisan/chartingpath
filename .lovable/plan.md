
The user is asking whether we can use Finazon (already integrated for FX/stocks per `finazonFetch.ts`) as the market breadth data source — the alternative we discussed (EODHD bulk failing with likely 403, Finnhub sampling fallback).

Let me check what Finazon offers for breadth-relevant data.

Finazon's `us_stocks_essential` dataset:
- Has `time_series` endpoint for individual tickers (already wired up in `finazonFetch.ts`)
- Does NOT have a single bulk "all US stocks EOD" endpoint like EODHD does
- However, it allows up to ~1000 calls/min on paid tiers and the free tier is generous

So Finazon **can** be used for breadth, but only via **sampling** — same approach we'd use with Finnhub. The advantage: we already have `FINAZON_API_KEY` configured and `fetchFinazonData()` reusable.

This is actually a cleaner solution than adding Finnhub:
- One less provider to maintain
- Reuses existing helper
- Commercial redistribution explicitly permitted (per the file's header comment)

Plan stays simple: replace the Finnhub fallback in my prior plan with Finazon sampling.

Keep the plan tight.
