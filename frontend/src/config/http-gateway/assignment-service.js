import { AxiosClient } from './http-client';

export const AssignmentService = {
    /**
     * Obtiene todas las asignaciones activas (Admin)
     * @returns {Promise} Lista de asignaciones
     */
    getAllAssignments: async () => {
        try {
            const response = await AxiosClient.get('api/room-assignments');
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene asignaciones de un usuario específico
     * @param {number} userId - ID del usuario
     * @returns {Promise} Lista de asignaciones del usuario
     */
    getAssignmentsByUser: async (userId) => {
        try {
            const response = await AxiosClient.get(`api/room-assignments/user/${userId}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtiene asignaciones de una habitación específica (Admin)
     * @param {number} roomId - ID de la habitación
     * @returns {Promise} Lista de asignaciones de la habitación
     */
    getAssignmentsByRoom: async (roomId) => {
        try {
            const response = await AxiosClient.get(`api/room-assignments/room/${roomId}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Crea una nueva asignación (Admin)
     * @param {Object} assignmentData - { roomId, userId }
     * @returns {Promise} Asignación creada
     */
    createAssignment: async (assignmentData) => {
        try {
            const response = await AxiosClient.post('api/room-assignments', assignmentData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Elimina una asignación (marca como inactiva) (Admin)
     * @param {number} id - ID de la asignación
     * @returns {Promise}
     */
    deleteAssignment: async (id) => {
        try {
            const response = await AxiosClient.delete(`api/room-assignments/${id}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    }
};
