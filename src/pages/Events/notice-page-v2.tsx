import { useParams, Navigate, useLoaderData } from 'react-router-dom';
import { Card } from '@/components/UI/card';
import { PageHeader } from '@/components/UI/v2';
import EventForm from '@/components/Events/event-form';
import { useAuth } from '@/hooks/use-auth';

/**
 * NoticePageV2 - Página de Avisos con diseño Shadcn UI v2.0
 */
export default function NoticePageV2() {
  const { taxpayerId } = useParams();
  const { user } = useAuth();
  const data = useLoaderData() as { taxpayerData: any } | null;
  const taxpayerData = data?.taxpayerData;

  const isMyTaxpayer = user?.taxpayer?.some(t => t.id === taxpayerId) || taxpayerData?.user?.id === user?.id;
  const isAuthorized = user?.role === 'ADMIN' || isMyTaxpayer;

  if (!isAuthorized) {
    return <Navigate to="/admin" replace />;
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Agregar Aviso"
        description="Registra un nuevo aviso para un contribuyente"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <EventForm title="Aviso" type="warning" taxpayerId={taxpayerId || ""} />
      </Card>
    </div>
  );
}
