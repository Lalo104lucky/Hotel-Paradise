/**
 * Servicio base de PouchDB para almacenamiento offline
 * PouchDB se carga desde CDN en index.html para evitar problemas con Vite
 */
class PouchDBService {
  constructor() {
    // Verificar que PouchDB esté disponible globalmente
    if (typeof window.PouchDB === 'undefined') {
      console.error('[PouchDB] PouchDB no está disponible. Asegúrate de que el script CDN esté cargado.');
      return;
    }

    // Bases de datos locales usando PouchDB global
    this.roomsDB = new window.PouchDB('hotel_rooms');
    this.cleaningsQueueDB = new window.PouchDB('cleanings_queue');
    this.incidentsDB = new window.PouchDB('hotel_incidents');
    this.incidentsQueueDB = new window.PouchDB('incidents_queue');
    this.statusUpdatesQueueDB = new window.PouchDB('status_updates_queue');
    this.completedTasksDB = new window.PouchDB('completed_tasks_offline');

    this.initializeIndexes();
  }

  /**
   * Inicializa índices para consultas eficientes
   */
  async initializeIndexes() {
    try {
      // Verificar que el plugin pouchdb-find esté cargado
      if (typeof this.roomsDB.createIndex !== 'function') {
        console.warn('[PouchDB] Plugin pouchdb-find no está disponible, omitiendo creación de índices');
        return;
      }

      // Índice para habitaciones por estado
      await this.roomsDB.createIndex({
        index: { fields: ['status'] }
      });

      // Índice para incidencias por estado
      await this.incidentsDB.createIndex({
        index: { fields: ['status'] }
      });

      console.log('[PouchDB] Índices creados exitosamente');
    } catch (error) {
      console.error('[PouchDB] Error creando índices:', error);
    }
  }

  /**
   * Guarda habitaciones en la base de datos local
   * @param {Array} rooms - Array de habitaciones
   */
  async saveRooms(rooms) {
    try {
      const docs = rooms.map(room => ({
        _id: `room_${room.id}`,
        ...room,
        syncedAt: new Date().toISOString()
      }));

      // Obtener documentos existentes para preservar _rev
      const existingDocs = await this.roomsDB.allDocs({
        keys: docs.map(d => d._id),
        include_docs: true
      });

      // Mapear _rev existentes
      const docsWithRev = docs.map(doc => {
        const existing = existingDocs.rows.find(r => r.id === doc._id);
        if (existing && existing.doc) {
          return { ...doc, _rev: existing.doc._rev };
        }
        return doc;
      });

      await this.roomsDB.bulkDocs(docsWithRev);
      console.log(`[PouchDB] ${rooms.length} habitaciones guardadas offline`);
    } catch (error) {
      console.error('[PouchDB] Error guardando habitaciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las habitaciones guardadas localmente
   * @returns {Promise<Array>}
   */
  async getRooms() {
    try {
      const result = await this.roomsDB.allDocs({ include_docs: true });
      return result.rows.map(row => row.doc);
    } catch (error) {
      console.error('[PouchDB] Error obteniendo habitaciones:', error);
      return [];
    }
  }

  /**
   * Guarda incidencias en la base de datos local
   * @param {Array} incidents - Array de incidencias
   */
  async saveIncidents(incidents) {
    try {
      const docs = incidents.map(incident => ({
        _id: `incident_${incident.id}`,
        ...incident,
        syncedAt: new Date().toISOString()
      }));

      // Obtener documentos existentes para preservar _rev
      const existingDocs = await this.incidentsDB.allDocs({
        keys: docs.map(d => d._id),
        include_docs: true
      });

      // Mapear _rev existentes
      const docsWithRev = docs.map(doc => {
        const existing = existingDocs.rows.find(r => r.id === doc._id);
        if (existing && existing.doc) {
          return { ...doc, _rev: existing.doc._rev };
        }
        return doc;
      });

      await this.incidentsDB.bulkDocs(docsWithRev);
      console.log(`[PouchDB] ${incidents.length} incidencias guardadas offline`);
    } catch (error) {
      console.error('[PouchDB] Error guardando incidencias:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las incidencias guardadas localmente
   * @returns {Promise<Array>}
   */
  async getIncidents() {
    try {
      const result = await this.incidentsDB.allDocs({ include_docs: true });
      return result.rows.map(row => row.doc);
    } catch (error) {
      console.error('[PouchDB] Error obteniendo incidencias:', error);
      return [];
    }
  }

  /**
   * Agrega un reporte de limpieza a la cola de sincronización
   * @param {Object} cleaningData - Datos de la limpieza
   * @returns {Promise<Object>}
   */
  async queueCleaning(cleaningData) {
    try {
      // Verificar si ya existe una limpieza pendiente para esta habitación
      const pendingCleanings = await this.getPendingCleanings();
      const existingCleaning = pendingCleanings.find(c => c.roomId === cleaningData.roomId);

      if (existingCleaning) {
        console.log('[PouchDB] Ya existe una limpieza pendiente para roomId:', cleaningData.roomId);
        return existingCleaning;
      }

      const doc = {
        _id: `cleaning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...cleaningData,
        queuedAt: new Date().toISOString(),
        synced: false
      };

      const result = await this.cleaningsQueueDB.put(doc);
      console.log('[PouchDB] Limpieza agregada a la cola:', result.id);
      return { ...doc, _id: result.id, _rev: result.rev };
    } catch (error) {
      console.error('[PouchDB] Error agregando limpieza a la cola:', error);
      throw error;
    }
  }

  /**
   * Obtiene limpiezas pendientes de sincronización
   * @returns {Promise<Array>}
   */
  async getPendingCleanings() {
    try {
      const result = await this.cleaningsQueueDB.allDocs({ include_docs: true });
      return result.rows
        .map(row => row.doc)
        .filter(doc => !doc.synced);
    } catch (error) {
      console.error('[PouchDB] Error obteniendo limpiezas pendientes:', error);
      return [];
    }
  }

  /**
   * Marca una limpieza como sincronizada
   * @param {string} id - ID del documento
   */
  async markCleaningAsSynced(id) {
    try {
      const doc = await this.cleaningsQueueDB.get(id);
      doc.synced = true;
      doc.syncedAt = new Date().toISOString();
      await this.cleaningsQueueDB.put(doc);
      console.log('[PouchDB] Limpieza marcada como sincronizada:', id);
    } catch (error) {
      console.error('[PouchDB] Error marcando limpieza como sincronizada:', error);
      throw error;
    }
  }

  /**
   * Elimina una limpieza pendiente de la cola
   * @param {string} id - ID del documento
   */
  async removePendingCleaning(id) {
    try {
      const doc = await this.cleaningsQueueDB.get(id);
      await this.cleaningsQueueDB.remove(doc);
      console.log('[PouchDB] Limpieza pendiente eliminada:', id);
    } catch (error) {
      console.error('[PouchDB] Error eliminando limpieza pendiente:', error);
      throw error;
    }
  }

  /**
   * Guarda una tarea como completada offline
   * @param {number} assignmentId - ID de la asignación
   * @param {Object} taskData - Datos de la tarea completada
   */
  async saveCompletedTaskOffline(assignmentId, taskData) {
    try {
      const doc = {
        _id: `task_${assignmentId}`,
        ...taskData,
        completedAt: new Date().toISOString(),
        synced: false
      };

      // Obtener doc existente para preservar _rev
      try {
        const existing = await this.completedTasksDB.get(doc._id);
        doc._rev = existing._rev;
      } catch (err) {
        // No existe, es nuevo
      }

      await this.completedTasksDB.put(doc);
      console.log('[PouchDB] Tarea completada guardada offline:', assignmentId);
    } catch (error) {
      console.error('[PouchDB] Error guardando tarea completada:', error);
      throw error;
    }
  }

  /**
   * Obtiene tareas completadas offline
   * @returns {Promise<Array>}
   */
  async getCompletedTasksOffline() {
    try {
      const result = await this.completedTasksDB.allDocs({ include_docs: true });
      return result.rows
        .filter(row => !row.doc.synced)
        .map(row => row.doc);
    } catch (error) {
      console.error('[PouchDB] Error obteniendo tareas completadas offline:', error);
      return [];
    }
  }

  /**
   * Elimina una tarea completada offline después de sincronizar
   * @param {number} assignmentId - ID de la asignación
   */
  async removeCompletedTaskOffline(assignmentId) {
    try {
      const docId = `task_${assignmentId}`;
      const doc = await this.completedTasksDB.get(docId);
      await this.completedTasksDB.remove(doc);
      console.log('[PouchDB] Tarea completada offline eliminada:', assignmentId);
    } catch (error) {
      if (error.status !== 404) {
        console.error('[PouchDB] Error eliminando tarea completada offline:', error);
      }
    }
  }

  /**
   * Agrega una actualización de estado a la cola de sincronización
   * @param {Object} statusUpdateData - { entityType, entityId, payload }
   * @returns {Promise<Object>}
   */
  async queueStatusUpdate(statusUpdateData) {
    try {
      const doc = {
        _id: `status_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...statusUpdateData,
        queuedAt: new Date().toISOString(),
        synced: false
      };

      const result = await this.statusUpdatesQueueDB.put(doc);
      console.log('[PouchDB] Actualización de estado agregada a la cola:', result.id);
      return { ...doc, _id: result.id, _rev: result.rev };
    } catch (error) {
      console.error('[PouchDB] Error agregando actualización de estado a la cola:', error);
      throw error;
    }
  }

  /**
   * Obtiene actualizaciones de estado pendientes de sincronización
   * @returns {Promise<Array>}
   */
  async getPendingStatusUpdates() {
    try {
      const result = await this.statusUpdatesQueueDB.allDocs({ include_docs: true });
      return result.rows
        .map(row => row.doc)
        .filter(doc => !doc.synced);
    } catch (error) {
      console.error('[PouchDB] Error obteniendo actualizaciones de estado pendientes:', error);
      return [];
    }
  }

  /**
   * Elimina una actualización de estado pendiente de la cola
   * @param {string} id - ID del documento
   */
  async removePendingStatusUpdate(id) {
    try {
      const doc = await this.statusUpdatesQueueDB.get(id);
      await this.statusUpdatesQueueDB.remove(doc);
      console.log('[PouchDB] Actualización de estado pendiente eliminada:', id);
    } catch (error) {
      console.error('[PouchDB] Error eliminando actualización de estado pendiente:', error);
      throw error;
    }
  }

  /**
   * Agrega una incidencia a la cola de sincronización
   * @param {Object} incidentData - Datos de la incidencia
   * @returns {Promise<Object>}
   */
  async queueIncident(incidentData) {
    try {
      const doc = {
        _id: `incident_queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...incidentData,
        queuedAt: new Date().toISOString(),
        synced: false
      };

      const result = await this.incidentsQueueDB.put(doc);
      console.log('[PouchDB] Incidencia agregada a la cola:', result.id);
      return { ...doc, _id: result.id, _rev: result.rev };
    } catch (error) {
      console.error('[PouchDB] Error agregando incidencia a la cola:', error);
      throw error;
    }
  }

  /**
   * Obtiene incidencias pendientes de sincronización
   * @returns {Promise<Array>}
   */
  async getPendingIncidents() {
    try {
      const result = await this.incidentsQueueDB.allDocs({ include_docs: true });
      return result.rows
        .map(row => row.doc)
        .filter(doc => !doc.synced);
    } catch (error) {
      console.error('[PouchDB] Error obteniendo incidencias pendientes:', error);
      return [];
    }
  }

  /**
   * Marca una incidencia como sincronizada
   * @param {string} id - ID del documento
   */
  async markIncidentAsSynced(id) {
    try {
      const doc = await this.incidentsQueueDB.get(id);
      doc.synced = true;
      doc.syncedAt = new Date().toISOString();
      await this.incidentsQueueDB.put(doc);
      console.log('[PouchDB] Incidencia marcada como sincronizada:', id);
    } catch (error) {
      console.error('[PouchDB] Error marcando incidencia como sincronizada:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una incidencia en la cola
   * @param {string} id - ID de la incidencia (formato: incident_123)
   * @param {Object} statusUpdate - { status, notes? }
   */
  async updateIncidentStatus(id, statusUpdate) {
    try {
      const doc = await this.incidentsDB.get(id);
      doc.status = statusUpdate.status;
      if (statusUpdate.notes) {
        doc.notes = statusUpdate.notes;
      }
      doc.updatedAt = new Date().toISOString();
      await this.incidentsDB.put(doc);
      console.log('[PouchDB] Estado de incidencia actualizado:', id);
    } catch (error) {
      console.error('[PouchDB] Error actualizando estado de incidencia:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una habitación en caché
   * @param {string|number} id - ID de la habitación (puede ser número o string con formato room_123)
   * @param {Object} statusUpdate - { status }
   */
  async updateRoomStatus(id, statusUpdate) {
    try {
      // Convertir id a string si es número
      const idStr = String(id);
      const roomId = idStr.startsWith('room_') ? idStr : `room_${idStr}`;
      const doc = await this.roomsDB.get(roomId);
      doc.status = statusUpdate.status;
      doc.updatedAt = new Date().toISOString();
      await this.roomsDB.put(doc);
      console.log('[PouchDB] Estado de habitación actualizado:', roomId);
    } catch (error) {
      console.error('[PouchDB] Error actualizando estado de habitación:', error);
      throw error;
    }
  }

  /**
   * Limpia datos sincronizados antiguos (opcional, para mantenimiento)
   */
  async cleanupSyncedData() {
    try {
      const cleanings = await this.getPendingCleanings();
      const syncedCleanings = cleanings.filter(c => c.synced);

      if (syncedCleanings.length > 0) {
        await this.cleaningsQueueDB.bulkDocs(
          syncedCleanings.map(doc => ({ ...doc, _deleted: true }))
        );
        console.log(`[PouchDB] ${syncedCleanings.length} limpiezas sincronizadas eliminadas`);
      }
    } catch (error) {
      console.error('[PouchDB] Error limpiando datos:', error);
    }
  }
}

// Exportar instancia singleton
const pouchDBService = new PouchDBService();
export default pouchDBService;
