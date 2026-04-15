import { LoadingState, PageHeader } from '@/components/UI/v2';
import ContributionsFilter from '@/components/contributions/contributions-filter';
import ContributionsStatistics from '@/components/contributions/contributions-statistics';
import { GroupData } from '@/components/contributions/contribution-types';
import { getContributions } from '@/components/utils/api/report-functions';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/**
 * ContributionsPageV2 - Página de Contribuciones con diseño Shadcn UI v2.0
 */
export default function ContributionsPageV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState<GroupData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
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

    if (!shouldFetch || !hasValidDates) return;

    // Feedback UX: mostrar loading en cuanto cambia filtro (año, mes o supervisor)
    setLoading(true);

    const fetchGroups = async () => {
      try {
        setLoading(true);
        const query: Record<string, string> = {
          startDate,
          endDate
        };

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
            setLoading(false);
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

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-700">
      <PageHeader
        title="Contribuciones"
        description="Seguimiento detallado de recaudación por fiscal y coordinación"
      />
      
      <div className="space-y-10">
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
        
        <div className="pt-4">
          {loading ? (
            <LoadingState message="Cargando métricas de contribución..." />
          ) : (
            <ContributionsStatistics
              groupData={groupData}
              selectedGroup={selectedGroup}
              selectedSupervisorId={selectedSupervisorId}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
