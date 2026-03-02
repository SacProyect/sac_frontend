import { apiConnection } from "./api-connection";
import { GroupData } from "@/components/contributions/contribution-types";
import { GroupRecordsApiResponse } from "@/types/group-records";
import { GetCompleteReportParams } from "@/types/reports";


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

export const getBestSupervisors = async (year?: number) => {
	try {
		let requestURL = 'reports/get-best-supervisor-by-group'
		if (year) {
			requestURL += `?date=${year}`
		}

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los mejores supervisores por grupo.")
	}
}

export const getTopFiscals = async (year?: number) => {
	try {
		let requestURL = 'reports/get-top-fiscals'
		if (year) {
			requestURL += `?date=${year}`
		}

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los mejores fiscales.")
	}
}

export const getTopCoordinators = async () => {
	try {
		const requestURL = 'reports/get-top-coordinators'
		const response = await apiConnection.get(requestURL);
		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los mejores coordinadores.")
	}
}

export const getTopFiveByGroup = async (year?: number) => {
	try {
		let requestURL = 'reports/get-top-five-by-group'
		if (year) {
			requestURL += `?date=${year}`
		}

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los mejores fiscales por grupo.")
	}
}

export const getMonthlyGrowth = async (year?: number) => {
	try {
		let requestURL = 'reports/get-monthly-growth'
		if (year) {
			requestURL += `?date=${year}`
		}

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener el crecimiento por grupo mensual de coordinadores.")
	}
}

export const getTaxpayersCompliance = async (year?: number) => {
	try {
		let requestURL = 'reports/get-taxpayers-compliance'
		if (year) {
			requestURL += `?date=${year}`
		}

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los cumplimientos.")
	}
}

export const getExpectedAmount = async (year?: number) => {
	try {
		let requestURL = 'reports/get-expected-amount'
		if (year) {
			requestURL += `?date=${year}`
		}

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener el pagado esperado.")
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
};

export const getFiscalInfo = async (fiscalId: string, year?: number) => {
	try {
		let requestUrl = `reports/get-fiscal-info/${fiscalId}`
		if (year) {
			requestUrl += `?date=${year}`
		}

		const response = await apiConnection.get(requestUrl);
		return response.data;
	} catch (e) {
		console.error('Error al obtener el reporte de iva individual:', e)
		throw e
	}
};

export const getFiscalTaxpayers = async (fiscalId: string, year?: number) => {
	try {
		let requestUrl = `reports/get-fiscal-taxpayers/${fiscalId}`
		if (year) {
			requestUrl += `?date=${year}`
		}
		const response = await apiConnection.get(requestUrl);
		return response.data;
	} catch (e) {
		console.error('Error al obtener el reporte de contribuyentes:', e)
		throw e
	}
};

function isValidDate(dateStr: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
}

export const getCompleteReport = async (params: GetCompleteReportParams) => {
	try {
		// Validar fechas
		if (params.startDate && !isValidDate(params.startDate.slice(0, 10))) {
			throw new Error("La fecha de inicio no es válida. Usa el formato YYYY-MM-DD.");
		}
		if (params.endDate && !isValidDate(params.endDate.slice(0, 10))) {
			throw new Error("La fecha de fin no es válida. Usa el formato YYYY-MM-DD.");
		}
		if (params.startDate && params.endDate) {
			const start = new Date(params.startDate);
			const end = new Date(params.endDate);
			if (start > end) {
				throw new Error("La fecha de inicio no puede ser mayor que la fecha de fin.");
			}
		}

		// Validar proceso si está presente
		if (params.process && !["AF", "VDF", "FP"].includes(params.process)) {
			throw new Error("El tipo de proceso debe ser AF, VDF o FP.");
		}

		const query = new URLSearchParams();

		if (params.startDate) query.append("startDate", params.startDate);
		if (params.endDate) query.append("endDate", params.endDate);
		if (params.groupId) query.append("groupId", params.groupId);
		if (params.process) query.append("process", params.process);

		const response = await apiConnection.get(`/reports/get-complete-report?${query.toString()}`);
		return response.data;
	} catch (error: any) {
		console.error("Error al obtener el reporte general:", error);
		throw new Error(error.message || "No se pudo obtener el reporte general.");
	}
};

export const getFiscalMonthlyCollect = async (fiscalId: string, year?: number) => {
	try {
		let requestUrl = `reports/get-fiscal-monthly-collect/${fiscalId}`
		if (year) {
			requestUrl += `?date=${year}`
		}
		const response = await apiConnection.get(requestUrl);
		return response.data;
	} catch (e) {
		console.error('Error al obtener el reporte de pagado mensual:', e)
		throw e
	}
};

export const getFiscalMonthlyPerformance = async (fiscalId: string, year?: number) => {
	try {
		let requestUrl = `reports/get-fiscal-monthly-performance/${fiscalId}`
		if (year) {
			requestUrl += `?date=${year}`
		}
		const response = await apiConnection.get(requestUrl);
		return response.data;
	} catch (e) {
		console.error('Error al obtener el reporte mensual de rendimiento:', e)
		throw e
	}
};

export const getFiscalComplianceByProcess = async (fiscalId: string, year?: number) => {
	try {
		let requestUrl = `reports/get-fiscal-compliance-by-process/${fiscalId}`
		if (year) {
			requestUrl += `?date=${year}`
		}
		const response = await apiConnection.get(requestUrl);
		return response.data;
	} catch (e) {
		console.error('Error al obtener el cumplimiento por proceso:', e)
		throw e
	}
};

export const getFiscalTaxpayerCompliance = async (fiscalId: string, year?: number) => {
	try {
		let requestUrl = `reports/get-fiscal-compliance/${fiscalId}`
		if (year) {
			requestUrl += `?date=${year}`
		}
		const response = await apiConnection.get(requestUrl);
		return response.data;
	} catch (e) {
		console.error('Error al obtener el cumplimiento:', e)
		throw e
	}
};

export const getFiscalCollectAnalisis = async (fiscalId: string, year?: number) => {
	try {
		let requestUrl = `reports/get-fiscal-collect-analisis/${fiscalId}`
		if (year) {
			requestUrl += `?date=${year}`
		}
		const response = await apiConnection.get(requestUrl);
		return response.data;
	} catch (e) {
		console.error('Error al obtener el analisis', e)
		throw e
	}
}



export const getGlobalPerformance = async (year?: number) => {
	try {
		let requestUrl = `reports/global-performance`
		if (year) {
			requestUrl += `?date=${year}`
		}

		const response = await apiConnection.get(requestUrl)

		return response.data
	} catch (e) {
		console.error(e)
		throw new Error("No se pudo obtener el rendimiento global")
	}
}

export const getGlobalTaxpayerPerformance = async (year?: number) => {
	try {
		let requestUrl = `reports/global-taxpayer-performance`
		if (year) {
			requestUrl += `?date=${year}`
		}

		const response = await apiConnection.get(requestUrl)

		// console.log("TAXPAYER PERFORMANCE: " + JSON.stringify(response.data))
		return response.data
	} catch (e) {
		console.error(e)
		throw new Error("No se pudo obtener el rendimiento de los contribuyentes")
	}
}

export const getGroupPerformance = async (year?: number) => {

	try {
		let requestUrl = `reports/group-performance`
		if (year) {
			requestUrl += `?date=${year}`
		}

		const response = await apiConnection.get(requestUrl)

		return response.data
	} catch (e) {
		console.error(e)
		throw new Error("No se pudo obtener el rendimiento de los contribuyentes")
	}
}

export const getGlobalKPI = async (year?: number) => {

	try {

		let requestURL = 'reports/global-kpi'
		if (year) {
			requestURL += `?date=${year}`
		}

		const response = await apiConnection.get(requestURL);

		return response.data;


	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener los KPI globales...")
	}

}