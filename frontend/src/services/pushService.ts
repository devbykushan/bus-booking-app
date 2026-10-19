/**
 * Push Notification Service
 * Handles browser push notification subscription, permission requests,
 * and communication with the backend push API.
 */

import { BASE_URL } from './api';

const DEFAULT_VAPID_PUBLIC_KEY =
  'BHhCc0-UWPpI-uJ7SviOuimM4Drkdtsg1ZPnI7KUY8dJUR9cmsT7JsBNHZd2Sx9wYUgaac-0yQvAbjo5JUtsCaU';

// ─── Check if Push is Supported ──────────────────────────────────────────────

export function isPushSupported(): boolean {
  return 'Notification' in window;
}

// ─── Get Current Permission State ────────────────────────────────────────────

export function getPushPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

// ─── Get VAPID Public Key from Server (with reliable fallback) ───────────────

async function getVapidPublicKey(): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/push/vapid-key`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.publicKey && typeof data.publicKey === 'string') {
        return data.publicKey;
      }
    }
  } catch {
    // Fall back to default key
  }
  return DEFAULT_VAPID_PUBLIC_KEY;
}

// ─── Convert URL-safe Base64 to Uint8Array ───────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ─── Subscribe to Push Notifications ─────────────────────────────────────────

export async function subscribeToPush(userId?: string): Promise<{ success: boolean; message: string }> {
  if (!isPushSupported()) {
    return { success: false, message: 'Push notifications are not supported in this browser' };
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Notification permission was denied in browser settings' };
    }

    // 2. Get VAPID key
    const vapidKey = await getVapidPublicKey();

    // 3. Try to get service worker registration with timeout
    let subscription: PushSubscription | null = null;
    if ('serviceWorker' in navigator) {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (registration && registration.pushManager) {
          subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
            });
          }
        }
      } catch (swErr) {
        console.warn('[Push] PushManager subscription warning (using local notifications):', swErr);
      }
    }

    // 4. Send subscription to backend if available
    if (subscription) {
      try {
        await fetch(`${BASE_URL}/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
                auth: arrayBufferToBase64(subscription.getKey('auth')!),
              },
            },
            userId: userId || null,
          }),
        });
      } catch (netErr) {
        console.warn('[Push] Could not sync subscription to backend (will retry later):', netErr);
      }
    }

    // 5. Save state in localStorage
    localStorage.setItem('push_notifications_enabled', 'true');

    return { success: true, message: 'Push notifications enabled successfully! 🔔' };
  } catch (err: any) {
    console.error('[Push] Subscribe error:', err);
    return { success: false, message: err?.message || 'Failed to enable push notifications' };
  }
}

// ─── Unsubscribe from Push Notifications ─────────────────────────────────────

export async function unsubscribeFromPush(): Promise<{ success: boolean; message: string }> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);

      if (registration && registration.pushManager) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          fetch(`${BASE_URL}/push/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          }).catch(() => {});

          await subscription.unsubscribe();
        }
      }
    }

    localStorage.setItem('push_notifications_enabled', 'false');
    return { success: true, message: 'Push notifications disabled' };
  } catch (err: any) {
    console.error('[Push] Unsubscribe error:', err);
    return { success: false, message: 'Failed to disable push notifications' };
  }
}

// ─── Check if Currently Subscribed ───────────────────────────────────────────

export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  return localStorage.getItem('push_notifications_enabled') === 'true';
}

// ─── Helper: ArrayBuffer to Base64 ──────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ─── Send a Test Notification (local preview) ────────────────────────────────

export async function sendTestNotification(): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification('🚌 Dewmina Super Line', {
          body: 'Push notifications are active! You will receive live booking confirmations & departure updates.',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'dewmina-active-test',
        });
        return;
      }
    }
  } catch {}

  try {
    new Notification('🚌 Dewmina Super Line', {
      body: 'Push notifications are active! You will receive live booking confirmations & departure updates.',
      icon: '/pwa-192x192.png',
    });
  } catch {}
}
