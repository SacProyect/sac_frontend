import { apiConnection } from "./apiConnection"
import { contract_type, Taxpayer, taxpayer_process } from "../../../types/taxpayer";
import { Event } from "../../../types/event";
import { NewEvent } from "../../Events/EventForm";
import { ObservationsForm } from "@/components/observations/ObservationsHeader";
import { IvaReportFormData } from "@/components/iva/IvaForm";
import { IslrReportFormData } from "@/components/ISLR/IslrForm";
import { IVAReports } from "@/types/IvaReports";
import { ISLRReports } from "@/types/ISLRReports";
import Decimal from "decimal.js";

interface TaxpayerData {
	providenceNum: number,
	process: taxpayer_process,
	name: string,
	rif: string,
	contract_type: contract_type,
	officerId: string,
}

interface UpdateObservationPayload {
	description: string;
}

type CreateIndexIva = {
	ordinaryAmount: Decimal,
	specialAmount: Decimal,
}

export const createIndexIva = async (input: CreateIndexIva) => {

	try {

		let requestURL = '/taxpayer/create-index-iva';


		const response = await apiConnection.post(requestURL, {
			ordinaryAmount: Number(input.ordinaryAmount),
			specialAmount: Number(input.specialAmount),
		})

		return response;

	} catch (e) {
		throw new Error("No se pudieron actualizar los registros de índice de iva.")
	}


}

export const modifyIndividualIndexIva = async (newIndexIva: Decimal, taxpayerId: string) => {

	try {

		const requestURL = '/taxpayer/modify-individual-index-iva';

		const response = await apiConnection.put(`${requestURL}/${taxpayerId}`, {
			newIndexIva: newIndexIva.toString(),
		});

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("No se pudo modificar el índice de IVA.")
	}
}


export const createTaxpayer = async (taxpayerData: FormData) => {
	try {

		const response = (await apiConnection.post(`/taxpayer`, taxpayerData, {
			headers: {
				'Content-Type': "multipart/form-data",
			}
		}));

		if (response.status === 200 || response.status === 201) {
			return { success: true, data: response.data };
		} else {
			console.error("API ERROR: ", response.status, response.data);
			return { success: false, message: response.data?.message || "Error al crear el contribuyente." };
		}

	} catch (error: any) {
		// Handle Axios errors properly
		if (error.response) {
			// Server responded with a status code outside 2xx
			const errorData = error.response.data;

			const msg = typeof errorData?.error === "string"
				? errorData.error
				: errorData?.message || "Ocurrió un error.";

			return {
				success: false,
				message: msg,
			};
		} else if (error.request) {
			// No response received
			return { success: false, message: "No hay respuesta del servidor. Revise la conexión." };
		} else {
			// Other unexpected errors
			return { success: false, message: "Ocurrió un error inesperado. Por favor, intente de nuevo más tarde." };
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

export const getTaxpayers = async () => {
	try {
		let requestURL = "/taxpayer/get-taxpayers"

		const response = await (await apiConnection.get(requestURL)).data

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los contribuyentes.")
	}
}

export const getFiscalTaxpayersForStats = async (fiscalId: string) => {

	try {
		let requestUrl = "/taxpayer/get-fiscal-taxpayers-for-stats"

		const response = await apiConnection.get(`${requestUrl}/${fiscalId}`);

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los vdf y af fuera ni dentro de plazo.")
	}

}

export const getFiscalsForReview = async () => {

	try {
		let requestUrl = "/user/get-fiscals-for-review"

		const response = await apiConnection.get(`${requestUrl}`);

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("No se pudieron obtener los fiscales.")
	}
}




// This api is specific to retrieve the taxpayers related to the user that needs to create some reports
export const getTaxpayerForEvents = async () => {
	try {
		let requestURL = "taxpayer/get-taxpayers-for-events"

		const response = await apiConnection.get(requestURL);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se encontraron contribuyentes")
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

export const deleteObservations = async (observationId: string) => {
	// console.log(observationId)

	try {
		const response = await apiConnection.delete(`/taxpayer/del-observation/${observationId}`);
		return response.data;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo borrar la observación, por favor, intente de nuevo.")
	}
}

export const createEvent = async (event_type: string, event_data: NewEvent) => {
	try {
		const response = await (await apiConnection.post(`/taxpayer/${event_type}`, event_data)).data

		return response
	} catch (error) {
		// console.log(error)
		return false
	}
}

export const updateObservation = async (id: string, newDescription: string) => {
	try {

		let requestURL = "/taxpayer/modify-observations"

		const response = await apiConnection.put(`${requestURL}/${id}`, {
			newDescription,
		});

		return response
	} catch (e) {
		// console.log("Error: " + e)
		throw new Error("Error al modificar la observación");
	}
}

export const updateFase = async (id: string, fase: string) => {

	try {
		let requestUrl = "/taxpayer/update-fase"

		const response = await apiConnection.put(`${requestUrl}/${id}`, {
			fase,
		})

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("No se pudo actualizar la fase del contribuyente, por favor, inténtelo de nuevo")
	}
}

export const updateCulminated = async (id: string, culminated: boolean) => {

	try {

		let requestUrl = '/taxpayer/update-culminated'

		const response = await apiConnection.put(`${requestUrl}/${id}`, {
			culminated,
		});

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("Ha ocurrido un error culminando el procedimiento, por favor, intente de nuevo.")
	}
}

export const notifyTaxpayer = async (id: string) => {

	try {
		let requestURL = "/taxpayer/notify"


		const response = await apiConnection.put(`${requestURL}/${id}`);

		return response;
	} catch (e) {
		throw new Error("Error al reportar al contribuyente como notificado")
	}
}


export const updateFinePayment = async (id: string, status: "paid" | "not_paid") => {

	try {

		const requestURL = "/taxpayer/updatePayment"

		const response = await apiConnection.put(`${requestURL}/${id}`, {
			status,
		})

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo actualizar la multa.")
	}
}

export const updateIva = async (payload: Partial<IVAReports>) => {
	try {
		if (!payload.id) throw new Error("ID requerido para actualizar el reporte");

		const requestURL = "/taxpayer/updateIva";

		const response = await apiConnection.put(`${requestURL}/${payload.id}`, payload);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo actualizar el reporte de IVA.");
	}
};

export const updateEvent = async (payload: Partial<Event>) => {
	// console.log(payload);

	try {
		if (!payload.id) throw new Error("ID requerido para actualizar el reporte");

		let requestUrl = "/taxpayer";

		const response = await apiConnection.put(
			`${requestUrl}/${payload.type?.toLowerCase()}/${payload.id}`,
			payload // ✅ Enviar el cuerpo aquí
		);

		return response.data;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo modificar. Intente de nuevo.");
	}
};

export const updateIslrReport = async (id: string, input: Partial<ISLRReports>) => {


	try {

		let requestURL = "/taxpayer/update-islr"

		const response = await apiConnection.put(`${requestURL}/${id}`,
			input
		)

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("No se pudo actualizar el reporte de ISLR, intente de nuevo.")
	}


}


export const createObservation = async (data: ObservationsForm) => {
	try {
		let requestUrl = "taxpayer/observations"

		const response = await apiConnection.post(requestUrl, data)

		return response

	} catch (e) {
		console.error(e)
		throw new Error("Error al crear la observación")
	}
}

export const createIVA = async (data: IvaReportFormData) => {
	try {
		let requestUrl = "/taxpayer/createIVA";

		const response = await apiConnection.post(requestUrl, data);

		return response.data; // generalmente la data va en response.data
	} catch (e: any) {
		// Extraemos el mensaje de error que viene desde backend (por ejemplo, en e.response.data.error)
		const backendMessage = e.response?.data?.error || e.response?.data || e.message;

		if (backendMessage === "IVA report for this taxpayer and month already exists.") {
			throw new Error("Ya hay un reporte para este contribuyente en este mes y año");
		}

		console.error(e);
		throw new Error("No se pudo agregar el reporte. Por favor, intente de nuevo.");
	}
};

export const createISLR = async (data: IslrReportFormData) => {

	try {
		let requestUrl = "/taxpayer/create-islr-report";

		const response = await apiConnection.post(requestUrl, data);

		return response;

	} catch (e: any) {
		const backendMessage: string =
			e.response?.data?.error ||
			e.response?.data ||
			e.message ||
			''

		if (backendMessage.startsWith('ISLR Report for this taxpayer in:')) {
			throw new Error(
				'Error: Ya hay un reporte de ISLR creado este año para este contribuyente'
			)
		}

		console.error(e);
		throw new Error("No se pudo crear el reporte de ISLR, por favor, intente de nuevo.")
	}
}

export const getObservations = async (taxpayerId: string) => {
	try {
		let requestURL = `taxpayer/get-observations/${taxpayerId}`

		const response = (await apiConnection.get(requestURL)).data;

		return response;

	} catch (e) {
		console.error("Error obteniendo las observaciones: ", e);
		throw new Error("No se pudieron obtener las observaciones");
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
		console.error(error)
		return []
	}
}

export const getParishList = async () => {
	try {
		let requestUrl = 'taxpayer/get-parish-list'

		const response = await apiConnection.get(requestUrl)

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener la lista de parroquias")
	}
}

export const getTaxpayerCategories = async () => {

	try {
		let requestUrl = 'taxpayer/get-taxpayer-categories'


		const response = await apiConnection.get(requestUrl);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo obtener las categorias");
	}
}

export const getTaxpayerData = async (taxpayerId: string) => {

	try {
		let requestURL = `/reports/pending`
		if (taxpayerId) {
			requestURL = `/taxpayer/data/${taxpayerId}`
		}
		const response = await (await apiConnection.get(requestURL)).data
		return response

	} catch (e) {
		console.error(e);
		throw new Error("Ha ocurrido un error");
	}
}

export const uploadRepairReport = async (taxpayerId: string, file: File) => {
	try {
		const formData = new FormData();
		formData.append("repairReport", file);

		// Ajusta la URL y método según tu backend
		const response = await apiConnection.post(`/taxpayer/repair-report/${taxpayerId}`, formData, {
			headers: {
				"Content-Type": "multipart/form-data"
			}
		});

		return response.data;
	} catch (e) {
		console.error(e);
		throw new Error("Error subiendo acta de reparación");
	}
};

export const downloadRepairPdf = async (key: string) => {

	try {

		const requestUrl = '/taxpayer/download-repair-report'

		const response = await apiConnection.get(`${requestUrl}/${key}`);

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("Can't generate the download url");
	}
}

export const downloadInvestigationPdf = async (key: string) => {

	try {


		const response = await apiConnection.get(`taxpayer/download-investigation`, {
			params: { key: encodeURIComponent(key) }
		});

		console.log(response);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("Ocurrio un error al descargar, por favor, intente de nuevo")
	}

}

export const deleteEvent = async (id: string) => {

	try {

		let requestURL = "/taxpayer/event"

		const response = await apiConnection.delete(`${requestURL}/${id}`);

		return response;

	} catch (e) {
		console.error(e);
		throw new Error("No se pudo eliminar, por favor, intente de nuevo.")
	}
}

export const deleteIva = async (id: string) => {
	try {
		let requestURL = "/taxpayer/delete-iva"

		const response = await apiConnection.delete(`${requestURL}/${id}`);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo eliminar el reporte de iva")
	}
}

export const deleteISLR = async (id: string) => {
	try {
		let requestURL = "/taxpayer/delete-islr"

		const response = await apiConnection.delete(`${requestURL}/${id}`);

		return response;
	} catch (e) {
		console.error(e);
		throw new Error("No se pudo borrar el reporte de ISLR.")
	}
}


