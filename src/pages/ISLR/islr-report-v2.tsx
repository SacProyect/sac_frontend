import { PageHeader } from '@/components/UI/v2';
import IslrForm from '@/components/ISLR/islr-form';
import { Button } from '@/components/UI/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
/**
 * IslrReportV2 - Página de Reporte ISLR con diseño Shadcn UI v2.0
 */
export default function IslrReportV2() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Reporte de ISLR"
        description="Registra y gestiona reportes de ISLR para contribuyentes"
        action={<Button variant="outline" onClick={() => navigate('/admin')} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>}
      />
      <div className="pt-2">
        <IslrForm />
      </div>
    </div>
  );
}
