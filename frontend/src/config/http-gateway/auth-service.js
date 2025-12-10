import { AxiosClient } from './http-client';

export const AuthService = {
    /**
     * Login de usuario
     * @param {Object} credentials - { email, password }
     * @returns {Promise} Token response con user, access_token y refresh_token
     */
    login: async (credentials) => {
        try {
            const response = await AxiosClient.post('auth/login', credentials);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Registro de nuevo usuario (Admin)
     * @param {Object} userData - { name, email, password, role }
     * @returns {Promise} Token response con user, access_token y refresh_token
     */
    register: async (userData) => {
        try {
            const response = await AxiosClient.post('auth/register', userData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Registro de camarera (Público)
     * @param {Object} userData - { name, email, password }
     * @returns {Promise} Token response con user, access_token y refresh_token
     */
    registerCamarera: async (userData) => {
        try {
            const response = await AxiosClient.post('auth/register-camarera', userData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Refresh del token de acceso
     * @param {string} refreshToken - El refresh token
     * @returns {Promise} Nuevo token response
     */
    refreshToken: async (refreshToken) => {
        try {
            const response = await AxiosClient.post('auth/refresh', null, {
                headers: {
                    'Authorization': `Bearer ${refreshToken}`
                }
            });
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Logout de usuario
     * @param {string} token - El access token
     * @returns {Promise}
     */
    logout: async (token) => {
        try {
            const response = await AxiosClient.post('auth/logout', null, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    }
};
