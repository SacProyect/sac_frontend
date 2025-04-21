import LoginPage from './pages/Auth/LoginPage'
import { ProtectedRoute } from './components/Navigation/ProtectedRoute';
import Sidebar from './components/Navigation/Sidebar';
import HomePage from './pages/Home/HomePage';
import { getPendingPayments, getTaxpayerEvents } from './components/utils/api/taxpayerFunctions';
import { createBrowserRouter, LoaderFunctionArgs } from 'react-router-dom';
import { AuthLayout } from './hooks/useAuth';
import { getFineHistory, getPaymentHistory } from './components/utils/api/reportFunctions';
import { getOfficers } from './components/utils/api/userFunctions';
import { Event } from './types/event';
import { Payment } from './types/payment';
import MainLayout from '@/MainLayout';
import { lazy, Suspense } from 'react';
import ContributionsPage from './pages/Contributions/ContributionsPage';

const FinePage = lazy(() => import('./pages/Events/FinePage'));
const ComitmentPage = lazy(() => import('./pages/Events/ComitmentPage'))
const PaymentPage = lazy(() => import('./pages/Events/PaymentPage'));
const NoticePage = lazy(() => import('./pages/Events/NoticePage'));
const TaxpayerForm = lazy(() => import('./components/Taxpayer/TaxpayerForm'));
const TaxpayerDetail = lazy(() => import('./pages/Taxpayer/TaxpayerDetail'));
const ErrorsReport = lazy(() => import("./components/errors/report/ErrorsReport"))
const StatsPage = lazy(() => import("./pages/stats/StatsPage"))


type LoaderData = {
  events: Event[],
  payments: Payment[],
  fines: Fines[]
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
            element: <Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Página de compromisos de multas...</div>} > <FinePage /> </Suspense> ,
          },
          {
            path: "/contributions",
            element: <Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Página de contribuciones...</div>} > <ContributionsPage/> </Suspense> ,
          },
          {
            path: "payment_compromise/:taxpayerId?",
            element: <Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Página de compromisos de pago...</div>} ><ComitmentPage /></Suspense> ,
          },
          {
            path: "payment/:taxpayerId?",
            element:<Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Página de pagos...</div>} > <PaymentPage /> </Suspense>,
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
            element:<Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Página de Avisos...</div>} ><NoticePage /></Suspense> ,
          },
          {
            path: "report/errors",
            element:<Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Página de Aviso de error...</div>} ><ErrorsReport/></Suspense> ,
          },
          {
            path: "/stats",
            element: <Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Página de Estadísticas...</div>} ><StatsPage/></Suspense>
          },
          {
            path: "taxpayer/",
            element:<Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Formulario de Contribuyentes...</div>} ><TaxpayerForm /></Suspense> ,
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
            path: "taxpayer/:taxpayer?",
            element:<Suspense fallback={<div className='absolute top-0 right-0 lg:w-[82vw] lg:h-[100vh] flex text-2xl items-center justify-center z-50 bg-white'>Cargando Detalles del Contribuyente...</div>} ><TaxpayerDetail /></Suspense> ,
            loader: async ({ params }: LoaderFunctionArgs): Promise<LoaderData> => {
              try {
                const taxpayerId = params.taxpayer;
                if (!taxpayerId) return { events: [], fines: [], payments: [] };
                const events: Event[] = await getTaxpayerEvents(taxpayerId);
                events.forEach((event) => (event.id = `${event.id}_${event.type}`));

                const fines = await getFineHistory(taxpayerId);
                const payments = await getPaymentHistory(taxpayerId);

                console.log("EVENTS FROM APP.TSX: " + JSON.stringify(events))

                return { events, fines, payments };
              } catch (error) {
                console.error(error);
                return { events: [], fines: [], payments: [] };
              }
            },
          },
        ],
      },
    ],
  },
]);

