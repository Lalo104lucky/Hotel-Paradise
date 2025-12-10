import { AxiosClient } from './http-client';

export const RoomService = {
    /**
     * Obtiene todas las habitaciones
     * @returns {Promise} Lista de habitaciones
     */
    getAllRooms: async () => {
        try {
            const response = await AxiosClient.get('api/rooms');
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene una habitación por ID
     * @param {number} id - ID de la habitación
     * @returns {Promise} Datos de la habitación
     */
    getRoomById: async (id) => {
        try {
            const response = await AxiosClient.get(`api/rooms/${id}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene habitaciones por estado
     * @param {string} status - Estado (EN_USO, PENDIENTE_LIMPIEZA, LIMPIA, BLOQUEADA_INCIDENCIA)
     * @returns {Promise} Lista de habitaciones con ese estado
     */
    getRoomsByStatus: async (status) => {
        try {
            const response = await AxiosClient.get(`api/rooms/status/${status}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene habitaciones por piso (Admin)
     * @param {string} floor - Piso
     * @returns {Promise} Lista de habitaciones del piso
     */
    getRoomsByFloor: async (floor) => {
        try {
            const response = await AxiosClient.get(`api/rooms/floor/${floor}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Crea una nueva habitación (Admin)
     * @param {Object} roomData - { roomNumber, floor?, barcodeValue?, notes? }
     * @returns {Promise} Habitación creada
     */
    createRoom: async (roomData) => {
        try {
            const response = await AxiosClient.post('api/rooms', roomData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Actualiza una habitación (Admin)
     * @param {number} id - ID de la habitación
     * @param {Object} roomData - { roomNumber, floor?, barcodeValue?, notes? }
     * @returns {Promise} Habitación actualizada
     */
    updateRoom: async (id, roomData) => {
        try {
            const response = await AxiosClient.put(`api/rooms/${id}`, roomData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Elimina una habitación (Admin)
     * @param {number} id - ID de la habitación
     * @returns {Promise}
     */
    deleteRoom: async (id) => {
        try {
            const response = await AxiosClient.delete(`api/rooms/${id}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Actualiza el estado de una habitación (Admin)
     * @param {number} id - ID de la habitación
     * @param {Object} statusData - { status, notes? }
     * @returns {Promise} Habitación con estado actualizado
     */
    updateRoomStatus: async (id, statusData) => {
        try {
            const response = await AxiosClient.patch(`api/rooms/${id}/status`, statusData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    }
};

// Constantes de estados de habitación
export const RoomStatus = {
    EN_USO: 'EN_USO',
    PENDIENTE_LIMPIEZA: 'PENDIENTE_LIMPIEZA',
    EN_LIMPIEZA: 'EN_LIMPIEZA',
    LIMPIA: 'LIMPIA',
    BLOQUEADA_INCIDENCIA: 'BLOQUEADA_INCIDENCIA'
};
