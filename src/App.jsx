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
import { getTaxpayerEvents } from './components/utils/api/taxpayerFunctions';
import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from './hooks/useAuth';
import { getFineHistory, getPaymentHistory } from './components/utils/api/reportFunctions';
import { getFuncionarios } from './components/utils/api/userFunctions';



export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />
      },
      {
        element: <ProtectedRoute>
          <Sidebar />
        </ProtectedRoute>,
        children: [
          {
            path: "/",
            element: <HomePage />
          }, {
            path: "multa/:contribuyente?",
            element: <FinePage />
          },
          {
            path: "compromiso_pago/:contribuyente?",
            element: <ComitmentPage />
          }, {
            path: "pago/:contribuyente?",
            element: <PaymentPage />
          }, {
            path: "aviso/:contribuyente?",
            element: <NoticePage />
          }, {
            path: "contribuyente/",
            element: <TaxpayerForm />,
            loader: async ({ params }) => {
              try {
                const response = await getFuncionarios()
                console.log(response)
                const official = response.map((item) => { return { value: item.id, name: `${item.nombre} C.I.:${item.cedula}`, id: item.id } })
                return official
              } catch (error) {
                return []
              }


            }
          }, {
            path: "contribuyente/:contribuyente?",
            element: <TaxpayerDetail />,
            loader: async ({ params }) => {
              try {
                const contribuyente = params.contribuyente
                const events = await getTaxpayerEvents(contribuyente)
                events.forEach(event => event.id = `${event.id}_${event.tipo}`)
                const fines = await getFineHistory(contribuyente)
                const payments = await getPaymentHistory(contribuyente)
                return { events, fines, payments }
              } catch (error) {

              }

            }
          }
        ]
      }
    ]
  },
]);
