import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/v2';
import ContributionsFilter from '@/components/contributions/ContributionsFilter';
import ContributionsHeader from '@/components/contributions/ContributionsHeader';
import ContributionsStatistics from '@/components/contributions/ContributionsStatistics';
import { GroupData } from '@/components/contributions/ContributionTypes';
import { getContributions } from '@/components/utils/api/reportFunctions';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ContributionsPageSkeleton from '@/components/contributions/ContributionsPageSkeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';

/**
 * ContributionsPageV2 - Página de Contribuciones con diseño Shadcn UI v2.0
 */
export default function ContributionsPageV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState<GroupData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statisticsPanelOpen, setStatisticsPanelOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const shouldFetch = user.role === 'ADMIN' || user.role === 'COORDINATOR';
    const hasValidDates = startDate && endDate;

    if (!shouldFetch || (user.role === 'ADMIN' && !hasValidDates)) return;

    // Feedback UX: mostrar loading en cuanto cambia filtro (año, mes o supervisor)
    setLoading(true);

    const fetchGroups = async () => {
      try {
        const query: Record<string, string> = {};

        if (hasValidDates) {
          query.startDate = startDate;
          query.endDate = endDate;
        }

        if (selectedSupervisorId) {
          query.supervisorId = selectedSupervisorId;
        }

        if (user.role === 'ADMIN') {
          const response = await getContributions(query);
          setGroupData(response);
        } else if (user.role === 'COORDINATOR') {
          const groupId = user.coordinatedGroup?.id;

          if (!groupId) {
            toast.error('No se encontró el grupo coordinado para este usuario.');
            return;
          }
          query.id = groupId;
          const response = await getContributions(query);
          setGroupData(response);
          setSelectedGroup(groupId);
        } else {
          navigate('/401');
        }
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron obtener las contribuciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [startDate, endDate, selectedSupervisorId, user, navigate]);

  if (loading) {
    return <ContributionsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estadísticas por Coordinación"
        description="Consulta y análisis de contribuciones por grupo"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200 hover:border-slate-600 hover:shadow-md">
        <ContributionsHeader />
        <ContributionsFilter
          groupData={groupData}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setSelectedGroup={(id) => {
            setSelectedGroup(id);
            if (id) setStatisticsPanelOpen(true);
          }}
          setSelectedSupervisorId={setSelectedSupervisorId}
        />
      </Card>

      {/* Panel de estadísticas: se abre al seleccionar una coordinación, se cierra con la X */}
      <Sheet
        open={statisticsPanelOpen && !!selectedGroup}
        onOpenChange={(open) => {
          if (!open) {
            setStatisticsPanelOpen(false);
            setSelectedGroup('');
            setSelectedSupervisorId(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-slate-700 bg-white sm:max-w-4xl"
        >
          <div className="pr-8 pt-2">
            <ContributionsStatistics
              groupData={groupData}
              selectedGroup={selectedGroup}
              selectedSupervisorId={selectedSupervisorId}
              startDate={startDate}
              endDate={endDate}
              onClearSelection={() => {
                setStatisticsPanelOpen(false);
                setSelectedGroup('');
                setSelectedSupervisorId(null);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
