import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { CiCalendar } from "react-icons/ci";
import { getContributions } from '../utils/api/reportFunctions';
import toast from 'react-hot-toast';
import { GroupData } from './ContributionTypes';


interface ContributionsFilterProps {
    groupData: GroupData[],
    setSelectedGroup: (groupId: string) => void;
}



function ContributionsFilter({ groupData, setSelectedGroup }: ContributionsFilterProps) {
    const { user } = useAuth()
    const navigate = useNavigate()

    if (!user) {
        navigate("/login")
        return null;
    }

    if (user.role === "COORDINATOR") setSelectedGroup(user.coordinatedGroup.id);

    console.log("USER: " + JSON.stringify(user))


    return (
        <section className='w-full pl-8'>
            <div className=' pt-4 flex items-center'>
                <p>Filtrar por: </p>
                <div className='pt-1 pl-4'>
                    <button className=' bg-white flex items-center justify-center text-center space-x-4 border border-gray-200'>
                        <CiCalendar size={15} />
                        <p className='text-xs'>Year 2025</p>
                    </button>
                </div>
            </div>
            {user.role === "ADMIN" && (
                <div className='h-64 pt-4 pr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(120px,1fr))] gap-4 overflow-y-auto custom-scroll'>
                    {groupData.length > 0 ? (
                        groupData.map((group) => (
                            <div key={group.id} className='w-full h-28 pt-2 border-2 border-black rounded-lg cursor-pointer' onClick={() => setSelectedGroup(group.id)}>
                                <div className='w-full flex justify-between px-2 space-x-2'>
                                    <div className='w-2/3'>
                                        <p className='font-semibold text-xs'>{group.id}</p>
                                    </div>
                                    <div className='w-1/2'>
                                        <p className='w-full text-xs rounded-full bg-gray-200 px-4 py-1 text-center font-semibold border border-gray-400'>Año 2025</p>
                                    </div>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className=' text-xs'>Recaudado:</p>
                                    <p className='font-semibold text-xs'>{group.collected} Bs</p>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className=' text-xs'>Multas:</p>
                                    <p className='font-semibold text-xs'>{group.totalFines}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center col-span-full">No groups found.</p>
                    )}
                </div>
            )}
            {user.role === "COORDINATOR" && (
                <div className='h-64 pt-4 pr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(120px,1fr))] gap-4 overflow-y-auto custom-scroll'>
                    {groupData.length > 0 ? (
                        groupData.map((group) => (
                            <div key={group.id} className='w-full h-28 pt-2 border-2 border-black rounded-lg cursor-pointer'>
                                <div className='w-full flex justify-between px-2 space-x-2'>
                                    <div className='w-2/3'>
                                        <p className='font-semibold text-xs'>{group.id}</p>
                                    </div>
                                    <div className='w-1/2'>
                                        <p className='w-full text-xs rounded-full bg-gray-200 px-4 py-1 text-center font-semibold border border-gray-400'>Año 2025</p>
                                    </div>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className=' text-xs'>Recaudado:</p>
                                    <p className='font-semibold text-xs'>{group.collected} Bs</p>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className=' text-xs'>Multas:</p>
                                    <p className='font-semibold text-xs'>{group.totalFines}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center col-span-full">No groups found.</p>
                    )}
                </div>
            )}








        </section>
    )
}

export default ContributionsFilter