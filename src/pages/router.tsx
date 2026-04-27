import { ProtectedRoute } from '@/components/Navigation/protected-route';
import { getPendingPayments, getTaxpayerData, getTaxpayerEvents } from '@/components/utils/api/taxpayer-functions';
import { createBrowserRouter, LoaderFunctionArgs, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/hooks/use-auth';
import { getFineHistory, getIslrReports, getPaymentHistory, getTaxHistory } from '@/components/utils/api/report-functions';
import { Event } from '@/types/event';
import { Payment } from '@/types/payment';
import MainLayoutV2 from '@/main-layout-v2';
import { lazy, Suspense, type ComponentType } from 'react';
// import ContributionsPage from '@/pages/Contributions/Contributions-Page-V2';
import { IVAReports } from '@/types/iva-reports';
// import ReportModal from '@/components/reports/ReportModal';
// import ReportModalGroups from '@/components/reports/ReportModalGroups';
import { ISLRReports } from '@/types/islr-reports';
import { NotificationsProvider } from "@/hooks/use-notifications";
import { GlobalLoader } from '@/components/UI/global-loader';
import { isNotificationsFeatureEnabled } from '@/config/feature-flags';
import { ChunkErrorBoundary } from '@/components/UI/chunk-error-boundary';
// import FiscalReviewPage from '@/pages/fiscal-review/FiscalReviewPage';
// import { PresentationProvider } from '@/components/context/PresentationContext';

// const FinePage = lazy(() => import('@/pages/Events/FinePage'));
// const ComitmentPage = lazy(() => import('@/pages/Events/ComitmentPage'));
// const PaymentPage = lazy(() => import('@/pages/Events/PaymentPage'));
// const NoticePage = lazy(() => import('@/pages/Events/NoticePage'));
// const TaxpayerForm = lazy(() => import('@/components/Taxpayer/TaxpayerForm'));
// const TaxpayerDetail = lazy(() => import('@/pages/Taxpayer/TaxpayerDetail'));
// const ErrorsReport = lazy(() => import("@/components/errors/report/ErrorsReport"));
// const StatsPage = lazy(() => import("@/pages/stats/StatsPage"));
// const ObservationsPage = lazy(() => import("@/pages/Observations/ObservationsPage"));
// const IvaReport = lazy(() => import("@/pages/iva/IvaReport"));
// const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
// const IslrReport = lazy(() => import("@/pages/islr/islr-report"));
// const TaxpayerCensus = lazy(() => import("@/pages/Census/CensusPage"));
// const CensusTable = lazy(() => import("@/pages/CensusTable/CensusTablePage"));
// const IndexIva = lazy(() => import("@/pages/index-iva/IndexIva"));
// const FiscalStats = lazy(() => import("@/pages/fiscal-stats/FiscalStatsPage"));
// const AdminPageV2 = lazy(() => import("@/pages/Admin/AdminPageV2"));
// const SettingsPageV2 = lazy(() => import("@/pages/Settings/SettingsPageV2"));
// const StatsDashboardV2 = lazy(() => import("@/pages/stats/StatsDashboardV2"));
// const FiscalStatsDashboardV2 = lazy(() => import("@/pages/stats/FiscalStatsDashboardV2"));
// const CensusTablePageV2 = lazy(() => import("@/pages/CensusTable/CensusTablePageV2"));
// const FiscalReviewPageV2 = lazy(() => import("@/pages/fiscal-review/FiscalReviewPageV2"));
// const ObservationsPageV2 = lazy(() => import("@/pages/Observations/ObservationsPageV2"));
// const TaxpayerDetailV2 = lazy(() => import("@/pages/Taxpayer/TaxpayerDetailV2"));
// const FinePageV2 = lazy(() => import("@/pages/Events/fine-page-v2"));
// const NoticePageV2 = lazy(() => import("@/pages/Events/notice-page-v2"));
// const PaymentPageV2 = lazy(() => import("@/pages/Events/payment-page-v2"));
// const ComitmentPageV2 = lazy(() => import("@/pages/Events/comitment-page-v2"));
// const ReportsPageV2 = lazy(() => import("@/pages/reports/reports-page-v2"));
// const ContributionsPageV2 = lazy(() => import("@/pages/Contributions/ContributionsPageV2"));
// const IvaReportV2 = lazy(() => import("@/pages/iva/iva-report-v2"));
// const IslrReportV2 = lazy(() => import("@/pages/islr/islr-report-v2"));
// const IndexIvaV2 = lazy(() => import("@/pages/index-iva/index-iva-v2"));
// const ErrorsReportV2 = lazy(() => import("@/pages/errors/errors-report-v2"));
// const LoginPageV2 = lazy(() => import("@/pages/Auth/login-page-v2"));

/**
 * Helper para lazy loading con retry automático
 * Maneja errores transitorios de red y carga de chunks
 */
function lazyWithRetry<T extends ComponentType<unknown>>(
    factory: () => Promise<{ default: T }>,
    retries = 2
): React.LazyExoticComponent<T> {
    return lazy(() => {
        const loadComponent = (attempt: number): Promise<{ default: T }> => {
            return factory().catch((error: Error) => {
                // Si es error de chunk dinámico fallido y tenemos reintentos
                const isChunkError = 
                    error.message?.includes('Failed to fetch dynamically imported module') ||
                    error.message?.includes('Failed to load module script') ||
                    error.message?.includes('error loading dynamically imported module') ||
                    error.message?.includes('Loading chunk');
                
                if (isChunkError && attempt < retries) {
                    console.warn(`Error cargando módulo, intento ${attempt + 1} de ${retries}. Recargando...`);
                    // Pequeña espera antes de reintentar
                    return new Promise(resolve => setTimeout(resolve, 300 * attempt))
                        .then(() => loadComponent(attempt + 1));
                }
                
                throw error;
            });
        };
        
        return loadComponent(1);
    });
}

const LoginPageV2 = lazyWithRetry(() => import("@/pages/Auth/login-page-v2"));
const AdminPageV2 = lazyWithRetry(() => import("@/pages/Admin/admin-page-v2"));
const SettingsPageV2 = lazyWithRetry(() => import("@/pages/Settings/settings-page-v2"));
const StatsDashboardV2 = lazyWithRetry(() => import("@/pages/stats/stats-dashboard-v2"));
const FiscalStatsDashboardV2 = lazyWithRetry(() => import("@/pages/stats/fiscal-stats-dashboard-v2"));
const CensusTablePageV2 = lazyWithRetry(() => import("@/pages/CensusTable/census-table-page-v2"));
const FiscalReviewPageV2 = lazyWithRetry(() => import("@/pages/fiscal-review/fiscal-review-page-v2"));
const ObservationsPageV2 = lazyWithRetry(() => import("@/pages/Observations/observations-page-v2"));
const TaxpayerDetailV2 = lazyWithRetry(() => import("@/pages/Taxpayer/taxpayer-detail-v2"));
const FinePageV2 = lazyWithRetry(() => import("@/pages/Events/fine-page-v2"));
const NoticePageV2 = lazyWithRetry(() => import("@/pages/Events/notice-page-v2"));
const PaymentPageV2 = lazyWithRetry(() => import("@/pages/Events/payment-page-v2"));
const ComitmentPageV2 = lazyWithRetry(() => import("@/pages/Events/comitment-page-v2"));
const ReportsPageV2 = lazyWithRetry(() => import("@/pages/reports/reports-page-v2"));
const ContributionsPageV2 = lazyWithRetry(() => import("@/pages/Contributions/contributions-page-v2"));
const IvaReportV2 = lazyWithRetry(() => import("@/pages/iva/iva-report-v2"));
const IslrReportV2 = lazyWithRetry(() => import("@/pages/ISLR/islr-report-v2"));
const IndexIvaV2 = lazyWithRetry(() => import("@/pages/index-iva/index-iva-v2"));
const ErrorsReportV2 = lazyWithRetry(() => import("@/pages/errors/errors-report-v2"));
const GroupReportPageV2 = lazyWithRetry(() => import("@/pages/reports/group-report-page-v2"));
const TaxpayerReportPage = lazyWithRetry(() => import("@/pages/reports/taxpayer-report-page"));
const NotificationsPageV1 = lazyWithRetry(() => import("@/pages/Notifications/notifications-page-v1"));
const AuditTrailPageV2 = lazyWithRetry(() => import("@/pages/audit/audit-trail-page-v2"));
const InternalAuditPageV2 = lazyWithRetry(() => import("@/pages/internal-audit/internal-audit-page-v2"));

type LoaderData = {
    events: Event[],
    payments: Payment[],
    fines: Fines[],
    taxSummary: IVAReports[],
    islrReports: ISLRReports[],
    taxpayerData: any;
}

export interface Fines {
    id: string,
    date: string,
    amount: number,
    type: string,
    status: boolean,
    taxpayerId: string,
    fines_quantity: number,
    total_amount: number
}


export const router = createBrowserRouter([
    {
        element: <AuthLayout />,
        children: [
            {
                path: "/login",
                element: <Suspense fallback={<GlobalLoader message="Iniciando sesión..." />}><LoginPageV2 /></Suspense>,
            },
            {
                path: "/",
                element: (
                    <ProtectedRoute>
                        <NotificationsProvider>
                            <MainLayoutV2 />
                        </NotificationsProvider>
                    </ProtectedRoute>
                ),
                children: [
                    {
                        index: true,
                        element: <Navigate to="/admin" replace />,
                    },
                    {
                        path: "admin",
                        element: <Suspense fallback={<GlobalLoader message="Cargando Administración..." />}><AdminPageV2 /></Suspense>,
                    },
                    {
                        path: "auditoria",
                        element: <Suspense fallback={<GlobalLoader message="Cargando auditoría..." />}><AuditTrailPageV2 /></Suspense>,
                    },
                    {
                        path: "auditoria-interna",
                        element: (
                            <Suspense fallback={<GlobalLoader message="Cargando auditoría interna..." />}>
                                <InternalAuditPageV2 />
                            </Suspense>
                        ),
                    },
                    {
                        path: "settings",
                        element: <Suspense fallback={<GlobalLoader message="Cargando Ajustes..." />}><SettingsPageV2 /></Suspense>,
                    },
                    {
                        path: "stats",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Estadísticas...
                            </div>
                        }>
                            <StatsDashboardV2 />
                        </Suspense>,
                    },
                    {
                        path: "stats/fiscal/:fiscalId",
                        element: <Suspense fallback={<GlobalLoader message="Cargando Estadísticas..." />}><FiscalStatsDashboardV2 /></Suspense>,
                    },
                    {
                        path: "census",
                        element: <Suspense fallback={<GlobalLoader message="Cargando Tabla Censo..." />}><CensusTablePageV2 /></Suspense>,
                    },
                    {
                        path: "fiscal-review",
                        element: <Suspense fallback={<GlobalLoader message="Cargando Revisión Fiscal..." />}><FiscalReviewPageV2 /></Suspense>,
                    },
                    {
                        path: "observations/:taxpayerId",
                        element: <Suspense fallback={<GlobalLoader message="Cargando Observaciones..." />}><ObservationsPageV2 /></Suspense>,
                    },
                    {
                        path: "fine/:taxpayerId",
                        element: (
                            <ChunkErrorBoundary>
                                <Suspense fallback={<GlobalLoader message="Cargando Multa..." />}>
                                    <FinePageV2 />
                                </Suspense>
                            </ChunkErrorBoundary>
                        ),
                        loader: async ({ params }) => {
                            try {
                                const taxpayerId = params.taxpayerId;
                                if (!taxpayerId) return null;
                                return { taxpayerData: await getTaxpayerData(taxpayerId) };
                            } catch (e) {
                                console.error(e);
                                return null;
                            }
                        }
                    },
                    {
                        path: "warning/:taxpayerId",
                        element: (
                            <ChunkErrorBoundary>
                                <Suspense fallback={<GlobalLoader message="Cargando Aviso..." />}>
                                    <NoticePageV2 />
                                </Suspense>
                            </ChunkErrorBoundary>
                        ),
                        loader: async ({ params }) => {
                            try {
                                const taxpayerId = params.taxpayerId;
                                if (!taxpayerId) return null;
                                return { taxpayerData: await getTaxpayerData(taxpayerId) };
                            } catch (e) {
                                console.error(e);
                                return null;
                            }
                        }
                    },
                    {
                        path: "payment/:taxpayerId",
                        element: (
                            <ChunkErrorBoundary>
                                <Suspense fallback={<GlobalLoader message="Cargando Pago..." />}>
                                    <PaymentPageV2 />
                                </Suspense>
                            </ChunkErrorBoundary>
                        ),
                        loader: async ({ params }) => {
                            try {
                                const taxpayerId = params.taxpayerId;
                                if (!taxpayerId) return [];
                                const pendingPayments = await getPendingPayments(taxpayerId);
                                return pendingPayments.map((event: Event) => ({
                                    id: event.id,
                                    value: event.id,
                                    name: `${event.type} ${event.date.split("T")[0]} ${event.taxpayer}`,
                                }));
                            } catch (error) {
                                console.error("No se pudieron obtener los pagos pendientes: " + error);
                                return [];
                            }
                        },
                    },
                    {
                        path: "payment_compromise/:taxpayerId",
                        element: (
                            <ChunkErrorBoundary>
                                <Suspense fallback={<GlobalLoader message="Cargando Compromiso..." />}>
                                    <ComitmentPageV2 />
                                </Suspense>
                            </ChunkErrorBoundary>
                        ),
                        loader: async ({ params }) => {
                            try {
                                const taxpayerId = params.taxpayerId;
                                if (!taxpayerId) return [];
                                const pendingPayments = await getPendingPayments(taxpayerId);
                                return pendingPayments.map((event: Event) => ({
                                    id: event.id,
                                    value: event.id,
                                    name: `${event.type} ${event.date.split("T")[0]} ${event.taxpayer}`,
                                }));
                            } catch (error) {
                                console.error("No se pudieron obtener los pagos pendientes: " + error);
                                return [];
                            }
                        },
                    },
                    {
                        path: "notifications",
                        element: <Suspense
                            fallback={
                                <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                    Cargando Notificaciones...
                                </div>
                            }
                        >
                            {isNotificationsFeatureEnabled ? <NotificationsPageV1 /> : <Navigate to="/admin" replace />}
                        </Suspense>,
                    },
                    {
                        path: "gen-reports",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Reportes...
                            </div>
                        }>
                            <ReportsPageV2 />
                        </Suspense>,
                    },
                    {
                        path: "gen-reports/:taxpayer",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Reporte del Contribuyente...
                            </div>
                        }>
                            <TaxpayerReportPage />
                        </Suspense>,
                    },
                    {
                        path: "getGroupReport/:id",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Reporte de Grupo...
                            </div>
                        }>
                            <GroupReportPageV2 />
                        </Suspense>,
                    },
                    {
                        path: "contributions",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Contribuciones...
                            </div>
                        }>
                            <ContributionsPageV2 />
                        </Suspense>,
                    },
                    {
                        path: "iva",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Reporte IVA...
                            </div>
                        }>
                            <IvaReportV2 />
                        </Suspense>,
                    },
                    {
                        path: "islr",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Reporte ISLR...
                            </div>
                        }>
                            <IslrReportV2 />
                        </Suspense>,
                    },
                    {
                        path: "index-iva",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Índice IVA...
                            </div>
                        }>
                            <IndexIvaV2 />
                        </Suspense>,
                    },
                    {
                        path: "report/errors",
                        element: <Suspense fallback={
                            <div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-slate-950 text-white'>
                                Cargando Reporte de Errores...
                            </div>
                        }>
                            <ErrorsReportV2 />
                        </Suspense>,
                    },
                    {
                        path: "taxpayer/:taxpayer",
                        element: (
                            <ChunkErrorBoundary>
                                <Suspense fallback={<GlobalLoader message="Cargando Detalles..." />}>
                                    <TaxpayerDetailV2 />
                                </Suspense>
                            </ChunkErrorBoundary>
                        ),
                        loader: async ({ params }: LoaderFunctionArgs): Promise<LoaderData> => {
                            try {
                                const taxpayerId = params.taxpayer;
                                if (!taxpayerId) return { events: [], fines: [], payments: [], taxSummary: [], islrReports: [], taxpayerData: null };
                                const taxpayerData = await getTaxpayerData(taxpayerId);
                                const events: Event[] = await getTaxpayerEvents(taxpayerId);
                                events.forEach((event) => (event.id = `${event.id}`));

                                const fines = await getFineHistory(taxpayerId);
                                const payments = await getPaymentHistory(taxpayerId);
                                const taxSummary = (await getTaxHistory(taxpayerId)).data;
                                const islrReports = (await getIslrReports(taxpayerId)).data

                                return { events, fines, payments, taxSummary, islrReports, taxpayerData };
                            } catch (error) {
                                console.error(error);
                                return { events: [], fines: [], payments: [], taxSummary: [], islrReports: [], taxpayerData: null };
                            }
                        },
                    },
                ],
            },
        ],
    },
]);