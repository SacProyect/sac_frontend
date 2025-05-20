import ContributionsFilter from '@/components/contributions/ContributionsFilter'
import ContributionsHeader from '@/components/contributions/ContributionsHeader'
import ContributionsStatistics from '@/components/contributions/ContributionsStatistics'
import { GroupData } from '@/components/contributions/ContributionTypes';
import { getContributions } from '@/components/utils/api/reportFunctions';
import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';





function ContributionsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");


    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const shouldFetch = user.role === "ADMIN" || user.role === "COORDINATOR";

        const hasValidDates = startDate && endDate;

        // No ejecutar si faltan datos necesarios
        if (!shouldFetch || (user.role === "ADMIN" && !hasValidDates)) return;

        const fetchGroups = async () => {
            try {
                const query: Record<string, string> = {};

                if (hasValidDates) {
                    query.startDate = startDate;
                    query.endDate = endDate;
                }

                if (user.role === "ADMIN") {
                    const response = await getContributions(query);
                    setGroupData(response);
                    console.log(response)
                } else if (user.role === "COORDINATOR") {
                    const groupId = user.coordinatedGroup.id;
                    query.id = groupId;
                    const response = await getContributions(query);
                    setGroupData(response);
                    setSelectedGroup(groupId);
                } else {
                    navigate("/401");
                }
            } catch (e) {
                toast.error("No se pudieron obtener las contribuciones.");
            }
        };

        fetchGroups();
    }, [startDate, endDate]);


    return (
        <aside className='lg:w-[82vw] w-full h-full overflow-y-auto'>
            <ContributionsHeader />
            <ContributionsFilter groupData={groupData} setSelectedGroup={setSelectedGroup} setStartDate={setStartDate} setEndDate={setEndDate} />
            <div className='pt-8 pb-16 pl-8 pr-4 lg:pb-0'>
                <ContributionsStatistics groupData={groupData} selectedGroup={selectedGroup} />
            </div>
        </aside>
    )
}

export default ContributionsPage