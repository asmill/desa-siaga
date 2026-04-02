import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DesaSiaga Warga',
        short_name: 'DesaSiaga',
        description: 'Aplikasi Prioritas Panggilan Ambulans Desa',
        theme_color: '#ef4444',
        background_color: '#f1f5f9',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/808/808602.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      }
    })
  ],
});
