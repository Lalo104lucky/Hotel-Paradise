import { AxiosClient } from './http-client';

export const HotelSettingsService = {
    /**
     * Obtiene la configuración del hotel
     * @returns {Promise} Configuración del hotel
     */
    getSettings: async () => {
        try {
            const response = await AxiosClient.get('api/hotel-settings');
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    },

    /**
     * Actualiza la configuración del hotel (Admin)
     * @param {Object} settingsData - Configuración a actualizar
     * @returns {Promise} Configuración actualizada
     */
    updateSettings: async (settingsData) => {
        try {
            const response = await AxiosClient.put('api/hotel-settings', settingsData);
            return { data: response, error: null };
        } catch (error) {
            return { data: null, error: error.response?.data || error.message };
        }
    }
};
