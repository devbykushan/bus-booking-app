/**
 * Push Notification Service
 * Handles browser push notification subscription, permission requests,
 * and communication with the backend push API.
 */

import { BASE_URL } from './api';

// ─── Check if Push is Supported ──────────────────────────────────────────────

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// ─── Get Current Permission State ────────────────────────────────────────────

export function getPushPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

// ─── Get VAPID Public Key from Server ────────────────────────────────────────

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/push/vapid-key`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.publicKey || null;
  } catch {
    return null;
  }
}

// ─── Convert URL-safe Base64 to Uint8Array ───────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
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
      return { success: false, message: 'Notification permission was denied' };
    }

    // 2. Get VAPID key
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      return { success: false, message: 'Push notifications are not configured on the server' };
    }

    // 3. Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 4. Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // 5. Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });
    }

    // 6. Send subscription to backend
    const res = await fetch(`${BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    if (!res.ok) {
      throw new Error('Failed to save subscription on server');
    }

    // Save state in localStorage
    localStorage.setItem('push_notifications_enabled', 'true');

    return { success: true, message: 'Push notifications enabled successfully!' };
  } catch (err: any) {
    console.error('[Push] Subscribe error:', err);
    return { success: false, message: err?.message || 'Failed to enable push notifications' };
  }
}

// ─── Unsubscribe from Push Notifications ─────────────────────────────────────

export async function unsubscribeFromPush(): Promise<{ success: boolean; message: string }> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from backend
      await fetch(`${BASE_URL}/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      // Unsubscribe from browser
      await subscription.unsubscribe();
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
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
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

// ─── Send a Test Notification (local, no server) ─────────────────────────────

export async function sendTestNotification(): Promise<void> {
  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification('🚌 Dewmina Super Line', {
      body: 'Push notifications are working! You\'ll receive booking updates here.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'test-notification',
    });
  }
}
