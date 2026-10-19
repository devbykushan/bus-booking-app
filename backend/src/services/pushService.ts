import { dbQuery } from '../db/database';
import crypto from 'crypto';

// ─── VAPID Keys ──────────────────────────────────────────────────────────────
// Set these in your .env file:
//   VAPID_PUBLIC_KEY=...
//   VAPID_PRIVATE_KEY=...
//   VAPID_SUBJECT=mailto:your@email.com
// 
// Generate keys by running: npx web-push generate-vapid-keys

const DEFAULT_VAPID_PUBLIC_KEY = 'BHhCc0-UWPpI-uJ7SviOuimM4Drkdtsg1ZPnI7KUY8dJUR9cmsT7JsBNHZd2Sx9wYUgaac-0yQvAbjo5JUtsCaU';
const DEFAULT_VAPID_PRIVATE_KEY = 'nGuD6fgMiE2kmOqinxWxfb3t76sXkPP8TAn5ls3sfx8';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:dewminasuperline@gmail.com';

// ─── Save Subscription ──────────────────────────────────────────────────────

export async function saveSubscription(
  userId: string | null,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  await dbQuery(
    `INSERT INTO push_subscriptions ("userId", "endpoint", "p256dh", "auth")
     VALUES ($1, $2, $3, $4)
     ON CONFLICT ("endpoint") DO UPDATE SET
       "userId" = COALESCE($1, push_subscriptions."userId"),
       "p256dh" = $3,
       "auth" = $4`,
    [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
  );
}

// ─── Remove Subscription ─────────────────────────────────────────────────────

export async function removeSubscription(endpoint: string): Promise<void> {
  await dbQuery(`DELETE FROM push_subscriptions WHERE "endpoint" = $1`, [endpoint]);
}

// ─── Send Push to a Specific User ────────────────────────────────────────────

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; icon?: string; badge?: string; url?: string; tag?: string }
): Promise<number> {
  const result = await dbQuery(
    `SELECT "endpoint", "p256dh", "auth" FROM push_subscriptions WHERE "userId" = $1`,
    [userId]
  );
  
  let sent = 0;
  for (const sub of result.rows) {
    try {
      await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      // If subscription expired (410 Gone), remove it
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await removeSubscription(sub.endpoint);
      }
      console.warn(`[Push] Failed to send to ${sub.endpoint.slice(0, 50)}...`, err?.message);
    }
  }
  return sent;
}

// ─── Send Push to ALL Subscribers ────────────────────────────────────────────

export async function sendPushToAll(
  payload: { title: string; body: string; icon?: string; badge?: string; url?: string; tag?: string }
): Promise<number> {
  const result = await dbQuery(`SELECT "endpoint", "p256dh", "auth" FROM push_subscriptions`);
  
  let sent = 0;
  for (const sub of result.rows) {
    try {
      await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await removeSubscription(sub.endpoint);
      }
    }
  }
  return sent;
}

// ─── Notification Helpers ────────────────────────────────────────────────────

export async function notifyBookingConfirmed(userId: string, pnr: string, route: string, date: string, seat: string): Promise<void> {
  await sendPushToUser(userId, {
    title: '✅ Booking Confirmed!',
    body: `PNR: ${pnr} | ${route} | ${date} | Seat ${seat}`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/#my-tickets',
    tag: `booking-${pnr}`,
  });
}

export async function notifyPaymentApproved(userId: string, pnr: string): Promise<void> {
  await sendPushToUser(userId, {
    title: '💰 Payment Approved!',
    body: `Your payment for booking ${pnr} has been verified and approved.`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/#my-tickets',
    tag: `payment-${pnr}`,
  });
}

export async function notifyTripReminder(userId: string, route: string, time: string): Promise<void> {
  await sendPushToUser(userId, {
    title: '⏰ Trip Reminder',
    body: `Your bus departs in 1 hour! ${route} at ${time}`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/#my-tickets',
    tag: `reminder-${Date.now()}`,
  });
}

export async function notifyPromoOffer(title: string, body: string): Promise<number> {
  return await sendPushToAll({
    title,
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/#home',
    tag: `promo-${Date.now()}`,
  });
}

export async function notifyBusDelay(route: string, originalTime: string, newTime: string): Promise<number> {
  return await sendPushToAll({
    title: '⚠️ Bus Schedule Update',
    body: `${route} delayed from ${originalTime} to ${newTime}`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/#journeys',
    tag: `delay-${Date.now()}`,
  });
}

// ─── Native Web Push Implementation (no external library needed) ─────────────
// Uses the Web Push Protocol (RFC 8291, RFC 8292) with VAPID auth

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

async function sendWebPush(subscription: PushSubscription, payload: string): Promise<void> {
  // If web-push library is available, use it. Otherwise fall back to fetch-based push.
  try {
    // @ts-ignore
    const webpush: any = await import('web-push');
    
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      payload,
      { TTL: 60 * 60 } // 1 hour TTL
    );
  } catch (importErr: any) {
    if (importErr?.code === 'MODULE_NOT_FOUND') {
      console.warn('[Push] web-push module not installed. Run: npm install web-push');
      console.warn('[Push] Notification skipped for:', subscription.endpoint.slice(0, 60));
    } else {
      throw importErr;
    }
  }
}

// ─── Get VAPID Public Key ────────────────────────────────────────────────────

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
