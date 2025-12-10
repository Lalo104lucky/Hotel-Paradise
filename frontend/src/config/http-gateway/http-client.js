import axios from 'axios';
import { alertaError } from '../context/alerts';
const ENV = import.meta.env;

const SERVER_URL = `${ENV.VITE_API_PROTOCOL}://${ENV.VITE_API_HOST}:${ENV.VITE_API_PORT}${ENV.VITE_API_BASE}`;

const AxiosClient = axios.create({
    baseURL: SERVER_URL,
    withCredentials: false,
});

const AxiosFormClient = axios.create({
    baseURL: SERVER_URL,
    withCredentials: false,
});

AxiosClient.interceptors.request.use((request) => {
    request.headers["Accept"] = "application/json";
    request.headers["Content-Type"] = "application/json";

    const session = JSON.parse(localStorage.getItem("user")) || null;
    if (session?.token) {
        request.headers["Authorization"] = `Bearer ${session.token}`;
    }

    return request;
});

AxiosFormClient.interceptors.request.use((request) => {
    request.headers["Accept"] = "application/json";

    const session = JSON.parse(localStorage.getItem("user")) || null;
    if (session?.token) {
        request.headers["Authorization"] = `Bearer ${session.token}`;
    }
    return request;
});

const responseHandler = (res) => Promise.resolve(res.data);
const errorHandler = (err) => {
    if (err.response?.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        alertaError('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        setTimeout(() => {
            window.location.href = "/sign-in";
        }, 2000);
    }
    return Promise.reject(err);
};

AxiosClient.interceptors.response.use(responseHandler, errorHandler);
AxiosFormClient.interceptors.response.use(responseHandler, errorHandler);

export { AxiosClient, AxiosFormClient };
