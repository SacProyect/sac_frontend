import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/v2';
import EventForm from '@/components/Events/event-form';

/**
 * NoticePageV2 - Página de Avisos con diseño Shadcn UI v2.0
 */
export default function NoticePageV2() {
  const { taxpayerId } = useParams();
  
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
