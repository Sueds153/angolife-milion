# Implementation Plan - Real Web Push Notifications

Implement background notifications using the Push API and Service Workers to notify users about new jobs and deals even when the browser is closed.

## Proposed Changes

### [Component Name] Database (Supabase)

#### [NEW] [push_subscriptions.sql](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/database/push_subscriptions.sql)
- Create a new table `push_subscriptions` to store user push endpoints and keys.
- Columns: `id`, `user_id` (FK to profiles), `subscription` (JSONB), `created_at`.
- Enable RLS: Users can only manage their own subscriptions.

### [Component Name] public/sw.js

#### [MODIFY] [sw.js](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/public/sw.js)
- Add a `push` event listener to handle incoming messages.
- Add a `notificationclick` event listener to open the app or a specific URL when the notification is clicked.

### [Component Name] services/notificationService.ts

#### [MODIFY] [notificationService.ts](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/services/notificationService.ts)
- Add `initWebPush()`: Registers the service worker and checks for existing subscriptions.
- Add `subscribeUser()`: Requests push permission, creates a new subscription using the VAPID public key, and saves it to Supabase.
- Add `unsubscribeUser()`: Removes the subscription from both the browser and the database.

### [Component Name] pages/ProfilePage.tsx

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/Administrator/Documents/angolife%20atualizado/angolife%20atualizado/angolife/pages/ProfilePage.tsx)
- Update the notification toggle to use the new Web Push logic instead of just native browser permissions.

## VAPID Key Generation
Run the following command to generate VAPID keys (requires `web-push` to be installed globally or via npx):
```bash
npx web-push generate-vapid-keys
```
The generated keys must be added to `.env.local`:
- `VITE_VAPID_PUBLIC_KEY=your_public_key`
- `VAPID_PRIVATE_KEY=your_private_key` (if sending from a custom backend)

## Verification Plan

### Automated Tests
- Verify SW registration via browser subagent.
- Mock a push event and verify that a notification is displayed.

### Manual Verification
- Enable notifications in the Profile page.
- Check Supabase `push_subscriptions` table for the new entry.
- Trigger a test notification from the Supabase dashboard (using a helper script or Edge Function).
