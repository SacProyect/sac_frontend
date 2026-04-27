import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { LoadingState } from '@/components/UI/v2';
import toast from 'react-hot-toast';
import { FiscalDetailsView } from '@/pages/fiscal-review/fiscal-review-page-v2';
import { fiscalCarteraYearNow } from '@/utils/fiscal-cartera-year';

/**
 * Estadísticas personales del fiscal — misma vista que "Exploración de Fiscal"
 * en Revisión Fiscal (paginación, KPIs clicables, rotación TV tras inactividad).
 */
export default function FiscalStatsDashboardV2() {
  const { fiscalId } = useParams<{ fiscalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const backTo = user?.role === 'FISCAL' ? '/admin' : '/stats';

  const effectiveFiscalId = fiscalId || user?.id || '';
  const initialYear = fiscalCarteraYearNow();

  useEffect(() => {
    if (user?.role === 'FISCAL' && user.id !== fiscalId && fiscalId) {
      toast.error('No puede acceder a esta página.');
      navigate(backTo);
    }
  }, [user, fiscalId, navigate, backTo]);

  if (!effectiveFiscalId || !user) {
    return <LoadingState message="Cargando..." />;
  }

  return (
    <FiscalDetailsView
      fiscalId={effectiveFiscalId}
      onBack={() => navigate(backTo)}
      initialYear={initialYear}
    />
  );
}
