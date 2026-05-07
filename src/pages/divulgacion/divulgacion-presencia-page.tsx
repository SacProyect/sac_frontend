import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/UI/v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/UI/table";
import { useAuth } from "@/hooks/use-auth";
import {
	closeDivulgacion,
	createDivulgacion,
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

type DivulgacionRow = {
	id: string;
	estado: EstadoDivulgacion;
	parroquia: ParroquiaCaracas;
	fecha: string;
	ubicacionReferencia: string | null;
	creadoPor?: { id: string; name: string; role: string };
	fiscalGroup?: { id: string; name: string } | null;
	_count?: { asistentes: number; visitas: number };
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
	const [busy, setBusy] = useState<string | null>(null);

	const [showForm, setShowForm] = useState(false);
	const [parroquiaForm, setParroquiaForm] = useState<ParroquiaCaracas>("SUCRE");
	const [fechaForm, setFechaForm] = useState<string>(todayISO);
	const [ubicacionReferencia, setUbicacionReferencia] = useState("");
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

	const [parroquiaSeleccionada, setParroquiaSeleccionada] = useState<ParroquiaCaracas | null>(null);

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
		cargar();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const aplicarFiltros = (e?: React.FormEvent) => {
		e?.preventDefault();
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
				ubicacionReferencia: ubicacionReferencia.trim() || undefined,
				notas: notas.trim() || undefined,
			});
			setShowForm(false);
			setUbicacionReferencia("");
			setNotas("");
			await cargar();
		} catch (e: any) {
			setError(e?.message ?? "No se pudo crear la jornada.");
		} finally {
			setBusy(null);
		}
	};

	const onCerrar = async (id: string) => {
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

	const itemsFiltrados = useMemo(() => {
		if (!parroquiaSeleccionada) return items;
		return items.filter((it) => it.parroquia === parroquiaSeleccionada);
	}, [items, parroquiaSeleccionada]);

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

			{misStats && misStats.scope !== "FISCAL" && (
				<>
					<RoleScopeBadge role={misStats.scope} groupName={user?.group?.name} />
					<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
						<KpiCard label="Jornadas hoy" value={misStats.jornadasHoy} />
						<KpiCard label="Abiertas hoy" value={misStats.abiertasHoy} accent="emerald" />
						<KpiCard label="Cerradas hoy" value={misStats.cerradasHoy} accent="rose" />
						<KpiCard label="Asistentes hoy" value={misStats.asistentesHoy} />
						<KpiCard label="Visitas hoy" value={misStats.visitasHoy} />
					</div>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
						<KpiCard label="Jornadas del mes" value={misStats.jornadasMes} />
						<KpiCard label="Visitas del mes" value={misStats.visitasMes} accent="emerald" />
						<KpiCard
							label="Abiertas en total"
							value={misStats.jornadasAbiertasTotal}
							accent="emerald"
						/>
					</div>
				</>
			)}

			{/* Panel rápido para asignar equipo a una jornada (solo Admin) */}
			{canManageEquipo && (
				<EquipoQuickAdd role={role} onChanged={() => cargar()} />
			)}

			{showForm && canCreate && (
				<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
					<CardHeader>
						<CardTitle>Nueva jornada de divulgación</CardTitle>
						<CardDescription>
							Tras crearla, podrás agregar asistentes y contribuyentes visitados desde el detalle.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-4 max-w-2xl" onSubmit={onCreate}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Fecha</label>
									<input
										type="date"
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
										value={fechaForm}
										onChange={(e) => setFechaForm(e.target.value)}
									/>
								</div>
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
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Ubicación de referencia (opcional)</label>
								<input
									className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
									placeholder="Av. Sucre, sector La Pastora"
									value={ubicacionReferencia}
									onChange={(e) => setUbicacionReferencia(e.target.value)}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Notas</label>
								<textarea
									className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
									rows={3}
									value={notas}
									onChange={(e) => setNotas(e.target.value)}
								/>
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
				</CardContent>
			</Card>

			{canSeeMap && (
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
					<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
						<CardHeader>
							<CardTitle>Mapa parroquial interactivo</CardTitle>
							<CardDescription>
								Click en una parroquia para filtrar la lista y ver el desglose comercial.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ParroquiaMapaInteractivo
								data={mapa}
								selected={parroquiaSeleccionada}
								onSelect={setParroquiaSeleccionada}
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
									<MiniKpi label="Jornadas" value={aggSeleccionada?.jornadas ?? 0} />
									<MiniKpi label="Abiertas" value={aggSeleccionada?.abiertas ?? 0} />
									<MiniKpi label="Cerradas" value={aggSeleccionada?.cerradas ?? 0} />
									<MiniKpi label="Asistentes" value={aggSeleccionada?.asistentes ?? 0} />
									<MiniKpi label="Visitas" value={aggSeleccionada?.visitas ?? 0} />
								</div>
								<DesgloseComercial actividades={aggSeleccionada?.actividades ?? {}} />
							</>
						) : (
							<DesgloseComercial actividades={totalActividadesPeriodo} title="Desglose comercial del período" />
						)}
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
				</CardHeader>
				<CardContent>
					{error && <p className="text-red-400 text-sm mb-3">{error}</p>}
					{!loading && (
						<Table>
							<TableHeader>
								<TableRow>
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
										<TableCell colSpan={8} className="text-center text-slate-500 py-6">
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
	value: number;
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

function RoleScopeBadge({
	role,
	groupName,
}: {
	role: "ADMIN" | "COORDINATOR" | "SUPERVISOR" | "FISCAL";
	groupName?: string;
}) {
	const palette: Record<typeof role, { bg: string; ring: string; icon: string; label: string; descr: string }> = {
		ADMIN: {
			bg: "from-violet-500/10",
			ring: "border-violet-500/40",
			icon: "👁",
			label: "Admin · Visión global",
			descr: "Ves todas las jornadas del sistema y puedes crear, cerrar, reabrir y duplicar.",
		},
		COORDINATOR: {
			bg: "from-emerald-500/10",
			ring: "border-emerald-500/40",
			icon: "🛠",
			label: `Coordinador${groupName ? ` · ${groupName}` : ""}`,
			descr: "Solo ves y gestionas jornadas de tu grupo. Puedes crear y duplicar; el cierre lo hace Admin.",
		},
		SUPERVISOR: {
			bg: "from-amber-500/10",
			ring: "border-amber-500/40",
			icon: "🔎",
			label: `Supervisor${groupName ? ` · ${groupName}` : ""}`,
			descr: "Ves todas las jornadas de tu grupo y el mapa. Puedes asignar equipo (asistentes) en jornadas abiertas de tu grupo.",
		},
		FISCAL: {
			bg: "from-sky-500/10",
			ring: "border-sky-500/40",
			icon: "✏",
			label: `Fiscal${groupName ? ` · ${groupName}` : ""}`,
			descr: "Registras contribuyentes visitados en jornadas donde te asignaron como asistente.",
		},
	};
	const p = palette[role];
	return (
		<div
			className={`flex items-start gap-3 rounded-xl border ${p.ring} bg-gradient-to-br ${p.bg} to-slate-900/60 px-4 py-3 card-anim`}
		>
			<div className="text-2xl leading-none">{p.icon}</div>
			<div>
				<div className="text-sm font-semibold text-slate-100">{p.label}</div>
				<div className="text-xs text-slate-300">{p.descr}</div>
			</div>
		</div>
	);
}
