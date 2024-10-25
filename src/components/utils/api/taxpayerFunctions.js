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

export const delteTaxpayer = async (taxpayerId) => {
	try {
		const response = await (await apiConnection.delete(`/contribuyente/${taxpayerId}`)).data
		return response
	} catch (error) {
		return false;
	}
}

export const createEvent = async (eventType, eventData) => {
	try {
		const response = await (await apiConnection.post(`/contribuyente/${eventType}`, eventData)).data
		return response
	} catch (error) {
		console.log(error)
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
export const getPendingPayments = async (taxpayerId) => {
	try {
		let requestURL = `/reportes/pending`
		if (taxpayerId) {
			requestURL = `/reportes/pending/${taxpayerId}`
		}
		const response = await (await apiConnection.get(requestURL)).data
		return response
	} catch (error) {
		console.log(error)
		return []
	}
}