/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Service worker for push notifications
self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options: NotificationOptions = {
      body: data.body || 'New alert from ChartingPath',
      icon: '/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png',
      badge: '/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png',
      tag: data.tag || 'chartingpath-alert',
      data: {
        url: data.url || '/members/alerts',
        alertId: data.alertId,
      },
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ChartingPath Alert', options)
    );
  } catch (err) {
    console.error('[SW] Push event error:', err);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'dismiss') {
    return;
  }

  // Open or focus the app
  const urlToOpen = data?.url || '/members/alerts';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

