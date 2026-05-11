import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/UI/v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/UI/table";
import { useAuth } from "@/hooks/use-auth";
import {
	closeDivulgacion,
	createDivulgacion,
	duplicarDivulgacion,
	downloadJornadasExcel,
	getMapaAgregado,
	getMisStats,
	listDivulgaciones,
	PARROQUIAS_CARACAS,
	reopenDivulgacion,
	type EstadoDivulgacion,
	type MapaParroquiaAgregado,
	type MisStats,
	type ParroquiaCaracas,
} from "@/components/utils/api/divulgacion-functions";
import ParroquiaMapaInteractivo, { PARROQUIA_LABELS } from "./parroquia-mapa-interactivo";
import DesgloseComercial from "./desglose-comercial";
import EquipoQuickAdd from "./equipo-quick-add";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const FILTERS_STORAGE_KEY = "divulgacion-presencia-filtros-v1";

type DivulgacionRow = {
	id: string;
	estado: EstadoDivulgacion;
	parroquia: ParroquiaCaracas;
	fecha: string;
	ubicacionReferencia: string | null;
	creadoPor?: { id: string; name: string; role: string };
	fiscalGroup?: { id: string; name: string } | null;
	_count?: { asistentes: number; visitas: number };
	notas?: string | null;
};

// El antiguo "Totales" se reemplazó por MisStats (KPIs personalizados por rol).

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}
function firstOfMonthISO(): string {
	const d = new Date();
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function DivulgacionPresenciaPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	// Este módulo está restringido a ADMIN — los flags se mantienen
	// como defensa en profundidad pero todos resuelven a true.
	const role = user?.role ?? "";
	const canCreate = role === "ADMIN";
	const canCloseReopen = role === "ADMIN";
	const canSeeMap = role === "ADMIN";
	const canManageEquipo = role === "ADMIN";

	const [items, setItems] = useState<DivulgacionRow[]>([]);
	const [misStats, setMisStats] = useState<MisStats | null>(null);
	const [mapa, setMapa] = useState<MapaParroquiaAgregado[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionInfo, setActionInfo] = useState("");
	const [busy, setBusy] = useState<string | null>(null);

	const [showForm, setShowForm] = useState(false);
	const [parroquiaForm, setParroquiaForm] = useState<ParroquiaCaracas>("SUCRE");
	const [fechaForm, setFechaForm] = useState<string>(todayISO);
	const [horaInicioForm, setHoraInicioForm] = useState("08:00");
	const [horaFinForm, setHoraFinForm] = useState("12:00");
	const [ubicacionReferencia, setUbicacionReferencia] = useState("");
	const [sectorForm, setSectorForm] = useState("");
	const [direccionDetalladaForm, setDireccionDetalladaForm] = useState("");
	const [objetivoForm, setObjetivoForm] = useState("Captacion de contribuyentes y orientacion tributaria.");
	const [tipoJornadaForm, setTipoJornadaForm] = useState("DIVULGACION");
	const [metaVisitasForm, setMetaVisitasForm] = useState("25");
	const [canalConvocatoriaForm, setCanalConvocatoriaForm] = useState("PUERTA_A_PUERTA");
	const [responsableForm, setResponsableForm] = useState("");
	const [telefonoResponsableForm, setTelefonoResponsableForm] = useState("");
	const [apoyoInstitucionalForm, setApoyoInstitucionalForm] = useState("");
	const [observacionesOperativas, setObservacionesOperativas] = useState("");
	const [notas, setNotas] = useState("");

	const [desde, setDesde] = useState<string>(firstOfMonthISO);
	const [hasta, setHasta] = useState<string>(todayISO);
	const [filtroParroquia, setFiltroParroquia] = useState<ParroquiaCaracas | "">("");
	const [filtroEstado, setFiltroEstado] = useState<EstadoDivulgacion | "">("");
	const [q, setQ] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 20;
	const [total, setTotal] = useState(0);
	const [downloading, setDownloading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [readyToLoad, setReadyToLoad] = useState(false);
	const [metaVisitasPeriodo, setMetaVisitasPeriodo] = useState("500");
	const [umbralBajo, setUmbralBajo] = useState("40");
	const [umbralMedio, setUmbralMedio] = useState("120");

	const [parroquiaSeleccionada, setParroquiaSeleccionada] = useState<ParroquiaCaracas | null>(null);
	const [mapView, setMapView] = useState<"normal" | "calor">("normal");
	const [heatMetric, setHeatMetric] = useState<"jornadas" | "visitas" | "asistentes" | "impacto_iva">("impacto_iva");

	const buildQuery = () => ({
		desde: desde || undefined,
		hasta: hasta || undefined,
		parroquia: filtroParroquia || undefined,
		estado: filtroEstado || undefined,
		q: q.trim() || undefined,
	});


	const cargar = async (overridePage?: number) => {
		try {
			setLoading(true);
			setError("");
			const params = {
				...buildQuery(),
				page: overridePage ?? page,
				pageSize,
			};
			const [lista, stats, m] = await Promise.all([
				listDivulgaciones(params),
				getMisStats(),
				canSeeMap
					? getMapaAgregado({ desde: desde || undefined, hasta: hasta || undefined })
					: Promise.resolve(null),
			]);
			setItems(Array.isArray(lista?.items) ? lista.items : []);
			setTotal(typeof lista?.total === "number" ? lista.total : 0);
			setMisStats(stats ?? null);
			setMapa(Array.isArray(m?.parroquias) ? m.parroquias : []);
		} catch (e: any) {
			setError(e?.message ?? "No se pudieron cargar las jornadas.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		try {
			const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
			if (raw) {
				const saved = JSON.parse(raw) as {
					desde?: string;
					hasta?: string;
					filtroParroquia?: ParroquiaCaracas | "";
					filtroEstado?: EstadoDivulgacion | "";
					q?: string;
					metaVisitasPeriodo?: string;
					umbralBajo?: string;
					umbralMedio?: string;
				};
				if (saved.desde) setDesde(saved.desde);
				if (saved.hasta) setHasta(saved.hasta);
				if (typeof saved.filtroParroquia === "string") setFiltroParroquia(saved.filtroParroquia);
				if (typeof saved.filtroEstado === "string") setFiltroEstado(saved.filtroEstado);
				if (typeof saved.q === "string") setQ(saved.q);
				if (typeof saved.metaVisitasPeriodo === "string") setMetaVisitasPeriodo(saved.metaVisitasPeriodo);
				if (typeof saved.umbralBajo === "string") setUmbralBajo(saved.umbralBajo);
				if (typeof saved.umbralMedio === "string") setUmbralMedio(saved.umbralMedio);
			}
		} finally {
			setReadyToLoad(true);
		}
	}, []);

	useEffect(() => {
		if (!readyToLoad) return;
		cargar();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [readyToLoad]);

	const aplicarFiltros = (e?: React.FormEvent) => {
		e?.preventDefault();
		guardarFiltros();
		setPage(1);
		cargar(1);
	};

	const guardarFiltros = () => {
		localStorage.setItem(
			FILTERS_STORAGE_KEY,
			JSON.stringify({
				desde,
				hasta,
				filtroParroquia,
				filtroEstado,
				q,
				metaVisitasPeriodo,
				umbralBajo,
				umbralMedio,
			}),
		);
	};

	const limpiarFiltrosGuardados = () => {
		localStorage.removeItem(FILTERS_STORAGE_KEY);
		setDesde(firstOfMonthISO());
		setHasta(todayISO());
		setFiltroParroquia("");
		setFiltroEstado("");
		setQ("");
		setMetaVisitasPeriodo("500");
		setUmbralBajo("40");
		setUmbralMedio("120");
		setPage(1);
		cargar(1);
	};

	const onExportExcel = async () => {
		try {
			setDownloading(true);
			await downloadJornadasExcel(buildQuery());
		} catch (e: any) {
			setError(e?.message ?? "No se pudo exportar.");
		} finally {
			setDownloading(false);
		}
	};

	const onCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setBusy("create");
			await createDivulgacion({
				fecha: fechaForm,
				parroquia: parroquiaForm,
				ubicacionReferencia:
					[ubicacionReferencia.trim(), sectorForm.trim(), direccionDetalladaForm.trim()]
						.filter(Boolean)
						.join(" | ") || undefined,
				notas: buildNotasOperacion(),
			});
			setShowForm(false);
			setUbicacionReferencia("");
			setSectorForm("");
			setDireccionDetalladaForm("");
			setResponsableForm("");
			setTelefonoResponsableForm("");
			setApoyoInstitucionalForm("");
			setObservacionesOperativas("");
			setNotas("");
			await cargar();
		} catch (e: any) {
			setError(e?.message ?? "No se pudo crear la jornada.");
		} finally {
			setBusy(null);
		}
	};

	const onCerrar = async (id: string) => {
		const row = items.find((it) => it.id === id);
		const asistentes = row?._count?.asistentes ?? 0;
		const visitas = row?._count?.visitas ?? 0;
		if (asistentes === 0 || visitas === 0) {
			const ok = window.confirm(
				"Esta jornada tiene checklist incompleto (asistentes o visitas en 0). ¿Deseas cerrarla de todas formas?",
			);
			if (!ok) return;
		}
		try {
			setBusy(id);
			await closeDivulgacion(id);
			await cargar();
		} finally {
			setBusy(null);
		}
	};

	const onReabrir = async (id: string) => {
		try {
			setBusy(id);
			await reopenDivulgacion(id);
			await cargar();
		} finally {
			setBusy(null);
		}
	};

	const onDuplicar = async (id: string) => {
		try {
			setBusy(`dup-${id}`);
			await duplicarDivulgacion(id, { fecha: todayISO(), replicarAsistentesExternos: true });
			await cargar();
		} catch (e: any) {
			setError(e?.message ?? "No se pudo duplicar la jornada.");
		} finally {
			setBusy(null);
		}
	};

	const onCerrarMasivo = async () => {
		const selected = itemsFiltrados.filter((it) => selectedIds.includes(it.id) && it.estado === "ABIERTA");
		if (selected.length === 0) return;
		const elegibles = selected.filter((row) => (row._count?.asistentes ?? 0) > 0 && (row._count?.visitas ?? 0) > 0);
		const omitidas = selected.filter((row) => !elegibles.some((ok) => ok.id === row.id));
		const ok = window.confirm(
			`Se procesarán ${selected.length} jornadas abiertas.\n` +
				`- Elegibles para cerrar: ${elegibles.length}\n` +
				`- Omitidas por checklist incompleto: ${omitidas.length}\n\n` +
				`¿Deseas continuar?`,
		);
		if (!ok) return;
		try {
			setBusy("bulk-close");
			setActionInfo("");
			setError("");
			for (const row of elegibles) {
				await closeDivulgacion(row.id);
			}
			setSelectedIds([]);
			await cargar();
			const detalleOmitidas =
				omitidas.length > 0
					? ` Omitidas: ${omitidas
							.slice(0, 3)
							.map((r) => PARROQUIA_LABELS[r.parroquia])
							.join(", ")}${omitidas.length > 3 ? "..." : ""}.`
					: "";
			setActionInfo(
				`Cierre masivo completado: ${elegibles.length} cerradas, ${omitidas.length} omitidas por checklist.${detalleOmitidas}`,
			);
		} catch (e: any) {
			setError(e?.message ?? "No se pudo completar el cierre masivo.");
		} finally {
			setBusy(null);
		}
	};

	const onReabrirMasivo = async () => {
		const selected = itemsFiltrados.filter((it) => selectedIds.includes(it.id) && it.estado === "CERRADA");
		if (selected.length === 0) return;
		const ok = window.confirm(`Se reabrirán ${selected.length} jornadas cerradas seleccionadas. ¿Continuar?`);
		if (!ok) return;
		try {
			setBusy("bulk-reopen");
			setActionInfo("");
			setError("");
			for (const row of selected) {
				await reopenDivulgacion(row.id);
			}
			setSelectedIds([]);
			await cargar();
			setActionInfo(`Reapertura masiva completada: ${selected.length} jornadas reabiertas.`);
		} catch (e: any) {
			setError(e?.message ?? "No se pudo completar la reapertura masiva.");
		} finally {
			setBusy(null);
		}
	};

	const itemsFiltrados = useMemo(() => {
		if (!parroquiaSeleccionada) return items;
		return items.filter((it) => it.parroquia === parroquiaSeleccionada);
	}, [items, parroquiaSeleccionada]);

	useEffect(() => {
		const validIds = new Set(itemsFiltrados.map((it) => it.id));
		setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
	}, [itemsFiltrados]);

	const aggSeleccionada = useMemo(() => {
		if (!parroquiaSeleccionada) return null;
		return mapa.find((p) => p.parroquia === parroquiaSeleccionada) ?? null;
	}, [mapa, parroquiaSeleccionada]);

	const totalActividadesPeriodo = useMemo(() => {
		const acc: Record<string, number> = {};
		for (const p of mapa) {
			for (const [k, v] of Object.entries(p.actividades)) {
				acc[k] = (acc[k] ?? 0) + v;
			}
		}
		return acc;
	}, [mapa]);

	const totalJornadasPeriodo = useMemo(
		() => mapa.reduce((sum, p) => sum + (p.jornadas ?? 0), 0),
		[mapa],
	);
	const totalVisitasPeriodo = useMemo(
		() => mapa.reduce((sum, p) => sum + (p.visitas ?? 0), 0),
		[mapa],
	);
	const totalCerradasPeriodo = useMemo(
		() => mapa.reduce((sum, p) => sum + (p.cerradas ?? 0), 0),
		[mapa],
	);
	const parroquiasConActividad = useMemo(
		() => mapa.filter((p) => (p.jornadas ?? 0) > 0).length,
		[mapa],
	);
	const promedioVisitasPorJornada = totalJornadasPeriodo
		? (totalVisitasPeriodo / totalJornadasPeriodo).toFixed(1)
		: "0.0";
	const tasaCierre = totalJornadasPeriodo
		? `${Math.round((totalCerradasPeriodo / totalJornadasPeriodo) * 100)}%`
		: "0%";
	const metaVisitasPeriodoNum = Math.max(0, Number(metaVisitasPeriodo) || 0);
	const cumplimientoMetaPct = metaVisitasPeriodoNum
		? Math.round((totalVisitasPeriodo / metaVisitasPeriodoNum) * 100)
		: 0;
	const jornadasSinVisitas = useMemo(
		() => items.filter((it) => (it._count?.visitas ?? 0) === 0).length,
		[items],
	);
	const jornadasAbiertasSinAsistentes = useMemo(
		() => items.filter((it) => it.estado === "ABIERTA" && (it._count?.asistentes ?? 0) === 0).length,
		[items],
	);
	const parroquiasSinActividad = useMemo(
		() => mapa.filter((p) => (p.jornadas ?? 0) === 0).length,
		[mapa],
	);

	const getIvaCount = (actividades: Record<string, number>) =>
		Object.entries(actividades).reduce((sum, [name, value]) => (/iva/i.test(name) ? sum + value : sum), 0);
	const umbralBajoNum = Math.max(0, Number(umbralBajo) || 0);
	const umbralMedioNum = Math.max(umbralBajoNum + 1, Number(umbralMedio) || umbralBajoNum + 1);
	const semaforoParroquias = useMemo(() => {
		return mapa
			.map((p) => {
				const score = p.visitas + getIvaCount(p.actividades) * 2;
				const nivel = score < umbralBajoNum ? "BAJO" : score < umbralMedioNum ? "MEDIO" : "ALTO";
				return {
					parroquia: p.parroquia,
					label: PARROQUIA_LABELS[p.parroquia],
					score,
					nivel,
				};
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, 6);
	}, [mapa, umbralBajoNum, umbralMedioNum]);
	const selectedRows = useMemo(
		() => itemsFiltrados.filter((it) => selectedIds.includes(it.id)),
		[itemsFiltrados, selectedIds],
	);
	const selectedAbiertas = selectedRows.filter((it) => it.estado === "ABIERTA").length;
	const selectedCerradas = selectedRows.filter((it) => it.estado === "CERRADA").length;

	const auditoriaReciente = useMemo(() => {
		const base = parroquiaSeleccionada
			? items.filter((it) => it.parroquia === parroquiaSeleccionada)
			: items;
		return [...base]
			.sort((a, b) => (a.fecha > b.fecha ? -1 : 1))
			.slice(0, 8);
	}, [items, parroquiaSeleccionada]);

	const buildNotasOperacion = () => {
		const bloques = [
			`Tipo de jornada: ${tipoJornadaForm}`,
			`Horario: ${horaInicioForm} - ${horaFinForm}`,
			`Meta de visitas: ${metaVisitasForm || "No definida"}`,
			`Canal de convocatoria: ${canalConvocatoriaForm}`,
			`Objetivo: ${objetivoForm.trim() || "No especificado"}`,
			`Responsable operativo: ${responsableForm.trim() || "No especificado"}`,
			`Telefono de contacto: ${telefonoResponsableForm.trim() || "No especificado"}`,
			`Apoyo institucional: ${apoyoInstitucionalForm.trim() || "No especificado"}`,
			`Observaciones operativas: ${observacionesOperativas.trim() || "No aplica"}`,
		];

		const notaLibre = notas.trim();
		if (notaLibre) {
			bloques.push(`Notas adicionales: ${notaLibre}`);
		}
		return bloques.join("\n");
	};
	const adminStats = misStats && misStats.scope !== "FISCAL" ? misStats : null;
	const chartParroquias = useMemo(() => {
		return mapa
			.map((p) => ({
				name: PARROQUIA_LABELS[p.parroquia],
				jornadas: p.jornadas,
				visitas: p.visitas,
				asistentes: p.asistentes,
				impacto_iva: p.visitas + getIvaCount(p.actividades) * 2,
			}))
			.sort((a, b) => b[heatMetric] - a[heatMetric])
			.slice(0, 8);
	}, [mapa, heatMetric]);

	const chartDesgloseActividades = useMemo(() => {
		const origen = parroquiaSeleccionada ? aggSeleccionada?.actividades ?? {} : totalActividadesPeriodo;
		return Object.entries(origen)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 6);
	}, [aggSeleccionada?.actividades, parroquiaSeleccionada, totalActividadesPeriodo]);

	const onImprimirResumen = () => {
		const win = window.open("", "_blank", "width=980,height=780");
		if (!win) return;
		const topSemaforo = semaforoParroquias
			.map((p) => `<tr><td>${p.label}</td><td>${p.nivel}</td><td>${p.score}</td></tr>`)
			.join("");
		const html = `
			<html>
				<head>
					<title>Reporte Ejecutivo - Divulgacion</title>
					<style>
						body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
						h1 { margin: 0 0 4px 0; }
						.muted { color: #475569; margin-bottom: 16px; }
						.grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; margin-bottom: 16px; }
						.card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; }
						.k { font-size: 12px; color: #334155; }
						.v { font-size: 26px; font-weight: 700; }
						table { width: 100%; border-collapse: collapse; margin-top: 10px; }
						th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 12px; }
					</style>
				</head>
				<body>
					<h1>Reporte Ejecutivo</h1>
					<div class="muted">Periodo ${desde || "—"} a ${hasta || "—"} · Generado ${new Date().toLocaleString()}</div>
					<div class="grid">
						<div class="card"><div class="k">Jornadas periodo</div><div class="v">${totalJornadasPeriodo}</div></div>
						<div class="card"><div class="k">Visitas periodo</div><div class="v">${totalVisitasPeriodo}</div></div>
						<div class="card"><div class="k">Cumplimiento meta</div><div class="v">${cumplimientoMetaPct}%</div></div>
					</div>
					<h3>Semaforo parroquial (top)</h3>
					<table>
						<thead><tr><th>Parroquia</th><th>Nivel</th><th>Score</th></tr></thead>
						<tbody>${topSemaforo}</tbody>
					</table>
				</body>
			</html>`;
		win.document.write(html);
		win.document.close();
		win.focus();
		win.print();
	};

	return (
		<div className="space-y-6 w-full max-w-full overflow-x-hidden divulgacion-module">
			<PageHeader
				title="Divulgación y Presencia Fiscal"
				description="Jornadas por parroquia. Coordinador agrega asistentes; Fiscal registra contribuyentes visitados; Admin abre/cierra."
				action={
					canCreate ? (
						<button
							onClick={() => setShowForm((v) => !v)}
							className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md transition-all"
						>
							{showForm ? "Cancelar" : "Nueva jornada"}
						</button>
					) : null
				}
			/>
			<style>{`
				.divulgacion-module [data-slot="card-title"] { color: #f1f5f9; font-size: 1rem; }
				.divulgacion-module [data-slot="card-description"] { color: #cbd5e1; }
				.divulgacion-module input,
				.divulgacion-module select,
				.divulgacion-module textarea {
					color: #f1f5f9;
				}
				.divulgacion-module input::placeholder,
				.divulgacion-module textarea::placeholder { color: #64748b; }
				.divulgacion-module label { color: #cbd5e1; }
				.divulgacion-module .field-label { color: #94a3b8; }
				.divulgacion-module .card-anim {
					animation: dvFadeUp 320ms ease-out both;
				}
				@keyframes dvFadeUp {
					from { opacity: 0; transform: translateY(8px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>

			{adminStats && (
				<>
					<div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
						<KpiCard label="Jornadas hoy" value={adminStats.jornadasHoy} />
						<KpiCard label="Abiertas hoy" value={adminStats.abiertasHoy} accent="emerald" />
						<KpiCard label="Cerradas hoy" value={adminStats.cerradasHoy} accent="rose" />
						<KpiCard label="Visitas hoy" value={adminStats.visitasHoy} />
						<KpiCard label="Jornadas período" value={totalJornadasPeriodo} />
						<KpiCard label="Visitas período" value={totalVisitasPeriodo} accent="emerald" />
						<KpiCard label="Parroquias activas" value={parroquiasConActividad} />
						<KpiCard label="Tasa de cierre" value={tasaCierre} />
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
						<KpiCard label="Jornadas del mes" value={adminStats.jornadasMes} />
						<KpiCard label="Visitas del mes" value={adminStats.visitasMes} accent="emerald" />
						<KpiCard
							label="Abiertas en total"
							value={adminStats.jornadasAbiertasTotal}
							accent="emerald"
						/>
						<KpiCard label="Promedio visitas/jornada" value={promedioVisitasPorJornada} />
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
						<KpiCard label="Meta de visitas período" value={metaVisitasPeriodoNum} />
						<KpiCard label="Cumplimiento meta" value={`${cumplimientoMetaPct}%`} accent="emerald" />
						<KpiCard label="Jornadas sin visitas" value={jornadasSinVisitas} accent="rose" />
						<KpiCard label="Abiertas sin asistentes" value={jornadasAbiertasSinAsistentes} accent="rose" />
					</div>
				</>
			)}

			<Card className="bg-slate-900/40 border-slate-800 rounded-2xl">
				<CardHeader>
					<CardTitle>Alertas operativas</CardTitle>
					<CardDescription>Te ayudan a priorizar supervisión y cierre del período.</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
					<AlertItem
						label="Jornadas abiertas sin asistentes"
						value={jornadasAbiertasSinAsistentes}
						tone={jornadasAbiertasSinAsistentes > 0 ? "warning" : "ok"}
					/>
					<AlertItem
						label="Jornadas sin visitas registradas"
						value={jornadasSinVisitas}
						tone={jornadasSinVisitas > 0 ? "warning" : "ok"}
					/>
					<AlertItem
						label="Parroquias sin actividad"
						value={parroquiasSinActividad}
						tone={parroquiasSinActividad > 0 ? "warning" : "ok"}
					/>
				</CardContent>
			</Card>

			{/* Panel rápido para asignar equipo a una jornada (solo Admin) */}
			{canManageEquipo && (
				<EquipoQuickAdd role={role} onChanged={() => cargar()} />
			)}

			{showForm && canCreate && (
				<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
					<CardHeader>
						<CardTitle>Nueva jornada de divulgación</CardTitle>
						<CardDescription>
							Carga operativa completa para ejecucion, seguimiento comercial y control de presencia fiscal.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-5 max-w-4xl" onSubmit={onCreate}>
							<div className="rounded-xl border border-slate-800 p-4 space-y-4 bg-slate-950/40">
								<div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
									Datos base de la jornada
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<div>
										<label className="block text-sm font-medium mb-1">Fecha</label>
										<input
											type="date"
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											value={fechaForm}
											onChange={(e) => setFechaForm(e.target.value)}
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Hora inicio</label>
										<input
											type="time"
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											value={horaInicioForm}
											onChange={(e) => setHoraInicioForm(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Hora fin</label>
										<input
											type="time"
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											value={horaFinForm}
											onChange={(e) => setHoraFinForm(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Tipo de jornada</label>
										<select
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											value={tipoJornadaForm}
											onChange={(e) => setTipoJornadaForm(e.target.value)}
										>
											<option value="DIVULGACION">Divulgacion</option>
											<option value="PRESENCIA_FISCAL">Presencia fiscal</option>
											<option value="MIXTA">Mixta</option>
											<option value="INSPECCION">Inspeccion comercial</option>
										</select>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium mb-1">Parroquia</label>
										<select
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											value={parroquiaForm}
											onChange={(e) => setParroquiaForm(e.target.value as ParroquiaCaracas)}
										>
											{PARROQUIAS_CARACAS.map((p) => (
												<option key={p} value={p}>
													{PARROQUIA_LABELS[p]}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Sector / comunidad</label>
										<input
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											placeholder="Ej: La Pastora norte, Calle Real"
											value={sectorForm}
											onChange={(e) => setSectorForm(e.target.value)}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium mb-1">Punto de referencia</label>
										<input
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											placeholder="Av. Sucre, frente a..."
											value={ubicacionReferencia}
											onChange={(e) => setUbicacionReferencia(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Direccion detallada</label>
										<input
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											placeholder="Cruce, local, manzana o edificio"
											value={direccionDetalladaForm}
											onChange={(e) => setDireccionDetalladaForm(e.target.value)}
										/>
									</div>
								</div>
							</div>
							<div className="rounded-xl border border-slate-800 p-4 space-y-4 bg-slate-950/40">
								<div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
									Plan comercial y operativo
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-medium mb-1">Meta de visitas</label>
										<input
											type="number"
											min={1}
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											value={metaVisitasForm}
											onChange={(e) => setMetaVisitasForm(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Canal de convocatoria</label>
										<select
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											value={canalConvocatoriaForm}
											onChange={(e) => setCanalConvocatoriaForm(e.target.value)}
										>
											<option value="PUERTA_A_PUERTA">Puerta a puerta</option>
											<option value="PUNTO_FIJO">Punto fijo</option>
											<option value="VOLANTEO">Volanteo</option>
											<option value="REDES">Redes comunitarias</option>
											<option value="MIXTO">Mixto</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Apoyo institucional</label>
										<input
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											placeholder="Consejo comunal, Sundde, etc."
											value={apoyoInstitucionalForm}
											onChange={(e) => setApoyoInstitucionalForm(e.target.value)}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium mb-1">Responsable operativo</label>
										<input
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											placeholder="Nombre y cargo"
											value={responsableForm}
											onChange={(e) => setResponsableForm(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">Telefono de contacto</label>
										<input
											className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
											placeholder="0412-0000000"
											value={telefonoResponsableForm}
											onChange={(e) => setTelefonoResponsableForm(e.target.value)}
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Objetivo de la jornada</label>
									<textarea
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
										rows={2}
										value={objetivoForm}
										onChange={(e) => setObjetivoForm(e.target.value)}
										placeholder="Que se busca lograr en la parroquia seleccionada"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Observaciones operativas</label>
									<textarea
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
										rows={2}
										value={observacionesOperativas}
										onChange={(e) => setObservacionesOperativas(e.target.value)}
										placeholder="Riesgos, requerimientos logisticos, recomendaciones"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Notas adicionales (opcional)</label>
									<textarea
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
										rows={3}
										value={notas}
										onChange={(e) => setNotas(e.target.value)}
										placeholder="Cualquier detalle extra para el equipo"
									/>
									<div className="text-xs text-slate-400 mt-1">{notas.length} caracteres</div>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => {
										setFechaForm(todayISO());
										setHoraInicioForm("08:00");
										setHoraFinForm("12:00");
									}}
									className="px-3 py-2 rounded border border-slate-700 text-slate-200 text-sm"
								>
									Usar horario sugerido
								</button>
								<button
									type="button"
									onClick={() => {
										setMetaVisitasForm("40");
										setCanalConvocatoriaForm("MIXTO");
										setTipoJornadaForm("MIXTA");
									}}
									className="px-3 py-2 rounded border border-slate-700 text-slate-200 text-sm"
								>
									Cargar preset intensivo
								</button>
							</div>
							<div className="text-xs text-slate-400">
								La informacion operativa se guarda dentro de las notas de la jornada para consulta en el detalle.
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Vista previa de ubicacion</label>
									<input
										readOnly
										className="w-full border rounded px-3 py-2 bg-slate-950/70 border-slate-700 text-slate-300"
										value={[ubicacionReferencia, sectorForm, direccionDetalladaForm].filter(Boolean).join(" | ")}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Vista previa de notas operativas</label>
									<textarea
										readOnly
										rows={3}
										className="w-full border rounded px-3 py-2 bg-slate-950/70 border-slate-700 text-slate-300"
										value={buildNotasOperacion()}
									/>
								</div>
							</div>
							<button
								type="submit"
								disabled={busy === "create"}
								className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
							>
								{busy === "create" ? "Creando..." : "Crear jornada"}
							</button>
						</form>
					</CardContent>
				</Card>
			)}

			<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
					<CardDescription>Aplican a la lista de jornadas y al mapa.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="grid grid-cols-1 md:grid-cols-6 gap-3" onSubmit={aplicarFiltros}>
						<div>
							<label className="block text-xs text-slate-400 mb-1">Desde</label>
							<input
								type="date"
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
								value={desde}
								onChange={(e) => setDesde(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-xs text-slate-400 mb-1">Hasta</label>
							<input
								type="date"
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
								value={hasta}
								onChange={(e) => setHasta(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-xs text-slate-400 mb-1">Parroquia</label>
							<select
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
								value={filtroParroquia}
								onChange={(e) => setFiltroParroquia(e.target.value as ParroquiaCaracas | "")}
							>
								<option value="">Todas</option>
								{PARROQUIAS_CARACAS.map((p) => (
									<option key={p} value={p}>
										{PARROQUIA_LABELS[p]}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-xs text-slate-400 mb-1">Estado</label>
							<select
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
								value={filtroEstado}
								onChange={(e) => setFiltroEstado(e.target.value as EstadoDivulgacion | "")}
							>
								<option value="">Todos</option>
								<option value="ABIERTA">Abierta</option>
								<option value="CERRADA">Cerrada</option>
							</select>
						</div>
						<div className="md:col-span-2">
							<label className="block text-xs text-slate-400 mb-1">Buscar (RIF, contribuyente, asistente, ubicación)</label>
							<div className="flex gap-2">
								<input
									className="flex-1 border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
									placeholder="J123456789, panadería..."
									value={q}
									onChange={(e) => setQ(e.target.value)}
								/>
								<button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white text-sm">
									Aplicar
								</button>
							</div>
						</div>
					</form>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={guardarFiltros}
							className="px-3 py-1.5 rounded bg-slate-800 text-slate-100 text-xs border border-slate-700"
						>
							Guardar filtros
						</button>
						<button
							type="button"
							onClick={limpiarFiltrosGuardados}
							className="px-3 py-1.5 rounded bg-slate-900 text-slate-300 text-xs border border-slate-700"
						>
							Limpiar filtros y ajustes
						</button>
						<div className="ml-auto flex items-center gap-2">
							<label className="text-xs text-slate-400">Meta de visitas (período)</label>
							<input
								type="number"
								min={0}
								value={metaVisitasPeriodo}
								onChange={(e) => setMetaVisitasPeriodo(e.target.value)}
								className="w-24 border rounded px-2 py-1 bg-slate-950 border-slate-700 text-xs"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{canSeeMap && (
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
					<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
						<CardHeader>
							<CardTitle>Mapa parroquial interactivo</CardTitle>
							<CardDescription>
								Alterna entre mapa normal y mapa de calor para detectar concentracion de actividad.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="mb-4 flex flex-wrap items-center gap-2">
								<button
									type="button"
									onClick={() => setMapView("normal")}
									className={`px-3 py-1.5 rounded-md text-xs border transition ${
										mapView === "normal"
											? "bg-blue-600 border-blue-500 text-white"
											: "bg-slate-900 border-slate-700 text-slate-300"
									}`}
								>
									Mapa normal
								</button>
								<button
									type="button"
									onClick={() => setMapView("calor")}
									className={`px-3 py-1.5 rounded-md text-xs border transition ${
										mapView === "calor"
											? "bg-rose-600 border-rose-500 text-white"
											: "bg-slate-900 border-slate-700 text-slate-300"
									}`}
								>
									Mapa de calor
								</button>
								{mapView === "calor" && (
									<div className="ml-auto flex items-center gap-2">
										<label className="text-xs text-slate-400">Metrica</label>
										<select
											className="border rounded px-2 py-1.5 bg-slate-950 border-slate-700 text-xs"
											value={heatMetric}
											onChange={(e) => setHeatMetric(e.target.value as "jornadas" | "visitas" | "asistentes" | "impacto_iva")}
										>
											<option value="impacto_iva">Impacto IVA + contribuyentes</option>
											<option value="visitas">Visitas</option>
											<option value="jornadas">Jornadas</option>
											<option value="asistentes">Asistentes</option>
										</select>
									</div>
								)}
							</div>
							<ParroquiaMapaInteractivo
								data={mapa}
								selected={parroquiaSeleccionada}
								onSelect={setParroquiaSeleccionada}
								mode={mapView === "calor" ? "heat" : "normal"}
								heatMetric={heatMetric}
							/>
							{parroquiaSeleccionada && (
								<button
									onClick={() => setParroquiaSeleccionada(null)}
									className="mt-3 text-xs text-amber-300 underline"
								>
									Limpiar selección
								</button>
							)}
						</CardContent>
					</Card>

					<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
						<CardHeader>
							<CardTitle>
								{parroquiaSeleccionada
									? `Detalle: ${PARROQUIA_LABELS[parroquiaSeleccionada]}`
									: "Resumen del período"}
							</CardTitle>
							<CardDescription>
								{parroquiaSeleccionada
									? "Indicadores de la parroquia seleccionada."
									: `${desde || "—"} a ${hasta || "—"}`}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{parroquiaSeleccionada ? (
								<>
									<div className="grid grid-cols-2 gap-3">
										<MiniKpi label="Jornadas en general" value={totalJornadasPeriodo} />
										<MiniKpi label="Visitas en parroquia seleccionada" value={aggSeleccionada?.visitas ?? 0} />
									</div>
									<DesgloseComercial actividades={aggSeleccionada?.actividades ?? {}} />
								</>
							) : (
								<>
									<div className="grid grid-cols-2 gap-3">
										<MiniKpi label="Jornadas en general" value={totalJornadasPeriodo} />
										<MiniKpi label="Visitas del período" value={totalVisitasPeriodo} />
									</div>
									<DesgloseComercial actividades={totalActividadesPeriodo} title="Desglose comercial del período" />
								</>
							)}
							<div className="pt-2 border-t border-slate-800">
								<div className="mb-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
									<div className="flex flex-wrap items-center gap-2 mb-2">
										<div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
											Semáforo de actividad parroquial
										</div>
										<div className="ml-auto flex items-center gap-2 text-xs">
											<label className="text-slate-400">Bajo &lt;</label>
											<input
												type="number"
												min={0}
												value={umbralBajo}
												onChange={(e) => setUmbralBajo(e.target.value)}
												className="w-16 border rounded px-2 py-1 bg-slate-900 border-slate-700 text-slate-200"
											/>
											<label className="text-slate-400">Medio &lt;</label>
											<input
												type="number"
												min={0}
												value={umbralMedio}
												onChange={(e) => setUmbralMedio(e.target.value)}
												className="w-16 border rounded px-2 py-1 bg-slate-900 border-slate-700 text-slate-200"
											/>
										</div>
									</div>
									<div className="space-y-1.5">
										{semaforoParroquias.map((item) => (
											<div key={item.parroquia} className="flex items-center justify-between text-xs">
												<span className="text-slate-200">{item.label}</span>
												<span
													className={`px-2 py-0.5 rounded font-semibold ${
														item.nivel === "ALTO"
															? "bg-rose-900/50 text-rose-300"
															: item.nivel === "MEDIO"
																? "bg-amber-900/50 text-amber-300"
																: "bg-emerald-900/50 text-emerald-300"
													}`}
												>
													{item.nivel} · {item.score}
												</span>
											</div>
										))}
									</div>
								</div>
								<div className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-2">
									Graficos de metricas por zona
								</div>
								<div className="h-52">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={chartParroquias}>
											<CartesianGrid strokeDasharray="3 3" stroke="#334155" />
											<XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-15} height={45} textAnchor="end" />
											<YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
											<Tooltip
												contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }}
												labelStyle={{ color: "#e2e8f0" }}
											/>
											<Bar dataKey={heatMetric} radius={[6, 6, 0, 0]} fill="#38bdf8" />
										</BarChart>
									</ResponsiveContainer>
								</div>
								<div className="h-52 mt-3">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={chartDesgloseActividades}
												dataKey="value"
												nameKey="name"
												outerRadius={78}
												innerRadius={38}
											>
												{chartDesgloseActividades.map((entry, index) => (
													<Cell
														key={`${entry.name}-${index}`}
														fill={["#f59e0b", "#f97316", "#fb7185", "#22c55e", "#06b6d4", "#a78bfa"][index % 6]}
													/>
												))}
											</Pie>
											<Tooltip
												contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }}
												labelStyle={{ color: "#e2e8f0" }}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
								<div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
									<div className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-2">
										Bitácora reciente
									</div>
									<div className="space-y-2 max-h-44 overflow-auto pr-1">
										{auditoriaReciente.map((row) => (
											<div key={row.id} className="text-xs border-b border-slate-800 pb-2">
												<div className="text-slate-200">
													{PARROQUIA_LABELS[row.parroquia]} · {row.fecha?.slice(0, 10) ?? "—"}
												</div>
												<div className="text-slate-400">
													Estado: {row.estado} · Asistentes: {row._count?.asistentes ?? 0} · Visitas:{" "}
													{row._count?.visitas ?? 0}
												</div>
												<div className="text-slate-500">
													Creado por: {row.creadoPor?.name ?? "—"}
												</div>
											</div>
										))}
										{auditoriaReciente.length === 0 && (
											<div className="text-xs text-slate-500">Sin eventos recientes en el período.</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
				<CardHeader className="flex flex-row items-start justify-between gap-3">
					<div>
						<CardTitle>
							{parroquiaSeleccionada
								? `Jornadas en ${PARROQUIA_LABELS[parroquiaSeleccionada]}`
								: "Jornadas"}
						</CardTitle>
						<CardDescription>
							{loading
								? "Cargando..."
								: `Mostrando ${itemsFiltrados.length} (página ${page} · ${total} en el período)`}
						</CardDescription>
					</div>
					<button
						onClick={onExportExcel}
						disabled={downloading || loading}
						className="px-3 py-2 rounded bg-emerald-700 text-white text-sm disabled:opacity-60 whitespace-nowrap"
					>
						{downloading ? "Generando..." : "Exportar Excel"}
					</button>
					<button
						onClick={onImprimirResumen}
						className="px-3 py-2 rounded bg-slate-700 text-white text-sm whitespace-nowrap"
					>
						Imprimir resumen
					</button>
				</CardHeader>
				<CardContent>
					{error && <p className="text-red-400 text-sm mb-3">{error}</p>}
					{actionInfo && <p className="text-emerald-300 text-sm mb-3">{actionInfo}</p>}
					{selectedIds.length > 0 && (
						<div className="mb-3 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
							<span className="text-slate-200 font-medium">{selectedIds.length} seleccionadas</span>
							<span className="text-slate-400">Abiertas: {selectedAbiertas}</span>
							<span className="text-slate-400">Cerradas: {selectedCerradas}</span>
							<button
								onClick={onCerrarMasivo}
								disabled={selectedAbiertas === 0 || busy === "bulk-close"}
								className="ml-auto px-2 py-1 rounded bg-rose-700 text-white disabled:opacity-50"
							>
								{busy === "bulk-close" ? "Cerrando..." : "Cerrar masivo"}
							</button>
							<button
								onClick={onReabrirMasivo}
								disabled={selectedCerradas === 0 || busy === "bulk-reopen"}
								className="px-2 py-1 rounded bg-emerald-700 text-white disabled:opacity-50"
							>
								{busy === "bulk-reopen" ? "Reabriendo..." : "Reabrir masivo"}
							</button>
							<button
								onClick={() => setSelectedIds([])}
								className="px-2 py-1 rounded bg-slate-700 text-white"
							>
								Limpiar
							</button>
						</div>
					)}
					{!loading && (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										<input
											type="checkbox"
											checked={itemsFiltrados.length > 0 && selectedIds.length === itemsFiltrados.length}
											onChange={(e) =>
												setSelectedIds(e.target.checked ? itemsFiltrados.map((it) => it.id) : [])
											}
										/>
									</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Fecha</TableHead>
									<TableHead>Parroquia</TableHead>
									<TableHead>Ubicación</TableHead>
									<TableHead>Asist./Visitas</TableHead>
									<TableHead>Grupo</TableHead>
									<TableHead>Creado por</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{itemsFiltrados.map((it) => (
									<TableRow key={it.id}>
										<TableCell>
											<input
												type="checkbox"
												checked={selectedIds.includes(it.id)}
												onChange={(e) =>
													setSelectedIds((prev) =>
														e.target.checked ? [...prev, it.id] : prev.filter((id) => id !== it.id),
													)
												}
											/>
										</TableCell>
										<TableCell>
											<span
												className={`px-2 py-1 rounded text-xs ${
													it.estado === "ABIERTA"
														? "bg-emerald-900/40 text-emerald-300"
														: "bg-rose-900/40 text-rose-300"
												}`}
											>
												{it.estado}
											</span>
										</TableCell>
										<TableCell>{it.fecha?.slice(0, 10) ?? "—"}</TableCell>
										<TableCell>{PARROQUIA_LABELS[it.parroquia]}</TableCell>
										<TableCell className="max-w-[14rem] truncate">{it.ubicacionReferencia ?? "—"}</TableCell>
										<TableCell>
											{it._count?.asistentes ?? 0} / {it._count?.visitas ?? 0}
										</TableCell>
										<TableCell>{it.fiscalGroup?.name ?? "—"}</TableCell>
										<TableCell>{it.creadoPor?.name ?? "—"}</TableCell>
										<TableCell className="space-x-2 whitespace-nowrap">
											<button
												onClick={() => navigate(`/divulgacion-presencia-fiscal/${it.id}`)}
												className="px-2 py-1 rounded bg-slate-700 text-white text-xs"
											>
												Detalle
											</button>
											{canCreate && (
												<button
													onClick={() => onDuplicar(it.id)}
													disabled={busy === `dup-${it.id}`}
													className="px-2 py-1 rounded bg-violet-700 text-white text-xs disabled:opacity-60"
												>
													{busy === `dup-${it.id}` ? "..." : "Duplicar"}
												</button>
											)}
											{canCloseReopen && it.estado === "ABIERTA" && (
												<button
													onClick={() => onCerrar(it.id)}
													disabled={busy === it.id}
													className="px-2 py-1 rounded bg-rose-600 text-white text-xs disabled:opacity-60"
												>
													{busy === it.id ? "..." : "Cerrar"}
												</button>
											)}
											{canCloseReopen && it.estado === "CERRADA" && (
												<button
													onClick={() => onReabrir(it.id)}
													disabled={busy === it.id}
													className="px-2 py-1 rounded bg-emerald-700 text-white text-xs disabled:opacity-60"
												>
													{busy === it.id ? "..." : "Reabrir"}
												</button>
											)}
										</TableCell>
									</TableRow>
								))}
								{itemsFiltrados.length === 0 && (
									<TableRow>
										<TableCell colSpan={9} className="text-center text-slate-500 py-6">
											No hay jornadas con los filtros actuales.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					)}

					{!loading && total > pageSize && !parroquiaSeleccionada && (
						<div className="flex items-center justify-between mt-3 text-sm text-slate-300">
							<span>
								Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
							</span>
							<div className="flex gap-2">
								<button
									className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50"
									disabled={page <= 1 || loading}
									onClick={() => {
										const np = Math.max(1, page - 1);
										setPage(np);
										cargar(np);
									}}
								>
									Anterior
								</button>
								<button
									className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50"
									disabled={page * pageSize >= total || loading}
									onClick={() => {
										const np = page + 1;
										setPage(np);
										cargar(np);
									}}
								>
									Siguiente
								</button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function KpiCard({
	label,
	value,
	accent,
}: {
	label: string;
	value: number | string;
	accent?: "emerald" | "rose";
}) {
	const ring =
		accent === "emerald"
			? "ring-emerald-500/30 from-emerald-500/10"
			: accent === "rose"
				? "ring-rose-500/30 from-rose-500/10"
				: "ring-blue-500/20 from-blue-500/10";
	const valueCls =
		accent === "emerald" ? "text-emerald-300" : accent === "rose" ? "text-rose-300" : "text-slate-100";
	return (
		<div
			className={`rounded-2xl border border-slate-700/70 bg-gradient-to-br ${ring} to-slate-900/60 p-4 ring-1 transition-all hover:ring-2 hover:-translate-y-0.5 hover:shadow-lg card-anim`}
		>
			<div className="text-[11px] uppercase tracking-wider text-slate-300 font-medium">{label}</div>
			<div className={`text-3xl font-bold ${valueCls} tabular-nums mt-1`}>{value}</div>
		</div>
	);
}

function MiniKpi({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 transition-colors hover:bg-slate-900/60">
			<div className="text-[11px] uppercase tracking-wider text-slate-300 font-medium">{label}</div>
			<div className="text-xl font-bold text-slate-50 tabular-nums">{value}</div>
		</div>
	);
}

function AlertItem({
	label,
	value,
	tone,
}: {
	label: string;
	value: number;
	tone: "ok" | "warning";
}) {
	return (
		<div
			className={`rounded-lg border p-3 ${
				tone === "warning"
					? "border-amber-700/50 bg-amber-950/20"
					: "border-emerald-700/50 bg-emerald-950/20"
			}`}
		>
			<div className="text-slate-200 text-xs">{label}</div>
			<div
				className={`text-xl font-bold mt-1 ${
					tone === "warning" ? "text-amber-300" : "text-emerald-300"
				}`}
			>
				{value}
			</div>
		</div>
	);
}

