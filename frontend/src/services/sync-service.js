import pouchDBService from './pouchdb-service';
import networkStatus from './network-status';
import { RoomService, CleaningService, IncidentService } from '../config/http-gateway';

/**
 * Servicio de sincronización entre PouchDB y el backend
 */
class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];

    // Auto-sincronizar cuando se recupera la conexión
    networkStatus.onStatusChange((isOnline) => {
      if (isOnline && !this.isSyncing) {
        console.log('[SyncService] Conexión restaurada, iniciando sincronización...');
        setTimeout(() => this.syncAll(), 2000); // Esperar 2s para estabilizar
      }
    });
  }

  /**
   * Registra un listener para eventos de sincronización
   * @param {Function} callback - Función que recibe { type, status, message }
   * @returns {Function} Función para remover el listener
   */
  onSyncEvent(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  notifySyncEvent(event) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[SyncService] Error en listener:', error);
      }
    });
  }

  /**
   * Sincroniza datos de habitaciones del servidor a PouchDB
   * @returns {Promise<Object>}
   */
  async syncRoomsFromServer() {
    try {
      console.log('[SyncService] Sincronizando habitaciones desde servidor...');
      const { data, error } = await RoomService.getAllRooms();

      if (error) {
        throw new Error(error.message || 'Error al obtener habitaciones');
      }

      if (data && data.length > 0) {
        await pouchDBService.saveRooms(data);
        console.log(`[SyncService] ✅ ${data.length} habitaciones sincronizadas`);
        return { success: true, count: data.length };
      }

      return { success: true, count: 0 };
    } catch (error) {
      console.error('[SyncService] Error sincronizando habitaciones:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincroniza datos de incidencias del servidor a PouchDB
   * @returns {Promise<Object>}
   */
  async syncIncidentsFromServer() {
    try {
      console.log('[SyncService] Sincronizando incidencias desde servidor...');
      const { data, error } = await IncidentService.getAllIncidents();

      if (error) {
        throw new Error(error.message || 'Error al obtener incidencias');
      }

      if (data && data.length > 0) {
        await pouchDBService.saveIncidents(data);
        console.log(`[SyncService] ✅ ${data.length} incidencias sincronizadas`);
        return { success: true, count: data.length };
      }

      return { success: true, count: 0 };
    } catch (error) {
      console.error('[SyncService] Error sincronizando incidencias:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincroniza limpiezas pendientes de PouchDB al servidor
   * @returns {Promise<Object>}
   */
  async syncCleaningsToServer() {
    try {
      const pendingCleanings = await pouchDBService.getPendingCleanings();

      if (pendingCleanings.length === 0) {
        console.log('[SyncService] No hay limpiezas pendientes');
        return { success: true, count: 0 };
      }

      console.log(`[SyncService] Sincronizando ${pendingCleanings.length} limpiezas al servidor...`);

      let successCount = 0;
      let failCount = 0;

      for (const cleaning of pendingCleanings) {
        try {
          const { roomId, notes, assignmentId } = cleaning;
          const cleaningId = cleaning._id || cleaning.id;
          const { error } = await CleaningService.registerCleaning({ roomId, notes });

          if (!error) {
            await pouchDBService.removePendingCleaning(cleaningId);
            
            // Eliminar tarea completada offline después de sincronizar exitosamente
            if (assignmentId) {
              await pouchDBService.removeCompletedTaskOffline(assignmentId);
            }
            
            successCount++;
          } else {
            console.error(`[SyncService] Error sincronizando limpieza ${cleaningId}:`, error);
            failCount++;
          }
        } catch (error) {
          const cleaningId = cleaning._id || cleaning.id;
          console.error(`[SyncService] Error en limpieza ${cleaningId}:`, error);
          failCount++;
        }
      }

      console.log(`[SyncService] ✅ Limpiezas sincronizadas: ${successCount} exitosas, ${failCount} fallidas`);

      return {
        success: true,
        count: successCount,
        failed: failCount
      };
    } catch (error) {
      console.error('[SyncService] Error sincronizando limpiezas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincroniza incidencias pendientes de PouchDB al servidor
   * @returns {Promise<Object>}
   */
  async syncIncidentsToServer() {
    try {
      const pendingIncidents = await pouchDBService.getPendingIncidents();

      if (pendingIncidents.length === 0) {
        console.log('[SyncService] No hay incidencias pendientes');
        return { success: true, count: 0 };
      }

      console.log(`[SyncService] Sincronizando ${pendingIncidents.length} incidencias al servidor...`);

      let successCount = 0;
      let failCount = 0;

      for (const incident of pendingIncidents) {
        try {
          const { roomId, title, description, photos, photoDataUrls } = incident;
          const incidentId = incident._id || incident.id;

          // Convertir photoDataUrls a archivos File si existen
          let photoFiles = [];
          if (photoDataUrls && photoDataUrls.length > 0) {
            photoFiles = await Promise.all(
              photoDataUrls.map(async (dataUrl, index) => {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                return new File([blob], `photo_${index}.jpg`, { type: 'image/jpeg' });
              })
            );
          }

          const incidentData = {
            roomId,
            title,
            description,
            photos: photoFiles
          };

          const { error } = await IncidentService.createIncidentWithFiles(incidentData);

          if (!error) {
            await pouchDBService.markIncidentAsSynced(incidentId);
            successCount++;
          } else {
            console.error(`[SyncService] Error sincronizando incidencia ${incidentId}:`, error);
            failCount++;
          }
        } catch (error) {
          const incidentId = incident._id || incident.id;
          console.error(`[SyncService] Error en incidencia ${incidentId}:`, error);
          failCount++;
        }
      }

      console.log(`[SyncService] ✅ Incidencias sincronizadas: ${successCount} exitosas, ${failCount} fallidas`);

      return {
        success: true,
        count: successCount,
        failed: failCount
      };
    } catch (error) {
      console.error('[SyncService] Error sincronizando incidencias:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincroniza actualizaciones de estado pendientes de PouchDB al servidor
   * @returns {Promise<Object>}
   */
  async syncStatusUpdatesToServer() {
    try {
      const pendingUpdates = await pouchDBService.getPendingStatusUpdates();

      if (pendingUpdates.length === 0) {
        console.log('[SyncService] No hay actualizaciones de estado pendientes');
        return { success: true, count: 0 };
      }

      console.log(`[SyncService] Sincronizando ${pendingUpdates.length} actualizaciones de estado al servidor...`);

      let successCount = 0;
      let failCount = 0;

      for (const update of pendingUpdates) {
        try {
          const { entityType, entityId, payload, _id: updateId } = update;
          let error;

          if (entityType === 'room') {
            const result = await RoomService.updateRoomStatus(entityId, payload);
            error = result.error;
          } else {
            // Aquí se pueden añadir otros tipos de entidades en el futuro
            console.warn(`[SyncService] Tipo de entidad no soportado para actualización de estado: ${entityType}`);
            continue;
          }

          if (!error) {
            await pouchDBService.removePendingStatusUpdate(updateId);
            successCount++;
          } else {
            console.error(`[SyncService] Error sincronizando actualización de estado ${updateId}:`, error);
            failCount++;
          }
        } catch (error) {
          console.error(`[SyncService] Error en actualización de estado ${update._id}:`, error);
          failCount++;
        }
      }

      console.log(`[SyncService] ✅ Actualizaciones de estado sincronizadas: ${successCount} exitosas, ${failCount} fallidas`);

      return {
        success: true,
        count: successCount,
        failed: failCount
      };
    } catch (error) {
      console.error('[SyncService] Error sincronizando actualizaciones de estado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincroniza todos los datos (bidireccional)
   * @returns {Promise<Object>}
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('[SyncService] Sincronización ya en progreso');
      return { success: false, message: 'Sincronización en progreso' };
    }

    if (!networkStatus.getIsOnline()) {
      console.log('[SyncService] Sin conexión, sincronización cancelada');
      return { success: false, message: 'Sin conexión a internet' };
    }

    this.isSyncing = true;
    this.notifySyncEvent({ type: 'start', status: 'running', message: 'Iniciando sincronización...' });

    try {
      // 1. Sincronizar cambios locales al servidor (limpiezas e incidencias)
      this.notifySyncEvent({ type: 'upload', status: 'running', message: 'Enviando cambios al servidor...' });

      const cleaningsResult = await this.syncCleaningsToServer();
      const incidentsResult = await this.syncIncidentsToServer();
      const statusUpdatesResult = await this.syncStatusUpdatesToServer();

      // 2. Sincronizar datos del servidor a local (habitaciones e incidencias)
      this.notifySyncEvent({ type: 'download', status: 'running', message: 'Descargando datos del servidor...' });

      const roomsResult = await this.syncRoomsFromServer();
      const incidentsDownloadResult = await this.syncIncidentsFromServer();

      this.isSyncing = false;

      const result = {
        success: true,
        rooms: roomsResult.count || 0,
        incidents: incidentsDownloadResult.count || 0,
        cleaningsSynced: cleaningsResult.count || 0,
        incidentsSynced: incidentsResult.count || 0,
        statusUpdatesSynced: statusUpdatesResult.count || 0,
        timestamp: new Date().toISOString()
      };

      this.notifySyncEvent({
        type: 'complete',
        status: 'success',
        message: '✅ Sincronización completada',
        result
      });

      console.log('[SyncService] ✅ Sincronización completada:', result);
      return result;
    } catch (error) {
      this.isSyncing = false;
      this.notifySyncEvent({
        type: 'error',
        status: 'failed',
        message: `❌ Error: ${error.message}`
      });

      console.error('[SyncService] Error en sincronización:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica si hay datos pendientes de sincronización
   * @returns {Promise<Object>}
   */
  async getPendingSyncStatus() {
    const pendingCleanings = await pouchDBService.getPendingCleanings();
    const pendingIncidents = await pouchDBService.getPendingIncidents();

    return {
      hasPending: pendingCleanings.length > 0 || pendingIncidents.length > 0,
      cleanings: pendingCleanings.length,
      incidents: pendingIncidents.length
    };
  }
}

// Exportar instancia singleton
const syncService = new SyncService();
export default syncService;
