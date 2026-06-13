import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { ParroquiaCaracas } from "@/components/utils/api/divulgacion-functions";
import parroquiasGeo from "../../pages/divulgacion/parroquias-libertador.geo.json";
import L from "leaflet";

/** Etiqueta legible por enum. */
export const PARROQUIA_LABELS: Record<ParroquiaCaracas, string> = {
	ALTAGRACIA: "Altagracia",
	ANTIMANO: "Antímano",
	CANDELARIA: "Candelaria",
	CARICUAO: "Caricuao",
	CATEDRAL: "Catedral",
	COCHE: "Coche",
	EL_JUNQUITO: "El Junquito",
	EL_PARAISO: "El Paraíso",
	EL_RECREO: "El Recreo",
	EL_VALLE: "El Valle",
	LA_PASTORA: "La Pastora",
	LA_VEGA: "La Vega",
	MACARAO: "Macarao",
	SAN_AGUSTIN: "San Agustín",
	SAN_BERNARDINO: "San Bernardino",
	SAN_JOSE: "San José",
	SAN_JUAN: "San Juan",
	SAN_PEDRO: "San Pedro",
	SANTA_ROSALIA: "Santa Rosalía",
	SANTA_TERESA: "Santa Teresa",
	SUCRE: "Sucre (Catia)",
	VEINTITRES_DE_ENERO: "23 de Enero",
};

/**
 * Paleta inspirada directamente en el mapa físico real del Municipio Libertador
 * (la imagen oficial coloreada): cada parroquia tiene su tono distintivo.
 */
export const BASE_COLOR: Record<ParroquiaCaracas, string> = {
	EL_JUNQUITO: "#E97B2C",
	SUCRE: "#7E4B2A",
	LA_PASTORA: "#C9663E",
	ANTIMANO: "#D86A33",
	MACARAO: "#F2D634",
	CARICUAO: "#E8A744",
	LA_VEGA: "#E5C36B",
	EL_PARAISO: "#E0A873",
	EL_VALLE: "#C97A55",
	COCHE: "#65B79C",
	VEINTITRES_DE_ENERO: "#9D2E36",
	SAN_JUAN: "#D14A50",
	SANTA_ROSALIA: "#D49C58",
	ALTAGRACIA: "#A14B7A",
	SAN_JOSE: "#E1457E",
	CATEDRAL: "#B33052",
	CANDELARIA: "#7C2A6E",
	SANTA_TERESA: "#9C3258",
	SAN_AGUSTIN: "#C45D4A",
	SAN_BERNARDINO: "#A23F86",
	EL_RECREO: "#7B3A93",
	SAN_PEDRO: "#5DA0B2",
};

/** GeoJSON tipado del Municipio Libertador (22 parroquias). */
export const PARROQUIAS_GEOJSON = parroquiasGeo as unknown as FeatureCollection<
	Geometry,
	{ display_name?: string }
> & {
	features: Array<
		Feature<Geometry, { display_name?: string }> & { _parroquia_key: ParroquiaCaracas }
	>;
};

/** Bounding box global del Municipio Libertador (calculado del GeoJSON). */
export const LIBERTADOR_BOUNDS: L.LatLngBoundsExpression = (() => {
	let minLat = 90,
		maxLat = -90,
		minLng = 180,
		maxLng = -180;
	for (const f of PARROQUIAS_GEOJSON.features) {
		const visit = (coords: any) => {
			if (typeof coords[0] === "number") {
				const [lng, lat] = coords as [number, number];
				if (lat < minLat) minLat = lat;
				if (lat > maxLat) maxLat = lat;
				if (lng < minLng) minLng = lng;
				if (lng > maxLng) maxLng = lng;
			} else {
				for (const c of coords) visit(c);
			}
		};
		visit((f.geometry as any).coordinates);
	}
	return [
		[minLat, minLng],
		[maxLat, maxLng],
	];
})();

// ---------------------------------------------------------------------------
// Fix: Mapeo display_name → ParroquiaCaracas + asignación de _parroquia_key
// ---------------------------------------------------------------------------

/** Normaliza strings removiendo acentos y pasando a minúsculas. */
const normalize = (s: string) =>
	s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Mapeo de display_name (GeoJSON) → ParroquiaCaracas */
const DISPLAY_NAME_TO_KEY: Record<string, ParroquiaCaracas> = {};
for (const key of Object.keys(PARROQUIA_LABELS) as ParroquiaCaracas[]) {
	const label = PARROQUIA_LABELS[key];
	// El display_name del GeoJSON es "Parroquia {Label}"
	DISPLAY_NAME_TO_KEY[label] = key;
	// También mapear variante sin acentos para robustez
	DISPLAY_NAME_TO_KEY[normalize(label)] = key;
}

/**
 * Asigna _parroquia_key a cada feature del GeoJSON basándose en display_name.
 * Llamar una vez al inicio para mutar el GeoJSON en memoria.
 */
export function assignParroquiaKeys(): void {
	for (const feature of PARROQUIAS_GEOJSON.features) {
		const displayName = feature.properties?.display_name ?? "";
		// Extraer nombre: "Parroquia Antímano, Municipio Libertador..." → "Antímano"
		const match = displayName.match(/^Parroquia\s+(.+?),/i);
		if (match) {
			const name = match[1].trim();
			const key =
				DISPLAY_NAME_TO_KEY[name] ?? DISPLAY_NAME_TO_KEY[normalize(name)];
			if (key) {
				(feature as any)._parroquia_key = key;
			}
		}
	}
}

// Ejecutar al importar el módulo (ANTES de PARROQUIA_CENTROIDS)
assignParroquiaKeys();

// ---------------------------------------------------------------------------
// Point-in-Polygon (Ray Casting) + detección de parroquia por punto GPS
// ---------------------------------------------------------------------------

/**
 * Algoritmo Ray Casting para determinar si un punto (lng, lat) está dentro de un polígono.
 * Las coordenadas del polígono son [lng, lat] (formato GeoJSON).
 */
export function pointInPolygon(
	point: [number, number], // [lng, lat]
	polygon: number[][][], // Coordenadas del polígono (formato GeoJSON: ring de [lng, lat])
): boolean {
	const [lng, lat] = point;
	let inside = false;

	for (const ring of polygon) {
		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			const [xi, yi] = ring[i];
			const [xj, yj] = ring[j];

			if (
				yi > lat !== yj > lat &&
				lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
			) {
				inside = !inside;
			}
		}
	}

	return inside;
}

/**
 * Detecta en qué parroquia cae un punto GPS [lat, lng].
 * Retorna la key de ParroquiaCaracas o null si no está dentro de ningún polígono.
 */
export function detectParroquiaFromPoint(
	lat: number,
	lng: number,
): ParroquiaCaracas | null {
	for (const feature of PARROQUIAS_GEOJSON.features) {
		const key = (feature as any)._parroquia_key as
			| ParroquiaCaracas
			| undefined;
		if (!key) continue;

		const geom = feature.geometry as any;
		if (geom.type === "Polygon" && geom.coordinates) {
			if (pointInPolygon([lng, lat], geom.coordinates)) {
				return key;
			}
		} else if (geom.type === "MultiPolygon" && geom.coordinates) {
			for (const polygon of geom.coordinates) {
				if (pointInPolygon([lng, lat], polygon)) {
					return key;
				}
			}
		}
	}

	return null;
}

/** Centroide aproximado por parroquia (calculado del GeoJSON). */
export const PARROQUIA_CENTROIDS = (() => {
	const out: Record<string, [number, number]> = {};
	for (const f of PARROQUIAS_GEOJSON.features) {
		let sumLat = 0,
			sumLng = 0,
			count = 0;
		const visit = (coords: any) => {
			if (typeof coords[0] === "number") {
				sumLng += coords[0];
				sumLat += coords[1];
				count++;
			} else {
				for (const c of coords) visit(c);
			}
		};
		visit((f.geometry as any).coordinates);
		if (count > 0) out[f._parroquia_key] = [sumLat / count, sumLng / count];
	}
	return out as Record<ParroquiaCaracas, [number, number]>;
})();
