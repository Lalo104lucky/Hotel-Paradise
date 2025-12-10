import { AxiosClient } from './http-client';

const NotificationService = {
  /**
   * Obtiene todas las notificaciones del usuario autenticado
   */
  async getMyNotifications() {
    try {
      const response = await AxiosClient.get('api/notifications');
      return { data: response, error: null };
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return { data: null, error: error.response?.data || error.message };
    }
  },

  /**
   * Obtiene solo las notificaciones no leídas
   */
  async getUnreadNotifications() {
    try {
      const response = await AxiosClient.get('api/notifications/unread');
      return { data: response, error: null };
    } catch (error) {
      console.error('Error obteniendo notificaciones no leídas:', error);
      return { data: null, error: error.response?.data || error.message };
    }
  },

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getUnreadCount() {
    try {
      const response = await AxiosClient.get('api/notifications/unread/count');
      return { data: response.count, error: null };
    } catch (error) {
      console.error('Error obteniendo conteo de notificaciones:', error);
      return { data: 0, error: error.response?.data || error.message };
    }
  },

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId) {
    try {
      const response = await AxiosClient.put(`api/notifications/${notificationId}/read`);
      return { data: response, error: null };
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      return { data: null, error: error.response?.data || error.message };
    }
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead() {
    try {
      const response = await AxiosClient.put('api/notifications/read-all');
      return { data: response, error: null };
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      return { data: null, error: error.response?.data || error.message };
    }
  },

  /**
   * Actualiza el FCM token del usuario
   */
  async updateFcmToken(fcmToken) {
    try {
      const response = await AxiosClient.put('auth/fcm-token', { fcmToken });
      return { data: response, error: null };
    } catch (error) {
      console.error('Error actualizando FCM token:', error);
      return { data: null, error: error.response?.data || error.message };
    }
  },

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId) {
    try {
      const response = await AxiosClient.delete(`api/notifications/${notificationId}`);
      return { data: response, error: null };
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      return { data: null, error: error.response?.data || error.message };
    }
  }
};

export default NotificationService;
