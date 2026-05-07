import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, useMapEvents, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { type Layer, type LeafletMouseEvent, type Map as LeafletMap } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { MapaParroquiaAgregado, ParroquiaCaracas } from "@/components/utils/api/divulgacion-functions";
import parroquiasGeo from "./parroquias-libertador.geo.json";

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
const BASE_COLOR: Record<ParroquiaCaracas, string> = {
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
const PARROQUIAS_GEOJSON = parroquiasGeo as unknown as FeatureCollection<
	Geometry,
	{ display_name?: string }
> & {
	features: Array<
		Feature<Geometry, { display_name?: string }> & { _parroquia_key: ParroquiaCaracas }
	>;
};

/** Bounding box global del Municipio Libertador (calculado del GeoJSON). */
const LIBERTADOR_BOUNDS: L.LatLngBoundsExpression = (() => {
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

/** Centroide aproximado por parroquia (calculado del GeoJSON). */
const PARROQUIA_CENTROIDS = (() => {
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

/** Parroquias "grandes" cuya etiqueta se muestra siempre. Resto: zoom alto / con datos. */
const PARROQUIAS_GRANDES = new Set<ParroquiaCaracas>([
	"EL_JUNQUITO",
	"SUCRE",
	"MACARAO",
	"ANTIMANO",
	"CARICUAO",
	"LA_VEGA",
	"EL_PARAISO",
	"EL_VALLE",
	"COCHE",
	"LA_PASTORA",
	"EL_RECREO",
	"SAN_PEDRO",
	"SAN_BERNARDINO",
]);

type ParroquiaMapaInteractivoProps = {
	data: MapaParroquiaAgregado[];
	selected: ParroquiaCaracas | null;
	onSelect: (p: ParroquiaCaracas | null) => void;
	className?: string;
};

/** Encaja el mapa al bounding box del Libertador y a la selección. */
function FitToLibertador({ selected }: { selected: ParroquiaCaracas | null }) {
	const map = useMap();
	const fittedRef = useRef(false);
	useEffect(() => {
		if (selected) {
			const f = PARROQUIAS_GEOJSON.features.find(
				(ft: any) => ft._parroquia_key === selected,
			);
			if (f) {
				const layer = L.geoJSON(f as any);
				map.fitBounds(layer.getBounds(), { padding: [40, 40], animate: true });
			}
		} else if (!fittedRef.current) {
			map.fitBounds(LIBERTADOR_BOUNDS as any, { padding: [12, 12] });
			fittedRef.current = true;
		}
	}, [selected, map]);
	return null;
}

/** Hook que rastrea el zoom actual para decidir qué labels mostrar. */
function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
	const map = useMap();
	useEffect(() => {
		onZoom(map.getZoom());
	}, [map, onZoom]);
	useMapEvents({
		zoomend: (e: L.LeafletEvent) => onZoom(e.target.getZoom()),
	});
	return null;
}

export default function ParroquiaMapaInteractivo({
	data,
	selected,
	onSelect,
	className,
}: ParroquiaMapaInteractivoProps) {
	const [zoom, setZoom] = useState<number>(12);

	const dataByParroquia = useMemo(() => {
		const m = new Map<ParroquiaCaracas, MapaParroquiaAgregado>();
		for (const p of data) m.set(p.parroquia, p);
		return m;
	}, [data]);

	const maxJornadas = useMemo(() => {
		let m = 0;
		for (const p of data) if (p.jornadas > m) m = p.jornadas;
		return m;
	}, [data]);

	const intensityFor = (p: ParroquiaCaracas): number => {
		const j = dataByParroquia.get(p)?.jornadas ?? 0;
		if (j === 0) return 0;
		if (maxJornadas <= 0) return 0.5;
		return 0.4 + 0.55 * (j / maxJornadas);
	};

	const shouldShowLabel = (p: ParroquiaCaracas): boolean => {
		if (selected === p) return true;
		const hasData = (dataByParroquia.get(p)?.jornadas ?? 0) > 0;
		if (zoom >= 14) return true;
		if (hasData) return true;
		if (zoom >= 13 && PARROQUIAS_GRANDES.has(p)) return true;
		return zoom >= 12 && PARROQUIAS_GRANDES.has(p);
	};

	/** Estilos del polígono según parroquia, intensidad y selección. */
	const styleFn = (feature?: Feature) => {
		const key = (feature as any)?._parroquia_key as ParroquiaCaracas;
		const isSel = selected === key;
		const t = intensityFor(key);
		const fillOpacity = t === 0 ? 0.55 : 0.6 + t * 0.3;
		return {
			color: isSel ? "#fbbf24" : "#0b1220",
			weight: isSel ? 3.5 : 1.2,
			fillColor: BASE_COLOR[key] ?? "#94a3b8",
			fillOpacity,
			opacity: 1,
			dashArray: "",
		};
	};

	/** Wire-up de hover/click por feature. */
	const onEachFeature = (feature: Feature, layer: Layer) => {
		const key = (feature as any)._parroquia_key as ParroquiaCaracas;
		const path = layer as L.Path;
		const agg = dataByParroquia.get(key);
		const tooltipHtml = `
			<div style="font-family:inherit;font-size:11px;line-height:1.35">
				<div style="font-weight:600;color:#0f172a">${PARROQUIA_LABELS[key]}</div>
				<div style="display:grid;grid-template-columns:auto auto;gap:0 12px;margin-top:4px;color:#334155">
					<span>Jornadas:</span><span style="text-align:right;font-weight:600">${agg?.jornadas ?? 0}</span>
					<span>Abiertas:</span><span style="text-align:right;font-weight:600">${agg?.abiertas ?? 0}</span>
					<span>Cerradas:</span><span style="text-align:right;font-weight:600">${agg?.cerradas ?? 0}</span>
					<span>Asistentes:</span><span style="text-align:right;font-weight:600">${agg?.asistentes ?? 0}</span>
					<span>Visitas:</span><span style="text-align:right;font-weight:600">${agg?.visitas ?? 0}</span>
				</div>
				${!agg
				? '<div style="font-size:10px;font-style:italic;color:#64748b;margin-top:4px">Sin actividad en el período.</div>'
				: ""
			}
			</div>`;
		path.bindTooltip(tooltipHtml, { sticky: true, direction: "top" });

		path.on({
			click: () => onSelect(selected === key ? null : key),
			mouseover: (e: LeafletMouseEvent) => {
				const l = e.target as L.Path;
				l.setStyle({ weight: 3, color: "#fde047" });
				if ((l as any).bringToFront) (l as any).bringToFront();
			},
			mouseout: (e: LeafletMouseEvent) => {
				const l = e.target as L.Path;
				const isSel = selected === key;
				l.setStyle({
					weight: isSel ? 3.5 : 1.2,
					color: isSel ? "#fbbf24" : "#0b1220",
				});
			},
		});
	};

	/** Re-render del GeoJSON cada vez que cambia la selección o los datos (para refrescar styleFn). */
	const geoKey = `${selected ?? "none"}-${data.length}-${maxJornadas}`;

	return (
		<div className={`relative w-full ${className ?? ""}`}>
			<div className="rounded-2xl overflow-hidden border border-slate-700 shadow-inner">
				<MapContainer
					center={[10.49, -66.96]}
					zoom={12}
					minZoom={11}
					maxZoom={17}
					scrollWheelZoom
					style={{ height: 540, width: "100%", background: "#0f172a" }}
					maxBounds={[
						[10.34, -67.18],
						[10.66, -66.74],
					]}
					maxBoundsViscosity={0.9}
				>
					<LayersControl position="topright">
						<LayersControl.BaseLayer checked name="Mapa estándar">
							<TileLayer
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
						</LayersControl.BaseLayer>
						<LayersControl.BaseLayer name="Relieve / topo">
							<TileLayer
								attribution='Tiles &copy; Esri — World Topographic Map'
								url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
							/>
						</LayersControl.BaseLayer>
						<LayersControl.BaseLayer name="Satélite">
							<TileLayer
								attribution='Tiles &copy; Esri — World Imagery'
								url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
							/>
						</LayersControl.BaseLayer>
						<LayersControl.BaseLayer name="Oscuro">
							<TileLayer
								attribution='&copy; <a href="https://carto.com">CARTO</a>'
								url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
							/>
						</LayersControl.BaseLayer>
					</LayersControl>

					<FitToLibertador selected={selected} />
					<ZoomTracker onZoom={setZoom} />

					<GeoJSON
						key={geoKey}
						data={PARROQUIAS_GEOJSON as any}
						style={styleFn as any}
						onEachFeature={onEachFeature}
					/>

					{(Object.keys(PARROQUIA_CENTROIDS) as ParroquiaCaracas[]).map((p) => {
						const c = PARROQUIA_CENTROIDS[p];
						if (!c) return null;
						const agg = dataByParroquia.get(p);
						const jornadas = agg?.jornadas ?? 0;
						const isSel = selected === p;
						const showLabel = shouldShowLabel(p);
						if (!showLabel) return null;
						const labelClass = isSel
							? "is-selected"
							: jornadas > 0
								? "has-activity"
								: "";
						const labelHtml = `<div class="parroquia-label-leaflet ${labelClass}">${PARROQUIA_LABELS[p]
							}${jornadas > 0
								? ` <span class="dot">${jornadas}</span>`
								: ""
							}</div>`;
						const icon = L.divIcon({
							className: "parroquia-label-wrapper",
							html: labelHtml,
							iconSize: [1, 1],
							iconAnchor: [0, 0],
						});
						return (
							<Marker
								key={p}
								position={c}
								icon={icon}
								interactive={true}
								eventHandlers={{
									click: () => onSelect(selected === p ? null : p),
								}}
							/>
						);
					})}
				</MapContainer>
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
				<span className="text-slate-400">
					Mapa real · OpenStreetMap · 22 parroquias del Municipio Libertador (Distrito Capital)
				</span>
				{selected && (
					<button
						className="text-amber-300 underline hover:text-amber-200"
						onClick={() => onSelect(null)}
					>
						Quitar selección
					</button>
				)}
				<span className="text-slate-500">·</span>
				<span className="text-slate-400">
					Zoom: <span className="font-mono text-slate-200">{zoom}</span>
					{zoom < 14 && (
						<span className="ml-1 italic text-slate-500">(acerca para ver todas las etiquetas)</span>
					)}
				</span>
				<span className="ml-auto inline-flex items-center gap-2">
					<span className="inline-flex items-center gap-1">
						<span
							className="inline-block w-3 h-3 rounded-full"
							style={{ background: "#0f172a", border: "1px solid #475569" }}
						/>
						sin actividad
					</span>
					<span className="inline-flex items-center gap-1">
						<span
							className="inline-block w-3 h-3 rounded-full"
							style={{ background: "#fbbf24", border: "1px solid #d97706" }}
						/>
						con jornadas
					</span>
				</span>
			</div>

			<style>{`
				.parroquia-label-wrapper {
					background: transparent !important;
					border: none !important;
					pointer-events: auto;
				}
				.parroquia-label-leaflet {
					display: inline-block;
					transform: translate(-50%, -50%);
					background: rgba(15,23,42,0.86);
					border: 1px solid rgba(148,163,184,0.45);
					color: #f1f5f9;
					padding: 2px 7px;
					border-radius: 6px;
					box-shadow: 0 1px 4px rgba(0,0,0,0.45);
					font-family: inherit;
					font-size: 10px;
					font-weight: 600;
					letter-spacing: 0.01em;
					white-space: nowrap;
					transition: all 0.18s ease-out;
				}
				.parroquia-label-leaflet .dot {
					display: inline-block;
					margin-left: 4px;
					padding: 0 5px;
					border-radius: 999px;
					background: #fbbf24;
					color: #0f172a;
					font-weight: 700;
				}
				.parroquia-label-leaflet.is-selected {
					background: rgba(251,191,36,0.96);
					color: #0f172a;
					border-color: #92400e;
					box-shadow: 0 2px 10px rgba(251,191,36,0.55);
					transform: translate(-50%, -50%) scale(1.08);
				}
				.parroquia-label-leaflet.has-activity:not(.is-selected) {
					background: rgba(120,53,15,0.95);
					border-color: rgba(251,191,36,0.6);
				}
				.leaflet-container { font-family: inherit; }
				.leaflet-container a { color: #60a5fa; }
				.leaflet-control-attribution { font-size: 10px; }
				.leaflet-interactive { cursor: pointer; transition: filter 0.15s ease; }
				.leaflet-interactive:hover { filter: brightness(1.1) saturate(1.15); }
			`}</style>
		</div>
	);
}

/** Mantengo `mixWithDark` exportado por compatibilidad. */
export function mixWithDark(hex: string, darkRatio: number): string {
	const c = hexToRgb(hex);
	if (!c) return hex;
	const dark = { r: 15, g: 23, b: 42 };
	const r = Math.round(c.r * (1 - darkRatio) + dark.r * darkRatio);
	const g = Math.round(c.g * (1 - darkRatio) + dark.g * darkRatio);
	const b = Math.round(c.b * (1 - darkRatio) + dark.b * darkRatio);
	return `rgb(${r}, ${g}, ${b})`;
}
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

export type _UnusedLeafletMap = LeafletMap;
