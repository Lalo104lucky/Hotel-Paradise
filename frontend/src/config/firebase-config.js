import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyAgWkN6yiSpfTIERr09c-gotAgbGLcIAXg",
    authDomain: "hotel-management-system-5cc8c.firebaseapp.com",
    projectId: "hotel-management-system-5cc8c",
    storageBucket: "hotel-management-system-5cc8c.firebasestorage.app",
    messagingSenderId: "141796617920",
    appId: "1:141796617920:web:0b7c3fc706842d13090725"
};

const app = initializeApp(firebaseConfig);

// VAPID Key (clave pública del Paso 1.6)
const VAPID_KEY = "BPVg6SubW0LONRplDaj-oA8SXiuhPLSasgEQQGW8_M5AS3_0S2Za2hYKDs3WCdSclv84XosMaW79KRgjOGioD-0";

// Inicializar messaging solo si el navegador lo soporta
let messaging = null;

try {
    // Verificar si Messaging es soportado
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        messaging = getMessaging(app);
        console.log('[Firebase] Messaging inicializado correctamente');
    } else {
        console.warn('[Firebase] Service Workers no soportados en este navegador');
    }
} catch (error) {
    console.warn('[Firebase] Error al inicializar Messaging:', error.message);
    console.warn('[Firebase] Las notificaciones push no estarán disponibles');
}

export { messaging, VAPID_KEY, getToken, onMessage, isSupported };