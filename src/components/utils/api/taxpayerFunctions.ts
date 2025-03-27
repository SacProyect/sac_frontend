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



export const createTaxpayer = async (taxpayerData: FormData) => {
	try {

		taxpayerData.forEach((value, key) => {

			console.log("taxpayerfunctions: " + key, value)
		})

		const response = (await apiConnection.post(`/taxpayer`, taxpayerData, {
			headers: {
				'Content-Type': "multipart/form-data",
			}
		}));

		if (response.status === 200 || response.status === 201) {
			return { success: true, data: response.data };
		} else {
			console.error("API ERROR: ", response.status, response.data);
			return { success: false, message: response.data?.message || "Failed to create taxpayer." };
		}

	} catch (error: any) {
		// Handle Axios errors properly
		if (error.response) {
			// Server responded with a status code outside 2xx
			return { success: false, message: error.response.data?.message || "Server error occurred." };
		} else if (error.request) {
			// No response received
			return { success: false, message: "No response from server. Check your network." };
		} else {
			// Other unexpected errors
			return { success: false, message: "Unexpected error occurred. Try again later." };
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
		return false
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