import LoginPage from './pages/Auth/LoginPage'
import { ProtectedRoute } from './components/Navigation/ProtectedRoute';
import Sidebar from './components/Navigation/Sidebar';
import HomePage from './pages/Home/HomePage';
import FinePage from './pages/Events/FinePage';
import ComitmentPage from './pages/Events/ComitmentPage';
import PaymentPage from './pages/Events/PaymentPage';
import NoticePage from './pages/Events/NoticePage';
import TaxpayerForm from './components/Taxpayer/TaxpayerForm';
import TaxpayerDetail from './pages/Taxpayer/TaxpayerDetail';
import { getPendingPayments, getTaxpayerEvents } from './components/utils/api/taxpayerFunctions';
import { createBrowserRouter, LoaderFunctionArgs } from 'react-router-dom';
import { AuthLayout } from './hooks/useAuth';
import { getFineHistory, getPaymentHistory } from './components/utils/api/reportFunctions';
import { getOfficers } from './components/utils/api/userFunctions';
import { Event } from './types/event';
import { Payment } from './types/payment';
import MainLayout from '@/MainLayout';


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
  quantity: number,
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
            path: "fine/:taxpayer?",
            element: <FinePage />,
          },
          {
            path: "payment_compromise/:taxpayer?",
            element: <ComitmentPage />,
          },
          {
            path: "payment/:taxpayer?",
            element: <PaymentPage />,
            loader: async ({ params }) => {
              try {
                const taxpayerId = params.taxpayer;
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
            path: "warning/:taxpayer?",
            element: <NoticePage />,
          },
          {
            path: "taxpayer/",
            element: <TaxpayerForm />,
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
            element: <TaxpayerDetail />,
            loader: async ({ params }: LoaderFunctionArgs): Promise<LoaderData> => {
              try {
                const taxpayerId = params.taxpayer;
                if (!taxpayerId) return { events: [], fines: [], payments: [] };
                const events: Event[] = await getTaxpayerEvents(taxpayerId);
                events.forEach((event) => (event.id = `${event.id}_${event.type}`));

                const fines = await getFineHistory(taxpayerId);
                const payments = await getPaymentHistory(taxpayerId);

                console.log("EVENTOS DESDE APP.TSX: " + JSON.stringify(events))

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

