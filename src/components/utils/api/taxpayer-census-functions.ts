import { NewTaxpayerCensus } from "@/components/taxpayer-census/taxpayer-census-form";
import { apiConnection } from "./api-connection";


export const createTaxpayerCensus = async (taxpayerData: NewTaxpayerCensus) => {
    try {
        const response = await apiConnection.post(`/census`, taxpayerData, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 200 || response.status === 201) {
            return { success: true, data: response.data };
        } else {
            console.error("API ERROR: ", response.status, response.data);
            return { success: false, message: response.data?.message || "Error al crear el contribuyente." };
        }
    } catch (error: any) {
        if (error.response) {
            const errorData = error.response.data;
            const msg = typeof errorData?.error === "string"
                ? errorData.error
                : errorData?.message || "Ocurrió un error.";
            return { success: false, message: msg };
        } else if (error.request) {
            return { success: false, message: "No hay respuesta del servidor. Revise la conexión." };
        } else {
            return { success: false, message: "Ocurrió un error inesperado. Por favor, intente de nuevo más tarde." };
        }
    }
};

export const getTaxpayerCensus = async () => {


    try {

        let requestUrl = "/census/getCensus"

        const response = await apiConnection.get(requestUrl);

        return response;

    } catch (e) {
        console.error(e);
        throw new Error("No se pudieron obtener los contribuyentes de censo")
    }

}

export const deleteTaxpayerCensus = async (id: string) => {


    try {

        let requestUrl = "/census/delete-census"

        const response = await apiConnection.delete(`${requestUrl}/${id}`);

        if (response.status === 201) {
            return response;
        }

        return;

    } catch (e) {
        console.error(e);
        throw new Error("No se pudo eliminar el contribuyente de censo")
    }


}