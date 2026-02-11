import { Card } from '@/components/UI/card';
import { PageHeader } from '@/components/UI/v2';
import IslrForm from '@/components/ISLR/IslrForm';

/**
 * IslrReportV2 - Página de Reporte ISLR con diseño Shadcn UI v2.0
 */
export default function IslrReportV2() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporte de ISLR"
        description="Registra y gestiona reportes de ISLR para contribuyentes"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <IslrForm />
      </Card>
    </div>
  );
}
