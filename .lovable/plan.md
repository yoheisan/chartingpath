
# Fix: Increase Copilot Token Limits and Improve Response Completeness

## Problem
The `trading-copilot` edge function calls the Gemini API **without specifying `max_tokens`**, causing the model to use its default limit which often truncates longer responses (Edge Atlas tables, Pine Scripts, detailed analysis). This is the #1 retention risk identified by Journey Analytics.

## Changes

### 1. Add `max_tokens` to the Gemini API request
**File:** `supabase/functions/trading-copilot/index.ts`

Add `max_tokens: 4096` to the request body at line ~1236. This gives the model room for full markdown tables, complete Pine Script blocks, and detailed analysis without truncation.

```text
body: JSON.stringify({
  model: "gemini-2.0-flash",
  messages: convo,
  tools,
  tool_choice: "auto",
  stream: false,
  max_tokens: 4096,    // <-- NEW
}),
```

### 2. Increase training-pair response storage limit
**File:** `supabase/functions/trading-copilot/index.ts` (line ~829)

The RLVR logger currently truncates stored responses at 5,000 characters. Increase to 8,000 to capture full responses for quality analysis.

```text
response: response.substring(0, 8000),  // was 5000
```

### 3. Redeploy the edge function
The `trading-copilot` function will be automatically redeployed after the code change.

## Why 4,096 tokens?
- Gemini 2.0 Flash supports up to 8,192 output tokens
- 4,096 is enough for a full Edge Atlas table (10 rows), Pine Script (~200 lines), or a detailed chart analysis -- without wasting quota on unnecessarily long responses
- This covers 95%+ of use cases; truly massive outputs (multi-pattern reports) can be addressed later if needed

## Impact
- Directly addresses the "Incomplete Copilot responses" bottleneck
- No cost increase concern -- Gemini bills by actual tokens generated, not the max limit
- Immediate improvement visible to all users
