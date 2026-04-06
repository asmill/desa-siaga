// Service Worker untuk DesaSiaga — Notifikasi Latar Belakang SOS & Chat
// OneSignal SDK (untuk Push Notifications via OneSignal)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Menangkap pesan dari halaman utama untuk menampilkan notifikasi
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [300, 100, 300, 100, 600],
      requireInteraction: true,  // Notifikasi tidak hilang sendiri sampai diklik
      tag: 'desasiaga-sos'       // Mencegah duplicate
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
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
