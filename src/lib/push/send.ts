/**
 * Server-side push notification helpers (placeholder).
 *
 * Uses the Web Push / VAPID protocol pattern. In production, wire this up to
 * the `web-push` npm package and store VAPID keys in environment variables.
 *
 * Subscriptions would be persisted in the `push_subscriptions` Supabase table.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// TODO: Configure VAPID keys
//
// In production, set these via environment variables:
//   VAPID_PUBLIC_KEY  — base64-url encoded public key
//   VAPID_PRIVATE_KEY — base64-url encoded private key
//   VAPID_SUBJECT     — mailto: or https: URL identifying the sender
//
// Generate a key pair with:
//   npx web-push generate-vapid-keys
// ---------------------------------------------------------------------------

// const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
// const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
// const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@sunsetshorresrv.com";

// ---------------------------------------------------------------------------
// sendPushNotification
// ---------------------------------------------------------------------------

/**
 * Send a push notification to a specific guest.
 *
 * In production this would:
 * 1. Look up the guest's push subscription(s) from the database.
 * 2. Call `webpush.sendNotification()` for each active subscription.
 * 3. Remove any subscriptions that return a 410 Gone response.
 *
 * @param guestId  — the guest to notify
 * @param title    — notification title
 * @param body     — notification body text
 * @param data     — optional structured data payload (e.g. deep-link URL)
 */
export async function sendPushNotification(
  guestId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement with web-push library
  //
  // const webpush = require("web-push");
  // webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  //
  // const { data: subscriptions } = await supabase
  //   .from("push_subscriptions")
  //   .select("*")
  //   .eq("guest_id", guestId);
  //
  // const payload = JSON.stringify({ title, body, data });
  //
  // for (const sub of subscriptions ?? []) {
  //   try {
  //     await webpush.sendNotification(sub.subscription, payload);
  //   } catch (err: any) {
  //     if (err.statusCode === 410) {
  //       // Subscription expired — clean up
  //       await supabase
  //         .from("push_subscriptions")
  //         .delete()
  //         .eq("id", sub.id);
  //     }
  //   }
  // }

  console.log(
    `[push] sendPushNotification — guestId=${guestId}, title="${title}", body="${body}"`,
    data,
  );

  return { success: true };
}

// ---------------------------------------------------------------------------
// subscribeToPush
// ---------------------------------------------------------------------------

/**
 * Store a guest's push subscription in the database.
 *
 * Called from a client-side API route after the browser grants push permission
 * and returns a PushSubscription object.
 *
 * @param guestId      — the guest who subscribed
 * @param subscription — the PushSubscription from the browser
 */
export async function subscribeToPush(
  guestId: string,
  subscription: PushSubscriptionData,
): Promise<{ success: boolean; error?: string }> {
  // TODO: Persist to Supabase
  //
  // const { error } = await supabase.from("push_subscriptions").upsert(
  //   {
  //     guest_id: guestId,
  //     endpoint: subscription.endpoint,
  //     subscription: subscription,
  //     created_at: new Date().toISOString(),
  //   },
  //   { onConflict: "endpoint" },
  // );
  //
  // if (error) return { success: false, error: error.message };

  console.log(
    `[push] subscribeToPush — guestId=${guestId}, endpoint=${subscription.endpoint}`,
  );

  return { success: true };
}

// ---------------------------------------------------------------------------
// unsubscribeFromPush
// ---------------------------------------------------------------------------

/**
 * Remove a guest's push subscription from the database.
 *
 * @param guestId  — the guest who unsubscribed
 * @param endpoint — the subscription endpoint to remove
 */
export async function unsubscribeFromPush(
  guestId: string,
  endpoint: string,
): Promise<{ success: boolean; error?: string }> {
  // TODO: Delete from Supabase
  //
  // const { error } = await supabase
  //   .from("push_subscriptions")
  //   .delete()
  //   .eq("guest_id", guestId)
  //   .eq("endpoint", endpoint);
  //
  // if (error) return { success: false, error: error.message };

  console.log(
    `[push] unsubscribeFromPush — guestId=${guestId}, endpoint=${endpoint}`,
  );

  return { success: true };
}
