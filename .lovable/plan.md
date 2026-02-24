

# Trading Copilot: Auth-Gated Onboarding Strategy

## Current State

The Trading Copilot is **completely open** to all users — authenticated or not. Anyone can:
- Open it via the bottom-right button or Cmd+K
- Send unlimited messages to the AI
- Use all quick actions (find setups, backtest queries, script generation)

The only difference for anonymous users is that conversation history is not saved (no sidebar). There is **no usage limit, no auth gate, and no onboarding nudge**.

## Problem

This is a missed conversion opportunity. The copilot is one of the platform's most powerful features and a key differentiator. Giving it away with zero friction means:
- No incentive to register
- No way to track engagement per user
- No path from "impressed" to "signed up"
- Higher compute costs from anonymous abuse

## Strategy: Free Trial Messages + Auth Gate

Allow anonymous users to **experience the copilot** with a limited number of free messages, then prompt registration to continue. This mirrors the auth-gate pattern already used on Screener, Pattern Lab, and the Dashboard.

### How It Works

1. **3 free messages** for anonymous users (tracked in `sessionStorage`)
2. After 3 messages, the input area is replaced with a sign-in CTA using the existing `AuthGateDialog`
3. Authenticated users get **unlimited messages** (or plan-based limits later)
4. The welcome screen stays fully visible — quick actions, branding, everything

## What Changes

### 1. `src/components/copilot/TradingCopilot.tsx`
- Track anonymous message count in `sessionStorage` (key: `copilot_guest_msgs`)
- After the free message limit, disable the input and show an inline auth gate prompt
- Import and render `AuthGateDialog` when the limit is reached
- Add a subtle counter badge: "2 of 3 free messages remaining"

### 2. `src/components/copilot/CopilotAuthGate.tsx` (new file)
- A small inline component shown below the chat when the guest limit is hit
- Shows: lock icon, "Sign in to continue chatting" message, Sign In / Create Account buttons
- Uses the same `AuthGateDialog` pattern for consistency
- Dismissible but re-appears on next message attempt

### 3. Welcome screen enhancement
- Add a subtle note under the welcome message for anonymous users: "Try 3 free messages -- sign in for unlimited access"
- No changes for authenticated users

## What Stays the Same

| Aspect | Behavior |
|--------|----------|
| Cmd+K shortcut | Works for everyone |
| Opening the copilot | Works for everyone |
| Quick action buttons | Visible to everyone (count toward free limit) |
| Conversation history | Only for authenticated users (no change) |
| Chart analysis context | Works for everyone within free limit |

## Technical Details

### Session tracking (no database needed)
```text
sessionStorage key: "copilot_guest_msgs"
value: number (incremented on each send)
reset: on sign-in (naturally cleared by auth state change)
```

### Files to modify:
- `src/components/copilot/TradingCopilot.tsx` -- add guest message counter logic + inline gate
- `src/components/copilot/CopilotAuthGate.tsx` -- new inline auth prompt component

### No backend changes
The edge function already accepts unauthenticated requests. The gate is purely frontend, keeping it simple and fast to ship. Rate limiting at the edge function level can be added later if needed.

