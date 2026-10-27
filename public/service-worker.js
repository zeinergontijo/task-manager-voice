const CACHE_NAME = 'task-manager-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Cache instalado');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API calls - Network First
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a resposta bem-sucedida
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline - retornar do cache se disponível
          return caches.match(request);
        })
    );
  }
  // Assets - Cache First
  else {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
  }
});

// Background Sync para sincronizar quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tarefas') {
    event.waitUntil(sincronizarTarefas());
  }
});

async function sincronizarTarefas() {
  try {
    console.log('🔄 Sincronizando tarefas...');
    // Aqui você pode implementar lógica de sincronização
    // Por enquanto, apenas log
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
  }
}
