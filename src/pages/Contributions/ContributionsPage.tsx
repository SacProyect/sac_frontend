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

    if (!user) {
        navigate("/login")
        return null;
    }

    console.log(user.coordinatedGroup)



    if (user.role === "ADMIN") {
        useEffect(() => {
            const fetchGroups = async () => {
                try {
                    const response = await getContributions()


                    console.log(response);
                    setGroupData(response);
                } catch (e) {
                    console.error(e)
                    toast.error("No se pudieron obtener las contribuciones, por favor intente de nuevo.")
                }
            }

            fetchGroups();

        }, []);
    } else if (user.role === "COORDINATOR") {
        useEffect(() => {
            const fetchGroups = async () => {
                try {
                    const groupId = user.coordinatedGroup.id

                    const response = await getContributions({ id: groupId })


                    setGroupData(response);
                } catch (e) {
                    toast.error("No se pudieron obtener las contribuciones.")
                }
            }

            fetchGroups();

        }, []);
    } else {
        navigate("/401")
        return null
    }




    return (
        <aside className='w-[82vw] h-full overflow-y-auto'>
            <ContributionsHeader />
            <ContributionsFilter groupData={groupData} setSelectedGroup={setSelectedGroup} />
            <div className='pl-8 pr-4 pt-8'>
                <ContributionsStatistics groupData={groupData} selectedGroup={selectedGroup} />
            </div>
        </aside>
    )
}

export default ContributionsPage