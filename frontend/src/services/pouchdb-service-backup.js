// Importación compatible con Vite
import PouchDB from 'pouchdb';
import find from 'pouchdb-find';

// Habilitar plugin find para consultas
PouchDB.plugin(find);

/**
 * Servicio base de PouchDB para almacenamiento offline
 */
class PouchDBService {
  constructor() {
    // Bases de datos locales
    this.roomsDB = new PouchDB('hotel_rooms');
    this.cleaningsQueueDB = new PouchDB('cleanings_queue');
    this.incidentsDB = new PouchDB('hotel_incidents');
    this.incidentsQueueDB = new PouchDB('incidents_queue');

    this.initializeIndexes();
  }

  /**
   * Inicializa índices para consultas eficientes
   */
  async initializeIndexes() {
    try {
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
