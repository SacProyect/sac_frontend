import axios from "axios";
import { useAuth } from "../../../hooks/useAuth";

export const apiConnection = axios.create({
	baseURL: "http://localhost:8000",
	headers: {
		'Content-Type': 'application/json',
	},
})
apiConnection.interceptors.request.use(
	(config) => {
		const token = JSON.parse(localStorage.getItem('authToken'))
		if (token) {
			config.headers.Authorization = "Bearer " + token;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
)

apiConnection.interceptors.response.use(
	(response) => {
		return response
	},
	(error) => {
		if (error.response.status === 401) {
			const { logout } = useAuth()
			logout()
		}
		return Promise.reject(error);
	}
)