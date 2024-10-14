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
          path: "multa",
          element: <FinePage />
        },
        {
          path: "compromiso_pago",
          element: <ComitmentPage />
        }, {
          path: "pago",
          element: <PaymentPage />
        }, {
          path: "aviso",
          element: <NoticePage />
        }, {
          path: "contribuyente",
          element: <TaxpayerForm />
        }
      ]
    }
  ]);
  return routes;
}
