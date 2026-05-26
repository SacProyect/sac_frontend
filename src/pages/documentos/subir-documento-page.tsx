import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/UI/v2";
import { Button } from "@/components/UI/button";
import { Input } from "@/components/UI/input";
import { Card, CardContent } from "@/components/UI/card";
import { Label } from "@/components/UI/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";
import { useAuth } from "@/hooks/use-auth";
import { uploadDocument } from "@/components/utils/api/documentos-functions";
import type { DocumentScope } from "@/types/documents";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import toast from "react-hot-toast";

const SCOPE_OPTIONS: { value: DocumentScope; label: string; description: string }[] = [
	{ value: "PRIVATE", label: "Próximamente", description: "Disponible pronto" },
	{ value: "SHARED", label: "Compartido", description: "Visible para administradores" },
];

// Default to SHARED

const DEFAULT_SCOPE: DocumentScope = "SHARED";

const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"image/jpeg",
	"image/png",
	"image/gif",
	"text/plain",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function getMimeTypeAcceptString(): string {
	return ALLOWED_MIME_TYPES
		.map((mime) => {
			if (mime.includes("pdf")) return ".pdf";
			if (mime.includes("msword")) return ".doc";
			if (mime.includes("officedocument.wordprocessingml")) return ".docx";
			if (mime.includes("ms-excel")) return ".xls";
			if (mime.includes("officedocument.spreadsheetml")) return ".xlsx";
			if (mime.includes("jpeg")) return ".jpg,.jpeg";
			if (mime.includes("png")) return ".png";
			if (mime.includes("gif")) return ".gif";
			if (mime.includes("text")) return ".txt";
			return "";
		})
		.filter(Boolean)
		.join(",");
}

export default function SubirDocumentoPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const role = user?.role ?? "";
	const isAdmin = role === "ADMIN";

	const [file, setFile] = useState<File | null>(null);
	const [name, setName] = useState("");
	const [scope, setScope] = useState<DocumentScope>(DEFAULT_SCOPE);
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [sendToJefa, setSendToJefa] = useState(false);

	const handleFileChange = (selectedFile: File | null) => {
		if (!selectedFile) return;
		if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
			toast.error(`Tipo de archivo no soportado: ${selectedFile.type}`);
			return;
		}
		if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
			toast.error("El archivo no puede superar los 10MB");
			return;
		}
		setFile(selectedFile);
		if (!name) {
			setName(selectedFile.name.replace(/\.[^.]+$/, ""));
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		const droppedFile = e.dataTransfer.files[0];
		handleFileChange(droppedFile);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			toast.error("Selecciona un archivo");
			return;
		}
		if (!name.trim()) {
			toast.error("Ingresa un nombre para el documento");
			return;
		}
		// Simplified: SHARED no longer requires selecting groups (just sets SHARED for now)

		try {
			setUploading(true);
			const jefaFlag = !isAdmin ? sendToJefa : false;
			// When coordinator chooses "Jefa/Administración", scope is already "SHARED" from the selector
			await uploadDocument(file, name.trim(), scope, [], jefaFlag);
			toast.success("Documento subido exitosamente");
			navigate("/documentos");
		} catch (e: any) {
			toast.error(e?.response?.data?.error ?? e?.message ?? "Error al subir el documento");
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="space-y-6 w-full max-w-2xl mx-auto">
			<PageHeader
				title="Subir documento"
				description={isAdmin ? "Selecciona un archivo y configura su visibilidad" : "Sube un documento. Elige si es solo para ti o para Jefa/Administración."}
				action={
					<Button variant="outline" onClick={() => navigate("/documentos")}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Volver
					</Button>
				}
			/>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Drop zone / file selector */}
				<Card className="rounded-2xl">
					<CardContent className="p-6">
						<div
							className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-border hover:border-muted-foreground/30"}
                ${file ? "bg-emerald-500/5 border-emerald-500/30" : ""}`}
							onDragOver={(e) => {
								e.preventDefault();
								setDragOver(true);
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={handleDrop}
							onClick={() => fileInputRef.current?.click()}
						>
							<input
								ref={fileInputRef}
								type="file"
								className="hidden"
								onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
								accept={getMimeTypeAcceptString()}
							/>

							{file ? (
								<div className="flex flex-col items-center gap-2">
									<FileText className="h-10 w-10 text-emerald-400" />
									<p className="font-medium text-sm">{file.name}</p>
									<p className="text-xs text-muted-foreground tabular-nums">
										{(file.size / 1024 / 1024).toFixed(2)} MB
									</p>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-xs text-rose-400"
										onClick={(e) => {
											e.stopPropagation();
											setFile(null);
										}}
									>
										Cambiar archivo
									</Button>
								</div>
							) : (
								<div className="flex flex-col items-center gap-2">
									<Upload className="h-10 w-10 text-muted-foreground/40" />
									<p className="font-medium text-sm text-muted-foreground">
										Arrastra un archivo aquí o haz clic para seleccionar
									</p>
									<p className="text-xs text-muted-foreground/60">
										PDF, DOCX, XLSX, imágenes (max 10MB)
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Nombre del documento */}
				<Card className="rounded-2xl">
					<CardContent className="p-6 space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nombre del documento</Label>
							<Input
								id="name"
								placeholder="Ej: Informe mensual mayo 2026"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>

						{isAdmin ? (
							<>
								<div className="space-y-2">
									<Label htmlFor="scope">Visibilidad</Label>
									<Select value={scope} onValueChange={(v) => setScope(v as DocumentScope)}>
										<SelectTrigger id="scope">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
{SCOPE_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value} disabled={opt.value === "PRIVATE"}>
											{opt.label} — {opt.description}
										</SelectItem>
									))}
										</SelectContent>
									</Select>
								</div>
							</>
						) : (
							<div className="space-y-2">
								<Label htmlFor="visibility">Enviar a</Label>
								<Select 
									value={sendToJefa ? "jefa" : "private"} 
									onValueChange={(v) => {
										const isJefa = v === "jefa";
										setSendToJefa(isJefa);
										setScope(isJefa ? "SHARED" : "PRIVATE");
									}}
								>
									<SelectTrigger id="visibility">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="private" disabled>Próximamente</SelectItem>
										<SelectItem value="jefa">Administración</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									{sendToJefa
										? "Se compartira con Gestion administrativa"
										: "Solo visible para ti (próximamente)"}
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Acciones */}
				<div className="flex flex-col sm:flex-row gap-3 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate("/documentos")}
						disabled={uploading}
					>
						Cancelar
					</Button>
					<Button type="submit" disabled={!file || !name.trim() || uploading}>
						{uploading ? (
							<>
								<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
								Subiendo...
							</>
						) : (
							<>
								<Upload className="w-4 h-4 mr-2" />
								Subir documento
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
