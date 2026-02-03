import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/v2';
import EventForm from '@/components/Events/EventForm';

/**
 * FinePageV2 - Página de Multas con diseño Shadcn UI v2.0
 */
export default function FinePageV2() {
  const { taxpayerId } = useParams();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agregar Multa"
        description="Registra una nueva multa para un contribuyente"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <EventForm title="Multa" type="fine" taxpayerId={taxpayerId || ""} />
      </Card>
    </div>
  );
}
