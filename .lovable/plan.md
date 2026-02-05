

# Multi-Channel Notification System: Email + Push

## Overview

Upgrade the notification system so that when a pattern is detected, the user receives both an **email** and a **browser push notification** (respecting their preferences). This ensures minimum latency between detection and user awareness.

---

## Current State

| Component | Status |
|-----------|--------|
| Email sending | Working (Resend via `send-pattern-alert`) |
| Push subscriptions table | Exists (`push_subscriptions`) |
| Service Worker | Ready (`public/sw.js`) |
| Push dispatch from backend | **Missing** |
| User notification preferences | **Missing** (no DB columns) |
| VAPID keys | **Missing** (required for Web Push) |

---

## Implementation Plan

### Phase 1: Add VAPID Keys (Required for Web Push)

VAPID (Voluntary Application Server Identification) keys are required for the Web Push protocol.

**Action**: Add two new secrets:
- `VAPID_PUBLIC_KEY` - Used in frontend to subscribe
- `VAPID_PRIVATE_KEY` - Used in edge function to sign push messages

You can generate these keys at: https://vapidkeys.com/ or using the `web-push` library.

---

### Phase 2: Add Notification Preferences to Database

**New Migration**: Add columns to `profiles` table

```sql
ALTER TABLE profiles 
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN push_notifications_enabled BOOLEAN DEFAULT true;
```

This allows users to independently toggle email and push notifications.

---

### Phase 3: Upgrade `send-pattern-alert` Edge Function

Modify the function to handle both channels:

```text
+-------------------------------------------------------+
|              send-pattern-alert                       |
+-------------------------------------------------------+
|  Input: alert, patternResult, marketData              |
+-------------------------------------------------------+
          |
          v
  +-------------------+
  | Get user's prefs  |  (email_enabled, push_enabled)
  +-------------------+
          |
          +-----------------------------+
          |                             |
          v                             v
  +----------------+           +------------------+
  | Email enabled? |           | Push enabled?    |
  +----------------+           +------------------+
          |                             |
          v                             v
  +----------------+           +------------------+
  | Send via Resend|           | Query push_subs  |
  +----------------+           +------------------+
                                        |
                                        v
                               +------------------+
                               | Send Web Push    |
                               | (using web-push) |
                               +------------------+
```

**Key changes to the edge function:**

1. Import `web-push` library for sending push notifications
2. Query `profiles` table for notification preferences
3. Query `push_subscriptions` table for user's push endpoints
4. Send push notification with pattern details (title, body, action URL)
5. Track which channels were used in the response

**Push notification payload structure:**
```json
{
  "title": "Pattern Alert: Hammer on AAPL",
  "body": "Bullish reversal detected (80% confidence) - $185.42",
  "tag": "pattern-alert-{alertId}",
  "url": "/members/alerts",
  "alertId": "uuid",
  "requireInteraction": true,
  "actions": [
    { "action": "view", "title": "View Chart" },
    { "action": "dismiss", "title": "Dismiss" }
  ]
}
```

---

### Phase 4: Connect NotificationSettings UI to Database

Update `NotificationSettings.tsx` to:

1. Load current preferences from `profiles` table on mount
2. Save changes when toggles are flipped
3. Show loading states during save operations

**Props change:**
```tsx
interface NotificationSettingsProps {
  userId?: string;
  // Remove emailEnabled/onEmailChange props
  // Component will manage its own state from DB
}
```

---

### Phase 5: Update pattern-detector to Pass User ID

The `pattern-detector` already fetches user profiles. Ensure it passes the `user_id` to `send-pattern-alert` so the function can look up preferences and push subscriptions.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx_add_notification_prefs.sql` | Create | Add preference columns to profiles |
| `supabase/functions/send-pattern-alert/index.ts` | Modify | Add push notification dispatch |
| `src/components/settings/NotificationSettings.tsx` | Modify | Connect to database for preferences |
| `src/hooks/usePushNotifications.ts` | Modify | Update VAPID public key from env |

---

## Technical Details

### Web Push Library Usage

```typescript
import webpush from 'npm:web-push@3.6.6';

webpush.setVapidDetails(
  'mailto:alerts@chartingpath.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

// For each subscription
await webpush.sendNotification(
  {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh_key,
      auth: subscription.auth_key
    }
  },
  JSON.stringify(payload)
);
```

### Parallel Notification Dispatch

Both email and push will be sent in parallel using `Promise.all()` to minimize latency:

```typescript
const results = await Promise.allSettled([
  emailEnabled ? sendEmail(...) : Promise.resolve(null),
  pushEnabled ? sendPushNotifications(...) : Promise.resolve(null),
]);
```

---

## Required Secrets

Before implementation, you'll need to add these secrets:

| Secret | Description |
|--------|-------------|
| `VAPID_PUBLIC_KEY` | Public key for Web Push subscription |
| `VAPID_PRIVATE_KEY` | Private key for signing push messages |

Generate at: https://vapidkeys.com/

---

## Expected Outcome

After implementation:
- Pattern detection triggers both email AND push notification simultaneously
- Users receive instant browser notifications even when not on the site
- Users can independently toggle email and push from settings
- Notification preferences persist in database
- UI badges update in real-time when new alerts arrive

