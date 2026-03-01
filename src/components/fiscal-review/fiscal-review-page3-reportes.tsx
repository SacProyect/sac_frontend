import { FiscalInfoExtended } from '@/types/fiscal-stats';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface FiscalReviewPage3Props {
  fiscalInfo: FiscalInfoExtended;
}

export function FiscalReviewPage3Reportes({ fiscalInfo }: FiscalReviewPage3Props) {
  
  const handleDownload = (reportName: string) => {
    toast.success(`Descargando reporte de ${reportName}...`);
    // Lógica para descargar PDF
  };

  const reports = [
    {
      id: 'vdf-in-time',
      name: 'VDF en Plazo (≤10 días)',
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
    },
    {
      id: 'af-in-time',
      name: 'AF en Plazo (≤120 días)',
      icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'vdf-out-time',
      name: 'VDF Fuera de Plazo (>10 días)',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
    },
    {
      id: 'af-out-time',
      name: 'AF Fuera de Plazo (>120 días)',
      icon: <XCircle className="h-5 w-5 text-red-500" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
      {reports.map((report) => (
        <Card key={report.id} className="bg-slate-800 border-slate-700 p-6 flex items-center justify-between transition-colors hover:bg-slate-700/50 hover:border-slate-600">
          <div className="flex items-center gap-3">
            {report.icon}
            <h3 className="text-white font-medium">{report.name}</h3>
          </div>
          <Button 
            onClick={() => handleDownload(report.name)}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </Card>
      ))}
    </div>
  );
}
