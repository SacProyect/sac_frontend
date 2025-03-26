import { InputErrors } from "@/components/errors/report/ErrorsReport";
import { apiConnection } from "./apiConnection";

export const getFineHistory = async (taxpayerId: string) => {
	try {
		let requestURL = `/reports/fine`
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
export const getPaymentHistory = async (taxpayerId: string) => {
	try {
		let requestURL = `reports/payments`
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

export const createError = async (data: InputErrors) => {

	console.log("data on createError: " + data)

	try {
		const requestUrl = `reports/errors`

		const response = (await apiConnection.post(requestUrl, data));

		console.log(response.data)
		return response;
	} catch (e) {
		console.error(e)
		return false;
	}

}