import { IncidentService } from '../config/http-gateway';
import pouchDBService from './pouchdb-service';
import networkStatus from './network-status';
import syncService from './sync-service';

/**
 * Wrapper del IncidentService que maneja automáticamente modo offline
 */
export const OfflineIncidentService = {
  /**
   * Obtiene todas las incidencias (online o desde caché offline)
   * @returns {Promise<Object>} { data, error, isFromCache }
   */
  async getAllIncidents() {
    const isOnline = networkStatus.getIsOnline();

    if (isOnline) {
      try {
        const result = await IncidentService.getAllIncidents();

        // Si fue exitoso, guardar en caché
        if (!result.error && result.data) {
          await pouchDBService.saveIncidents(result.data);
        }

        return { ...result, isFromCache: false };
      } catch (error) {
        console.warn('[OfflineIncidentService] Error en servidor, usando caché...', error);
        // Si falla, intentar con caché
        const cachedIncidents = await pouchDBService.getIncidents();
        return {
          data: cachedIncidents,
          error: null,
          isFromCache: true,
          cacheWarning: 'Mostrando datos en caché (sin conexión al servidor)'
        };
      }
    } else {
      // Modo offline: usar solo caché
      console.log('[OfflineIncidentService] Modo offline, usando caché local');
      const cachedIncidents = await pouchDBService.getIncidents();
      return {
        data: cachedIncidents,
        error: null,
        isFromCache: true,
        offlineMode: true
      };
    }
  },

  /**
   * Crea una nueva incidencia con archivos (online o en cola offline)
   * @param {Object} incidentData - { roomId, title, description, photos: File[] }
   * @returns {Promise<Object>} { data, error, isQueued }
   */
  async createIncidentWithFiles(incidentData) {
    const isOnline = networkStatus.getIsOnline();

    if (isOnline) {
      try {
        const result = await IncidentService.createIncidentWithFiles(incidentData);

        // Si fue exitoso, actualizar cachés
        if (!result.error) {
          await syncService.syncIncidentsFromServer();
          await syncService.syncRoomsFromServer();
        }

        return { ...result, isQueued: false };
      } catch (error) {
        console.warn('[OfflineIncidentService] Error en servidor, guardando en cola...', error);
        // Si falla, guardar en cola con fotos convertidas a data URLs
        return await this.queueIncidentOffline(incidentData);
      }
    } else {
      // Modo offline: guardar en cola
      console.log('[OfflineIncidentService] Modo offline, agregando a cola');
      return await this.queueIncidentOffline(incidentData);
    }
  },

  /**
   * Guarda una incidencia en la cola offline con fotos convertidas a dataURL
   * @private
   */
  async queueIncidentOffline(incidentData) {
    try {
      const photoDataUrls = [];

      // Convertir archivos File a Data URLs para almacenamiento offline
      if (incidentData.photos && incidentData.photos.length > 0) {
        for (const photo of incidentData.photos) {
          const dataUrl = await this.fileToDataURL(photo);
          photoDataUrls.push(dataUrl);
        }
      }

      const queueData = {
        roomId: incidentData.roomId,
        title: incidentData.title,
        description: incidentData.description,
        photoDataUrls // Guardar como data URLs en lugar de archivos
      };

      await pouchDBService.queueIncident(queueData);

      return {
        data: { message: 'Incidencia guardada en cola para sincronización' },
        error: null,
        isQueued: true,
        offlineMode: true
      };
    } catch (error) {
      console.error('[OfflineIncidentService] Error guardando en cola:', error);
      return {
        data: null,
        error: { message: error.message },
        isQueued: false
      };
    }
  },

  /**
   * Convierte un archivo File a Data URL
   * @private
   */
  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Actualiza el estado de una incidencia (Admin)
   * @param {number} id - ID de la incidencia
   * @param {Object} statusData - { status, notes? }
   * @returns {Promise<Object>}
   */
  async updateIncidentStatus(id, statusData) {
    const isOnline = networkStatus.getIsOnline();

    if (isOnline) {
      const result = await IncidentService.updateIncidentStatus(id, statusData);

      // Si fue exitoso, actualizar cachés
      if (!result.error) {
        await syncService.syncIncidentsFromServer();
        await syncService.syncRoomsFromServer();
      }

      return result;
    } else {
      // En modo offline, actualizamos solo el caché local
      try {
        await pouchDBService.updateIncidentStatus(`incident_${id}`, statusData);

        return {
          data: { message: 'Estado actualizado localmente' },
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

  /**
   * Obtiene el estado de la cola de sincronización
   * @returns {Promise<Object>}
   */
  async getPendingSyncStatus() {
    const pendingIncidents = await pouchDBService.getPendingIncidents();
    return {
      count: pendingIncidents.length,
      items: pendingIncidents
    };
  },

  // Re-exportar métodos que no necesitan funcionalidad offline especial
  getIncidentById: IncidentService.getIncidentById,
  getIncidentsByRoom: IncidentService.getIncidentsByRoom,
  getIncidentsByStatus: IncidentService.getIncidentsByStatus,
  createIncident: IncidentService.createIncident,
  getPendingSyncIncidents: IncidentService.getPendingSyncIncidents,
  getImageUrl: IncidentService.getImageUrl
};
