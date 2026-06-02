import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLoaderData, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';

import { Button } from '@/components/UI/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';
import {
  Bell,
  AlertTriangle,
  DollarSign,
  FileText,
  Briefcase,
  Clock,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Event } from '@/types/event';
import { IVAReports } from '@/types/iva-reports';
import { ISLRReports } from '@/types/islr-reports';
import { Fines } from '@/pages/router';
import { Payment } from '@/types/payment';
import { PageHeader } from '@/components/UI/v2';
import { deleteTaxpayer, getTaxpayerCases } from '@/components/utils/api/taxpayer-functions';
import { TaxCase } from '@/types/tax-case';
import { useTaxpayerDetail } from '@/components/stats/use-taxpayer-detail';
import { TabDetallesContribuyente } from '@/components/Taxpayer/tab-detalles';
import TabCasoEnProceso from '@/components/Taxpayer/tab-caso-proceso';
import TabHistorialExpediente from '@/components/Taxpayer/tab-historial';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';

/**
 * TaxpayerDetailV2 - Detalle del Contribuyente con diseño Shadcn UI v2.0
 *
 * Muestra:
 * - PageHeader con navegación
 * - Acciones rápidas (con permisos)
 * - 3 tabs principales: Detalles, Caso en Proceso, Historial
 * - Diálogo de eliminación (solo ADMIN)
 */
export default function TaxpayerDetailV2() {
  const { taxpayer } = useParams<{ taxpayer: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    events: initialEvents,
    fines,
    payments,
    taxSummary: initialTaxSummary,
    islrReports: initialIslrReports,
    taxpayerData,
    observations,
  } = useLoaderData() as {
    events: Event[];
    fines: Fines;
    payments: Payment;
    taxSummary: IVAReports[];
    islrReports: ISLRReports[];
    taxpayerData: any;
    observations: any[];
  };

  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [taxSummary, setTaxSummary] = useState<IVAReports[]>(initialTaxSummary);
  const [islrReports, setIslrReports] = useState<ISLRReports[]>(initialIslrReports);
  const [cases, setCases] = useState<TaxCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ─── Hook de detalle del contribuyente ─── */
  const hook = useTaxpayerDetail({
    taxpayerId: taxpayer,
    taxpayerDataFromLoader: taxpayerData,
    user,
  });

  /* ─── Filter events by selected case ─── */
  const filteredEvents = useMemo(() => {
    if (!selectedCaseId) return events;
    return events.filter((e) => e.tax_case_id === selectedCaseId || !e.tax_case_id);
  }, [events, selectedCaseId]);

  /* ─── Delete handler ─── */
  const handleDeleteTaxpayer = useCallback(async () => {
    if (!taxpayer) return;
    setIsDeleting(true);
    try {
      await deleteTaxpayer(taxpayer);
      toast.success('Contribuyente eliminado correctamente');
      navigate('/admin', { replace: true });
    } catch {
      toast.error('Error al eliminar el contribuyente');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [taxpayer, navigate]);

  /* ─── Load cases for this taxpayer ─── */
  useEffect(() => {
    if (taxpayer) {
      getTaxpayerCases(taxpayer).then((data) => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCaseId(data[0].id);
        }
      });
    }
  }, [taxpayer]);

  /* ─── Auth guards ─── */
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isMyTaxpayer =
    user?.taxpayer?.some((t: any) => t.id === taxpayer) ||
    taxpayerData?.user?.id === user?.id;
  const canSeeAllOptions = user.role === 'ADMIN' || isMyTaxpayer;
  const isAssignedFiscal =
    user.role === 'FISCAL' &&
    (taxpayerData?.officerId === user.id ||
      taxpayerData?.user?.id === user.id ||
      isMyTaxpayer);

  /* ─── Quick Actions ─── */
  type QuickAction = {
    name: string;
    title: string;
    icon: typeof Bell;
    group: 'case' | 'payment' | 'danger';
    path?: string;
    onClick?: () => void;
  };

  const quickActions: QuickAction[] = [
    {
      name: 'Aviso',
      title: 'Registrar un aviso asociado a este expediente',
      path: `/warning/${taxpayer}?case=${selectedCaseId || ''}`,
      icon: Bell,
      group: 'case',
    },
    {
      name: 'Multa',
      title: 'Registrar una multa o sanción',
      path: `/fine/${taxpayer}?case=${selectedCaseId || ''}`,
      icon: AlertTriangle,
      group: 'case',
    },
    {
      name: 'Pago',
      title: 'Registrar un pago recibido',
      path: `/payment/${taxpayer}?case=${selectedCaseId || ''}`,
      icon: DollarSign,
      group: 'payment',
    },
    {
      name: 'Compromiso',
      title: 'Registrar un compromiso de pago',
      path: `/payment_compromise/${taxpayer}?case=${selectedCaseId || ''}`,
      icon: FileText,
      group: 'payment',
    },
    ...(user.role === 'ADMIN'
      ? [
          {
            name: 'Eliminar',
            title: 'Eliminar contribuyente permanentemente',
            icon: Trash2,
            group: 'danger' as const,
            onClick: () => setShowDeleteConfirm(true),
          },
        ]
      : []),
  ].filter((opt) => canSeeAllOptions || opt.name === 'Observaciones');

  /* ─── Compute fines count for TabDetallesContribuyente ─── */
  const finesCount = useMemo(() => {
    if (typeof fines === 'number') return fines;
    if (Array.isArray(fines)) return fines.length;
    return 0;
  }, [fines]);

  /* ─── canEdit for historial tab ─── */
  const canEditHistory = user.role === 'ADMIN' || isAssignedFiscal;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Detalle del Contribuyente"
        description="Información completa y gestión de eventos"
        backTo="/census"
      />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  QUICK ACTIONS — compact action bar (skill-applied)          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-700/50 pb-4 mb-2">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Acciones Rápidas
          </h3>
          {user?.role && (
            <span className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">
              {user.role}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-0.5">
          {(['case', 'payment', 'danger'] as const).map((group, groupIdx) => {
            const groupActions = quickActions.filter(a => a.group === group);
            if (groupActions.length === 0) return null;
            return (
              <Fragment key={group}>
                {groupIdx > 0 && (
                  <span className="w-px h-5 bg-slate-700/40 mx-1.5 hidden sm:block" aria-hidden="true" />
                )}
                {groupActions.map((action) => {
                  const Icon = action.icon;
                  const isDanger = action.group === 'danger';
                  const baseClass = isDanger
                    ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50';

                  const buttonContent = (
                    <>
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs whitespace-nowrap hidden sm:inline">
                        {action.name}
                      </span>
                    </>
                  );

                  if (action.path) {
                    return (
                      <Link
                        key={action.name}
                        to={action.path}
                        title={action.title}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${baseClass} h-7 sm:h-8 gap-1.5 px-2 sm:px-2.5`}
                        >
                          {buttonContent}
                        </Button>
                      </Link>
                    );
                  }

                  return (
                    <Button
                      key={action.name}
                      type="button"
                      onClick={action.onClick}
                      title={action.title}
                      variant="ghost"
                      size="sm"
                      className={`${baseClass} h-7 sm:h-8 gap-1.5 px-2 sm:px-2.5`}
                    >
                      {buttonContent}
                    </Button>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  3 TABS PRINCIPALES                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Tabs defaultValue="detalles" className="w-full lg:max-w-[1024px] lg:mx-auto">
        <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-slate-700/50 rounded-none p-0 gap-0">
          <TabsTrigger
            value="detalles"
            className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-white text-slate-400 rounded-none py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] bg-transparent hover:text-slate-200 transition-all duration-200"
          >
            <FileText className="h-4 w-4 sm:mr-2 shrink-0" />
            <span className="hidden sm:inline">Detalles</span>
          </TabsTrigger>
          <TabsTrigger
            value="caso"
            className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-white text-slate-400 rounded-none py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] bg-transparent hover:text-slate-200 transition-all duration-200"
          >
            <Briefcase className="h-4 w-4 sm:mr-2 shrink-0" />
            <span className="hidden sm:inline">Caso en Proceso</span>
          </TabsTrigger>
          <TabsTrigger
            value="historial"
            className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-white text-slate-400 rounded-none py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] bg-transparent hover:text-slate-200 transition-all duration-200"
          >
            <Clock className="h-4 w-4 sm:mr-2 shrink-0" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab: Detalles del Contribuyente ─── */}
        <TabsContent value="detalles">
          <TabDetallesContribuyente
            taxpayerData={hook.taxpayerData}
            loadingDetails={hook.loadingDetails}
            events={filteredEvents}
            observations={observations}
            canEditIndex={hook.canEditIndex}
            canEditTaxpayer={hook.canEditTaxpayer}
            showEditModal={hook.showEditModal}
            setShowEditModal={hook.setShowEditModal}
            setNewIndexIva={hook.setNewIndexIva}
            setShowIndexModal={hook.setShowIndexModal}
            onTaxpayerDataUpdate={hook.setTaxpayerData}
            formatCurrency={hook.formatCurrency}
            fines={finesCount}
            taxpayerId={taxpayer}
          />
        </TabsContent>

        {/* ─── Tab: Caso en Proceso ─── */}
        <TabsContent value="caso">
          <TabCasoEnProceso
            taxpayerData={hook.taxpayerData}
            loadingDetails={hook.loadingDetails}
            selectedCaseId={selectedCaseId}
            cases={cases}
            user={user}
            selectedFile={hook.selectedFile}
            showModal={hook.showModal}
            showFaseModal={hook.showFaseModal}
            showCulminatedModal={hook.showCulminatedModal}
            showNotifiedModal={hook.showNotifiedModal}
            faseToChange={hook.faseToChange}
            fileInputRef={hook.fileInputRef}
            fases={hook.fases}
            canEditFase={hook.canEditFase}
            handleFaseClick={hook.handleFaseClick}
            confirmFaseChange={hook.confirmFaseChange}
            handleCulminatedClick={hook.handleCulminatedClick}
            confirmCulminated={hook.confirmCulminated}
            handleNotifiedClick={hook.handleNotifiedClick}
            confirmNotified={hook.confirmNotified}
            handleUploadClick={hook.handleUploadClick}
            handleFileChange={hook.handleFileChange}
            handleConfirmSend={hook.handleConfirmSend}
            handleCancelSend={hook.handleCancelSend}
            handleDownloadRepair={hook.handleDownloadRepair}
            handleDownloadInvestigation={hook.handleDownloadInvestigation}
            setShowFaseModal={hook.setShowFaseModal}
            setShowCulminatedModal={hook.setShowCulminatedModal}
            setShowNotifiedModal={hook.setShowNotifiedModal}
            setFaseToChange={hook.setFaseToChange}
            setShowModal={hook.setShowModal}
            setSelectedFile={hook.setSelectedFile}
          />
        </TabsContent>

        {/* ─── Tab: Historial del Expediente ─── */}
        <TabsContent value="historial">
          <TabHistorialExpediente
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={setSelectedCaseId}
            events={events}
            setEvents={setEvents}
            taxSummary={taxSummary}
            setTaxSummary={setTaxSummary}
            islrReports={islrReports}
            setIslrReports={setIslrReports}
            filteredEvents={filteredEvents}
            onCreateCase={() => navigate(`/taxpayer/${taxpayer}/cases/new`)}
            canEdit={canEditHistory}
          />
        </TabsContent>
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  DELETE DIALOG — al final, fuera de los tabs                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => !isDeleting && setShowDeleteConfirm(open)}
      >
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-left pr-8 text-rose-400">
              <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              Eliminar contribuyente
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">
              Esta acción es{' '}
              <span className="text-rose-400 font-semibold">
                permanente e irreversible
              </span>
              . Se eliminarán todos los datos del expediente, incluyendo eventos,
              reportes de IVA e ISLR.
            </DialogDescription>
          </DialogHeader>

          {taxpayerData && (
            <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-4 space-y-1 my-1">
              <p className="text-sm font-semibold text-white">
                {taxpayerData.name}
              </p>
              <p className="text-xs text-slate-400 font-mono">
                {taxpayerData.rif}
              </p>
            </div>
          )}

          <p className="text-sm text-slate-300">
            ¿Estás seguro de que deseas continuar?
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl min-h-[42px] transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteTaxpayer}
              disabled={isDeleting}
              className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/40 text-white font-semibold rounded-xl min-h-[42px] flex items-center justify-center gap-2 transition-colors"
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Sí, eliminar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
