/// <reference lib="webworker" />

// ─── Push Notification Handler for Service Worker ────────────────────────────
// This file is injected into the PWA service worker via vite-plugin-pwa

declare const self: ServiceWorkerGlobalScope;

// Handle incoming push events
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const title = data.title || '🚌 Dewmina Super Line';
    const options: NotificationOptions = {
      body: data.body || '',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      tag: data.tag || `notification-${Date.now()}`,
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
      },
      actions: [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Push event parse error:', err);
    // Fallback: show raw text
    const text = event.data?.text() || 'New notification';
    event.waitUntil(
      self.registration.showNotification('🚌 Dewmina Super Line', { body: text })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});

// Handle push subscription change (auto-resubscribe)
self.addEventListener('pushsubscriptionchange', ((event: any) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
              },
            },
          }),
        });
      })
  );
}) as EventListener);
