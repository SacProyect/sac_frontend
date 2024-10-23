import { apiConnection } from "./apiConnection"

export const createTaxpayer = async (taxpayerData) => {
	try {
		const response = await (await apiConnection.post(`/contribuyente`, taxpayerData)).data
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}

export const getTaxpayerEvents = async (taxpayerId, eventType) => {
	try {
		let requestURL = `/contribuyente/event/${taxpayerId}`
		if (eventType) {
			requestURL = `${requestURL}/${eventType}`;
		}
		const response = await (await apiConnection.get(requestURL)).data
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}

export const getAllEvents = async () => {
	try {
		const response = await (await apiConnection.get(`/contribuyente/event/all`)).data
		return response
	} catch (error) {
		return false
	}
}