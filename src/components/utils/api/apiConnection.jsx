import axios from "axios";

export const apiConnection = axios.create({
	baseURL: "https://sac-backend-r910.onrender.com",
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
			window.localStorage.setItem("user", JSON.stringify(null));
		}
		return Promise.reject(error);
	}
)
