import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/UI/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/UI/select";
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
		<Card className="rounded-2xl">
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
					<p className="text-muted-foreground text-sm">Cargando jornadas activas...</p>
				) : loadErr ? (
					<p className="text-destructive text-sm">{loadErr}</p>
				) : jornadas.length === 0 ? (
					<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-400">
						<div className="font-semibold mb-1">No hay jornadas abiertas</div>
						<div>
							{role === "COORDINATOR" || role === "ADMIN"
								? "Crea una nueva jornada para empezar a asignar el equipo."
								: "El Coordinador del grupo debe abrir una jornada para que puedas asignar equipo."}
						</div>
					</div>
				) : (
					<>
						<div>
							<label className="block text-xs font-medium mb-1">
								Jornada (parroquia · fecha · grupo)
							</label>
							<Select value={selectedId} onValueChange={(v) => { setSelectedId(v); limpiar(); }}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{jornadas.map((j) => (
										<SelectItem key={j.id} value={j.id}>
											{PARROQUIA_LABELS[j.parroquia]} · {j.fecha?.slice(0, 10)}
											{j.fiscalGroup?.name ? ` · ${j.fiscalGroup.name}` : ""}
											{j._count ? ` · ${j._count.asistentes} asistentes` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selected && (
								<div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
									{selected.ubicacionReferencia && (
										<span>{selected.ubicacionReferencia}</span>
									)}
									<Button
										type="button"
										variant="link"
										size="sm"
										onClick={() => navigate(`/divulgacion-presencia-fiscal/${selected.id}`)}
										className="ml-auto"
									>
										Abrir detalle →
									</Button>
								</div>
							)}
						</div>

						<div className="inline-flex rounded-lg overflow-hidden border">
							<Button
								variant={tipo === "INTERNO_SAC" ? "default" : "ghost"}
								size="sm"
								onClick={() => { setTipo("INTERNO_SAC"); limpiar(); }}
								className="rounded-none"
							>
								Interno SAC
							</Button>
							<Button
								variant={tipo === "EXTERNO_LIBRE" ? "default" : "ghost"}
								size="sm"
								onClick={() => { setTipo("EXTERNO_LIBRE"); limpiar(); }}
								className="rounded-none"
							>
								Externo (campo libre)
							</Button>
						</div>

						{tipo === "INTERNO_SAC" ? (
							<div className="space-y-2">
								<input
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									placeholder="Buscar fiscal/supervisor/coordinador del grupo..."
									value={q}
									onChange={(e) => {
										setQ(e.target.value);
										setSeleccionado(null);
									}}
								/>
								{opciones.length > 0 && !seleccionado && (
									<ul className="rounded-md border border-border bg-card max-h-56 overflow-y-auto divide-y divide-border">
										{opciones.map((u) => (
											<li
												key={u.id}
												onClick={() => {
													setSeleccionado(u);
													setQ(u.name);
													setOpciones([]);
												}}
												className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
											>
												<div className="text-foreground">{u.name}</div>
												<div className="text-xs text-muted-foreground">
													{u.role} · {u.email}
												</div>
											</li>
										))}
									</ul>
								)}
								{seleccionado && (
									<div className="rounded-md bg-accent border px-3 py-2 text-sm flex items-center justify-between">
										<span>
											Seleccionado: <strong>{seleccionado.name}</strong> ({seleccionado.role})
										</span>
										<Button
											variant="link"
											size="sm"
											onClick={() => { setSeleccionado(null); setQ(""); }}
										>
											cambiar
										</Button>
									</div>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-medium mb-1">
										Nombre completo *
									</label>
									<input
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										value={nombreLibre}
										onChange={(e) => setNombreLibre(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1">
										Documento (cédula/RIF) *
									</label>
									<input
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										value={documentoLibre}
										onChange={(e) => setDocumentoLibre(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1">
										Cargo / rol
									</label>
									<input
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										value={cargoLibre}
										onChange={(e) => setCargoLibre(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1">
										Organización
									</label>
									<input
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										value={organizacionLibre}
										onChange={(e) => setOrganizacionLibre(e.target.value)}
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-xs font-medium mb-1">
										Teléfono
									</label>
									<input
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										value={telefonoLibre}
										onChange={(e) => setTelefonoLibre(e.target.value)}
									/>
								</div>
							</div>
						)}

						{err && <p className="text-destructive text-sm">{err}</p>}
						{okMsg && (
							<p className="text-emerald-400 text-sm flex items-center gap-1">
								<span>✓</span>
								{okMsg}
							</p>
						)}

						<div className="flex items-center gap-2">
							<Button onClick={onSubmit} disabled={busy}>
								{busy ? "Agregando..." : "Agregar al equipo"}
							</Button>
							<Button variant="outline" onClick={limpiar} disabled={busy}>
								Limpiar
							</Button>
							{selected && (
								<Button
									variant="link"
									size="sm"
									onClick={() => navigate(`/divulgacion-presencia-fiscal/${selected.id}`)}
									className="ml-auto"
								>
									Ver equipo completo →
								</Button>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
