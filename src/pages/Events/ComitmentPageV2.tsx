import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/v2';
import EventForm from '@/components/Events/EventForm';

/**
 * ComitmentPageV2 - Página de Compromisos de Pago con diseño Shadcn UI v2.0
 */
export default function ComitmentPageV2() {
  const { taxpayerId } = useParams();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agregar Compromiso de Pago"
        description="Registra un nuevo compromiso de pago para un contribuyente"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <EventForm title="Compromiso de pago" type="payment_compromise" taxpayerId={taxpayerId || ""} />
      </Card>
    </div>
  );
}
