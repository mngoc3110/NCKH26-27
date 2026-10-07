/**
 * ============================================================================
 * SERVICE WORKER - OFFLINE-FIRST CAPABILITY (COLORMIND ASD)
 * Đảm bảo ứng dụng hoạt động 100% khi không có mạng trong phòng can thiệp
 * ============================================================================
 */

const CACHE_NAME = 'colormind-asd-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './src/assets/icons/icon.svg',
  './src/assets/css/main.css',
  './src/assets/css/components.css',
  './src/assets/css/child-view.css',
  './src/assets/css/teacher-portal.css',
  './src/assets/css/camera-gesture.css',
  './src/core/state.js',
  './src/core/audio-engine.js',
  './src/core/color-system.js',
  './src/core/pwa-installer.js',
  './src/modules/research/research-logger.js',
  './src/modules/games/matching-game.js',
  './src/modules/games/sorting-game.js',
  './src/modules/games/sequence-game.js',
  './src/modules/teacher/content-manager.js',
  './src/modules/teacher/rules-config.js',
  './src/modules/teacher/spss-exporter.js',
  './src/modules/camera/camera-gesture.js',
  './src/main.js'
];

// 1. Cài đặt Service Worker và lưu cache toàn bộ file cốt lõi
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Lưu bộ nhớ đệm cho chế độ Ngoại Tuyến (Offline)...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Kích hoạt và dọn dẹp các phiên bản cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Xóa bộ nhớ đệm cũ:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Xử lý yêu cầu tài nguyên: Chiến lược Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  // Bỏ qua các yêu cầu không phải GET hoặc chrome-extension
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Trả về từ cache ngay lập tức để tải tức thì
        return cachedResponse;
      }
      // Nếu chưa có trong cache, tải từ mạng
      return fetch(event.request).then((networkResponse) => {
        // Nếu là tài nguyên nội bộ, tự động bổ sung vào cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Khi hoàn toàn offline và không có cache khớp
        console.warn('[Service Worker] Ngoại tuyến: Không tải được tài nguyên', event.request.url);
      });
    })
  );
});
