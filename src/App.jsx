import { useRoutes } from 'react-router-dom';
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


export default function App() {
  const routes = useRoutes([
    {
      path: "/login",
      element: <LoginPage />
    },
    {
      path: "/",
      element: <ProtectedRoute>
        <Sidebar />
      </ProtectedRoute>,
      children: [
        {
          path: "home",
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
          element: <TaxpayerForm />
        }, {
          path: "contribuyente/:contribuyente?",
          element: <TaxpayerDetail />
        }
      ]
    }
  ]);
  return routes;
}
