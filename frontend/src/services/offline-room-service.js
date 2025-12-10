import { RoomService } from '../config/http-gateway';
import pouchDBService from './pouchdb-service';
import networkStatus from './network-status';
import syncService from './sync-service';

/**
 * Wrapper del RoomService que maneja automáticamente modo offline
 */
export const OfflineRoomService = {
  /**
   * Obtiene todas las habitaciones (online o desde caché offline)
   * @returns {Promise<Object>} { data, error, isFromCache }
   */
  async getAllRooms() {
    const isOnline = networkStatus.getIsOnline();

    if (isOnline) {
      try {
        const result = await RoomService.getAllRooms();

        // Si fue exitoso, guardar en caché
        if (!result.error && result.data) {
          await pouchDBService.saveRooms(result.data);
        }

        return { ...result, isFromCache: false };
      } catch (error) {
        console.warn('[OfflineRoomService] Error en servidor, usando caché...', error);
        // Si falla, intentar con caché
        const cachedRooms = await pouchDBService.getRooms();
        return {
          data: cachedRooms,
          error: null,
          isFromCache: true,
          cacheWarning: 'Mostrando datos en caché (sin conexión al servidor)'
        };
      }
    } else {
      // Modo offline: usar solo caché
      console.log('[OfflineRoomService] Modo offline, usando caché local');
      const cachedRooms = await pouchDBService.getRooms();
      return {
        data: cachedRooms,
        error: null,
        isFromCache: true,
        offlineMode: true
      };
    }
  },

  /**
   * Obtiene una habitación por ID
   * @param {number} id - ID de la habitación
   * @returns {Promise<Object>} { data, error, isFromCache }
   */
  async getRoomById(id) {
    const isOnline = networkStatus.getIsOnline();

    if (isOnline) {
      return await RoomService.getRoomById(id);
    } else {
      // Buscar en caché
      const cachedRooms = await pouchDBService.getRooms();
      const room = cachedRooms.find(r => r.id === id);

      if (room) {
        return { data: room, error: null, isFromCache: true };
      } else {
        return {
          data: null,
          error: { message: 'Habitación no encontrada en caché offline' },
          isFromCache: true
        };
      }
    }
  },

  /**
   * Actualiza el estado de una habitación
   * @param {number} id - ID de la habitación
   * @param {Object} statusData - { status, notes? }
   * @returns {Promise<Object>}
   */
  async updateRoomStatus(id, statusData) {
    const isOnline = networkStatus.getIsOnline();

    if (isOnline) {
      try {
        const result = await RoomService.updateRoomStatus(id, statusData);

        // Si fue exitoso, actualizar caché
        if (!result.error) {
          await pouchDBService.updateRoomStatus(id, statusData);
          await syncService.syncRoomsFromServer();
        }

        return result;
      } catch (error) {
        // Si falla online, intentar guardar offline
        console.warn('[OfflineRoomService] Error actualizando en servidor, guardando offline...', error);
        await pouchDBService.updateRoomStatus(id, statusData);
        return {
          data: { id, ...statusData },
          error: null,
          offlineMode: true,
          warning: 'Cambio guardado localmente. Se sincronizará cuando haya conexión.'
        };
      }
    } else {
      // En modo offline, actualizamos el caché local
      try {
        await pouchDBService.updateRoomStatus(id, statusData);

        return {
          data: { id, ...statusData },
          error: null,
          offlineMode: true,
          warning: 'Cambio guardado localmente. Se sincronizará cuando haya conexión.'
        };
      } catch (error) {
        return {
          data: null,
          error: { message: error.message },
          offlineMode: true
        };
      }
    }
  },

  // Re-exportar métodos que no necesitan funcionalidad offline
  getRoomsByStatus: RoomService.getRoomsByStatus,
  getRoomsByFloor: RoomService.getRoomsByFloor,
  createRoom: RoomService.createRoom,
  updateRoom: RoomService.updateRoom,
  deleteRoom: RoomService.deleteRoom
};
