// Service Worker para Hotel Management PWA + Firebase Notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAgWkN6yiSpfTIERr09c-gotAgbGLcIAXg",
    authDomain: "hotel-management-system-5cc8c.firebaseapp.com",
    projectId: "hotel-management-system-5cc8c",
    storageBucket: "hotel-management-system-5cc8c.firebasestorage.app",
    messagingSenderId: "141796617920",
    appId: "1:141796617920:web:0b7c3fc706842d13090725"
});

const messaging = firebase.messaging();

const CACHE_NAME = 'hotel-management-v5';

// Obtener el base path dinámicamente
const BASE_PATH = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/'));

const ASSETS = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/logo.svg`,
    `${BASE_PATH}/manifest.json`
];

// Instalación: precachear recursos estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                await cache.addAll(ASSETS);
                console.log('[SW] Assets precached');
                self.skipWaiting(); // Activar inmediatamente
            } catch (error) {
                console.error('[SW] Error during install:', error);
            }
        })()
    );
});

// Activación: limpiar cachés antiguos
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        (async () => {
            const cacheKeys = await caches.keys();
            await Promise.all(
                cacheKeys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
            );
            self.clients.claim(); // Tomar control inmediatamente
            console.log('[SW] Service Worker activated');
        })()
    );
});

// Fetch: estrategia Network First con fallback a cache
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Solo manejar peticiones GET con http/https
    if (req.method !== 'GET') return;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // Network First para peticiones a la API (datos frescos)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(req));
        return;
    }

    // Cache First para recursos estáticos (performance)
    event.respondWith(cacheFirst(req));
});

// Estrategia Network First: intenta red primero, fallback a cache
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cachear respuesta exitosa
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await cache.match(request);
        return cachedResponse || Response.error();
    }
}

// Estrategia Cache First: cache primero, fallback a red
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        return Response.error();
    }
}

// Mensajes del cliente (para debug o sincronización futura)
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ===== FIREBASE NOTIFICATIONS =====

// Manejo de notificaciones en background
messaging.onBackgroundMessage((payload) => {
    console.log('[Firebase] Mensaje recibido en background:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        data: payload.data,
        tag: `hotel-${Date.now()}`, // Tag único para cada notificación
        requireInteraction: false
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('[Firebase] Notificación clickeada:', event);
    event.notification.close();

    // Abrir la aplicación
    event.waitUntil(
        clients.openWindow('/')
    );
});
