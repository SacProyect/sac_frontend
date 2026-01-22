import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/v2';
import IvaForm from '@/components/iva/IvaForm';

/**
 * IvaReportV2 - Página de Reporte IVA con diseño Shadcn UI v2.0
 */
export default function IvaReportV2() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporte de IVA"
        description="Registra y gestiona reportes de IVA para contribuyentes"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <IvaForm />
      </Card>
    </div>
  );
}
