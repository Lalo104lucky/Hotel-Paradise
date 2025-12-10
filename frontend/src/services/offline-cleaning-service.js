import { CleaningService } from '../config/http-gateway';
import pouchDBService from './pouchdb-service';
import networkStatus from './network-status';
import syncService from './sync-service';
import { RoomStatus } from '../config/http-gateway/room-service';

/**
 * Wrapper del CleaningService que maneja automáticamente modo offline
 */
export const OfflineCleaningService = {
  /**
   * Registra una limpieza (online o en cola offline)
   * @param {Object} cleaningData - { roomId, notes?, assignmentId? }
   * @returns {Promise<Object>} { data, error, isQueued }
   */
  async registerCleaning(cleaningData) {
    const isOnline = networkStatus.getIsOnline();

    try {
      // PASO 1: Actualizar el estado en PouchDB PRIMERO para persistir el cambio
      await pouchDBService.updateRoomStatus(cleaningData.roomId, { status: RoomStatus.LIMPIA });
      
      if (isOnline) {
        // PASO 2: Intentar enviar al servidor directamente
        const result = await CleaningService.registerCleaning(cleaningData);

        if (!result.error) {
          // Si fue exitoso, NO encolar y actualizar caché de habitaciones
          await syncService.syncRoomsFromServer();
          return { ...result, isQueued: false, offlineMode: false };
        } else {
          // Si falla online, encolar como fallback (el estado ya está actualizado en caché)
          console.warn('[OfflineCleaningService] Falló el envío online, encolando...');
          await pouchDBService.queueCleaning(cleaningData);
          return {
            data: { message: 'Limpieza guardada en cola para sincronización' },
            error: null,
            isQueued: true,
            offlineMode: true
          };
        }
      } else {
        // Modo offline: guardar en cola (el estado ya está actualizado en caché)
        console.log('[OfflineCleaningService] Modo offline, agregando a cola');
        await pouchDBService.queueCleaning(cleaningData);

        return {
          data: { message: 'Limpieza guardada en cola para sincronización' },
          error: null,
          isQueued: true,
          offlineMode: true
        };
      }
    } catch (error) {
      console.error('[OfflineCleaningService] Error registrando limpieza:', error);
      // Si hay excepción, encolar
      await pouchDBService.queueCleaning(cleaningData);
      return {
        data: { message: 'Limpieza guardada en cola para sincronización' },
        error: null,
        isQueued: true,
        offlineMode: true
      };
    }
  },

  /**
   * Obtiene el estado de la cola de sincronización
   * @returns {Promise<Object>}
   */
  async getPendingSyncStatus() {
    const pendingCleanings = await pouchDBService.getPendingCleanings();
    return {
      count: pendingCleanings.length,
      items: pendingCleanings
    };
  },

  // Re-exportar métodos que no necesitan funcionalidad offline
  getCleaningsByRoom: CleaningService.getCleaningsByRoom,
  getCleaningsByUser: CleaningService.getCleaningsByUser,
  getCleaningsByDateRange: CleaningService.getCleaningsByDateRange,
  getPendingSyncCleanings: CleaningService.getPendingSyncCleanings
};
