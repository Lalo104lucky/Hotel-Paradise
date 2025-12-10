import { AxiosClient } from './http-client';

export const CleaningService = {
    /**
     * Registra una limpieza de habitación (Camarera)
     * @param {Object} cleaningData - { roomId, notes? }
     * @returns {Promise} Registro de limpieza creado
     */
    registerCleaning: async (cleaningData) => {
        try {
            const response = await AxiosClient.post('api/cleanings', cleaningData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene el historial de limpiezas de una habitación (Admin)
     * @param {number} roomId - ID de la habitación
     * @returns {Promise} Lista de limpiezas
     */
    getCleaningsByRoom: async (roomId) => {
        try {
            const response = await AxiosClient.get(`api/cleanings/room/${roomId}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene el historial de limpiezas de un usuario (Admin)
     * @param {number} userId - ID del usuario
     * @returns {Promise} Lista de limpiezas
     */
    getCleaningsByUser: async (userId) => {
        try {
            const response = await AxiosClient.get(`api/cleanings/user/${userId}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene limpiezas en un rango de fechas (Admin)
     * @param {string} start - Fecha inicio (ISO 8601)
     * @param {string} end - Fecha fin (ISO 8601)
     * @returns {Promise} Lista de limpiezas
     */
    getCleaningsByDateRange: async (start, end) => {
        try {
            const response = await AxiosClient.get('api/cleanings/date-range', {
                params: { start, end }
            });
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene limpiezas pendientes de sincronización (Admin)
     * @returns {Promise} Lista de limpiezas pendientes
     */
    getPendingSyncCleanings: async () => {
        try {
            const response = await AxiosClient.get('api/cleanings/pending-sync');
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    }
};
