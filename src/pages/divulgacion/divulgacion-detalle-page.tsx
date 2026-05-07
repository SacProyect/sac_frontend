import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/UI/v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/UI/table";
import { useAuth } from "@/hooks/use-auth";
import {
	addAsistentes,
	addVisita,
	closeDivulgacion,
	downloadJornadaPdf,
	duplicarDivulgacion,
	getDivulgacionById,
	listUsuariosAsignables,
	PARROQUIAS_CARACAS,
	removeAsistente,
	removeVisita,
	reopenDivulgacion,
	updateDivulgacion,
	type AsistentePayload,
	type EstadoDivulgacion,
	type ParroquiaCaracas,
	type UsuarioAsignable,
} from "@/components/utils/api/divulgacion-functions";
import { checkTaxpayerByRif } from "@/components/utils/api/taxpayer-functions";
import { PARROQUIA_LABELS } from "./parroquia-mapa-interactivo";
import DesgloseComercial from "./desglose-comercial";

type Asistente = {
	id: string;
	tipo: "INTERNO_SAC" | "EXTERNO_LIBRE";
	user?: { id: string; name: string; role: string } | null;
	nombreLibre: string | null;
	documentoLibre: string | null;
	cargoLibre: string | null;
	organizacionLibre: string | null;
	telefonoLibre: string | null;
	notas: string | null;
	createdAt: string;
};

type Visita = {
	id: string;
	taxpayerId: string | null;
	rifCapturado: string;
	nombreCapturado: string | null;
	tipoActividad: string;
	yaRegistradoEnSac: boolean;
	direccionSector: string | null;
	notas: string | null;
	createdAt: string;
	taxpayer?: { id: string; rif: string; name: string } | null;
	creadoPor?: { id: string; name: string; role: string };
};

type Detalle = {
	id: string;
	estado: EstadoDivulgacion;
	parroquia: ParroquiaCaracas;
	fecha: string;
	ubicacionReferencia: string | null;
	notas: string | null;
	closedAt: string | null;
	createdAt: string;
	updatedAt: string;
	fiscalGroup?: { id: string; name: string; coordinatorId: string } | null;
	creadoPor?: { id: string; name: string; role: string };
	cerradoPor?: { id: string; name: string; role: string } | null;
	asistentes: Asistente[];
	visitas: Visita[];
};

const ACTIVIDADES_SUGERIDAS = [
	"Panadería",
	"Farmacia",
	"Licorería",
	"Abasto",
	"Restaurante",
	"Ferretería",
	"Supermercado",
	"Otro",
];

export default function DivulgacionDetallePage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const role = user?.role ?? "";
	const userId = user?.id ?? "";

	const [data, setData] = useState<Detalle | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState<string | null>(null);

	const cargar = useCallback(async () => {
		if (!id) return;
		try {
			setLoading(true);
			setError("");
			const r = await getDivulgacionById(id);
			setData(r?.item ?? null);
		} catch (e: any) {
			setError(e?.message ?? "No se pudo cargar la jornada.");
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		cargar();
	}, [cargar]);

	const isAbierta = data?.estado === "ABIERTA";
	const esAdmin = role === "ADMIN";
	const esCoordDelGrupo =
		role === "COORDINATOR" && !!data?.fiscalGroup?.coordinatorId && data.fiscalGroup.coordinatorId === userId;
	// El Supervisor del mismo grupo también puede gestionar asistentes (no edita cabecera).
	const esSupervisorDelGrupo = role === "SUPERVISOR" && !!data?.fiscalGroup?.id;
	const fiscalEsAsistente = useMemo(() => {
		if (role !== "FISCAL" || !data) return false;
		return data.asistentes.some((a) => a.tipo === "INTERNO_SAC" && a.user?.id === userId);
	}, [data, role, userId]);

	const puedeEditarCabecera = (esAdmin || esCoordDelGrupo) && isAbierta;
	const puedeEditarAsistentes =
		(esAdmin || esCoordDelGrupo || esSupervisorDelGrupo) && isAbierta;
	const puedeEditarVisitas = (esAdmin || fiscalEsAsistente) && isAbierta;
	const puedeCerrar = esAdmin;

	const onCerrar = async () => {
		if (!id) return;
		try {
			setBusy("cerrar");
			await closeDivulgacion(id);
			await cargar();
		} finally {
			setBusy(null);
		}
	};
	const onReabrir = async () => {
		if (!id) return;
		try {
			setBusy("reabrir");
			await reopenDivulgacion(id);
			await cargar();
		} finally {
			setBusy(null);
		}
	};

	const onExportPdf = async () => {
		if (!id) return;
		try {
			setBusy("pdf");
			await downloadJornadaPdf(id);
		} catch (e: any) {
			setError(e?.message ?? "No se pudo generar el PDF.");
		} finally {
			setBusy(null);
		}
	};

	const onDuplicar = async () => {
		if (!id) return;
		const ok = confirm(
			"¿Duplicar esta jornada? Se creará una nueva jornada con la misma parroquia, ubicación y equipo SAC, en blanco de visitas.",
		);
		if (!ok) return;
		try {
			setBusy("duplicar");
			const result: any = await duplicarDivulgacion(id, { replicarAsistentesExternos: false });
			const newId = result?.item?.id;
			if (newId) navigate(`/divulgacion-presencia-fiscal/${newId}`);
			else await cargar();
		} catch (e: any) {
			setError(e?.message ?? "No se pudo duplicar.");
		} finally {
			setBusy(null);
		}
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<PageHeader title="Cargando jornada..." description="" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<PageHeader title="Error" description={error} />
				<button
					onClick={() => navigate("/divulgacion-presencia-fiscal")}
					className="px-3 py-2 rounded bg-slate-700 text-white text-sm"
				>
					Volver
				</button>
			</div>
		);
	}

	if (!data) return null;

	const desgloseJornada = data.visitas.reduce<Record<string, number>>((acc, v) => {
		const k = (v.tipoActividad || "Otro").trim();
		acc[k] = (acc[k] ?? 0) + 1;
		return acc;
	}, {});

	return (
		<div className="space-y-6 w-full max-w-full overflow-x-hidden divulgacion-module">
			<style>{`
				.divulgacion-module [data-slot="card-title"] { color: #f1f5f9; }
				.divulgacion-module [data-slot="card-description"] { color: #cbd5e1; }
				.divulgacion-module input,
				.divulgacion-module select,
				.divulgacion-module textarea { color: #f1f5f9; }
				.divulgacion-module input::placeholder,
				.divulgacion-module textarea::placeholder { color: #64748b; }
				.divulgacion-module label { color: #cbd5e1; }
				.divulgacion-module .field-label { color: #94a3b8; }
				.divulgacion-module [data-slot="card-content"],
				.divulgacion-module [role="tabpanel"] { animation: dvFadeUp 280ms ease-out both; }
				@keyframes dvFadeUp {
					from { opacity: 0; transform: translateY(6px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
			<PageHeader
				title={`Jornada — ${PARROQUIA_LABELS[data.parroquia]}`}
				description={`${data.fecha?.slice(0, 10) ?? ""} · ${data.fiscalGroup?.name ?? "Sin grupo"} · Creada por ${data.creadoPor?.name ?? "—"}`}
				action={
					<div className="flex items-center gap-2 flex-wrap">
						<button
							onClick={() => navigate("/divulgacion-presencia-fiscal")}
							className="px-3 py-2 rounded bg-slate-700 text-white text-sm"
						>
							Volver
						</button>
						<button
							onClick={onExportPdf}
							disabled={busy === "pdf"}
							className="px-3 py-2 rounded bg-blue-700 text-white text-sm disabled:opacity-60"
						>
							{busy === "pdf" ? "Generando..." : "Exportar PDF"}
						</button>
						{(esAdmin || esCoordDelGrupo) && (
							<button
								onClick={onDuplicar}
								disabled={busy === "duplicar"}
								className="px-3 py-2 rounded bg-indigo-700 text-white text-sm disabled:opacity-60"
							>
								{busy === "duplicar" ? "Duplicando..." : "Duplicar"}
							</button>
						)}
						{puedeCerrar && data.estado === "ABIERTA" && (
							<button
								onClick={onCerrar}
								disabled={busy === "cerrar"}
								className="px-3 py-2 rounded bg-rose-600 text-white text-sm disabled:opacity-60"
							>
								{busy === "cerrar" ? "Cerrando..." : "Cerrar jornada"}
							</button>
						)}
						{puedeCerrar && data.estado === "CERRADA" && (
							<button
								onClick={onReabrir}
								disabled={busy === "reabrir"}
								className="px-3 py-2 rounded bg-emerald-700 text-white text-sm disabled:opacity-60"
							>
								{busy === "reabrir" ? "Reabriendo..." : "Reabrir jornada"}
							</button>
						)}
					</div>
				}
			/>

			<div className="flex items-center gap-3">
				<EstadoBadge estado={data.estado} />
				<span className="text-xs text-slate-400">
					{data.estado === "CERRADA" && data.cerradoPor
						? `Cerrada por ${data.cerradoPor.name} el ${data.closedAt?.slice(0, 10) ?? "—"}`
						: ""}
				</span>
			</div>

			<Tabs defaultValue="info" className="w-full">
				<TabsList
					className="bg-slate-900/70 border border-slate-700 p-1 rounded-xl gap-1 h-auto"
					style={{ height: "auto" }}
				>
					<TabsTrigger
						value="info"
						className="px-4 py-2 text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
					>
						Información
					</TabsTrigger>
					<TabsTrigger
						value="asistentes"
						className="px-4 py-2 text-slate-300 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
					>
						Asistentes ({data.asistentes.length})
					</TabsTrigger>
					<TabsTrigger
						value="visitas"
						className="px-4 py-2 text-slate-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
					>
						Visitas ({data.visitas.length})
					</TabsTrigger>
					<TabsTrigger
						value="resumen"
						className="px-4 py-2 text-slate-300 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
					>
						Resumen
					</TabsTrigger>
				</TabsList>

				<TabsContent value="info">
					<InfoTab
						data={data}
						canEdit={puedeEditarCabecera}
						onSaved={cargar}
						role={role}
						isAbierta={isAbierta}
					/>
				</TabsContent>

				<TabsContent value="asistentes">
					<AsistentesTab
						divulgacionId={data.id}
						asistentes={data.asistentes}
						canEdit={puedeEditarAsistentes}
						onChanged={cargar}
						role={role}
						isAbierta={isAbierta}
					/>
				</TabsContent>

				<TabsContent value="visitas">
					<VisitasTab
						divulgacionId={data.id}
						visitas={data.visitas}
						canEdit={puedeEditarVisitas}
						currentUserId={userId}
						isAdmin={esAdmin}
						onChanged={cargar}
						role={role}
						isAbierta={isAbierta}
						fiscalEsAsistente={fiscalEsAsistente}
					/>
				</TabsContent>

				<TabsContent value="resumen">
					<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
						<CardHeader>
							<CardTitle>Resumen de la jornada</CardTitle>
							<CardDescription>Indicadores y desglose comercial.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								<MiniKpi label="Asistentes" value={data.asistentes.length} />
								<MiniKpi
									label="Internos SAC"
									value={data.asistentes.filter((a) => a.tipo === "INTERNO_SAC").length}
								/>
								<MiniKpi
									label="Externos"
									value={data.asistentes.filter((a) => a.tipo === "EXTERNO_LIBRE").length}
								/>
								<MiniKpi label="Visitas" value={data.visitas.length} />
							</div>
							<DesgloseComercial actividades={desgloseJornada} title="Tipos de actividad visitados" />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

/* ─── Subcomponentes ─── */

function EstadoBadge({ estado }: { estado: EstadoDivulgacion }) {
	const cls =
		estado === "ABIERTA"
			? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
			: "bg-rose-500/15 text-rose-300 border-rose-500/40";
	return (
		<span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${cls}`}>
			{estado}
		</span>
	);
}

function MiniKpi({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
			<div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
			<div className="text-lg font-semibold text-slate-100 tabular-nums">{value}</div>
		</div>
	);
}

/** Aviso visible cuando el rol actual no tiene permiso para editar/agregar en una pestaña. */
function PermissionHint({
	tone = "info",
	icon = "🔒",
	title,
	descr,
}: {
	tone?: "info" | "warn";
	icon?: string;
	title: string;
	descr: string;
}) {
	const cls =
		tone === "warn"
			? "border-amber-500/40 bg-amber-500/10"
			: "border-slate-600 bg-slate-800/40";
	return (
		<div className={`flex items-start gap-3 rounded-xl border ${cls} px-4 py-3`}>
			<div className="text-xl leading-none">{icon}</div>
			<div>
				<div className="text-sm font-semibold text-slate-100">{title}</div>
				<div className="text-xs text-slate-300 mt-0.5">{descr}</div>
			</div>
		</div>
	);
}

function InfoTab({
	data,
	canEdit,
	onSaved,
	role,
	isAbierta,
}: {
	data: Detalle;
	canEdit: boolean;
	onSaved: () => Promise<void> | void;
	role: string;
	isAbierta: boolean;
}) {
	const [editing, setEditing] = useState(false);
	const [parroquia, setParroquia] = useState<ParroquiaCaracas>(data.parroquia);
	const [fecha, setFecha] = useState(data.fecha?.slice(0, 10) ?? "");
	const [ubicacion, setUbicacion] = useState(data.ubicacionReferencia ?? "");
	const [notas, setNotas] = useState(data.notas ?? "");
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState("");

	const onSave = async () => {
		try {
			setBusy(true);
			setErr("");
			await updateDivulgacion(data.id, {
				parroquia,
				fecha,
				ubicacionReferencia: ubicacion.trim() || undefined,
				notas: notas.trim() || undefined,
			});
			setEditing(false);
			await onSaved();
		} catch (e: any) {
			setErr(e?.message ?? "No se pudo guardar.");
		} finally {
			setBusy(false);
		}
	};

	const reasonNoEdit = !isAbierta
		? "La jornada está cerrada — solicítale a un Admin que la reabra para editar."
		: role === "SUPERVISOR"
			? "Tu rol Supervisor es solo de lectura."
			: role === "FISCAL"
				? "Solo Admin o el Coordinador del grupo pueden editar la cabecera."
				: role === "COORDINATOR"
					? "Solo el Coordinador titular del grupo de la jornada puede editar."
					: "No tiene permisos para editar la cabecera.";

	return (
		<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
			<CardHeader>
				<CardTitle>Información de la jornada</CardTitle>
				<CardDescription>
					{canEdit
						? "Puede editar la cabecera mientras la jornada esté abierta."
						: "Solo lectura."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{!canEdit && (
					<PermissionHint
						title="Solo lectura"
						descr={reasonNoEdit}
					/>
				)}
				{!editing ? (
					<dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
						<Field label="Parroquia">{PARROQUIA_LABELS[data.parroquia]}</Field>
						<Field label="Fecha">{data.fecha?.slice(0, 10) ?? "—"}</Field>
						<Field label="Ubicación de referencia">{data.ubicacionReferencia ?? "—"}</Field>
						<Field label="Grupo fiscal">{data.fiscalGroup?.name ?? "—"}</Field>
						<Field label="Creada por">{data.creadoPor?.name ?? "—"}</Field>
						<Field label="Estado"><EstadoBadge estado={data.estado} /></Field>
						<div className="md:col-span-2">
							<Field label="Notas">{data.notas || "—"}</Field>
						</div>
					</dl>
				) : (
					<div className="space-y-4 max-w-2xl">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">Parroquia</label>
								<select
									className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
									value={parroquia}
									onChange={(e) => setParroquia(e.target.value as ParroquiaCaracas)}
								>
									{PARROQUIAS_CARACAS.map((p) => (
										<option key={p} value={p}>
											{PARROQUIA_LABELS[p]}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Fecha</label>
								<input
									type="date"
									className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
									value={fecha}
									onChange={(e) => setFecha(e.target.value)}
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Ubicación de referencia</label>
							<input
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
								value={ubicacion}
								onChange={(e) => setUbicacion(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Notas</label>
							<textarea
								rows={3}
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
								value={notas}
								onChange={(e) => setNotas(e.target.value)}
							/>
						</div>
						{err && <p className="text-red-400 text-sm">{err}</p>}
					</div>
				)}
				{canEdit && (
					<div className="flex items-center gap-2">
						{editing ? (
							<>
								<button
									onClick={onSave}
									disabled={busy}
									className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
								>
									{busy ? "Guardando..." : "Guardar"}
								</button>
								<button
									onClick={() => setEditing(false)}
									disabled={busy}
									className="px-3 py-2 rounded bg-slate-700 text-white text-sm"
								>
									Cancelar
								</button>
							</>
						) : (
							<button
								onClick={() => setEditing(true)}
								className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
							>
								Editar
							</button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div>
			<dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
			<dd className="text-slate-200">{children}</dd>
		</div>
	);
}

/* ─── Asistentes ─── */

function AsistentesTab({
	divulgacionId,
	asistentes,
	canEdit,
	onChanged,
	role,
	isAbierta,
}: {
	divulgacionId: string;
	asistentes: Asistente[];
	canEdit: boolean;
	onChanged: () => Promise<void> | void;
	role: string;
	isAbierta: boolean;
}) {
	const [tipo, setTipo] = useState<"INTERNO_SAC" | "EXTERNO_LIBRE">("INTERNO_SAC");
	const [busy, setBusy] = useState<string | null>(null);
	const [err, setErr] = useState("");

	const [q, setQ] = useState("");
	const [opciones, setOpciones] = useState<UsuarioAsignable[]>([]);
	const [seleccionado, setSeleccionado] = useState<UsuarioAsignable | null>(null);

	const [nombreLibre, setNombreLibre] = useState("");
	const [documentoLibre, setDocumentoLibre] = useState("");
	const [cargoLibre, setCargoLibre] = useState("");
	const [organizacionLibre, setOrganizacionLibre] = useState("");
	const [telefonoLibre, setTelefonoLibre] = useState("");

	useEffect(() => {
		if (!canEdit || tipo !== "INTERNO_SAC") return;
		let cancel = false;
		const t = window.setTimeout(async () => {
			try {
				const r = await listUsuariosAsignables({ q: q.trim() || undefined, divulgacionId, limit: 20 });
				if (!cancel) setOpciones(r?.items ?? []);
			} catch {
				if (!cancel) setOpciones([]);
			}
		}, 250);
		return () => {
			cancel = true;
			window.clearTimeout(t);
		};
	}, [q, canEdit, tipo, divulgacionId]);

	const limpiarForm = () => {
		setSeleccionado(null);
		setQ("");
		setNombreLibre("");
		setDocumentoLibre("");
		setCargoLibre("");
		setOrganizacionLibre("");
		setTelefonoLibre("");
	};

	const onAgregar = async () => {
		try {
			setErr("");
			setBusy("add");
			let payload: AsistentePayload;
			if (tipo === "INTERNO_SAC") {
				if (!seleccionado) {
					setErr("Selecciona un usuario SAC.");
					return;
				}
				payload = { tipo: "INTERNO_SAC", userId: seleccionado.id };
			} else {
				if (nombreLibre.trim().length < 2 || documentoLibre.trim().length < 3) {
					setErr("Nombre y documento son obligatorios para externos.");
					return;
				}
				payload = {
					tipo: "EXTERNO_LIBRE",
					nombreLibre: nombreLibre.trim(),
					documentoLibre: documentoLibre.trim(),
					cargoLibre: cargoLibre.trim() || undefined,
					organizacionLibre: organizacionLibre.trim() || undefined,
					telefonoLibre: telefonoLibre.trim() || undefined,
				};
			}
			await addAsistentes(divulgacionId, [payload]);
			limpiarForm();
			await onChanged();
		} catch (e: any) {
			setErr(e?.response?.data?.error ?? e?.message ?? "No se pudo agregar.");
		} finally {
			setBusy(null);
		}
	};

	const onQuitar = async (asistenteId: string) => {
		try {
			setBusy(asistenteId);
			await removeAsistente(divulgacionId, asistenteId);
			await onChanged();
		} finally {
			setBusy(null);
		}
	};

	return (
		<div className="space-y-4">
			{!canEdit && (
				<PermissionHint
					title="No puedes modificar el equipo de esta jornada"
					descr={
						!isAbierta
							? "La jornada está cerrada. Pide a un Admin que la reabra para gestionar asistentes."
							: role === "FISCAL"
								? "Solo Admin, Coordinador o Supervisor del grupo agregan/quitan asistentes."
								: role === "COORDINATOR"
									? "Solo el Coordinador titular del grupo de la jornada puede gestionar asistentes."
									: role === "SUPERVISOR"
										? "Solo puedes gestionar asistentes en jornadas de tu propio grupo."
										: "No tiene permisos para gestionar asistentes."
					}
				/>
			)}
			{canEdit && (
				<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
					<CardHeader>
						<CardTitle>Agregar asistente</CardTitle>
						<CardDescription>
							Interno SAC: selecciona un usuario del grupo. Externo: captura datos del invitado.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="inline-flex rounded-lg overflow-hidden border border-slate-700">
							<button
								onClick={() => {
									setTipo("INTERNO_SAC");
									limpiarForm();
								}}
								className={`px-3 py-1.5 text-sm ${tipo === "INTERNO_SAC" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300"}`}
							>
								Interno SAC
							</button>
							<button
								onClick={() => {
									setTipo("EXTERNO_LIBRE");
									limpiarForm();
								}}
								className={`px-3 py-1.5 text-sm ${tipo === "EXTERNO_LIBRE" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300"}`}
							>
								Externo (campo libre)
							</button>
						</div>

						{tipo === "INTERNO_SAC" ? (
							<div className="space-y-2 max-w-xl">
								<input
									className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
									placeholder="Buscar fiscal/supervisor/coordinador del grupo..."
									value={q}
									onChange={(e) => {
										setQ(e.target.value);
										setSeleccionado(null);
									}}
								/>
								{opciones.length > 0 && !seleccionado && (
									<ul className="rounded border border-slate-700 bg-slate-950 max-h-56 overflow-y-auto divide-y divide-slate-800">
										{opciones.map((u) => (
											<li
												key={u.id}
												onClick={() => {
													setSeleccionado(u);
													setQ(u.name);
													setOpciones([]);
												}}
												className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-800"
											>
												<div className="text-slate-100">{u.name}</div>
												<div className="text-xs text-slate-400">
													{u.role} · {u.email}
												</div>
											</li>
										))}
									</ul>
								)}
								{seleccionado && (
									<div className="rounded bg-blue-900/30 border border-blue-700 px-3 py-2 text-sm text-blue-100">
										Seleccionado: <strong>{seleccionado.name}</strong> ({seleccionado.role})
									</div>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
								<input
									className="border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
									placeholder="Nombre completo *"
									value={nombreLibre}
									onChange={(e) => setNombreLibre(e.target.value)}
								/>
								<input
									className="border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
									placeholder="Documento (cédula/RIF) *"
									value={documentoLibre}
									onChange={(e) => setDocumentoLibre(e.target.value)}
								/>
								<input
									className="border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
									placeholder="Cargo / rol"
									value={cargoLibre}
									onChange={(e) => setCargoLibre(e.target.value)}
								/>
								<input
									className="border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
									placeholder="Organización"
									value={organizacionLibre}
									onChange={(e) => setOrganizacionLibre(e.target.value)}
								/>
								<input
									className="border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm md:col-span-2"
									placeholder="Teléfono"
									value={telefonoLibre}
									onChange={(e) => setTelefonoLibre(e.target.value)}
								/>
							</div>
						)}

						{err && <p className="text-red-400 text-sm">{err}</p>}

						<div className="flex items-center gap-2">
							<button
								onClick={onAgregar}
								disabled={busy === "add"}
								className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
							>
								{busy === "add" ? "Agregando..." : "Agregar asistente"}
							</button>
						</div>
					</CardContent>
				</Card>
			)}

			<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
				<CardHeader>
					<CardTitle>Equipo / asistentes</CardTitle>
					<CardDescription>{asistentes.length} registrados en esta jornada.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Tipo</TableHead>
								<TableHead>Nombre</TableHead>
								<TableHead>Documento / Email</TableHead>
								<TableHead>Cargo</TableHead>
								<TableHead>Organización / Rol</TableHead>
								{canEdit && <TableHead>Acción</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{asistentes.map((a) => (
								<TableRow key={a.id}>
									<TableCell>
										<span
											className={`px-2 py-0.5 rounded text-[11px] ${
												a.tipo === "INTERNO_SAC"
													? "bg-sky-900/40 text-sky-300"
													: "bg-amber-900/40 text-amber-300"
											}`}
										>
											{a.tipo === "INTERNO_SAC" ? "Interno SAC" : "Externo"}
										</span>
									</TableCell>
									<TableCell>{a.tipo === "INTERNO_SAC" ? a.user?.name ?? "—" : a.nombreLibre ?? "—"}</TableCell>
									<TableCell>
										{a.tipo === "INTERNO_SAC" ? "—" : a.documentoLibre ?? "—"}
									</TableCell>
									<TableCell>{a.tipo === "INTERNO_SAC" ? "—" : a.cargoLibre ?? "—"}</TableCell>
									<TableCell>
										{a.tipo === "INTERNO_SAC" ? a.user?.role ?? "—" : a.organizacionLibre ?? "—"}
									</TableCell>
									{canEdit && (
										<TableCell>
											<button
												onClick={() => onQuitar(a.id)}
												disabled={busy === a.id}
												className="px-2 py-1 rounded bg-rose-600 text-white text-xs disabled:opacity-60"
											>
												{busy === a.id ? "..." : "Quitar"}
											</button>
										</TableCell>
									)}
								</TableRow>
							))}
							{asistentes.length === 0 && (
								<TableRow>
									<TableCell colSpan={canEdit ? 6 : 5} className="text-center text-slate-500 py-6">
										Aún no hay asistentes registrados.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

/* ─── Visitas ─── */

function VisitasTab({
	divulgacionId,
	visitas,
	canEdit,
	currentUserId,
	isAdmin,
	onChanged,
	role,
	isAbierta,
	fiscalEsAsistente,
}: {
	divulgacionId: string;
	visitas: Visita[];
	canEdit: boolean;
	currentUserId: string;
	isAdmin: boolean;
	onChanged: () => Promise<void> | void;
	role: string;
	isAbierta: boolean;
	fiscalEsAsistente: boolean;
}) {
	const [rif, setRif] = useState("");
	const [tipoActividad, setTipoActividad] = useState("Panadería");
	const [tipoActividadOtro, setTipoActividadOtro] = useState("");
	const [direccion, setDireccion] = useState("");
	const [notas, setNotas] = useState("");
	const [nombreCapturado, setNombreCapturado] = useState("");
	const [busy, setBusy] = useState<string | null>(null);
	const [err, setErr] = useState("");

	const [rifInfo, setRifInfo] = useState<RifFeedbackInfo>({ state: "idle" });

	const onRifBlur = async () => {
		const trimmed = rif.trim();
		if (!trimmed) {
			setRifInfo({ state: "idle" });
			return;
		}
		try {
			setRifInfo({ state: "checking" });
			const r = await checkTaxpayerByRif(trimmed);
			if (r?.exists && r.taxpayer) {
				setRifInfo({ state: "exists", taxpayer: r.taxpayer });
				if (!nombreCapturado) setNombreCapturado(r.taxpayer.name ?? "");
			} else {
				setRifInfo({ state: "new" });
			}
		} catch (e: any) {
			setRifInfo({ state: "error", message: e?.message ?? "No se pudo validar el RIF." });
		}
	};

	const onAgregar = async () => {
		try {
			setErr("");
			setBusy("add");
			const tipoFinal = tipoActividad === "Otro" ? tipoActividadOtro.trim() : tipoActividad;
			if (!rif.trim() || tipoFinal.length < 2) {
				setErr("RIF y tipo de actividad son obligatorios.");
				return;
			}
			await addVisita(divulgacionId, {
				rif: rif.trim(),
				tipoActividad: tipoFinal,
				taxpayerId: rifInfo.state === "exists" ? rifInfo.taxpayer.id : null,
				nombreCapturado: nombreCapturado.trim() || undefined,
				direccionSector: direccion.trim() || undefined,
				notas: notas.trim() || undefined,
			});
			setRif("");
			setNombreCapturado("");
			setDireccion("");
			setNotas("");
			setTipoActividadOtro("");
			setTipoActividad("Panadería");
			setRifInfo({ state: "idle" });
			await onChanged();
		} catch (e: any) {
			setErr(e?.response?.data?.error ?? e?.message ?? "No se pudo agregar la visita.");
		} finally {
			setBusy(null);
		}
	};

	const onQuitar = async (visitaId: string) => {
		try {
			setBusy(visitaId);
			await removeVisita(divulgacionId, visitaId);
			await onChanged();
		} finally {
			setBusy(null);
		}
	};

	const reasonNoEdit = !isAbierta
		? "La jornada está cerrada. Pide a un Admin que la reabra para registrar contribuyentes."
		: role === "FISCAL" && !fiscalEsAsistente
			? "Solo registras visitas en jornadas donde el Coordinador te haya añadido como asistente."
			: role === "COORDINATOR"
				? "El registro de contribuyentes lo hace cada Fiscal asistente. Coordinador no captura visitas."
				: role === "SUPERVISOR"
					? "Tu rol Supervisor es solo de lectura."
					: "No tiene permisos para registrar visitas en esta jornada.";

	return (
		<div className="space-y-4">
			{!canEdit && (
				<PermissionHint
					title="No puedes registrar contribuyentes en esta jornada"
					descr={reasonNoEdit}
					tone="warn"
				/>
			)}
			{canEdit && (
				<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
					<CardHeader>
						<CardTitle>Registrar contribuyente visitado</CardTitle>
						<CardDescription>
							Captura el RIF; al perder el foco te indicamos si ya existe en el SAC.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 max-w-3xl">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium mb-1">RIF *</label>
								<input
									className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 uppercase"
									placeholder="J123456789"
									value={rif}
									onChange={(e) => {
										setRif(e.target.value.toUpperCase());
										if (rifInfo.state !== "idle") setRifInfo({ state: "idle" });
									}}
									onBlur={onRifBlur}
								/>
								<RifFeedback info={rifInfo} />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Tipo de actividad *</label>
								<select
									className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
									value={tipoActividad}
									onChange={(e) => setTipoActividad(e.target.value)}
								>
									{ACTIVIDADES_SUGERIDAS.map((a) => (
										<option key={a} value={a}>
											{a}
										</option>
									))}
								</select>
								{tipoActividad === "Otro" && (
									<input
										className="mt-2 w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
										placeholder="Especifique tipo de actividad"
										value={tipoActividadOtro}
										onChange={(e) => setTipoActividadOtro(e.target.value)}
									/>
								)}
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">
								Nombre del contribuyente {rifInfo.state === "exists" ? "(cargado del SAC)" : "(opcional)"}
							</label>
							<input
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
								value={nombreCapturado}
								onChange={(e) => setNombreCapturado(e.target.value)}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Dirección / sector</label>
							<input
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
								value={direccion}
								onChange={(e) => setDireccion(e.target.value)}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Notas</label>
							<textarea
								rows={2}
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
								value={notas}
								onChange={(e) => setNotas(e.target.value)}
							/>
						</div>

						{err && <p className="text-red-400 text-sm">{err}</p>}

						<button
							onClick={onAgregar}
							disabled={busy === "add"}
							className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
						>
							{busy === "add" ? "Registrando..." : "Registrar visita"}
						</button>
					</CardContent>
				</Card>
			)}

			<Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
				<CardHeader>
					<CardTitle>Contribuyentes visitados</CardTitle>
					<CardDescription>{visitas.length} en esta jornada.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>RIF</TableHead>
								<TableHead>Nombre</TableHead>
								<TableHead>Actividad</TableHead>
								<TableHead>SAC</TableHead>
								<TableHead>Dirección</TableHead>
								<TableHead>Registró</TableHead>
								{canEdit && <TableHead>Acción</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{visitas.map((v) => (
								<TableRow key={v.id}>
									<TableCell className="font-mono text-xs">{v.rifCapturado}</TableCell>
									<TableCell>{v.nombreCapturado ?? v.taxpayer?.name ?? "—"}</TableCell>
									<TableCell>{v.tipoActividad}</TableCell>
									<TableCell>
										{v.yaRegistradoEnSac ? (
											<span className="px-2 py-0.5 rounded text-[11px] bg-emerald-900/40 text-emerald-300">
												Registrado
											</span>
										) : (
											<span className="px-2 py-0.5 rounded text-[11px] bg-amber-900/40 text-amber-300">
												Nuevo
											</span>
										)}
									</TableCell>
									<TableCell className="max-w-[16rem] truncate">{v.direccionSector ?? "—"}</TableCell>
									<TableCell>{v.creadoPor?.name ?? "—"}</TableCell>
									{canEdit && (
										<TableCell>
											{(isAdmin || v.creadoPor?.id === currentUserId) && (
												<button
													onClick={() => onQuitar(v.id)}
													disabled={busy === v.id}
													className="px-2 py-1 rounded bg-rose-600 text-white text-xs disabled:opacity-60"
												>
													{busy === v.id ? "..." : "Quitar"}
												</button>
											)}
										</TableCell>
									)}
								</TableRow>
							))}
							{visitas.length === 0 && (
								<TableRow>
									<TableCell colSpan={canEdit ? 7 : 6} className="text-center text-slate-500 py-6">
										Aún no hay visitas registradas.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

type RifTaxpayerLite = {
	id: string;
	rif: string;
	name: string;
	contract_type?: string;
	process?: string;
	emition_date?: string;
};

type RifFeedbackInfo =
	| { state: "idle" }
	| { state: "checking" }
	| { state: "exists"; taxpayer: RifTaxpayerLite }
	| { state: "new" }
	| { state: "error"; message: string };

function RifFeedback({ info }: { info: RifFeedbackInfo }) {
	if (info.state === "idle") return null;
	if (info.state === "checking") {
		return <p className="mt-1 text-xs text-slate-400">Validando RIF...</p>;
	}
	if (info.state === "error") {
		return <p className="mt-1 text-xs text-rose-400">{info.message}</p>;
	}
	if (info.state === "new") {
		return (
			<div className="mt-1 rounded bg-amber-900/30 border border-amber-700 px-2 py-1 text-xs text-amber-100">
				No registrado en el SAC. Se creará la visita capturando los datos manualmente.
			</div>
		);
	}
	const t = info.taxpayer;
	return (
		<div className="mt-1 rounded bg-emerald-900/30 border border-emerald-700 px-2 py-1 text-xs text-emerald-100">
			<div className="font-semibold">{t.name}</div>
			<div>
				RIF: <span className="font-mono">{t.rif}</span>
				{t.contract_type ? ` · ${t.contract_type}` : ""}
				{t.process ? ` · ${t.process}` : ""}
			</div>
		</div>
	);
}
