importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración Firebase (MISMA DEL PASO 3.1)
firebase.initializeApp({
    apiKey: "AIzaSyAgWkN6yiSpfTIERr09c-gotAgbGLcIAXg",
    authDomain: "hotel-management-system-5cc8c.firebaseapp.com",
    projectId: "hotel-management-system-5cc8c",
    storageBucket: "hotel-management-system-5cc8c.firebasestorage.app",
    messagingSenderId: "141796617920",
    appId: "1:141796617920:web:0b7c3fc706842d13090725"
});

const messaging = firebase.messaging();

// Manejo de notificaciones en background
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensaje recibido en background:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notificación clickeada:', event);
    event.notification.close();

    // Abrir la aplicación
    event.waitUntil(
        clients.openWindow('/')
    );
});