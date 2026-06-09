import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import {
  Eye,
  FileText,
  Download,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  generateDocument,
  getDocumentDownloadUrl,
} from '@/components/utils/api/controles-ingreso-functions';
import type {
  ControlIngreso,
  ControlIngresoTemplate,
  ControlIngresoDocument,
  ControlIngresoAssignee,
} from '@/types/controles-ingreso';

interface ControlDocumentPreviewProps {
  control: ControlIngreso;
  template?: ControlIngresoTemplate | null;
  document?: ControlIngresoDocument | null;
  assignees?: ControlIngresoAssignee[];
  onDocumentGenerated?: (doc: any) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function ControlDocumentPreview({
  control,
  template,
  document: initialDocument,
  assignees,
  onDocumentGenerated,
}: ControlDocumentPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(
    initialDocument?.file_url ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(
    initialDocument?.generated_at
      ? new Date(initialDocument.generated_at).toLocaleString('es-VE')
      : null
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Sincronizar si cambia el documento inicial desde props
  useEffect(() => {
    if (initialDocument?.file_url) {
      setDocumentUrl(initialDocument.file_url);
      setIsLoadingPreview(true);
      setLastGenerated(
        initialDocument.generated_at
          ? new Date(initialDocument.generated_at).toLocaleString('es-VE')
          : null
      );
      setError(null);
    }
  }, [initialDocument?.file_url, initialDocument?.generated_at]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDocument(control.id, template?.id);
      if (result.success && result.document?.file_url) {
        setDocumentUrl(result.document.file_url);
        setIsLoadingPreview(true);
        setLastGenerated(new Date().toLocaleString('es-VE'));
        onDocumentGenerated?.(result.document);
      } else {
        setError(result.message || 'Error al generar el documento');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al generar el documento');
    } finally {
      setIsGenerating(false);
    }
  }, [control.id, template?.id]);

  const handleDownloadDoc = useCallback(async () => {
    if (!documentUrl) return;
    try {
      // Intentar obtener URL firmada fresca; si falla, usar la existente
      const result = await getDocumentDownloadUrl(control.id, 'docx');
      const url = result?.downloadUrl || documentUrl;
      window.open(url, '_blank');
    } catch {
      // Fallback: usar la URL que ya tenemos
      window.open(documentUrl, '_blank');
    }
  }, [control.id, documentUrl]);

  const templateVersion = template?.version ?? initialDocument?.template_version ?? null;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4 text-indigo-400" />
          Vista Previa del Documento
        </CardTitle>
        {lastGenerated && (
          <span className="text-[10px] text-slate-500">
            Generado: {lastGenerated}
            {templateVersion ? ` · v${templateVersion}` : ''}
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error global */}
        {error && (
          <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/20 p-3">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-red-300 font-medium">Error</p>
              <p className="text-xs text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {/* Sin documento generado */}
        {!documentUrl && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-700/50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-slate-300 font-medium">
                No hay documento generado
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                Genere el documento oficial para visualizarlo y descargarlo en formato DOC.
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Documento
                </>
              )}
            </Button>
          </div>
        )}

        {/* Documento generado: preview + acciones */}
        {documentUrl && (
          <div className="space-y-3">
            {/* Área de preview alternativo */}
            <div className="relative rounded-lg border border-slate-700/50 bg-white overflow-hidden">
              {isLoadingPreview ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-2" />
                  <span className="text-xs text-slate-500">Cargando preview...</span>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {/* Header del documento */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Oficio de Control de Ingreso
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {control.number}
                    </p>
                  </div>
                  
                  {/* Datos del sujeto pasivo */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wider">
                      Sujeto Pasivo
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Nombre:</span>
                        <span className="text-slate-800 ml-1">{control.subject_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">RIF:</span>
                        <span className="text-slate-800 ml-1">{control.subject_rif}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Dirección:</span>
                        <span className="text-slate-800 ml-1">{control.subject_address}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fechas */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wider">
                      Fechas del Control
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Inicio:</span>
                        <span className="text-slate-800 ml-1">{formatDate(control.start_date)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Cierre:</span>
                        <span className="text-slate-800 ml-1">{formatDate(control.end_date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fiscales asignados */}
                  {assignees && assignees.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wider">
                        Fiscales Asignados ({assignees.length})
                      </h4>
                      <div className="space-y-1">
                        {assignees.slice(0, 5).map((assignee, idx) => (
                          <div key={idx} className="text-sm text-slate-700">
                            {idx + 1}. {assignee.full_name} - {assignee.identity_document}
                          </div>
                        ))}
                        {assignees.length > 5 && (
                          <div className="text-sm text-slate-500 italic">
                            ... y {assignees.length - 5} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Mensaje de descarga */}
                  <div className="bg-slate-50 rounded-md p-4 text-center">
                    <p className="text-sm text-slate-600 mb-3">
                      El documento está listo para descargar en formato DOCX
                    </p>
                    <Button
                      onClick={handleDownloadDoc}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Documento
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>
                {template?.name && `Plantilla: ${template.name}`}
                {templateVersion && ` (v${templateVersion})`}
              </span>
              <span>
                {lastGenerated && `Generado el ${lastGenerated}`}
              </span>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDoc}
                className="border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar DOC
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled
                title="Conversión a PDF próximamente"
                className="border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Regenerando...' : 'Regenerar Documento'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
