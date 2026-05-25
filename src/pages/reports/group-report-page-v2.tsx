import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/UI/v2';
import { GroupKpiCards } from '@/components/reports/group-kpi-cards';
import { GroupCharts } from '@/components/reports/group-charts';
import { GroupFiscalTable } from '@/components/reports/group-fiscal-table';
import { getGroupRecords } from '@/components/utils/api/report-functions';
import { GroupRecordsApiResponse } from '@/types/group-records';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function GroupReportPageV2() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const year = Number(searchParams.get('year')) || new Date().getFullYear();
  const [groupData, setGroupData] = useState<GroupRecordsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getGroupRecords({ id, year });
        setGroupData(data);
      } catch (error) {
        console.error("Error fetching group report:", error);
        toast.error("Ocurrió un error al cargar el reporte del grupo.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroupData();
  }, [id, year]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-500">
      <PageHeader
        title={groupData ? groupData.groupName : "Estadísticas de Grupo"}
        description={groupData
          ? `Año ${year} · ${groupData.records.length} registros de fiscalización`
          : "Visualizando información de fiscalización para este grupo."
        }
        backTo="/gen-reports"
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
          <Loader2 className="w-8 h-8 mb-4 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium">Cargando estadísticas del grupo...</p>
        </div>
      ) : !groupData ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
          <p className="text-lg font-medium">No se pudieron cargar los datos</p>
          <p className="text-sm mt-2">Intente de nuevo más tarde</p>
        </div>
      ) : (
        <div className="space-y-6">
          <GroupKpiCards data={groupData} />
          <GroupCharts data={groupData} />
          <GroupFiscalTable data={groupData} />
        </div>
      )}
    </div>
  );
}
