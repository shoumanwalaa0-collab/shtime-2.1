// Service Worker for Shtime-2 Background Notifications & FCM
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Direct message from client to display background notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data;
    const options = {
      body: body || 'Shtime-2. Play now',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: 'shtime-notif-' + Date.now(),
      data: { url: '/' },
    };
    event.waitUntil(self.registration.showNotification(title || 'Shtime-2', options));
  }
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Now shtime-2',
    body: 'تحديث جديد يمكنك الان اذ انهيت المراحل يبدا الذكاء الاصطناعي بصناعه مراحل وتم اضافه قائمه SOON التي يمكنك بها رؤيه التحديثات القادمه',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
