import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card } from '@/components/UI/card';
import { PageHeader } from '@/components/UI/v2';
import GroupReportStatistics from '@/components/reports/group-report-statistics';
import { getGroupRecords } from '@/components/utils/api/report-functions';
import { GroupRecordsApiResponse } from '@/types/group-records';
import toast from 'react-hot-toast';

export default function GroupReportPageV2() {
  const { id } = useParams<{ id: string }>();
  const [groupData, setGroupData] = useState<GroupRecordsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getGroupRecords({ id, year: new Date().getFullYear() });
        setGroupData(data);
      } catch (error) {
        console.error("Error fetching group report:", error);
        toast.error("Ocurrió un error al cargar el reporte del grupo.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroupData();
  }, [id]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-500">
      <PageHeader
        title="Estadísticas de Grupo"
        description="Visualizando información de fiscalización para este grupo."
      />
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 p-4 sm:p-6 transition-all duration-300 hover:border-slate-700/50 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden backdrop-blur-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <svg className="w-8 h-8 mb-4 text-indigo-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <p className="text-sm font-medium">Cargando estadísticas del grupo...</p>
            </div>
          ) : (
            <GroupReportStatistics 
                groupData={groupData} 
                selectedGroup={id || ""} 
                pdfMode={false} 
            />
          )}
        </Card>
      </div>
    </div>
  );
}
