/**
 * Servicio para detectar y monitorear el estado de la conexión a internet
 */

class NetworkStatusService {
  constructor() {
    this.listeners = [];
    this.isOnline = navigator.onLine;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => {
      console.log('[NetworkStatus] 🟢 Conexión restaurada');
      this.isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      console.log('[NetworkStatus] 🔴 Sin conexión a internet');
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  /**
   * Verifica si hay conexión a internet
   * @returns {boolean}
   */
  getIsOnline() {
    return this.isOnline;
  }

  /**
   * Registra un listener para cambios en el estado de la red
   * @param {Function} callback - Función que recibe (isOnline)
   * @returns {Function} Función para remover el listener
   */
  onStatusChange(callback) {
    this.listeners.push(callback);

    // Retornar función para remover el listener
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(isOnline) {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('[NetworkStatus] Error en listener:', error);
      }
    });
  }

  /**
   * Verifica conectividad haciendo ping al backend
   * @returns {Promise<boolean>}
   */
  async checkConnectivity() {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('[NetworkStatus] Backend no disponible:', error.message);
      return false;
    }
  }
}

// Exportar instancia singleton
const networkStatus = new NetworkStatusService();
export default networkStatus;
