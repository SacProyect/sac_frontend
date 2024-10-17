import axios from "axios"

const apiURL = "http://localhost:8000/contribuyente"

export const createTaxpayer = async (taxpayerData) => {
	try {
		const response = await (await axios.post(`${apiURL}`, taxpayerData)).data
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}

export const getTaxpayerEvents = async (taxpayerId, eventType) => {
	try {
		let requestURL = `${apiURL}/event/${taxpayerId}`
		if (eventType) {
			requestURL = `${requestURL}/${eventType}`;
		}
		const response = await (await axios.get(requestURL)).data
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}

export const getAllEvents = async () => {
	try {
		const response = await (await axios.get(`${apiURL}/event/all`)).data
		return response
	} catch (error) {
		return false
	}
}