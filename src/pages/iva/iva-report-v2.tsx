import { Card } from '@/components/UI/card';
import { PageHeader } from '@/components/UI/v2';
import { AutomationPromoBanner } from '@/components/subscription/automation-promo-banner';
import { BulkIvaImportPanel } from '@/components/subscription/bulk-iva-import-panel';
import IvaForm from '@/components/iva/iva-form';
import { Button } from '@/components/UI/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
/**
 * IvaReportV2 - Página de Reporte IVA con diseño Shadcn UI v2.0
 */
export default function IvaReportV2() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Reporte de IVA"
        description="Registra y gestiona reportes de IVA para contribuyentes"
        action={<Button variant="outline" onClick={() => navigate('/admin')} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>}
      />

      <AutomationPromoBanner className="mb-2" />

      <BulkIvaImportPanel />

      <div className="w-full">
        <IvaForm />
      </div>
    </div>
  );
}
