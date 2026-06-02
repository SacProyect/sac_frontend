import { Card } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import { TaxCase } from '@/types/tax-case';
import type { UseTaxpayerDetailReturn } from '@/components/stats/use-taxpayer-detail';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface TabCasoEnProcesoProps
  extends Pick<
    UseTaxpayerDetailReturn,
    | 'taxpayerData'
    | 'loadingDetails'
    | 'selectedFile'
    | 'showModal'
    | 'showFaseModal'
    | 'showCulminatedModal'
    | 'showNotifiedModal'
    | 'faseToChange'
    | 'fileInputRef'
    | 'fases'
    | 'canEditFase'
    | 'handleFaseClick'
    | 'confirmFaseChange'
    | 'handleCulminatedClick'
    | 'confirmCulminated'
    | 'handleNotifiedClick'
    | 'confirmNotified'
    | 'handleUploadClick'
    | 'handleFileChange'
    | 'handleConfirmSend'
    | 'handleCancelSend'
    | 'handleDownloadRepair'
    | 'handleDownloadInvestigation'
    | 'setShowFaseModal'
    | 'setShowCulminatedModal'
    | 'setShowNotifiedModal'
    | 'setFaseToChange'
    | 'setShowModal'
    | 'setSelectedFile'
  > {
  /** ID del caso seleccionado actualmente */
  selectedCaseId: string | null;
  /** Lista de todos los casos del contribuyente */
  cases: TaxCase[];
  /** Usuario autenticado actual */
  user: any;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TabCasoEnProceso({
  taxpayerData,
  selectedCaseId,
  cases,
  user,
  selectedFile,
  showModal,
  showFaseModal,
  showCulminatedModal,
  showNotifiedModal,
  faseToChange,
  fileInputRef,
  fases,
  canEditFase,
  handleFaseClick,
  confirmFaseChange,
  handleCulminatedClick,
  confirmCulminated,
  handleNotifiedClick,
  confirmNotified,
  handleUploadClick,
  handleFileChange,
  handleConfirmSend,
  handleCancelSend,
  handleDownloadRepair,
  handleDownloadInvestigation,
  setShowFaseModal,
  setShowCulminatedModal,
  setShowNotifiedModal,
  setFaseToChange,
  setShowModal,
  setSelectedFile,
}: TabCasoEnProcesoProps) {
  const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null;

  /* ---- Permisos de botones de acción ---- */
  const canCulminate =
    taxpayerData?.culminated !== true &&
    ((user?.role === 'FISCAL' && user?.id === taxpayerData?.officerId) ||
      (user?.role === 'COORDINATOR' &&
        user?.id === taxpayerData?.user?.group?.coordinatorId) ||
      (user?.role === 'SUPERVISOR' &&
        (user?.id === taxpayerData?.officerId ||
          user?.supervised_members?.some(
            (m: any) => m.id === taxpayerData?.officerId,
          ))) ||
      user?.role === 'ADMIN');

  const canNotify =
    !taxpayerData?.notified &&
    ((user?.role === 'FISCAL' && taxpayerData?.officerId === user?.id) ||
      user?.role === 'ADMIN' ||
      (user?.role === 'SUPERVISOR' &&
        (user?.id === taxpayerData?.officerId ||
          user?.supervised_members?.some(
            (m: any) => m.id === taxpayerData?.officerId,
          ))));

  const canDownloadInvestigation =
    user?.role === 'ADMIN' &&
    taxpayerData &&
    taxpayerData.investigation_pdfs.length >= 1;

  const isRepairOwner =
    user && taxpayerData?.officerId === user.id;

  return (
    <div className="space-y-4">
      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  CASE DETAIL CARD                                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {selectedCaseId && selectedCase && taxpayerData && (
        <Card className="bg-slate-800 border-slate-700 p-4 sm:p-5 transition-all duration-200 hover:border-slate-600 hover:shadow-md rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Detalle del Caso
            </span>
            <Badge className="bg-indigo-900/30 text-indigo-300 border border-indigo-800/30 text-[11px] font-bold">
              {selectedCase.year} — {selectedCase.process}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Procedimiento
              </span>
              <span className="text-sm font-medium text-slate-200">
                {selectedCase.process || '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Fase
              </span>
              <span className="text-sm font-medium">
                {selectedCase.fase ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-blue-900/20 text-blue-400">
                    {selectedCase.fase.replace('_', ' ')}
                  </span>
                ) : (
                  '—'
                )}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                N° Providencia
              </span>
              <span className="text-sm font-medium text-slate-200">
                {taxpayerData.providenceNum ?? '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Fiscal Asignado
              </span>
              <span className="text-sm font-medium text-slate-200">
                {taxpayerData.user?.name ?? 'No asignado'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Supervisor
              </span>
              <span className="text-sm font-medium text-slate-200">
                {taxpayerData.user?.supervisor?.name ?? 'No asignado'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Grupo
              </span>
              <span className="text-sm font-medium text-slate-200">
                {taxpayerData.user?.group?.name ?? 'No asignado'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Fecha de Emisión
              </span>
              <span className="text-sm font-medium text-slate-200">
                {selectedCase.emition_date
                  ? new Date(selectedCase.emition_date).toLocaleDateString(
                      'es-VE',
                      { year: 'numeric', month: 'short', day: 'numeric' },
                    )
                  : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Estado
              </span>
              <span className="text-sm font-medium flex items-center gap-2">
                {selectedCase.notified ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-900/20 text-emerald-400">
                    Notificado
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-red-900/20 text-red-400">
                    Pendiente
                  </span>
                )}
                {selectedCase.culminated && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-900/20 text-emerald-400">
                    Culminado
                  </span>
                )}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  ACTION BUTTONS                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {taxpayerData && (
        <Card className="bg-slate-800 border-slate-700 p-4 sm:p-5 transition-all duration-200 hover:border-slate-600 hover:shadow-md rounded-lg">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
            Acciones del Caso
          </h3>
          <div className="flex flex-wrap gap-2">
            {/* Culminar Procedimiento */}
            {canCulminate && (
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold border-0 cursor-pointer transition-colors duration-150 bg-blue-600 text-white hover:opacity-85"
                onClick={() => handleCulminatedClick(true)}
              >
                Culminar Procedimiento
              </button>
            )}

            {/* Reportar notificado */}
            {canNotify && (
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 bg-transparent border border-slate-600/30 text-slate-200 hover:opacity-85"
                onClick={() => handleNotifiedClick(true)}
              >
                Reportar notificado
              </button>
            )}

            {/* Descargar investigación */}
            {canDownloadInvestigation && (
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 bg-transparent border border-slate-600/30 text-slate-200 hover:opacity-85"
                onClick={handleDownloadInvestigation}
              >
                Descargar investigación
              </button>
            )}
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  AF-SPECIFIC SECTION                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {taxpayerData?.process === 'AF' && (
        <Card className="bg-slate-800 border-slate-700 p-4 sm:p-5 transition-all duration-200 hover:border-slate-600 hover:shadow-md rounded-lg">
          {/* ── Acta de Reparo ── */}
          {taxpayerData.RepairReports.length > 0 ? (
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 bg-transparent border border-slate-600/30 text-slate-200 hover:opacity-85"
              onClick={() =>
                handleDownloadRepair(taxpayerData.RepairReports[0].pdf_url)
              }
            >
              Descargar acta de reparo
            </button>
          ) : (
            isRepairOwner && (
              <div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 bg-transparent border border-slate-600/30 text-slate-200 hover:opacity-85"
                  onClick={handleUploadClick}
                >
                  Subir acta de reparo
                </button>
                <input
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            )
          )}

          {/* ── Fase Selector ── */}
          {canEditFase && (
            <>
              <hr className="h-px bg-slate-700/20 border-0 my-3" />
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  style={{ marginBottom: '8px' }}
                >
                  AVANCE DE FASE
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {fases.map((fase) => (
                    <button
                      key={fase}
                      type="button"
                      className={`px-3 py-1 rounded-md text-[11px] font-bold border cursor-pointer transition-colors duration-150 ${
                        taxpayerData?.fase === fase
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-blue-500/25 bg-blue-500/20 text-blue-500 hover:border-blue-500'
                      }`}
                      onClick={() => handleFaseClick(fase)}
                    >
                      {fase.replace('FASE_', 'Fase ')}
                    </button>
                  ))}
                </div>
                {taxpayerData?.fase && (
                  <p className="text-xs italic mt-2 text-slate-400 leading-relaxed">
                    {taxpayerData.fase === 'FASE_1' &&
                      'Notificación de providencia, acta de requerimientos, constancias y actas de recepción.'}
                    {taxpayerData.fase === 'FASE_2' &&
                      'Análisis y desarrollo de hojas de trabajo y predeterminación con soportes.'}
                    {taxpayerData.fase === 'FASE_3' &&
                      'Determinación y reparo definitivo: acta de reparo, informe y requerimiento finales.'}
                    {taxpayerData.fase === 'FASE_4' &&
                      'Declaración sustitutiva; resolución de sanción de allanamiento; culminación de expediente.'}
                  </p>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODALS                                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* ── Modal: Confirmar cambio de fase ── */}
      <Dialog
        open={showFaseModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowFaseModal(false);
            setFaseToChange(null);
          }
        }}
      >
        <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-center">
              Confirmar cambio de fase
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-center">
              ¿Estás seguro de que deseas cambiar la fase de la auditoría
              fiscal?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            <span className="font-bold text-slate-100">Fase actual:</span>{' '}
            {taxpayerData?.fase.replace('_', ' ')}
          </p>
          <p className="text-sm text-slate-300">
            <span className="font-bold text-slate-100">Nueva fase:</span>{' '}
            {faseToChange?.replace('_', ' ')}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowFaseModal(false);
                setFaseToChange(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmFaseChange}>Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Confirmar culminación ── */}
      <Dialog
        open={showCulminatedModal}
        onOpenChange={(open) => {
          if (!open) setShowCulminatedModal(false);
        }}
      >
        <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-center text-blue-400">
              Confirmar Culminación
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-center">
              ¿Deseas marcar el procedimiento de este contribuyente como
              culminado?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowCulminatedModal(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={confirmCulminated}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Confirmar notificado ── */}
      <Dialog
        open={showNotifiedModal}
        onOpenChange={(open) => {
          if (!open) setShowNotifiedModal(false);
        }}
      >
        <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-center text-blue-400">
              Confirmar Notificación
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-center">
              ¿Deseas reportar al contribuyente como notificado?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowNotifiedModal(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={confirmNotified}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Subir acta de reparo ── */}
      <Dialog
        open={showModal && !!selectedFile}
        onOpenChange={(open) => {
          if (!open) handleCancelSend();
        }}
      >
        <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle>Confirmar Acta de Reparo</DialogTitle>
            <DialogDescription className="text-slate-400">
              Archivo:{' '}
              <span className="font-medium text-slate-200">
                {selectedFile?.name}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCancelSend}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmSend}
            >
              Subir archivo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
