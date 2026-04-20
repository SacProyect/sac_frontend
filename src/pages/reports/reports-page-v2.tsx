import { useParams } from 'react-router-dom';
import { Card } from '@/components/UI/card';
import { PageHeader } from '@/components/UI/v2';
import GenerateReport from '@/components/reports/generate-report';

/**
 * ReportsPageV2 - Página de Generación de Reportes con diseño Shadcn UI v2.0
 */
export default function ReportsPageV2() {
  const { taxpayer } = useParams<{ taxpayer?: string }>();

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-500">
      <PageHeader
        title={taxpayer ? "Reporte Detallado" : "Generar Reportes"}
        description={taxpayer 
          ? "Visualizando información específica del contribuyente seleccionado" 
          : "Busca contribuyentes y genera reportes consolidados por grupo o individuales"
        }
      />
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 p-1 sm:p-2 transition-all duration-300 hover:border-slate-700/50 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden backdrop-blur-sm">
          <GenerateReport />
        </Card>
      </div>
    </div>
  );
}
