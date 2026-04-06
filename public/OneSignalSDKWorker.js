// Service Worker DesaSiaga — Notifikasi Latar Belakang SOS & Chat

// OneSignal SDK
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Tangani notifikasi yang dikirim via postMessage dari halaman utama
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      tag: 'desasiaga-sos'
    });
  }
});

// Klik notifikasi: buka/fokus tab aplikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
