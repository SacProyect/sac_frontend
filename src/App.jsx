import { useRoutes } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage'
import { ProtectedRoute } from './components/Navigation/ProtectedRoute';
import Sidebar from './components/Navigation/Sidebar';
import HomePage from './pages/Home/HomePage';


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
        }
      ]
    }
  ]);
  return routes;
}
