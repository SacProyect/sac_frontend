import axios from "axios"

const apiURL = "http://localhost:8000/reportes"

export const getFineHistory = async (taxpayerId) => {
	try {
		let requestURL = `${apiURL}/multa`
		if (taxpayerId) {
			requestURL = `${requestURL}/${taxpayerId}`;
		}
		const response = await (await axios.get(requestURL)).data;
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}
export const getPaymentHistory = async (taxpayerId) => {
	try {
		let requestURL = `${apiURL}/pagos`
		if (taxpayerId) {
			requestURL = `${requestURL}/${taxpayerId}`;
		}
		const response = await (await axios.get(requestURL)).data;
		return response
	} catch (error) {
		console.error(error)
		return false
	}
}