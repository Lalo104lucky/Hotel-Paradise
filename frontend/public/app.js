// PWA Helper Functions para Hotel Paradise
// Este archivo contiene utilidades para el registro del Service Worker
// y funcionalidades offline/PWA

/**
 * Registra el Service Worker
 * Debe ser llamado desde el index.html o main.jsx
 */
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('[PWA] Service Worker registrado:', registration.scope);

                // Detectar actualizaciones del Service Worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[PWA] Nueva versión del Service Worker encontrada');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Hay una nueva versión disponible
                            console.log('[PWA] Nueva versión lista. Considera recargar.');
                            // Opcionalmente mostrar notificación al usuario
                            notifyUpdate();
                        }
                    });
                });
            } catch (error) {
                console.error('[PWA] Error al registrar Service Worker:', error);
            }
        });

        // Detectar cuando el SW toma control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA] Service Worker actualizado y activo');
        });
    } else {
        console.warn('[PWA] Service Workers no son soportados en este navegador');
    }
}

/**
 * Notifica al usuario que hay una actualización disponible
 */
function notifyUpdate() {
    // Aquí puedes usar SweetAlert2 o cualquier sistema de notificaciones
    if (window.confirm('Nueva versión disponible. ¿Recargar para actualizar?')) {
        window.location.reload();
    }
}

/**
 * Verifica si la aplicación está instalada como PWA
 * @returns {boolean}
 */
export function isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

/**
 * Verifica el estado de la red
 * @returns {boolean}
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Escucha cambios en el estado de la red
 * @param {Function} onlineCallback - Función a ejecutar cuando se conecta
 * @param {Function} offlineCallback - Función a ejecutar cuando se desconecta
 */
export function watchNetworkStatus(onlineCallback, offlineCallback) {
    window.addEventListener('online', () => {
        console.log('[PWA] Conexión restaurada');
        if (onlineCallback) onlineCallback();
    });

    window.addEventListener('offline', () => {
        console.log('[PWA] Sin conexión');
        if (offlineCallback) offlineCallback();
    });
}

/**
 * Obtiene información sobre el Service Worker activo
 * @returns {Promise<ServiceWorker|null>}
 */
export async function getActiveServiceWorker() {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.active || null;
    }
    return null;
}

/**
 * Fuerza la actualización del Service Worker
 */
export async function updateServiceWorker() {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.update();
            console.log('[PWA] Service Worker actualizado manualmente');
        }
    }
}

/**
 * Desregistra el Service Worker (útil para debugging)
 */
export async function unregisterServiceWorker() {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            const result = await registration.unregister();
            console.log('[PWA] Service Worker desregistrado:', result);
            return result;
        }
    }
    return false;
}

// Función de inicialización que se puede llamar desde React
export function initPWA(options = {}) {
    const {
        onOnline = () => console.log('[PWA] Online'),
        onOffline = () => console.log('[PWA] Offline'),
        autoRegister = true
    } = options;

    console.log('[PWA] Inicializando funcionalidades PWA...');
    console.log('[PWA] ¿Instalada?:', isPWAInstalled());
    console.log('[PWA] ¿Online?:', isOnline());

    // Registrar Service Worker
    if (autoRegister) {
        registerServiceWorker();
    }

    // Monitorear estado de red
    watchNetworkStatus(onOnline, onOffline);

    return {
        isPWAInstalled: isPWAInstalled(),
        isOnline: isOnline(),
        updateServiceWorker,
        unregisterServiceWorker
    };
}

// Auto-inicialización si se importa como módulo
if (typeof window !== 'undefined') {
    console.log('[PWA] app.js cargado');
}
