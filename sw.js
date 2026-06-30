const CACHE_NAME = 'voice-camera-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安装时预缓存静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 激活时清除旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 网络优先策略：每次都尝试网络，失败才用缓存
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // HTML 文件：始终网络优先
  if (event.request.destination === 'document' ||
      event.request.url.endsWith('.html') ||
      event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 更新缓存
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 其他资源：缓存优先
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const clone = response.clone();
        if (response.ok && response.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
    )
  );
});
