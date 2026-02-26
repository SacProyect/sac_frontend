import { Card } from '@/components/UI/card';
import { PageHeader } from '@/components/UI/v2';
import IvaForm from '@/components/iva/iva-form';

/**
 * IvaReportV2 - Página de Reporte IVA con diseño Shadcn UI v2.0
 */
export default function IvaReportV2() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Reporte de IVA"
        description="Registra y gestiona reportes de IVA para contribuyentes"
      />
      <div className="w-full">
        <IvaForm />
      </div>
    </div>
  );
}
