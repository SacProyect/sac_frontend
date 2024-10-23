import { apiConnection } from "./apiConnection";

export const getFineHistory = async (taxpayerId) => {
	try {
		let requestURL = `/reportes/multa`
		if (taxpayerId) {
			requestURL = `${requestURL}/${taxpayerId}`;
		}
		const response = await (await apiConnection.get(requestURL)).data;
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}
export const getPaymentHistory = async (taxpayerId) => {
	try {
		let requestURL = `reportes/pagos`
		if (taxpayerId) {
			requestURL = `${requestURL}/${taxpayerId}`;
		}
		const response = await (await apiConnection.get(requestURL)).data;
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}