import { AxiosClient, AxiosFormClient } from './http-client';

export const IncidentService = {
    /**
     * Obtiene todas las incidencias (Admin)
     * @returns {Promise} Lista de incidencias
     */
    getAllIncidents: async () => {
        try {
            const response = await AxiosClient.get('api/incidents');
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene una incidencia por ID
     * @param {number} id - ID de la incidencia
     * @returns {Promise} Datos de la incidencia
     */
    getIncidentById: async (id) => {
        try {
            const response = await AxiosClient.get(`api/incidents/${id}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene incidencias de una habitación
     * @param {number} roomId - ID de la habitación
     * @returns {Promise} Lista de incidencias
     */
    getIncidentsByRoom: async (roomId) => {
        try {
            const response = await AxiosClient.get(`api/incidents/room/${roomId}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene incidencias por estado (Admin)
     * @param {string} status - Estado (ABIERTA, EN_REVISION, RESUELTA)
     * @returns {Promise} Lista de incidencias
     */
    getIncidentsByStatus: async (status) => {
        try {
            const response = await AxiosClient.get(`api/incidents/status/${status}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Crea una nueva incidencia con archivos de foto (Camarera)
     * @param {Object} incidentData - { roomId, title, description, isOffline?, photos: File[] }
     * @returns {Promise} Incidencia creada
     */
    createIncidentWithFiles: async (incidentData) => {
        try {
            const formData = new FormData();
            formData.append('roomId', incidentData.roomId);
            formData.append('title', incidentData.title);

            if (incidentData.description) {
                formData.append('description', incidentData.description);
            }

            if (incidentData.isOffline !== undefined) {
                formData.append('isOffline', incidentData.isOffline);
            }

            // Agregar fotos si existen
            if (incidentData.photos && incidentData.photos.length > 0) {
                incidentData.photos.forEach(photo => {
                    formData.append('photos', photo);
                });
            }

            // IMPORTANTE: Usar AxiosFormClient que NO establece Content-Type
            // El navegador configura automáticamente multipart/form-data con el boundary correcto
            const response = await AxiosFormClient.post('api/incidents', formData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Crea una nueva incidencia sin archivos (JSON) (Camarera)
     * @param {Object} incidentData - { roomId, title, description, isOffline?, photoUrls? }
     * @returns {Promise} Incidencia creada
     */
    createIncident: async (incidentData) => {
        try {
            const response = await AxiosClient.post('api/incidents/json', incidentData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Actualiza el estado de una incidencia (Admin)
     * @param {number} id - ID de la incidencia
     * @param {Object} statusData - { status, notes? }
     * @returns {Promise} Incidencia actualizada
     */
    updateIncidentStatus: async (id, statusData) => {
        try {
            const response = await AxiosClient.patch(`api/incidents/${id}/status`, statusData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene incidencias pendientes de sincronización (Admin)
     * @returns {Promise} Lista de incidencias pendientes
     */
    getPendingSyncIncidents: async () => {
        try {
            const response = await AxiosClient.get('api/incidents/pending-sync');
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Genera la URL completa para una imagen de incidencia
     * @param {string} photoUrl - URL relativa de la foto (ej: "HTL-3-305/uuid.jpg")
     * @returns {string} URL completa para acceder a la imagen
     */
    getImageUrl: (photoUrl) => {
        if (!photoUrl) return '';
        // Si ya es una URL completa, retornarla tal cual
        if (photoUrl.startsWith('http')) return photoUrl;
        // Construir URL del backend
        const baseUrl = AxiosClient.defaults.baseURL || 'http://localhost:8080';
        const fullUrl = `${baseUrl}api/incidents/images/${photoUrl}`;
        console.log('[DEBUG] Photo URL:', photoUrl, '-> Full URL:', fullUrl);
        return fullUrl;
    }
};

// Constantes de estados de incidencia
export const IncidentStatus = {
    ABIERTA: 'ABIERTA',
    EN_REVISION: 'EN_REVISION',
    RESUELTA: 'RESUELTA'
};
