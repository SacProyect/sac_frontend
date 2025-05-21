import { InputErrors } from "@/components/errors/report/ErrorsReport";
import { apiConnection } from "./apiConnection";


interface ContributionsInput {
	id?: string,
	startDate?: string,
	endDate?: string
}


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

export const getIslrReports = async (taxpayerId: string) => {

	try { 
		let requestURL = `taxpayer/get-islr`;

		if (taxpayerId) requestURL = `${requestURL}/${taxpayerId}`;

		const response = await apiConnection.get(requestURL);
		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los reportes de ISLR, por favor, intente de nuevo.")
	}

}

export const getTaxHistory = async (taxpayerId: string) => {

	try {

		let requestURL = "taxpayer/getTaxSummary"

		const response = await apiConnection.get(`${requestURL}/${taxpayerId}`);

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener el historial de IVA de este contribuyente. Por favor, inténtelo de nuevo.")
	}
}


export const createError = async (data: FormData) => {

	try {
		const requestUrl = `reports/errors`

		const response = (await apiConnection.post(requestUrl, data, {
			headers: {
				'Content-Type': "multipart/form-data",
			}
		}));

		return response;
	} catch (e : any) {
		console.error("Upload failed:", e?.response?.data || e.message);
		throw new Error("Error sending the report");
	}

}

export const getContributions = async (data?: ContributionsInput) => {

	try {

		const requestUrl = `reports/fiscal-groups`

		const response = await apiConnection.get(requestUrl, {
			params: data,
		})

		return response.data

	} catch (e) {
		console.error(e)
		throw e;
	}

}

export const getGlobalPerformance = async () => {
	try {
		const requestUrl = `reports/global-performance`

		const response = await apiConnection.get(requestUrl)

		console.log("response: " + JSON.stringify(response.data))
		return response.data
	} catch (e) {
		console.error(e)
		throw new Error("No se pudo obtener el rendimiento global")
	}
}

export const getGlobalTaxpayerPerformance = async () => {
	try {
		const requestUrl = `reports/global-taxpayer-performance`

		const response = await apiConnection.get(requestUrl)

		console.log("TAXPAYER PERFORMANCE: " + JSON.stringify(response.data))
		return response.data
	} catch (e) {
		console.error(e)
		throw new Error("No se pudo obtener el rendimiento de los contribuyentes")
	}
}

export const getGroupPerformance = async () => {

	try {
		const requestUrl = `reports/group-performance`

		const response = await apiConnection.get(requestUrl)

		return response.data
	} catch (e) {
		console.error(e)
		throw new Error("No se pudo obtener el rendimiento de los contribuyentes")
	}
}

export const getGlobalKPI = async () => {

	try {

		const requestURL = 'reports/global-kpi'

		const response = await apiConnection.get(requestURL);

		return response.data;


	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener los KPI globales...")
	}

}