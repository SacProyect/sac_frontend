import ContributionsFilter from '@/components/contributions/ContributionsFilter';
import ContributionsHeader from '@/components/contributions/ContributionsHeader';
import ContributionsStatistics from '@/components/contributions/ContributionsStatistics';
import ContributionsPageSkeleton from '@/components/contributions/ContributionsPageSkeleton';
import { GroupData } from '@/components/contributions/ContributionTypes';
import { getContributions } from '@/components/utils/api/reportFunctions';
import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';





function ContributionsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const shouldFetch = user.role === "ADMIN" || user.role === "COORDINATOR";
        const hasValidDates = startDate && endDate;

        if (!shouldFetch || (user.role === "ADMIN" && !hasValidDates)) return;

        setLoading(true);

        const fetchGroups = async () => {
            try {
                const query: Record<string, string> = {};

                if (hasValidDates) {
                    query.startDate = startDate;
                    query.endDate = endDate;

                }

                if (selectedSupervisorId) {
                    query.supervisorId = selectedSupervisorId
                }

                if (user.role === "ADMIN") {
                    const response = await getContributions(query);
                    setGroupData(response);
                    // console.log(response)
                } else if (user.role === "COORDINATOR") {
                    const groupId = user.coordinatedGroup?.id;

                    if (!groupId) {
                        toast.error("No se encontró el grupo coordinado para este usuario.");
                        return;
                    }
                    query.id = groupId;
                    const response = await getContributions(query);
                    setGroupData(response);
                    setSelectedGroup(groupId);
                } else {
                    navigate("/401");
                }
            } catch (e) {
                console.error(e);
                toast.error("No se pudieron obtener las contribuciones.");
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
        <aside className='lg:w-[82vw] w-full h-full overflow-y-auto'>
            <ContributionsHeader />
            <ContributionsFilter
                groupData={groupData}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                setSelectedGroup={setSelectedGroup}
                setSelectedSupervisorId={setSelectedSupervisorId}
            />
            <div className='pt-8 pb-16 pl-8 pr-4 lg:pb-0'>
                <ContributionsStatistics groupData={groupData} selectedGroup={selectedGroup} selectedSupervisorId={selectedSupervisorId} startDate={startDate} endDate={endDate} />
            </div>
        </aside>
    )
}

export default ContributionsPage