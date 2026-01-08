/// <reference types="vite/client" />
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";

//TODO ESTO QUITARLO ANTES DE  SUBIRLO
const base_url = import.meta.env.VITE_BASE_URL || "http://localhost:3000";


export const apiConnection = axios.create({
	baseURL: base_url,
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor para adjuntar el token en cada petición
apiConnection.interceptors.request.use(
	(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
		const tokenString = localStorage.getItem("authToken");

		// Verificar si el token es válido antes de parsearlo
		const token: string | null = tokenString && tokenString !== "undefined" ? JSON.parse(tokenString) : null;

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error: AxiosError): Promise<AxiosError> => {
		return Promise.reject(error);
	}
);

// Interceptor para manejar respuestas
apiConnection.interceptors.response.use(
	(response: AxiosResponse): AxiosResponse => response,
	(error: AxiosError): Promise<AxiosError> => {
		if (error.response?.status === 401) {
			localStorage.removeItem("authToken");
		}
		return Promise.reject(error);
	}
);

export default apiConnection;
