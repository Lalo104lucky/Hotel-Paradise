import { messaging, VAPID_KEY, getToken, onMessage } from '../config/firebase-config';
import { NotificationService } from '../config/http-gateway';

/**
 * Solicita permisos de notificación y registra el FCM token
 */
export const requestNotificationPermission = async () => {
  try {
    console.log('[Firebase] Solicitando permisos de notificación...');

    // Verificar si messaging está disponible
    if (!messaging) {
      console.warn('[Firebase] Firebase Messaging no está disponible en este navegador');
      return null;
    }

    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.warn('[Firebase] Este navegador no soporta notificaciones push');
      return null;
    }

    // Solicitar permisos
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('[Firebase] Permisos concedidos');

      // Obtener el FCM token
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (currentToken) {
        console.log('[Firebase] FCM Token obtenido:', currentToken);

        // Enviar el token al backend
        const { data, error } = await NotificationService.updateFcmToken(currentToken);

        if (error) {
          console.error('[Firebase] Error al guardar FCM token en el backend:', error);
        } else {
          console.log('[Firebase] FCM token guardado en el backend exitosamente');
        }

        return currentToken;
      } else {
        console.warn('[Firebase] No se pudo obtener el FCM token');
        return null;
      }
    } else if (permission === 'denied') {
      console.warn('[Firebase] Permisos de notificación denegados');
      return null;
    } else {
      console.warn('[Firebase] Permisos de notificación no concedidos (default)');
      return null;
    }
  } catch (error) {
    console.error('[Firebase] Error al solicitar permisos de notificación:', error);
    return null;
  }
};

/**
 * Configura el listener para notificaciones en primer plano
 */
export const setupForegroundNotificationListener = (onNotificationReceived) => {
  try {
    // Verificar si messaging está disponible
    if (!messaging) {
      console.warn('[Firebase] Firebase Messaging no está disponible, no se puede configurar listener');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('[Firebase] Mensaje recibido en primer plano:', payload);
      console.log('[Firebase] Notification payload:', payload.notification);
      console.log('[Firebase] Data payload:', payload.data);

      // Verificar que payload.notification existe
      if (!payload.notification) {
        console.warn('[Firebase] Payload no contiene notification, solo data');
        if (onNotificationReceived) {
          onNotificationReceived(payload);
        }
        return;
      }

      const { title, body } = payload.notification;
      const data = payload.data;

      console.log('[Firebase] Mostrando notificación:', { title, body });

      // Mostrar notificación del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        // Usar timestamp como tag único para que cada notificación sea independiente
        const uniqueTag = `hotel-${Date.now()}`;

        const notification = new Notification(title, {
          body: body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          data: data,
          requireInteraction: false, // Auto-cerrar después de unos segundos
          tag: uniqueTag // Tag único para cada notificación
        });

        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notification.close();

          // Callback personalizado si se proporciona
          if (onNotificationReceived) {
            onNotificationReceived(payload);
          }
        };

        console.log('[Firebase] Notificación mostrada exitosamente');
      } else {
        console.warn('[Firebase] No se puede mostrar notificación. Permission:', Notification.permission);
      }

      // Callback personalizado si se proporciona
      if (onNotificationReceived) {
        onNotificationReceived(payload);
      }
    });

    console.log('[Firebase] Listener de notificaciones en primer plano configurado');
  } catch (error) {
    console.error('[Firebase] Error al configurar listener de notificaciones:', error);
  }
};

/**
 * Formatea una fecha relativa (ej: "hace 5 minutos")
 */
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace un momento';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }
};

export default {
  requestNotificationPermission,
  setupForegroundNotificationListener,
  formatRelativeTime
};
