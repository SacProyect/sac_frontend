import LoginPage from './pages/Auth/LoginPage'
import { ProtectedRoute } from './components/Navigation/ProtectedRoute';
import Sidebar from './components/Navigation/Sidebar';
import HomePage from './pages/Home/HomePage';
import { getPendingPayments, getTaxpayerEvents } from './components/utils/api/taxpayerFunctions';
import { createBrowserRouter, LoaderFunctionArgs } from 'react-router-dom';
import { AuthLayout } from './hooks/useAuth';
import { getFineHistory, getIslrReports, getPaymentHistory, getTaxHistory } from './components/utils/api/reportFunctions';
import { getOfficers } from './components/utils/api/userFunctions';
import { Event } from './types/event';
import { Payment } from './types/payment';
import MainLayout from '@/MainLayout';
import { lazy, Suspense } from 'react';
import ContributionsPage from './pages/Contributions/ContributionsPage';
import { IVAReports } from './types/IvaReports';
import ReportModal from './components/reports/ReportModal';
import ReportModalGroups from './components/reports/ReportModalGroups';
import { ISLRReports } from './types/ISLRReports';
import FiscalReviewPage from './pages/fiscal-review/FiscalReviewPage';

const FinePage = lazy(() => import('./pages/Events/FinePage'));
const ComitmentPage = lazy(() => import('./pages/Events/ComitmentPage'));
const PaymentPage = lazy(() => import('./pages/Events/PaymentPage'));
const NoticePage = lazy(() => import('./pages/Events/NoticePage'));
const TaxpayerForm = lazy(() => import('./components/Taxpayer/TaxpayerForm'));
const TaxpayerDetail = lazy(() => import('./pages/Taxpayer/TaxpayerDetail'));
const ErrorsReport = lazy(() => import("./components/errors/report/ErrorsReport"));
const StatsPage = lazy(() => import("./pages/stats/StatsPage"));
const ObservationsPage = lazy(() => import("@/pages/Observations/ObservationsPage"));
const IvaReport = lazy(() => import("@/pages/iva/IvaReport"));
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
const IslrReport = lazy(() => import("@/pages/ISLR/IslrReport"));
const TaxpayerCensus = lazy(() => import("@/pages/Census/CensusPage"));
const CensusTable = lazy(() => import("@/pages/CensusTable/CensusTablePage"));
const IndexIva = lazy(() => import("@/pages/index-iva/IndexIva"));
const FiscalStats = lazy(() => import("@/pages/fiscal-stats/FiscalStatsPage"));


type LoaderData = {
  events: Event[],
  payments: Payment[],
  fines: Fines[],
  taxSummary: IVAReports[],
  islrReports: ISLRReports[],
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
        element: <LoginPage />,
      },
      {
        path: "/",
        element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: "fine/:taxpayerId?",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl text-center items-center justify-center z-50 bg-white'>Cargando Página de multas...</div>} > <FinePage /> </Suspense>,
          },
          {
            path: "/contributions",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl text-center items-center justify-center z-50 bg-white'>Cargando Página de contribuciones...</div>} > <ContributionsPage /> </Suspense>,
          },
          {
            path: "/show-census",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl text-center items-center justify-center z-50 bg-white'>Cargando Página de censo...</div>} > <CensusTable /> </Suspense>,
          },
          {
            path: "payment_compromise/:taxpayerId?",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl text-center items-center justify-center z-50 bg-white'>Cargando Página de compromisos de pago...</div>} ><ComitmentPage /></Suspense>,
          },
          {
            path: "payment/:taxpayerId?",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl text-center items-center justify-center z-50 bg-white'>Cargando Página de pagos...</div>} > <PaymentPage /> </Suspense>,
            loader: async ({ params }) => {
              try {
                const taxpayerId = params.taxpayer;

                // console.log("TAXPAYER ID APP.TSX: " + taxpayerId)



                if (!taxpayerId) return [];
                const pendingPayments = await getPendingPayments(taxpayerId);
                return pendingPayments.map((event: Event) => ({
                  id: event.id,
                  value: event.id,
                  name: `${event.type} ${event.date.split("T")[0]} ${event.taxpayer}`,
                }));
              } catch (error) {
                console.log("No se pudieron obtener los taxpayers: " + error);
                return [];
              }
            },
          },
          {
            path: "warning/:taxpayerId?",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Avisos...</div>} ><NoticePage /></Suspense>,
          },
          {
            path: "observations/:taxpayerId?",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Observaciones...</div>} ><ObservationsPage /></Suspense>,
          },
          {
            path: "report/errors",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Aviso de error...</div>} ><ErrorsReport /></Suspense>,
          },
          {
            path: "/stats",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Estadísticas...</div>} ><StatsPage /></Suspense>
          },
          {
            path: "/fiscal-review",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Revisión de fiscales...</div>} ><FiscalReviewPage /></Suspense>
          },
          {
            path: "/fiscal-stats/:fiscalId",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Estadísticas...</div>} ><FiscalStats /></Suspense>
          },
          {
            path: "/index-iva",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Indice de IVA...</div>} ><IndexIva /></Suspense>
          },
          {
            path: "/iva",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Reporte de IVA...</div>} ><IvaReport /></Suspense>
          },
          {
            path: "/getGroupReport/:groupId",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Reporte de Grupos...</div>} ><ReportModalGroups /></Suspense>
          },
          {
            path: "taxpayer/",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Formulario de Contribuyentes...</div>} >
              <div className='w-full h-full'>
                <TaxpayerForm />
              </div>
            </Suspense>,
            loader: async () => {
              try {
                const response = await getOfficers();
                return response.map((item: { id: number; name: string; personId: string }) => ({
                  value: item.id,
                  name: `${item.name} C.I.:${item.personId}`,
                  id: item.id,
                }));
              } catch (error) {
                console.error("No se pudieron obtener los funcionarios: " + error);
                return [];
              }
            },
          },
          {
            path: "census/",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Formulario de Contribuyentes Para Censo...</div>} >
              <div className='w-full h-full'>
                <TaxpayerCensus />
              </div>
            </Suspense>,
            loader: async () => {
              try {
                const response = await getOfficers();
                return response.map((item: { id: number; name: string; personId: string }) => ({
                  value: item.id,
                  name: `${item.name} C.I.:${item.personId}`,
                  id: item.id,
                }));
              } catch (error) {
                console.error("No se pudieron obtener los funcionarios: " + error);
                return [];
              }
            },
          },
          {
            path: "/islr",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Reporte de ISLR...</div>} ><IslrReport /></Suspense>
          },
          {
            path: "taxpayer/:taxpayer?",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Detalles del Contribuyente...</div>} ><TaxpayerDetail /></Suspense>,
            loader: async ({ params }: LoaderFunctionArgs): Promise<LoaderData> => {
              try {
                const taxpayerId = params.taxpayer;
                if (!taxpayerId) return { events: [], fines: [], payments: [], taxSummary: [], islrReports: [] };
                const events: Event[] = await getTaxpayerEvents(taxpayerId);
                events.forEach((event) => (event.id = `${event.id}`));

                const fines = await getFineHistory(taxpayerId);
                const payments = await getPaymentHistory(taxpayerId);
                const taxSummary = (await getTaxHistory(taxpayerId)).data;
                const islrReports = (await getIslrReports(taxpayerId)).data

                console.log("EVENTS FROM APP.TSX: " + JSON.stringify(events))

                return { events, fines, payments, taxSummary, islrReports };
              } catch (error) {
                console.error(error);
                return { events: [], fines: [], payments: [], taxSummary: [], islrReports: [] };
              }
            },
          },
          {
            path: "/gen-reports/:taxpayer?",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Generación de Reportes...</div>} ><ReportsPage /></Suspense>,
            loader: async ({ params }: LoaderFunctionArgs): Promise<LoaderData> => {
              try {
                const taxpayerId = params.taxpayer;
                if (!taxpayerId) return { events: [], fines: [], payments: [], taxSummary: [], islrReports: [] };
                const events: Event[] = await getTaxpayerEvents(taxpayerId);
                events.forEach((event) => (event.id = `${event.id}_${event.type}`));

                const fines = await getFineHistory(taxpayerId);
                const payments = await getPaymentHistory(taxpayerId);
                const taxSummary = (await getTaxHistory(taxpayerId)).data;
                const islrReports = (await getIslrReports(taxpayerId)).data

                console.log("EVENTS FROM APP.TSX: " + JSON.stringify(events))

                return { events, fines, payments, taxSummary, islrReports };
              } catch (error) {
                console.error(error);
                return { events: [], fines: [], payments: [], taxSummary: [], islrReports: [] };
              }
            },
          },
          {
            path: "/reports/gen/:taxpayer",
            element: <Suspense fallback={<div className='absolute top-0 right-0 w-[100vw] h-[100vh] lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center text-center justify-center z-50 bg-white'>Cargando Página de Generación de Reportes...</div>} ><ReportModal /></Suspense>,
            loader: async ({ params }: LoaderFunctionArgs): Promise<LoaderData> => {
              try {

                const taxpayerId = params.taxpayer;

                console.log("PARAMS:", params);
                console.log("TAXPAYER ID:", taxpayerId);
                if (!taxpayerId) return { events: [], fines: [], payments: [], taxSummary: [], islrReports: [] };
                const events: Event[] = await getTaxpayerEvents(taxpayerId);
                events.forEach((event) => (event.id = `${event.id}_${event.type}`));

                const fines = await getFineHistory(taxpayerId);
                const payments = await getPaymentHistory(taxpayerId);
                const taxSummary = (await getTaxHistory(taxpayerId)).data;
                const islrReports = (await getIslrReports(taxpayerId)).data

                console.log("EVENTS FROM APP.TSX: " + JSON.stringify(events))

                return { events, fines, payments, taxSummary, islrReports };
              } catch (error) {
                console.error(error);
                return { events: [], fines: [], payments: [], taxSummary: [], islrReports: [] };
              }
            },
          },
        ],
      },
    ],
  },
]);

