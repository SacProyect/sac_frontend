import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/UI/v2";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/UI/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import { Badge } from "@/components/UI/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/UI/dialog";
import { Skeleton } from "@/components/UI/skeleton";
import {
	listDocuments,
	deleteDocument,
	downloadDocument,
	changeDocumentScope,
	shareDocumentWith,
	unshareDocumentFrom,
	listFiscalGroups,
	formatFileSize,
	getScopeLabel,
	getFileIcon,
	type ListDocumentsQuery,
} from "@/components/utils/api/documentos-functions";
import type { DocumentItem, DocumentScope, DocumentTab, FiscalGroupInfo } from "@/types/documents";
import { Trash2, Download, Upload, Search, FileText, Share2, X } from "lucide-react";
import toast from "react-hot-toast";

const TAB_LABELS: Record<string, string> = {
	mine: "Mis documentos",
	shared: "Compartidos con mi coordinación",
	all: "Todos los compartidos",
};

const SCOPE_BADGE_CLASSES: Record<string, string> = {
	PRIVATE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
	SHARED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function DocumentosPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = (searchParams.get("tab") as DocumentTab) || "mine";

	const role = user?.role ?? "";

	// Determinar tabs según rol
	const tabs = useMemo(() => {
		if (role === "ADMIN") {
			return ["mine", "shared", "all"] as DocumentTab[];
		}
		// COORDINATOR: solo mine y shared (su coordinación)
		return ["mine", "shared"] as DocumentTab[];
	}, [role]);

	// Asegurar que el tab actual sea válido
	const currentTab = tabs.includes(tabParam) ? tabParam : (tabs[0] ?? "mine");

	// Estados
	const [items, setItems] = useState<DocumentItem[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Filtros
	const [q, setQ] = useState("");
	const [desde, setDesde] = useState("");
	const [hasta, setHasta] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 20;

	// Modal de detalle
	const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [busy, setBusy] = useState<string | null>(null);

	// Modal de compartir
	const [shareOpen, setShareOpen] = useState(false);
	const [fiscalGroups, setFiscalGroups] = useState<FiscalGroupInfo[]>([]);
	const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
	const [loadingGroups, setLoadingGroups] = useState(false);

	const fetchDocuments = useCallback(
		async (overrideTab?: DocumentTab) => {
			try {
				setLoading(true);
				setError("");
				const query: ListDocumentsQuery = {
					tab: overrideTab ?? currentTab,
					page,
					pageSize,
				};
				if (q.trim()) query.q = q.trim();
				if (desde) query.desde = desde;
				if (hasta) query.hasta = hasta;

				const result = await listDocuments(query);
				setItems(Array.isArray(result.items) ? result.items : []);
				setTotal(typeof result.total === "number" ? result.total : 0);
			} catch (e: any) {
				setError(e?.message ?? "No se pudieron cargar los documentos.");
			} finally {
				setLoading(false);
			}
		},
		[currentTab, page, pageSize, q, desde, hasta],
	);

	// Resetear página y limpiar datos al cambiar de tab
	useEffect(() => {
		setPage(1);
		setItems([]);
		setError("");
	}, [currentTab]);

	useEffect(() => {
		fetchDocuments();
	}, [fetchDocuments]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		fetchDocuments();
	};

	const clearFilters = () => {
		setQ("");
		setDesde("");
		setHasta("");
		setPage(1);
	};

	const handleDelete = async (id: string) => {
		if (!window.confirm("¿Eliminar este documento?")) return;
		try {
			setBusy(id);
			await deleteDocument(id);
			toast.success("Documento eliminado");
			setDetailOpen(false);
			fetchDocuments();
		} catch (e: any) {
			toast.error(e?.message ?? "No se pudo eliminar.");
		} finally {
			setBusy(null);
		}
	};

	const handleDownload = async (id: string) => {
		try {
			const result = await downloadDocument(id);
			if (result?.data?.url) {
				window.open(result.data.url, "_blank");
			}
		} catch (e: any) {
			toast.error(e?.message ?? "No se pudo descargar.");
		}
	};

	const handleChangeScope = async (id: string, scope: DocumentScope) => {
		try {
			setBusy(`scope-${id}`);
			await changeDocumentScope(id, scope);
			toast.success("Visibilidad actualizada");
			setDetailOpen(false);
			fetchDocuments();
		} catch (e: any) {
			toast.error(e?.message ?? "No se pudo actualizar.");
		} finally {
			setBusy(null);
		}
	};

	// Abrir modal de compartir
	const openShareModal = async (doc: DocumentItem) => {
		setSelectedDoc(doc);
		setSelectedGroups(doc.sharedWith?.map((s) => s.fiscalGroup.id) ?? []);
		setShareOpen(true);
		if (fiscalGroups.length === 0) {
			setLoadingGroups(true);
			try {
				const result = await listFiscalGroups();
				setFiscalGroups(result.data ?? []);
			} catch (e: any) {
				toast.error("No se pudieron cargar las coordinaciones");
			} finally {
				setLoadingGroups(false);
			}
		}
	};

	// Guardar cambios de compartición
	const handleSaveShare = async () => {
		if (!selectedDoc) return;
		try {
			setBusy(`share-${selectedDoc.id}`);

			const currentIds = selectedDoc.sharedWith?.map((s) => s.fiscalGroup.id) ?? [];

			// Grupos a agregar
			const toAdd = selectedGroups.filter((id) => !currentIds.includes(id));
			if (toAdd.length > 0) {
				await shareDocumentWith(selectedDoc.id, toAdd);
			}

			// Grupos a quitar
			const toRemove = currentIds.filter((id) => !selectedGroups.includes(id));
			for (const gId of toRemove) {
				await unshareDocumentFrom(selectedDoc.id, gId);
			}

			toast.success("Compartido actualizado");
			setShareOpen(false);
			setDetailOpen(false);
			fetchDocuments();
		} catch (e: any) {
			toast.error(e?.message ?? "Error al actualizar compartición");
		} finally {
			setBusy(null);
		}
	};

	const getMimeLabel = (mime: string): string => {
		if (mime.includes("pdf")) return "PDF";
		if (mime.includes("word") || mime.includes("document")) return "DOCX";
		if (mime.includes("excel") || mime.includes("spreadsheet")) return "XLSX";
		if (mime.includes("image")) return "IMG";
		if (mime.includes("text")) return "TXT";
		return "FILE";
	};

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return (
		<div className="space-y-6 w-full max-w-full overflow-x-hidden">
			<PageHeader
				title="Documentos"
				description="Administración de documentos del sistema"
				action={
					<Button onClick={() => navigate("/documentos/subir")}>
						<Upload className="w-4 h-4 mr-2" />
						Subir documento
					</Button>
				}
			/>

			{/* Error banner */}
			{error && (
				<div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-3">
					<span className="flex-1">{error}</span>
					<Button variant="outline" size="sm" onClick={() => fetchDocuments()}>
						Reintentar
					</Button>
				</div>
			)}

			{/* Tabs según rol */}
			<Tabs
				value={currentTab}
				onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
				className="w-full"
			>
				<TabsList className="bg-slate-900/60 border border-slate-800/50 p-1 rounded-xl gap-1 h-auto w-full sm:w-auto overflow-x-auto">
					{tabs.map((tab) => (
						<TabsTrigger
							key={tab}
							value={tab}
							className="px-4 py-2 data-[state=active]:shadow-sm transition-all rounded-lg whitespace-nowrap"
						>
							{TAB_LABELS[tab]}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value={currentTab} className="mt-6 space-y-4">
					{/* Filtros */}
					<Card className="rounded-2xl">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">Filtros</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
								<div className="flex-1 min-w-[12rem] w-full sm:w-auto">
									<label className="block text-xs text-muted-foreground mb-1">Buscar</label>
									<div className="relative">
										<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Nombre del documento..."
											value={q}
											onChange={(e) => setQ(e.target.value)}
											className="pl-8"
										/>
									</div>
								</div>
								<div className="w-full sm:w-auto">
									<label className="block text-xs text-muted-foreground mb-1">Desde</label>
									<Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full sm:w-36" />
								</div>
								<div className="w-full sm:w-auto">
									<label className="block text-xs text-muted-foreground mb-1">Hasta</label>
									<Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full sm:w-36" />
								</div>
								<div className="flex gap-2 w-full sm:w-auto">
									<Button type="submit" size="sm" className="flex-1 sm:flex-none">
										Aplicar
									</Button>
									<Button type="button" variant="outline" size="sm" onClick={clearFilters} className="flex-1 sm:flex-none">
										Limpiar
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Tabla de documentos */}
					<Card className="rounded-2xl">
						<CardContent className="p-0">
							{loading ? (
								<div className="p-6 space-y-3">
									{Array.from({ length: 5 }).map((_, i) => (
										<Skeleton key={i} className="h-12 w-full" />
									))}
								</div>
							) : items.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 text-center">
									<FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
									<p className="text-muted-foreground font-medium">No hay documentos</p>
									<p className="text-sm text-muted-foreground/60 mt-1">
										Sube tu primer documento para comenzar
									</p>
									<Button
										variant="outline"
										className="mt-4"
										onClick={() => navigate("/documentos/subir")}
									>
										<Upload className="w-4 h-4 mr-2" />
										Subir documento
									</Button>
								</div>
							) : (
								<>
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="min-w-[14rem]">Documento</TableHead>
													<TableHead className="min-w-[5rem]">Tipo</TableHead>
													<TableHead className="min-w-[7rem]">Scope</TableHead>
													<TableHead className="min-w-[5rem]">Tamaño</TableHead>
													<TableHead className="min-w-[6rem]">Fecha</TableHead>
													<TableHead className="min-w-[8rem]">Remitente</TableHead>
													<TableHead className="min-w-[10rem]">Compartido con</TableHead>
													<TableHead className="text-right min-w-[6rem]">Acciones</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{items.map((doc) => (
													<TableRow
														key={doc.id}
														className="cursor-pointer"
														onClick={() => {
															setSelectedDoc(doc);
															setDetailOpen(true);
														}}
													>
														<TableCell>
															<div className="flex items-center gap-3">
																<span className="text-lg shrink-0">{getFileIcon(doc.mimeType)}</span>
																<div className="min-w-0">
																	<p className="text-sm font-medium truncate max-w-[180px] sm:max-w-[220px]">
																		{doc.name}
																	</p>
																	<p className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[220px]">
																		{doc.originalName}
																	</p>
																</div>
															</div>
														</TableCell>
														<TableCell>
															<span className="text-xs font-mono text-muted-foreground">
																{getMimeLabel(doc.mimeType)}
															</span>
														</TableCell>
														<TableCell>
															<Badge variant="outline" className={`${SCOPE_BADGE_CLASSES[doc.scope]}`}>
																{getScopeLabel(doc.scope)}
															</Badge>
														</TableCell>
														<TableCell className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
															{formatFileSize(doc.fileSize)}
														</TableCell>
														<TableCell className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
															{new Date(doc.createdAt).toLocaleDateString()}
														</TableCell>
														<TableCell className="text-sm">{doc.uploadedBy?.name ?? doc.owner?.name ?? "—"}</TableCell>
														<TableCell className="text-sm">
															{doc.sharedWith && doc.sharedWith.length > 0 ? (
																<div className="flex flex-wrap gap-1">
																	{doc.sharedWith.map((sw) => (
																		<Badge key={sw.fiscalGroup.id} variant="outline" className="text-[10px] px-1.5 py-0">
																			{sw.fiscalGroup.name}
																		</Badge>
																	))}
																</div>
															) : doc.scope === "SHARED" ? (
																<Badge variant="outline" className="text-[10px] px-1.5 py-0">
																	Administración
																</Badge>
															) : (
																<span className="text-muted-foreground/60">—</span>
															)}
														</TableCell>
														<TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
															<div className="flex items-center justify-end gap-1">
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => handleDownload(doc.id)}
																	title="Descargar"
																>
																	<Download className="h-4 w-4" />
																</Button>
																{doc.ownerId === user?.id && doc.scope === "SHARED" && (
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() => openShareModal(doc)}
																		title="Compartir con coordinaciones"
																	>
																		<Share2 className="h-4 w-4" />
																	</Button>
																)}
																{doc.ownerId === user?.id && (
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() => handleDelete(doc.id)}
																		disabled={busy === doc.id}
																		className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
																		title="Eliminar"
																	>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																)}
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>

									{/* Paginación */}
									{total > pageSize && (
										<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 text-sm border-t border-border">
											<span className="text-muted-foreground">
												Página {page} de {totalPages} · {total} documentos
											</span>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													disabled={page <= 1}
													onClick={() => setPage((p) => Math.max(1, p - 1))}
												>
													Anterior
												</Button>
												<Button
													variant="outline"
													size="sm"
													disabled={page * pageSize >= total}
													onClick={() => setPage((p) => p + 1)}
												>
													Siguiente
												</Button>
											</div>
										</div>
									)}
								</>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Modal de detalle del documento */}
			<Dialog open={detailOpen} onOpenChange={setDetailOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<span className="text-lg">{selectedDoc ? getFileIcon(selectedDoc.mimeType) : ""}</span>
							{selectedDoc?.name}
						</DialogTitle>
						<DialogDescription>
							{selectedDoc?.originalName}
						</DialogDescription>
					</DialogHeader>

					{selectedDoc && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-muted-foreground text-xs">Tipo</p>
									<p className="font-medium">{getMimeLabel(selectedDoc.mimeType)}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Tamaño</p>
									<p className="font-medium tabular-nums">{formatFileSize(selectedDoc.fileSize)}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Scope</p>
									<Badge variant="outline" className={`${SCOPE_BADGE_CLASSES[selectedDoc.scope]}`}>
										{getScopeLabel(selectedDoc.scope)}
									</Badge>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Subido</p>
									<p className="font-medium tabular-nums">
										{new Date(selectedDoc.createdAt).toLocaleDateString()}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Propietario</p>
									<p className="font-medium">{selectedDoc.owner?.name ?? "—"}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Subido por</p>
									<p className="font-medium">{selectedDoc.uploadedBy?.name ?? "—"}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Coordinación</p>
									<p className="font-medium">{selectedDoc.uploadedBy?.group?.name ?? selectedDoc.owner?.group?.name ?? "—"}</p>
								</div>
								<div className="col-span-2">
									<p className="text-muted-foreground text-xs mb-1">Compartido con</p>
									{selectedDoc.sharedWith && selectedDoc.sharedWith.length > 0 ? (
										<div className="flex flex-wrap gap-1">
											{selectedDoc.sharedWith.map((sw) => (
												<Badge key={sw.fiscalGroup.id} variant="outline" className="text-xs">
													{sw.fiscalGroup.name}
												</Badge>
											))}
										</div>
									) : selectedDoc.scope === "SHARED" ? (
										<Badge variant="outline" className="text-xs">
											Administración
										</Badge>
									) : (
										<p className="text-sm text-muted-foreground/60">No compartido</p>
									)}
								</div>
							</div>

							{/* Cambiar scope (solo owner) */}
							{selectedDoc.ownerId === user?.id && (
								<div className="pt-4 border-t border-border space-y-2">
									<p className="text-xs text-muted-foreground">Cambiar visibilidad:</p>
									<div className="flex flex-wrap gap-2">
										{selectedDoc.scope === "SHARED" ? (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleChangeScope(selectedDoc.id, "PRIVATE")}
												disabled={busy === `scope-${selectedDoc.id}`}
											>
												Hacer Privado
											</Button>
										) : (
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setDetailOpen(false);
													openShareModal(selectedDoc);
												}}
												disabled={busy === `scope-${selectedDoc.id}`}
											>
												<Share2 className="w-3 h-3 mr-1" />
												Compartir con coordinaciones
											</Button>
										)}
									</div>
								</div>
							)}
						</div>
					)}

					<DialogFooter className="gap-2 mt-2">
						<Button
							variant="outline"
							onClick={() => selectedDoc && handleDownload(selectedDoc.id)}
						>
							<Download className="w-4 h-4 mr-2" />
							Descargar
						</Button>
						{selectedDoc && selectedDoc.ownerId === user?.id && (
							<Button
								variant="destructive"
								onClick={() => handleDelete(selectedDoc.id)}
								disabled={busy === selectedDoc?.id}
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Eliminar
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal de compartir con coordinaciones */}
			<Dialog open={shareOpen} onOpenChange={setShareOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Compartir documento</DialogTitle>
						<DialogDescription>
							Selecciona las coordinaciones con las que quieres compartir este documento
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 max-h-60 overflow-y-auto">
						{loadingGroups ? (
							<div className="space-y-2">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
						) : fiscalGroups.length === 0 ? (
							<p className="text-sm text-muted-foreground">No hay coordinaciones disponibles</p>
						) : (
							fiscalGroups.map((fg) => (
								<label
									key={fg.id}
									className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${selectedGroups.includes(fg.id) ? "border-indigo-500 bg-indigo-500/10" : "border-border hover:border-muted-foreground/30"}`}
								>
									<input
										type="checkbox"
										className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
										checked={selectedGroups.includes(fg.id)}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedGroups([...selectedGroups, fg.id]);
											} else {
												setSelectedGroups(selectedGroups.filter((id) => id !== fg.id));
											}
										}}
									/>
									<div>
										<p className="text-sm font-medium">{fg.name}</p>
									</div>
								</label>
							))
						)}
					</div>

					<DialogFooter className="gap-2 mt-4">
						<Button variant="outline" onClick={() => setShareOpen(false)} disabled={busy !== null}>
							Cancelar
						</Button>
						<Button
							variant="default"
							onClick={handleSaveShare}
							disabled={busy !== null}
						>
							{busy ? "Guardando..." : "Guardar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
