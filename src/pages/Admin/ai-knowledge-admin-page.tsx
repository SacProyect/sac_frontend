import { useCallback, useEffect, useState } from 'react';
import {
    archiveAiKnowledgeDocument,
    listAiKnowledgeDocuments,
    uploadAiKnowledgeDocument,
    type KnowledgeDocumentRow,
} from '@/components/utils/api/ai-knowledge-functions';
import { Button } from '@/components/UI/button';
import toast from 'react-hot-toast';

export default function AiKnowledgeAdminPage() {
    const [documents, setDocuments] = useState<KnowledgeDocumentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('manual_sac');
    const [file, setFile] = useState<File | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setDocuments(await listAiKnowledgeDocuments('all'));
        } catch {
            toast.error('No se pudo cargar la base de conocimiento.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const onUpload = async () => {
        if (!title.trim() || !file) {
            toast.error('Título y archivo requeridos.');
            return;
        }
        setUploading(true);
        try {
            const form = new FormData();
            form.append('title', title.trim());
            form.append('type', type);
            form.append('file', file);
            const result = await uploadAiKnowledgeDocument(form);
            toast.success(`Documento indexado (${result.chunkCount} fragmentos).`);
            setTitle('');
            setFile(null);
            await load();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al subir.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const onArchive = async (id: string) => {
        try {
            await archiveAiKnowledgeDocument(id);
            toast.success('Documento archivado.');
            await load();
        } catch {
            toast.error('No se pudo archivar.');
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold">Conocimiento IA</h1>
                <p className="text-sm text-muted-foreground">
                    Documentos indexados para el asistente (normativa, procedimientos, manuales).
                </p>
            </div>

            <section className="rounded-xl border p-4 space-y-3">
                <h2 className="font-medium">Subir documento</h2>
                <input
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <select
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="normativa">Normativa</option>
                    <option value="procedimiento">Procedimiento</option>
                    <option value="manual_sac">Manual SAC</option>
                    <option value="plantilla">Plantilla</option>
                </select>
                <input
                    type="file"
                    accept=".md,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Button onClick={() => void onUpload()} disabled={uploading}>
                    {uploading ? 'Indexando…' : 'Publicar'}
                </Button>
            </section>

            <section className="rounded-xl border p-4">
                <h2 className="mb-3 font-medium">Documentos</h2>
                {loading ? (
                    <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin documentos. Ejecute el seed o suba archivos.</p>
                ) : (
                    <ul className="divide-y">
                        {documents.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                                <div>
                                    <p className="font-medium">{doc.title}</p>
                                    <p className="text-muted-foreground">
                                        {doc.type} · v{doc.version} · {doc.status} · {doc._count.chunks} fragmentos
                                    </p>
                                </div>
                                {doc.status === 'published' && (
                                    <Button variant="outline" size="sm" onClick={() => void onArchive(doc.id)}>
                                        Archivar
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
