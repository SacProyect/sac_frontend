import { apiConnection } from "./api-connection";

export type EstadoDivulgacion = "ABIERTA" | "CERRADA";

export type ParroquiaCaracas =
	| "ALTAGRACIA"
	| "ANTIMANO"
	| "CANDELARIA"
	| "CARICUAO"
	| "CATEDRAL"
	| "COCHE"
	| "EL_JUNQUITO"
	| "EL_PARAISO"
	| "EL_RECREO"
	| "EL_VALLE"
	| "LA_PASTORA"
	| "LA_VEGA"
	| "MACARAO"
	| "SAN_AGUSTIN"
	| "SAN_BERNARDINO"
	| "SAN_JOSE"
	| "SAN_JUAN"
	| "SAN_PEDRO"
	| "SANTA_ROSALIA"
	| "SANTA_TERESA"
	| "SUCRE"
	| "VEINTITRES_DE_ENERO";

export const PARROQUIAS_CARACAS: ParroquiaCaracas[] = [
	"ALTAGRACIA",
	"ANTIMANO",
	"CANDELARIA",
	"CARICUAO",
	"CATEDRAL",
	"COCHE",
	"EL_JUNQUITO",
	"EL_PARAISO",
	"EL_RECREO",
	"EL_VALLE",
	"LA_PASTORA",
	"LA_VEGA",
	"MACARAO",
	"SAN_AGUSTIN",
	"SAN_BERNARDINO",
	"SAN_JOSE",
	"SAN_JUAN",
	"SAN_PEDRO",
	"SANTA_ROSALIA",
	"SANTA_TERESA",
	"SUCRE",
	"VEINTITRES_DE_ENERO",
];

const BASE = "/divulgacion-presencia-fiscal";

export type CreateDivulgacionPayload = {
	fecha?: string;
	parroquia: ParroquiaCaracas;
	ubicacionReferencia?: string;
	fiscalGroupId?: string | null;
	notas?: string;
};

export type UpdateDivulgacionPayload = Partial<CreateDivulgacionPayload>;

export type ListDivulgacionesQuery = {
	desde?: string;
	hasta?: string;
	parroquia?: ParroquiaCaracas;
	estado?: EstadoDivulgacion;
	fiscalGroupId?: string;
	q?: string;
	page?: number;
	pageSize?: number;
};

export async function createDivulgacion(payload: CreateDivulgacionPayload) {
	const response = await apiConnection.post(`${BASE}/jornadas`, payload);
	return response.data;
}

export async function listDivulgaciones(query?: ListDivulgacionesQuery) {
	const response = await apiConnection.get(`${BASE}/jornadas`, {
		params: query,
	});
	return response.data;
}

export async function getDivulgacionById(id: string) {
	const response = await apiConnection.get(`${BASE}/jornadas/${id}`);
	return response.data;
}

export async function updateDivulgacion(id: string, payload: UpdateDivulgacionPayload) {
	const response = await apiConnection.patch(`${BASE}/jornadas/${id}`, payload);
	return response.data;
}

export async function closeDivulgacion(id: string) {
	const response = await apiConnection.patch(`${BASE}/jornadas/${id}/cerrar`);
	return response.data;
}

export async function reopenDivulgacion(id: string) {
	const response = await apiConnection.patch(`${BASE}/jornadas/${id}/reabrir`);
	return response.data;
}

export async function getTotalesDelDia(fecha?: string) {
	const response = await apiConnection.get(`${BASE}/totales-dia`, {
		params: fecha ? { fecha } : undefined,
	});
	return response.data;
}

export type TipoAsistente = "INTERNO_SAC" | "EXTERNO_LIBRE";

export type AsistenteInternoPayload = {
	tipo: "INTERNO_SAC";
	userId: string;
	notas?: string;
};

export type AsistenteExternoPayload = {
	tipo: "EXTERNO_LIBRE";
	nombreLibre: string;
	documentoLibre: string;
	cargoLibre?: string;
	organizacionLibre?: string;
	telefonoLibre?: string;
	notas?: string;
};

export type AsistentePayload = AsistenteInternoPayload | AsistenteExternoPayload;

export async function addAsistentes(divulgacionId: string, asistentes: AsistentePayload[]) {
	const response = await apiConnection.post(`${BASE}/jornadas/${divulgacionId}/asistentes`, {
		asistentes,
	});
	return response.data;
}

export async function removeAsistente(divulgacionId: string, asistenteId: string) {
	const response = await apiConnection.delete(
		`${BASE}/jornadas/${divulgacionId}/asistentes/${asistenteId}`,
	);
	return response.data;
}

export type AddVisitaPayload = {
	rif: string;
	tipoActividad: string;
	taxpayerId?: string | null;
	nombreCapturado?: string;
	direccionSector?: string;
	notas?: string;
};

export async function addVisita(divulgacionId: string, payload: AddVisitaPayload) {
	const response = await apiConnection.post(`${BASE}/jornadas/${divulgacionId}/visitas`, payload);
	return response.data;
}

export async function removeVisita(divulgacionId: string, visitaId: string) {
	const response = await apiConnection.delete(
		`${BASE}/jornadas/${divulgacionId}/visitas/${visitaId}`,
	);
	return response.data;
}

export type MapaParroquiaAgregado = {
	parroquia: ParroquiaCaracas;
	jornadas: number;
	abiertas: number;
	cerradas: number;
	asistentes: number;
	visitas: number;
	actividades: Record<string, number>;
};

export type MapaResponse = {
	desde: string;
	hasta: string;
	parroquias: MapaParroquiaAgregado[];
};

export async function getMapaAgregado(query?: {
	desde?: string;
	hasta?: string;
	fiscalGroupId?: string;
}): Promise<MapaResponse> {
	const response = await apiConnection.get(`${BASE}/mapa`, { params: query });
	return response.data;
}

export type UsuarioAsignable = {
	id: string;
	name: string;
	role: string;
	email: string;
	groupId: string | null;
};

export async function listUsuariosAsignables(query?: {
	q?: string;
	divulgacionId?: string;
	limit?: number;
}): Promise<{ items: UsuarioAsignable[] }> {
	const response = await apiConnection.get(`${BASE}/usuarios-asignables`, { params: query });
	return response.data;
}

export type MisStatsFiscal = {
	scope: "FISCAL";
	jornadasComoAsistente: number;
	jornadasAbiertasComoAsistente: number;
	visitasHoy: number;
	visitasSemana: number;
	visitasMes: number;
	visitasTotal: number;
	ultimasVisitas: Array<{
		id: string;
		rifCapturado: string;
		nombreCapturado: string | null;
		tipoActividad: string;
		yaRegistradoEnSac: boolean;
		createdAt: string;
		divulgacion: { id: string; parroquia: string; fecha: string };
	}>;
};
export type MisStatsResponsable = {
	scope: "ADMIN" | "COORDINATOR" | "SUPERVISOR";
	jornadasHoy: number;
	abiertasHoy: number;
	cerradasHoy: number;
	asistentesHoy: number;
	visitasHoy: number;
	jornadasMes: number;
	visitasMes: number;
	jornadasAbiertasTotal: number;
};
export type MisStats = MisStatsFiscal | MisStatsResponsable;

export async function getMisStats(): Promise<MisStats> {
	const response = await apiConnection.get(`${BASE}/mis-stats`);
	return response.data;
}

export async function duplicarDivulgacion(
	id: string,
	payload?: { fecha?: string; replicarAsistentesExternos?: boolean },
) {
	const response = await apiConnection.post(`${BASE}/jornadas/${id}/duplicar`, payload ?? {});
	return response.data;
}

function triggerBlobDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export async function downloadJornadasExcel(query?: ListDivulgacionesQuery) {
	const response = await apiConnection.get(`${BASE}/jornadas/export/xlsx`, {
		params: query,
		responseType: "blob",
	});
	const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
	triggerBlobDownload(response.data, `divulgaciones-${ts}.xlsx`);
}

export async function downloadJornadaPdf(id: string) {
	const response = await apiConnection.get(`${BASE}/jornadas/${id}/export/pdf`, {
		responseType: "blob",
	});
	triggerBlobDownload(response.data, `divulgacion-${id}.pdf`);
}
