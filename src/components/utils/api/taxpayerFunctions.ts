import { apiConnection } from "./apiConnection"
import { contract_type, Taxpayer, taxpayer_process } from "../../../types/taxpayer";
import { Event } from "../../../types/event";
import { NewEvent } from "../../Events/EventForm";

interface TaxpayerData {
	providenceNum: number,
	process: taxpayer_process,
	name: string,
	rif: string,
	contract_type: contract_type,
	officerId: string,
}



export const createTaxpayer = async (taxpayerData: TaxpayerData) => {
	try {

		const response = await apiConnection.post(`/taxpayer`, taxpayerData);

		if (response.status == 200 || response.status == 201) {
			return response.data;
		} else {
			console.error("API ERROR: ", response.status, response.data);
			return { success: false, message: "Failed to create taxpayer." }
		}
	} catch (error: any) {
		if (error.response) {
			// Error response from the server
			console.error('Server responded with error:', error.response.status, error.response.data);

			return { success: false, message: error.response.data }
		} else if (error.request) {
			// No response received
			console.error('No response received:', error.request);
			return { success: false, message: 'No response from server' };
		} else {
			// Other errors (e.g., network or code issues)
			console.error('Error occurred:', error.message);
			return { success: false, message: error.message || 'An unknown error occurred' };
		}
	}
}

export const getTaxpayerEvents = async (taxpayerId: string, event_type?: string) => {
	try {
		let requestURL = `/taxpayer/event/${taxpayerId}`
		if (event_type) {
			requestURL = `${requestURL}/${event_type}`;
		}
		const response = await (await apiConnection.get(requestURL)).data
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}

export const deleteTaxpayer = async (taxpayerId: string) => {
	try {
		const response = await (await apiConnection.delete(`/taxpayer/${taxpayerId}`)).data
		return response
	} catch (error) {
		return false;
	}
}

export const createEvent = async (event_type: string, event_data: NewEvent) => {
	try {
		const response = await (await apiConnection.post(`/taxpayer/${event_type}`, event_data)).data

		return response
	} catch (error) {
		console.log(error)
		return {error: true, message: "No se pudo crear el evento"}
	}
}

export const getAllEvents = async () => {
	try {
		const response = await (await apiConnection.get(`/taxpayer/event/all`)).data
		return response
	} catch (error) {
		return false
	}
}

export const getPendingPayments = async (taxpayerId: string) => {
	try {
		let requestURL = `/reports/pending`
		if (taxpayerId) {
			requestURL = `/reports/pending/${taxpayerId}`
		}
		const response = await (await apiConnection.get(requestURL)).data
		return response
	} catch (error) {
		console.log(error)
		return []
	}
}