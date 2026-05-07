import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/card";
import {
	addAsistentes,
	listDivulgaciones,
	listUsuariosAsignables,
	type AsistentePayload,
	type EstadoDivulgacion,
	type ParroquiaCaracas,
	type UsuarioAsignable,
} from "@/components/utils/api/divulgacion-functions";
import { PARROQUIA_LABELS } from "./parroquia-mapa-interactivo";

type JornadaItem = {
	id: string;
	parroquia: ParroquiaCaracas;
	fecha: string;
	estado: EstadoDivulgacion;
	ubicacionReferencia: string | null;
	fiscalGroup?: { id: string; name: string } | null;
	_count?: { asistentes: number; visitas: number };
};

/**
 * Panel "Asignar equipo a la jornada" para Coordinador / Supervisor / Admin.
 * Permite agregar asistentes (interno SAC del grupo o externo libre) sobre una
 * jornada ABIERTA sin entrar al detalle.
 */
export default function EquipoQuickAdd({
	role,
	onChanged,
}: {
	role: "ADMIN" | "COORDINATOR" | "SUPERVISOR" | string;
	onChanged?: () => void;
}) {
	const navigate = useNavigate();

	const [jornadas, setJornadas] = useState<JornadaItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadErr, setLoadErr] = useState("");
	const [selectedId, setSelectedId] = useState<string>("");

	const [tipo, setTipo] = useState<"INTERNO_SAC" | "EXTERNO_LIBRE">("INTERNO_SAC");

	// Interno SAC
	const [q, setQ] = useState("");
	const [opciones, setOpciones] = useState<UsuarioAsignable[]>([]);
	const [seleccionado, setSeleccionado] = useState<UsuarioAsignable | null>(null);

	// Externo
	const [nombreLibre, setNombreLibre] = useState("");
	const [documentoLibre, setDocumentoLibre] = useState("");
	const [cargoLibre, setCargoLibre] = useState("");
	const [organizacionLibre, setOrganizacionLibre] = useState("");
	const [telefonoLibre, setTelefonoLibre] = useState("");

	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState("");
	const [okMsg, setOkMsg] = useState("");

	const fetchJornadas = async () => {
		try {
			setLoading(true);
			setLoadErr("");
			const r = await listDivulgaciones({ estado: "ABIERTA", pageSize: 50 });
			const items: JornadaItem[] = r?.items ?? [];
			setJornadas(items);
			if (items.length > 0) {
				setSelectedId((prev) => (items.find((i) => i.id === prev) ? prev : items[0].id));
			} else {
				setSelectedId("");
			}
		} catch (e: any) {
			setLoadErr(e?.message ?? "No se pudieron cargar las jornadas activas.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchJornadas();
	}, []);

	const selected = useMemo(
		() => jornadas.find((j) => j.id === selectedId) ?? null,
		[jornadas, selectedId],
	);

	useEffect(() => {
		if (tipo !== "INTERNO_SAC" || !selectedId) return;
		let cancel = false;
		const t = window.setTimeout(async () => {
			try {
				const r = await listUsuariosAsignables({
					q: q.trim() || undefined,
					divulgacionId: selectedId,
					limit: 20,
				});
				if (!cancel) setOpciones(r?.items ?? []);
			} catch {
				if (!cancel) setOpciones([]);
			}
		}, 250);
		return () => {
			cancel = true;
			window.clearTimeout(t);
		};
	}, [q, tipo, selectedId]);

	const limpiar = () => {
		setSeleccionado(null);
		setQ("");
		setOpciones([]);
		setNombreLibre("");
		setDocumentoLibre("");
		setCargoLibre("");
		setOrganizacionLibre("");
		setTelefonoLibre("");
	};

	const onSubmit = async () => {
		try {
			setErr("");
			setOkMsg("");
			if (!selectedId) {
				setErr("Selecciona la jornada a la que agregarás asistentes.");
				return;
			}
			let payload: AsistentePayload;
			if (tipo === "INTERNO_SAC") {
				if (!seleccionado) {
					setErr("Selecciona un usuario SAC del grupo.");
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
			setBusy(true);
			await addAsistentes(selectedId, [payload]);
			limpiar();
			setOkMsg("Asistente agregado correctamente.");
			onChanged?.();
		} catch (e: any) {
			setErr(e?.response?.data?.error ?? e?.message ?? "No se pudo agregar el asistente.");
		} finally {
			setBusy(false);
		}
	};

	const roleBadge =
		role === "ADMIN"
			? { label: "ADMIN", cls: "bg-violet-500/20 text-violet-300 border-violet-600/40" }
			: role === "COORDINATOR"
				? { label: "COORDINADOR", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-600/40" }
				: { label: "SUPERVISOR", cls: "bg-blue-500/20 text-blue-300 border-blue-600/40" };

	return (
		<Card className="bg-slate-900/60 border-slate-800 rounded-2xl">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<span>Asignar equipo a la jornada</span>
					<span className={`px-1.5 py-0.5 rounded text-[10px] border ${roleBadge.cls}`}>
						{roleBadge.label}
					</span>
				</CardTitle>
				<CardDescription>
					Selecciona una jornada <strong>abierta</strong> y agrega rápidamente quienes asistirán
					(interno SAC del grupo o invitado externo). El listado se filtra automáticamente al
					grupo correspondiente.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{loading ? (
					<p className="text-slate-400 text-sm">Cargando jornadas activas...</p>
				) : loadErr ? (
					<p className="text-rose-400 text-sm">{loadErr}</p>
				) : jornadas.length === 0 ? (
					<div className="rounded-xl border border-amber-600/40 bg-amber-500/10 p-4 text-sm text-amber-100">
						<div className="font-semibold mb-1">No hay jornadas abiertas</div>
						<div className="text-amber-200/90">
							{role === "COORDINATOR" || role === "ADMIN"
								? "Crea una nueva jornada para empezar a asignar el equipo."
								: "El Coordinador del grupo debe abrir una jornada para que puedas asignar equipo."}
						</div>
					</div>
				) : (
					<>
						<div>
							<label className="block text-xs font-medium mb-1 text-slate-300">
								Jornada (parroquia · fecha · grupo)
							</label>
							<select
								className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700"
								value={selectedId}
								onChange={(e) => {
									setSelectedId(e.target.value);
									limpiar();
								}}
							>
								{jornadas.map((j) => (
									<option key={j.id} value={j.id}>
										{PARROQUIA_LABELS[j.parroquia]} · {j.fecha?.slice(0, 10)}
										{j.fiscalGroup?.name ? ` · ${j.fiscalGroup.name}` : ""}
										{j._count ? ` · ${j._count.asistentes} asistentes` : ""}
									</option>
								))}
							</select>
							{selected && (
								<div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
									{selected.ubicacionReferencia && (
										<span>📍 {selected.ubicacionReferencia}</span>
									)}
									<button
										type="button"
										onClick={() => navigate(`/divulgacion-presencia-fiscal/${selected.id}`)}
										className="ml-auto text-emerald-300 underline hover:text-emerald-200"
									>
										Abrir detalle →
									</button>
								</div>
							)}
						</div>

						<div className="inline-flex rounded-lg overflow-hidden border border-slate-700 shadow-sm">
							<button
								onClick={() => {
									setTipo("INTERNO_SAC");
									limpiar();
								}}
								className={`px-3 py-1.5 text-sm transition-colors ${
									tipo === "INTERNO_SAC"
										? "bg-emerald-600 text-white"
										: "bg-slate-900 text-slate-300 hover:bg-slate-800"
								}`}
							>
								Interno SAC
							</button>
							<button
								onClick={() => {
									setTipo("EXTERNO_LIBRE");
									limpiar();
								}}
								className={`px-3 py-1.5 text-sm transition-colors ${
									tipo === "EXTERNO_LIBRE"
										? "bg-emerald-600 text-white"
										: "bg-slate-900 text-slate-300 hover:bg-slate-800"
								}`}
							>
								Externo (campo libre)
							</button>
						</div>

						{tipo === "INTERNO_SAC" ? (
							<div className="space-y-2">
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
									<div className="rounded bg-emerald-900/30 border border-emerald-700 px-3 py-2 text-sm text-emerald-100 flex items-center justify-between">
										<span>
											Seleccionado: <strong>{seleccionado.name}</strong> ({seleccionado.role})
										</span>
										<button
											className="text-xs underline text-emerald-200 hover:text-white"
											onClick={() => {
												setSeleccionado(null);
												setQ("");
											}}
										>
											cambiar
										</button>
									</div>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-medium mb-1 text-slate-300">
										Nombre completo *
									</label>
									<input
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
										value={nombreLibre}
										onChange={(e) => setNombreLibre(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1 text-slate-300">
										Documento (cédula/RIF) *
									</label>
									<input
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
										value={documentoLibre}
										onChange={(e) => setDocumentoLibre(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1 text-slate-300">
										Cargo / rol
									</label>
									<input
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
										value={cargoLibre}
										onChange={(e) => setCargoLibre(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1 text-slate-300">
										Organización
									</label>
									<input
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
										value={organizacionLibre}
										onChange={(e) => setOrganizacionLibre(e.target.value)}
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-xs font-medium mb-1 text-slate-300">
										Teléfono
									</label>
									<input
										className="w-full border rounded px-3 py-2 bg-slate-950 border-slate-700 text-sm"
										value={telefonoLibre}
										onChange={(e) => setTelefonoLibre(e.target.value)}
									/>
								</div>
							</div>
						)}

						{err && <p className="text-rose-400 text-sm">{err}</p>}
						{okMsg && (
							<p className="text-emerald-400 text-sm flex items-center gap-1">
								<span>✓</span>
								{okMsg}
							</p>
						)}

						<div className="flex items-center gap-2">
							<button
								onClick={onSubmit}
								disabled={busy}
								className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm disabled:opacity-60 transition-colors shadow-md"
							>
								{busy ? "Agregando..." : "Agregar al equipo"}
							</button>
							<button
								onClick={limpiar}
								disabled={busy}
								className="px-3 py-2 rounded bg-slate-700 text-slate-100 text-sm"
							>
								Limpiar
							</button>
							{selected && (
								<button
									onClick={() => navigate(`/divulgacion-presencia-fiscal/${selected.id}`)}
									className="ml-auto text-xs text-blue-300 underline hover:text-blue-200"
								>
									Ver equipo completo →
								</button>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
