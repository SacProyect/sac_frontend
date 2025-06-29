import { InputErrors } from "@/components/errors/report/ErrorsReport";
import { apiConnection } from "./apiConnection";
import { GroupData } from "@/components/contributions/ContributionTypes";
import { GroupRecordsApiResponse } from "@/types/groupRecords";


interface ContributionsInput {
	id?: string,
	startDate?: string,
	endDate?: string
	supervisorId?: string,
}

export interface GroupRecordsInput {
	id: string
	year: number
	month?: number
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

export const getBestSupervisors = async () => {
	try {
		let requestURL = 'reports/get-best-supervisor-by-group'

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los mejores supervisores por grupo.")
	}
}

export const getTopFiscals = async () => {
	try {
		let requestURL = 'reports/get-top-fiscals'

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los mejores fiscales.")
	}
}

export const getTopFiveByGroup = async () => {
	try {
		let requestURL = 'reports/get-top-five-by-group'

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los mejores fiscales por grupo.")
	}
}

export const getMonthlyGrowth = async () => {
	try {
		let requestURL = 'reports/get-monthly-growth'

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener el crecimiento por grupo mensual de coordinadores.")
	}
}

export const getTaxpayersCompliance = async () => {
	try {
		let requestURL = 'reports/get-taxpayers-compliance'

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los cumplimientos.")
	}
}

export const getExpectedAmount= async () => {
	try {
		let requestURL = 'reports/get-expected-amount'

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener el recaudado esperado.")
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
	} catch (e: any) {
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

export const getIndividualIvaReport = async (id: string | undefined) => {
	try {
		const requestUrl = `reports/individual-iva-report`
		const response = await apiConnection.get(`${requestUrl}/${id}`);
		return response.data;
	} catch (e) {
		console.error('Error al obtener el reporte de iva individual:', e)
		throw e
	}
}

export const getGroupRecords = async (data: GroupRecordsInput): Promise<GroupRecordsApiResponse> => {
	try {
		const requestUrl = `reports/get-group-records`
		const response = await apiConnection.get(requestUrl, { params: data });
		return response.data as GroupRecordsApiResponse;
	} catch (e) {
		console.error('Error al obtener group records:', e)
		throw e
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