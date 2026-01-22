import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/v2';
import GenerateReport from '@/components/reports/GenerateReport';

/**
 * ReportsPageV2 - Página de Generación de Reportes con diseño Shadcn UI v2.0
 */
export default function ReportsPageV2() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Generar Reportes"
        description="Busca contribuyentes y genera reportes completos"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <GenerateReport />
      </Card>
    </div>
  );
}
