import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/UI/v2";
import { Button } from "@/components/UI/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/UI/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/UI/select";
import { Label } from "@/components/UI/label";
import { Input } from "@/components/UI/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/UI/dialog";
import { ModalFooter } from "@/components/UI/v2";
import { getUsersByRole } from "@/components/utils/api/user-functions";
import { useAuth } from "@/hooks/use-auth";
import toast from "react-hot-toast";
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
	getMapaFinanciero,
	type EstadoDivulgacion,
	type MapaParroquiaAgregado,
	type MisStats,
	type ParroquiaCaracas,
	type ParishFinancialStats,
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
import { ArrowLeft } from "lucide-react";

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
	const role = user?.role ?? "";
	const canCreate = role === "ADMIN";
	const canCloseReopen = role === "ADMIN";
	const canSeeMap = role === "ADMIN";
	const canManageEquipo = role === "ADMIN";

	const [items, setItems] = useState<DivulgacionRow[]>([]);
	const [misStats, setMisStats] = useState<MisStats | null>(null);
	const [mapa, setMapa] = useState<MapaParroquiaAgregado[]>([]);
	const [mapaFinanciero, setMapaFinanciero] = useState<ParishFinancialStats[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionInfo, setActionInfo] = useState("");
	const [busy, setBusy] = useState<string | null>(null);

	const [dialogOpen, setDialogOpen] = useState(false);
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
	const [coordinadores, setCoordinadores] = useState<Array<{ id: string; name: string }>>([]);

	const [desde, setDesde] = useState<string>(firstOfMonthISO);
	const [hasta, setHasta] = useState<string>(todayISO);
	const [filtroParroquia, setFiltroParroquia] = useState<ParroquiaCaracas | "">("");
	const [filtroEstado, setFiltroEstado] = useState<EstadoDivulgacion | "">("");
	const [q, setQ] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 20;
	const [total, setTotal] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get("tab") || "dashboard";
	const [downloading, setDownloading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [readyToLoad, setReadyToLoad] = useState(false);
	const [metaVisitasPeriodo, setMetaVisitasPeriodo] = useState("500");
	const [umbralBajo, setUmbralBajo] = useState("40");
	const [umbralMedio, setUmbralMedio] = useState("120");

	const [parroquiaSeleccionada, setParroquiaSeleccionada] = useState<ParroquiaCaracas | null>(null);
	const [mapView, setMapView] = useState<"normal" | "calor">("normal");
	const [heatMetric, setHeatMetric] = useState<"jornadas" | "visitas" | "asistentes" | "impacto_iva" | "impacto_iva_real" | "recaudacion_real">("impacto_iva");

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
			const [lista, stats, m, mf] = await Promise.all([
				listDivulgaciones(params),
				getMisStats(),
				canSeeMap
					? getMapaAgregado({ desde: desde || undefined, hasta: hasta || undefined })
					: Promise.resolve(null),
				canSeeMap
					? getMapaFinanciero({ desde: desde || undefined, hasta: hasta || undefined })
					: Promise.resolve(null),
			]);
			setItems(Array.isArray(lista?.items) ? lista.items : []);
			setTotal(typeof lista?.total === "number" ? lista.total : 0);
			setMisStats(stats ?? null);
			setMapa(Array.isArray(m?.parroquias) ? m.parroquias : []);
			setMapaFinanciero(Array.isArray(mf?.parroquias) ? mf.parroquias : []);
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
		getUsersByRole("COORDINATOR").then((users) => {
			setCoordinadores(Array.isArray(users) ? users : []);
		});
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

	const onCreate = async (e?: React.FormEvent) => {
		e?.preventDefault();
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
			toast.success("Jornada creada exitosamente");
			setDialogOpen(false);
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
			toast.error(e?.response?.data?.error ?? e?.message ?? "No se pudo crear la jornada.");
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
		const financialByParish = new Map<string, ParishFinancialStats>();
		for (const fp of mapaFinanciero) {
			financialByParish.set(fp.parishId, fp);
		}
		return mapa
			.map((p) => {
				const fin = financialByParish.get(p.parroquia);
				return {
					name: PARROQUIA_LABELS[p.parroquia],
					jornadas: p.jornadas,
					visitas: p.visitas,
					asistentes: p.asistentes,
					impacto_iva: p.visitas + getIvaCount(p.actividades) * 2,
					impacto_iva_real: fin?.totalIvaPaid ?? 0,
					recaudacion_real: fin?.totalPaymentAmount ?? 0,
				};
			})
			.sort((a, b) => b[heatMetric] - a[heatMetric])
			.slice(0, 8);
	}, [mapa, heatMetric, mapaFinanciero]);

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
				// action={<Button variant="outline" onClick={() => navigate('/admin')} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
				// 	<ArrowLeft className="h-4 w-4" />
				// 	Volver
				// </Button>}
				action={
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={() => navigate('/admin')} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
							<ArrowLeft className="h-4 w-4" />
							Volver
						</Button>
						{canCreate && (
							<Button onClick={() => setDialogOpen(true)}>
								Nueva jornada
							</Button>
						)}
						
						<Button
							variant="secondary"
							onClick={onExportExcel}
							disabled={downloading || loading}
						>
							{downloading ? "Generando..." : "Exportar Excel"}
						</Button>
						<Button
							variant="outline"
							onClick={onImprimirResumen}
						>
							Imprimir resumen
						</Button>
					</div>
				}
			/>

			<Tabs
				value={tabParam}
				onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
				className="w-full"
			>
				<TabsList className="bg-slate-900/60 border border-slate-800/50 p-1 rounded-xl gap-1 h-auto w-full sm:w-auto">
					<TabsTrigger value="dashboard" className="px-4 py-2 data-[state=active]:shadow-sm transition-all rounded-lg">
						Dashboard
					</TabsTrigger>
					<TabsTrigger value="jornadas" className="px-4 py-2 data-[state=active]:shadow-sm transition-all rounded-lg">
						Jornadas
						{items.length > 0 && (
							<span className="ml-2 px-1.5 py-0.5 rounded-full bg-muted text-[10px] tabular-nums">
								{total}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="mapa" className="px-4 py-2 data-[state=active]:shadow-sm transition-all rounded-lg">
						Georreferencia
					</TabsTrigger>
				</TabsList>

				<TabsContent value="dashboard" className="mt-6 space-y-6">
					{error && (
						<div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
							{error}
						</div>
					)}
					{actionInfo && (
						<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
							{actionInfo}
						</div>
					)}

					{adminStats && (
						<>
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
								<KpiCard label="Jornadas período" value={totalJornadasPeriodo} />
								<KpiCard label="Visitas período" value={totalVisitasPeriodo} accent="emerald" />
								<KpiCard label="Tasa de cierre" value={tasaCierre} />
								<KpiCard label="Parroquias activas" value={parroquiasConActividad} />
								<KpiCard
									label="Cumplimiento meta"
									value={`${cumplimientoMetaPct}%`}
									accent={cumplimientoMetaPct >= 80 ? "emerald" : cumplimientoMetaPct >= 50 ? "amber" : "rose"}
								/>
								<KpiCard label="Promedio visitas/jornada" value={promedioVisitasPorJornada} />
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								<Card className="rounded-2xl">
									<CardHeader className="pb-3">
										<CardTitle>Top parroquias por métrica</CardTitle>
										<CardDescription>
											{heatMetric === "visitas" ? "Visitas" : heatMetric === "jornadas" ? "Jornadas" : heatMetric === "asistentes" ? "Asistentes" : "Impacto IVA"}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="h-64">
											<ResponsiveContainer width="100%" height="100%">
												<BarChart data={chartParroquias}>
													<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
													<XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} interval={0} angle={-20} height={50} textAnchor="end" />
													<YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
													<Tooltip
														contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", borderRadius: "8px" }}
														labelStyle={{ color: "#f1f5f9" }}
													/>
													<Bar dataKey={heatMetric} radius={[6, 6, 0, 0]} fill="#38bdf8" />
												</BarChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>

								<Card className="rounded-2xl">
									<CardHeader className="pb-3">
										<CardTitle>Desglose de actividades</CardTitle>
										<CardDescription>
											{parroquiaSeleccionada
												? `Solo ${PARROQUIA_LABELS[parroquiaSeleccionada]}`
												: "Todas las parroquias"}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="h-64">
											<ResponsiveContainer width="100%" height="100%">
												<PieChart>
													<Pie
														data={chartDesgloseActividades}
														dataKey="value"
														nameKey="name"
														outerRadius={80}
														innerRadius={40}
													>
														{chartDesgloseActividades.map((entry, index) => (
															<Cell
																key={`${entry.name}-${index}`}
																fill={["#f59e0b", "#f97316", "#fb7185", "#22c55e", "#06b6d4", "#a78bfa"][index % 6]}
															/>
														))}
													</Pie>
													<Tooltip
														contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
														labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
														itemStyle={{ color: "#e2e8f0" }}
													/>
												</PieChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>
							</div>

							<Card className="rounded-2xl">
								<CardHeader className="pb-3">
									<CardTitle>Semáforo de actividad parroquial</CardTitle>
									<CardDescription>Top 6 parroquias por score de actividad. Ajusta umbrales abajo.</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
										<span className="text-muted-foreground">Umbrales:</span>
										<label className="flex items-center gap-1 text-muted-foreground">
											Bajo &lt;
											<input
												type="number"
												min={0}
												value={umbralBajo}
												onChange={(e) => setUmbralBajo(e.target.value)}
												className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
											/>
										</label>
										<label className="flex items-center gap-1 text-muted-foreground">
											Medio &lt;
											<input
												type="number"
												min={0}
												value={umbralMedio}
												onChange={(e) => setUmbralMedio(e.target.value)}
												className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
											/>
										</label>
										<span className="text-muted-foreground ml-2">Meta período: {metaVisitasPeriodo} visitas</span>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
										{semaforoParroquias.map((item) => (
											<div
												key={item.parroquia}
												className={`rounded-lg border px-3 py-2 text-sm flex items-center justify-between ${
													item.nivel === "ALTO"
														? "border-rose-500/30 bg-rose-500/5"
														: item.nivel === "MEDIO"
															? "border-amber-500/30 bg-amber-500/5"
															: "border-emerald-500/30 bg-emerald-500/5"
												}`}
											>
												<span className="font-medium">{item.label}</span>
												<span
													className={`px-2 py-0.5 rounded text-xs font-semibold tabular-nums ${
														item.nivel === "ALTO"
															? "bg-rose-500/10 text-rose-400"
															: item.nivel === "MEDIO"
																? "bg-amber-500/10 text-amber-400"
																: "bg-emerald-500/10 text-emerald-400"
													}`}
												>
													{item.score}
												</span>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</>
					)}

					{canManageEquipo && (
						<details className="group [&>summary]:cursor-pointer">
							<summary className="text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors mb-2 list-none flex items-center gap-2">
								<span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-xs group-open:rotate-90 transition-transform">
									▶
								</span>
								Asignar equipo a jornada activa
							</summary>
							<div className="mt-3">
								<EquipoQuickAdd role={role} onChanged={() => cargar()} />
							</div>
						</details>
					)}

					{adminStats && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
							<KpiCard label="Meta de visitas período" value={metaVisitasPeriodoNum} />
							<KpiCard label="Jornadas sin visitas" value={jornadasSinVisitas} accent="rose" />
							<KpiCard label="Abiertas sin asistentes" value={jornadasAbiertasSinAsistentes} accent="rose" />
							<KpiCard label="Jornadas hoy" value={adminStats?.jornadasHoy ?? 0} />
						</div>
					)}
				</TabsContent>

				<TabsContent value="jornadas" className="mt-6 space-y-4">
					{error && (
						<div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
							{error}
						</div>
					)}
					{actionInfo && (
						<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
							{actionInfo}
						</div>
					)}

					<Card className="rounded-2xl">
						<CardHeader className="pb-3">
							<CardTitle>Filtros</CardTitle>
							<CardDescription>
								{loading
									? "Cargando..."
									: `${itemsFiltrados.length} mostrados · Página ${page} de ${Math.max(1, Math.ceil(total / pageSize))}`}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="flex flex-wrap items-end gap-2" onSubmit={aplicarFiltros}>
								<div>
									<label className="block text-xs text-muted-foreground mb-1">Desde</label>
									<input
										type="date"
										className="w-36 rounded-md border border-input bg-background px-2 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										value={desde}
										onChange={(e) => setDesde(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-xs text-muted-foreground mb-1">Hasta</label>
									<input
										type="date"
										className="w-36 rounded-md border border-input bg-background px-2 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										value={hasta}
										onChange={(e) => setHasta(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-xs text-muted-foreground mb-1">Parroquia</label>
									<Select value={filtroParroquia || "ALL"} onValueChange={(v) => setFiltroParroquia(v === "ALL" ? "" : v as ParroquiaCaracas)}>
										<SelectTrigger className="min-w-[8rem]">
											<SelectValue placeholder="Todas" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ALL">Todas</SelectItem>
											{PARROQUIAS_CARACAS.map((p) => (
												<SelectItem key={p} value={p}>
													{PARROQUIA_LABELS[p]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="block text-xs text-muted-foreground mb-1">Estado</label>
									<Select value={filtroEstado || "ALL"} onValueChange={(v) => setFiltroEstado(v === "ALL" ? "" : v as EstadoDivulgacion)}>
										<SelectTrigger>
											<SelectValue placeholder="Todos" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ALL">Todos</SelectItem>
											<SelectItem value="ABIERTA">Abierta</SelectItem>
											<SelectItem value="CERRADA">Cerrada</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex-1 min-w-[10rem]">
									<label className="block text-xs text-muted-foreground mb-1">Buscar</label>
									<input
										className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										placeholder="RIF, nombre, ubicación..."
										value={q}
										onChange={(e) => setQ(e.target.value)}
									/>
								</div>
								<Button type="submit" size="sm">
									Aplicar
								</Button>
								<Button type="button" variant="outline" size="sm" onClick={guardarFiltros}>
									Guardar
								</Button>
								<Button type="button" variant="ghost" size="sm" onClick={limpiarFiltrosGuardados}>
									Limpiar
								</Button>
							</form>
							<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground">Meta de visitas:</span>
									<input
										type="number"
										min={0}
										value={metaVisitasPeriodo}
										onChange={(e) => setMetaVisitasPeriodo(e.target.value)}
										className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
									/>
								</div>
								<div className="flex items-center gap-1.5 ml-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											setDesde(todayISO());
											setHasta(todayISO());
											aplicarFiltros();
										}}
									>
										Hoy
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											setDesde(firstOfMonthISO());
											setHasta(todayISO());
											aplicarFiltros();
										}}
									>
										Este mes
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{selectedIds.length > 0 && (
						<div className="rounded-xl border bg-card px-4 py-3 flex flex-wrap items-center gap-2 text-sm">
							<span className="font-medium">{selectedIds.length} seleccionadas</span>
							<span className="text-muted-foreground">Abiertas: {selectedAbiertas}</span>
							<span className="text-muted-foreground">Cerradas: {selectedCerradas}</span>
							<div className="ml-auto flex items-center gap-2">
								<Button
									variant="destructive"
									size="sm"
									onClick={onCerrarMasivo}
									disabled={selectedAbiertas === 0 || busy === "bulk-close"}
								>
									{busy === "bulk-close" ? "Cerrando..." : "Cerrar masivo"}
								</Button>
								<Button
									size="sm"
									onClick={onReabrirMasivo}
									disabled={selectedCerradas === 0 || busy === "bulk-reopen"}
									className="bg-emerald-700 hover:bg-emerald-600 text-white"
								>
									{busy === "bulk-reopen" ? "Reabriendo..." : "Reabrir masivo"}
								</Button>
								<Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
									Limpiar
								</Button>
							</div>
						</div>
					)}

					<Card className="rounded-2xl">
						<CardContent className="p-0">
							{!loading && (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-10">
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
											<TableHead className="text-right">Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{itemsFiltrados.map((it) => (
											<TableRow
												key={it.id}
												className="cursor-pointer transition-colors"
												onClick={() => navigate(`/divulgacion-presencia-fiscal/${it.id}`)}
											>
												<TableCell onClick={(e) => e.stopPropagation()}>
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
														className={`px-2 py-1 rounded text-xs font-medium ${
															it.estado === "ABIERTA"
																? "bg-emerald-500/10 text-emerald-400"
																: "bg-rose-500/10 text-rose-400"
														}`}
													>
														{it.estado}
													</span>
												</TableCell>
												<TableCell className="text-sm tabular-nums">{it.fecha?.slice(0, 10) ?? "—"}</TableCell>
												<TableCell className="text-sm">{PARROQUIA_LABELS[it.parroquia]}</TableCell>
												<TableCell className="max-w-[14rem] truncate text-sm text-muted-foreground">
													{it.ubicacionReferencia ?? "—"}
												</TableCell>
												<TableCell className="tabular-nums text-sm">
													{it._count?.asistentes ?? 0} / {it._count?.visitas ?? 0}
												</TableCell>
												<TableCell className="text-sm">{it.fiscalGroup?.name ?? "—"}</TableCell>
												<TableCell className="text-sm">{it.creadoPor?.name ?? "—"}</TableCell>
												<TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
													<div className="flex items-center justify-end gap-1">
														<Button
															variant="secondary"
															size="sm"
															onClick={() => navigate(`/divulgacion-presencia-fiscal/${it.id}`)}
														>
															Detalle
														</Button>
														{canCreate && (
															<Button
																variant="outline"
																size="sm"
																onClick={() => onDuplicar(it.id)}
																disabled={busy === `dup-${it.id}`}
															>
																{busy === `dup-${it.id}` ? "..." : "Duplicar"}
															</Button>
														)}
														{canCloseReopen && it.estado === "ABIERTA" && (
															<Button
																variant="destructive"
																size="sm"
																onClick={() => onCerrar(it.id)}
																disabled={busy === it.id}
															>
																{busy === it.id ? "..." : "Cerrar"}
															</Button>
														)}
														{canCloseReopen && it.estado === "CERRADA" && (
															<Button
																size="sm"
																onClick={() => onReabrir(it.id)}
																disabled={busy === it.id}
																className="bg-emerald-700 hover:bg-emerald-600 text-white"
															>
																{busy === it.id ? "..." : "Reabrir"}
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										))}
										{itemsFiltrados.length === 0 && (
											<TableRow>
												<TableCell colSpan={9} className="text-center text-muted-foreground py-8">
													{loading ? "Cargando..." : "No hay jornadas con los filtros actuales."}
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							)}
							{loading && (
								<div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
										Cargando...
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{!loading && total > pageSize && !parroquiaSeleccionada && (
						<div className="flex items-center justify-between text-sm">
							<span>
								Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
							</span>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page <= 1 || loading}
									onClick={() => {
										const np = Math.max(1, page - 1);
										setPage(np);
										cargar(np);
									}}
								>
									Anterior
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page * pageSize >= total || loading}
									onClick={() => {
										const np = page + 1;
										setPage(np);
										cargar(np);
									}}
								>
									Siguiente
								</Button>
							</div>
						</div>
					)}
				</TabsContent>

				<TabsContent value="mapa" className="mt-6 space-y-6">
					{canSeeMap && (
						<div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
							<Card className="rounded-2xl">
								<CardHeader className="pb-3">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div>
											<CardTitle>Mapa parroquial interactivo</CardTitle>
											<CardDescription>
												Selecciona una parroquia para ver detalle.
											</CardDescription>
										</div>
										<div className="flex items-center gap-2">
											<Button
												type="button"
												variant={mapView === "normal" ? "default" : "outline"}
												size="sm"
												onClick={() => setMapView("normal")}
											>
												Normal
											</Button>
											<Button
												type="button"
												variant={mapView === "calor" ? "default" : "outline"}
												size="sm"
												onClick={() => setMapView("calor")}
											>
												Calor
											</Button>
											{mapView === "calor" && (
												<Select value={heatMetric} onValueChange={(v) => setHeatMetric(v as any)}>
													<SelectTrigger className="w-auto text-xs">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="impacto_iva_real">Impacto IVA (Real)</SelectItem>
														<SelectItem value="recaudacion_real">Recaudación (Real)</SelectItem>
														<SelectItem value="impacto_iva">Impacto IVA (Actividades)</SelectItem>
														<SelectItem value="visitas">Visitas</SelectItem>
														<SelectItem value="jornadas">Jornadas</SelectItem>
														<SelectItem value="asistentes">Asistentes</SelectItem>
													</SelectContent>
												</Select>
											)}
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<ParroquiaMapaInteractivo
										data={mapa}
										financialData={mapaFinanciero}
										selected={parroquiaSeleccionada}
										onSelect={setParroquiaSeleccionada}
										mode={mapView === "calor" ? "heat" : "normal"}
										heatMetric={heatMetric}
									/>
									{parroquiaSeleccionada && (
										<button
											onClick={() => setParroquiaSeleccionada(null)}
											className="mt-3 text-xs text-amber-400 underline hover:text-amber-300"
										>
											Limpiar selección
										</button>
									)}
								</CardContent>
							</Card>

							<div className="space-y-4">
								<Card className="rounded-2xl">
									<CardHeader className="pb-3">
										<CardTitle>
											{parroquiaSeleccionada
												? PARROQUIA_LABELS[parroquiaSeleccionada]
												: "Resumen del período"}
										</CardTitle>
										<CardDescription>
											{parroquiaSeleccionada
												? "Indicadores de la parroquia seleccionada."
												: `${desde || "—"} a ${hasta || "—"}`}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										{parroquiaSeleccionada ? (
											<div className="grid grid-cols-2 gap-2">
												<MiniKpi label="Jornadas" value={aggSeleccionada?.jornadas ?? 0} />
												<MiniKpi label="Visitas" value={aggSeleccionada?.visitas ?? 0} />
												<MiniKpi label="Asistentes" value={aggSeleccionada?.asistentes ?? 0} />
												<MiniKpi label="Cerradas" value={aggSeleccionada?.cerradas ?? 0} />
											</div>
										) : (
											<div className="grid grid-cols-2 gap-2">
												<MiniKpi label="Jornadas" value={totalJornadasPeriodo} />
												<MiniKpi label="Visitas" value={totalVisitasPeriodo} />
												<MiniKpi label="Parroquias activas" value={parroquiasConActividad} />
												<MiniKpi label="Prom. visitas/jornada" value={Number(promedioVisitasPorJornada)} />
											</div>
										)}
										<DesgloseComercial
											actividades={parroquiaSeleccionada ? aggSeleccionada?.actividades ?? {} : totalActividadesPeriodo}
											title={parroquiaSeleccionada ? "Actividades en esta parroquia" : "Desglose comercial del período"}
										/>
									</CardContent>
								</Card>

								<Card className="rounded-2xl">
									<CardHeader className="pb-3">
										<CardTitle>Bitácora reciente</CardTitle>
										<CardDescription>
											{parroquiaSeleccionada
												? `Últimas jornadas en ${PARROQUIA_LABELS[parroquiaSeleccionada]}`
												: "Últimas jornadas registradas"}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 max-h-60 overflow-auto pr-1">
											{auditoriaReciente.map((row) => (
												<div key={row.id} className="text-xs border-b pb-2 last:border-0">
													<div className="font-medium">
														{PARROQUIA_LABELS[row.parroquia]} · {row.fecha?.slice(0, 10) ?? "—"}
													</div>
													<div className="text-muted-foreground">
														{row.estado} · Asist: {row._count?.asistentes ?? 0} · Vis:{" "}
														{row._count?.visitas ?? 0}
													</div>
													<div className="text-muted-foreground/70">Creado por: {row.creadoPor?.name ?? "—"}</div>
												</div>
											))}
											{auditoriaReciente.length === 0 && (
												<div className="text-xs text-muted-foreground">Sin eventos recientes en el período.</div>
											)}
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					)}
				</TabsContent>
			</Tabs>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0 gap-0">
					<div className="h-0.5 bg-gradient-to-r from-indigo-500/60 via-indigo-400/40 to-transparent shrink-0" />
					<div className="px-5 pt-5 pb-4 border-b border-slate-800 shrink-0">
						<DialogHeader className="p-0">
							<DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
								<span className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center">
									<span className="w-2.5 h-2.5 rounded-sm bg-indigo-400" />
								</span>
								Nueva jornada de divulgación
							</DialogTitle>
							<DialogDescription className="text-slate-400 text-sm mt-1">
								Carga operativa completa para ejecución, seguimiento comercial y control de presencia fiscal.
							</DialogDescription>
						</DialogHeader>
					</div>

					<form className="overflow-y-auto custom-scrollbar px-5 py-4 space-y-5" onSubmit={onCreate}>
						<div className="rounded-xl border border-slate-700/50 p-4 space-y-3">
							<div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
								<span className="w-1 h-3 bg-indigo-500 rounded-sm" />
								Datos base de la jornada
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
										Fecha
									</Label>
									<input
										type="date"
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
										value={fechaForm}
										onChange={(e) => setFechaForm(e.target.value)}
										required
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
										Inicio
									</Label>
									<input
										type="time"
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
										value={horaInicioForm}
										onChange={(e) => setHoraInicioForm(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
										Fin
									</Label>
									<input
										type="time"
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
										value={horaFinForm}
										onChange={(e) => setHoraFinForm(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
										Tipo
									</Label>
									<Select value={tipoJornadaForm} onValueChange={setTipoJornadaForm}>
										<SelectTrigger className="bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500/30 transition-all">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-slate-900 border-slate-700/60 text-white">
											<SelectItem value="DIVULGACION">Divulgación</SelectItem>
											<SelectItem value="PRESENCIA_FISCAL">Presencia fiscal</SelectItem>
											<SelectItem value="MIXTA">Mixta</SelectItem>
											<SelectItem value="INSPECCION">Inspección comercial</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
										Parroquia
									</Label>
									<Select value={parroquiaForm} onValueChange={(v) => setParroquiaForm(v as ParroquiaCaracas)}>
										<SelectTrigger className="bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500/30 transition-all">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-slate-900 border-slate-700/60 text-white max-h-60">
											{PARROQUIAS_CARACAS.map((p) => (
												<SelectItem key={p} value={p}>
													{PARROQUIA_LABELS[p]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
										Sector / comunidad
									</Label>
									<input
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
										placeholder="La Pastora norte, Calle Real"
										value={sectorForm}
										onChange={(e) => setSectorForm(e.target.value)}
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
										Punto de referencia
									</Label>
									<input
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
										placeholder="Av. Sucre, frente a..."
										value={ubicacionReferencia}
										onChange={(e) => setUbicacionReferencia(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
										Dirección detallada
									</Label>
									<input
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
										placeholder="Cruce, local, manzana"
										value={direccionDetalladaForm}
										onChange={(e) => setDireccionDetalladaForm(e.target.value)}
									/>
								</div>
							</div>
						</div>

						<div className="rounded-xl border border-slate-700/50 p-4 space-y-3">
							<div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
								<span className="w-1 h-3 bg-emerald-500 rounded-sm" />
								Plan comercial y operativo
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
										Meta de visitas
									</Label>
									<input
										type="number"
										min={1}
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
										value={metaVisitasForm}
										onChange={(e) => setMetaVisitasForm(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
										Canal de convocatoria
									</Label>
									<Select value={canalConvocatoriaForm} onValueChange={setCanalConvocatoriaForm}>
										<SelectTrigger className="bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm focus:ring-1 focus:ring-emerald-500/30 transition-all">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-slate-900 border-slate-700/60 text-white">
											<SelectItem value="PUERTA_A_PUERTA">Puerta a puerta</SelectItem>
											<SelectItem value="PUNTO_FIJO">Punto fijo</SelectItem>
											<SelectItem value="VOLANTEO">Volanteo</SelectItem>
											<SelectItem value="REDES">Redes comunitarias</SelectItem>
											<SelectItem value="MIXTO">Mixto</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-3">
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
										Apoyo institucional
									</Label>
									<input
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
										placeholder="Consejo comunal, Sundde"
										value={apoyoInstitucionalForm}
										onChange={(e) => setApoyoInstitucionalForm(e.target.value)}
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
										Responsable operativo
									</Label>
									<Select value={responsableForm} onValueChange={setResponsableForm}>
										<SelectTrigger className="bg-slate-950/40 border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm focus:ring-1 focus:ring-emerald-500/30 transition-all">
											<SelectValue placeholder="Seleccionar coordinador..." />
										</SelectTrigger>
										<SelectContent className="bg-slate-900 border-slate-700/60 text-white">
											{coordinadores.map((c) => (
												<SelectItem key={c.id} value={c.name}>
													{c.name}
												</SelectItem>
											))}
											{coordinadores.length === 0 && (
												<div className="px-2 py-3 text-xs text-slate-500 text-center">No hay coordinadores disponibles</div>
											)}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
										<svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
										Teléfono de contacto
									</Label>
									<input
										className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg h-9 text-slate-200 text-sm px-3 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
										placeholder="0412-0000000"
										value={telefonoResponsableForm}
										onChange={(e) => setTelefonoResponsableForm(e.target.value)}
									/>
								</div>
							</div>
							<div className="space-y-1.5">
								<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
									<svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									Objetivo de la jornada
								</Label>
								<textarea
									className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg text-slate-200 text-sm px-3 py-2 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-y min-h-[2.25rem]"
									rows={2}
									value={objetivoForm}
									onChange={(e) => setObjetivoForm(e.target.value)}
									placeholder="Qué se busca lograr en la parroquia seleccionada"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
									<svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
									Observaciones operativas
								</Label>
								<textarea
									className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg text-slate-200 text-sm px-3 py-2 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-y min-h-[2.25rem]"
									rows={2}
									value={observacionesOperativas}
									onChange={(e) => setObservacionesOperativas(e.target.value)}
									placeholder="Riesgos, requerimientos logísticos, recomendaciones"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
									<svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
									Notas adicionales
								</Label>
								<textarea
									className="w-full bg-slate-950/40 border border-slate-700/60 rounded-lg text-slate-200 text-sm px-3 py-2 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-y min-h-[2.25rem]"
									rows={2}
									value={notas}
									onChange={(e) => setNotas(e.target.value)}
									placeholder="Cualquier detalle extra para el equipo"
								/>
							</div>
						</div>

						<details className="group rounded-xl border border-slate-700/30 [&>summary]:cursor-pointer">
							<summary className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-300 transition-colors list-none">
								<svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
								Presets y vista previa
							</summary>
							<div className="px-4 pb-4 space-y-3">
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] h-7"
										onClick={() => {
											setFechaForm(todayISO());
											setHoraInicioForm("08:00");
											setHoraFinForm("12:00");
										}}
									>
										Horario sugerido (8-12)
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] h-7"
										onClick={() => {
											setMetaVisitasForm("40");
											setCanalConvocatoriaForm("MIXTO");
											setTipoJornadaForm("MIXTA");
										}}
									>
										Preset intensivo
									</Button>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vista previa de ubicación</Label>
										<div className="w-full bg-slate-950/20 border border-slate-700/30 rounded-lg px-3 py-2 text-slate-400 text-xs font-mono min-h-[2.25rem] break-all">
											{[ubicacionReferencia, sectorForm, direccionDetalladaForm].filter(Boolean).join(" | ") || <span className="italic text-slate-600">Sin datos de ubicación</span>}
										</div>
									</div>
									<div className="space-y-1">
										<Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vista previa de notas</Label>
										<div className="w-full bg-slate-950/20 border border-slate-700/30 rounded-lg px-3 py-2 text-slate-400 text-xs font-mono min-h-[2.25rem] break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
											{buildNotasOperacion() || <span className="italic text-slate-600">Sin notas</span>}
										</div>
									</div>
								</div>
							</div>
						</details>
					</form>

					<DialogFooter className="px-5 py-4 border-t border-slate-800">
						<ModalFooter
							onCancel={() => setDialogOpen(false)}
							onConfirm={onCreate}
							confirmLabel={busy === "create" ? "Creando..." : "Crear jornada"}
							isLoading={busy === "create"}
							confirmVariant="default"
						/>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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
	accent?: "emerald" | "rose" | "amber";
}) {
	const ring =
		accent === "emerald"
			? "ring-emerald-500/30 from-emerald-500/10"
			: accent === "rose"
				? "ring-rose-500/30 from-rose-500/10"
				: accent === "amber"
					? "ring-amber-500/30 from-amber-500/10"
					: "ring-blue-500/20 from-blue-500/10";
	const valueCls =
		accent === "emerald"
			? "text-emerald-300"
			: accent === "rose"
				? "text-rose-300"
				: accent === "amber"
					? "text-amber-300"
					: "text-slate-100";
	return (
		<div
			className={`rounded-2xl border bg-gradient-to-br ${ring} p-4 ring-1 transition-all hover:ring-2 hover:-translate-y-0.5`}
		>
			<div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
			<div className={`text-3xl font-bold ${valueCls} tabular-nums mt-1`}>{value}</div>
		</div>
	);
}

function MiniKpi({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg border p-3 transition-colors">
			<div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
			<div className="text-xl font-bold text-foreground tabular-nums">{value}</div>
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
					? "border-amber-500/30 bg-amber-500/5"
					: "border-emerald-500/30 bg-emerald-500/5"
			}`}
		>
			<div className="text-sm">{label}</div>
			<div
				className={`text-xl font-bold mt-1 ${
					tone === "warning" ? "text-amber-400" : "text-emerald-400"
				}`}
			>
				{value}
			</div>
		</div>
	);
}
