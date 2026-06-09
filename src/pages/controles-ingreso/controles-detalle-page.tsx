import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader, EmptyState, BackButton, LoadingState } from '@/components/UI/v2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';
import { ControlIngresoStatusBadge } from '@/components/controles-ingreso/control-status-badge';
import { AsignacionFiscalesPanel } from '@/components/controles-ingreso/asignacion-fiscales-panel';
import { ControlDocumentPreview } from '@/components/controles-ingreso/control-document-preview';
import { getControlById, addAssignees, removeAssignee, getAuditLogs } from '@/components/utils/api/controles-ingreso-functions';
import type { ControlIngresoAssignee, Coordinacion } from '@/types/controles-ingreso';
import { COORDINACION_LABELS } from '@/types/controles-ingreso';
import {
  MapPin, Calendar, Building2, FileText, Clock,
  User, ClipboardCheck, History, Download,
} from 'lucide-react';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ControlesDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(true);
  const [control, setControl] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [assignees, setAssignees] = useState<ControlIngresoAssignee[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        const [controlRes, auditRes] = await Promise.all([
          getControlById(id!),
          getAuditLogs(id!),
        ]);
        if (!cancelled && controlRes.success) {
          const c = { ...controlRes.item, status: controlRes.item.status.toLowerCase() };
          setControl(c);
          setTemplate(c.template || null);
          setAssignees((c.assignees || []).map((a: any) => ({
            ...a,
            control_id: c.id,
            created_at: a.created_at || new Date().toISOString(),
          })));
          setAuditLogs(auditRes.logs || []);
        }
      } catch (err) {
        console.error('Error loading control:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleAddAssignee = async (newAssignee: Omit<ControlIngresoAssignee, 'id' | 'control_id' | 'created_at'>) => {
    if (!control) return;
    try {
      const res = await addAssignees(control.id, { assignees: [newAssignee] });
      if (res.success) {
        setAssignees(prev => [...prev, ...res.items.map((a: any) => ({
          ...a,
          control_id: control.id,
        }))]);
      }
    } catch (err) {
      console.error('Error adding assignee:', err);
    }
  };

  const handleRemoveAssignee = async (assigneeId: string) => {
    if (!control) return;
    try {
      const res = await removeAssignee(control.id, assigneeId);
      if (res.success) {
        setAssignees(prev => prev.filter(a => a.id !== assigneeId));
      }
    } catch (err) {
      console.error('Error removing assignee:', err);
    }
  };

  const handleGenerateFromSummary = () => {
    setActiveTab('documento');
  };

  const handleDocumentGenerated = (doc: any) => {
    setGeneratedDocument(doc);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton to="/controles-de-ingreso" label="Volver al dashboard" />
        <LoadingState message="Cargando control..." />
      </div>
    );
  }

  if (!control) {
    return (
      <div className="space-y-6">
        <BackButton to="/controles-de-ingreso" label="Volver al dashboard" />
        <PageHeader title="Control no encontrado" />
        <EmptyState title="Control no encontrado" message={`No existe un control con ID "${id}".`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/controles-de-ingreso" label="Volver al dashboard" />

      <PageHeader
        title={control.number}
        description={control.subject_name}
        action={<ControlIngresoStatusBadge status={control.status} />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="resumen" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="fiscales" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-1.5">
            <User className="h-3.5 w-3.5" /> Fiscales
            <span className="ml-1 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded-full">{assignees.length}</span>
          </TabsTrigger>
          <TabsTrigger value="documento" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Documento
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-1.5">
            <History className="h-3.5 w-3.5" /> Auditoría
          </TabsTrigger>
        </TabsList>

        {/* TAB RESUMEN */}
        <TabsContent value="resumen" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sujeto Pasivo */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  Sujeto Pasivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Nombre" value={control.subject_name} />
                <DetailRow label="RIF" value={control.subject_rif} mono />
                <DetailRow label="Dirección" value={control.subject_address} />
                <DetailRow label="Parroquia" value={control.subject_parish_id} />
              </CardContent>
            </Card>

            {/* Datos del Control */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-indigo-400" />
                  Datos del Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="N° Expediente" value={control.number} mono />
                <DetailRow label="Coordinación" value={COORDINACION_LABELS[control.coordination_id as Coordinacion] || control.coordination_id} />
                <DetailRow label="Fecha emisión" value={formatDate(control.issue_date)} />
                <DetailRow label="Fecha inicio" value={formatDate(control.start_date)} />
                <DetailRow label="Fecha cierre" value={formatDate(control.end_date)} />
              </CardContent>
            </Card>
          </div>

          {/* Notas */}
          {control.notes && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-100 text-sm font-semibold">Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">{control.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Plantilla */}
          {template && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Plantilla Asignada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30">{template.code}</Badge>
                  <span className="text-sm text-slate-300">{template.name}</span>
                  <span className="text-xs text-slate-500">v{template.version}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleGenerateFromSummary}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar Documento
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-400 hover:text-slate-200"
              disabled
              title="Generación de PDF próximamente"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </TabsContent>

        {/* TAB FISCALES */}
        <TabsContent value="fiscales" className="mt-4">
          <AsignacionFiscalesPanel
            assignees={assignees}
            onAdd={handleAddAssignee}
            onRemove={handleRemoveAssignee}
          />
        </TabsContent>

        {/* TAB DOCUMENTO */}
        <TabsContent value="documento" className="mt-4">
          <ControlDocumentPreview
            control={control}
            template={template}
            document={generatedDocument}
            onDocumentGenerated={handleDocumentGenerated}
          />
        </TabsContent>

        {/* TAB AUDITORÍA */}
        <TabsContent value="auditoria" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-400" />
                Historial de Cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No hay registros de auditoría</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-700/30 last:border-0 last:pb-0">
                      <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-300">{log.action}</p>
                        {log.previous_value && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Antes: {log.previous_value} → Ahora: {log.new_value}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {formatDate(log.created_at)} · {log.created_by}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}
