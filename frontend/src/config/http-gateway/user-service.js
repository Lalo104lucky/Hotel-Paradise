import { AxiosClient } from './http-client';

export const UserService = {
    /**
     * Obtener todos los usuarios
     * @returns {Promise} Lista de usuarios
     */
    getAllUsers: async () => {
        try {
            const [adminResponse, camareraResponse] = await Promise.all([
                AxiosClient.get('users/role/ADMIN'),
                AxiosClient.get('users/role/CAMARERA')
            ]);
            const combined = [...adminResponse, ...camareraResponse];
            return { data: combined, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtener usuarios por rol (backend)
     * @param {string} backendRole - El rol del backend (ADMIN, CAMARERA)
     * @returns {Promise} Lista de usuarios filtrados
     */
    getUsersByRole: async (backendRole) => {
        try {
            const response = await AxiosClient.get(`users/role/${backendRole}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtener camareras activas
     * @returns {Promise} Lista de camareras
     */
    getCamareras: async () => {
        try {
            const response = await AxiosClient.get('users/role/CAMARERA');
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Obtener un usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Promise} Usuario
     */
    getUserById: async (id) => {
        try {
            const response = await AxiosClient.get(`users/${id}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Actualizar estado de usuario
     * @param {number} id - ID del usuario
     * @param {boolean} status - Nuevo estado (true = activo, false = inactivo)
     * @returns {Promise} Usuario actualizado
     */
    updateUserStatus: async (id, status) => {
        try {
            const response = await AxiosClient.patch(`users/${id}/status`, { status });
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Actualizar información de usuario
     * @param {number} id - ID del usuario
     * @param {Object} userData - Datos a actualizar { name?, email?, role? }
     * @returns {Promise} Usuario actualizado
     */
    updateUser: async (id, userData) => {
        try {
            const response = await AxiosClient.patch(`users/${id}`, userData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Eliminar usuario
     * @param {number} id - ID del usuario
     * @returns {Promise}
     */
    deleteUser: async (id) => {
        try {
            const response = await AxiosClient.delete(`users/${id}`);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    }
};
