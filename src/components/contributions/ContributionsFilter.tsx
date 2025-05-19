import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { CiCalendar } from "react-icons/ci";
import { getContributions } from '../utils/api/reportFunctions';
import toast from 'react-hot-toast';
import { GroupData } from './ContributionTypes';


interface ContributionsFilterProps {
    groupData: GroupData[],
    setSelectedGroup: (groupId: string) => void;
    setStartDate: (startDate: string) => void;
    setEndDate: (endDate: string) => void;
}



function ContributionsFilter({ groupData, setSelectedGroup, setStartDate, setEndDate }: ContributionsFilterProps) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [optionClicked, setOptionClicked] = useState("Year")
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null); // Ref to calendar container


    if (!user) {
        navigate("/login")
        return null;
    }

    if (user.role === "COORDINATOR") setSelectedGroup(user.coordinatedGroup.id);

    const startYear = new Date().getFullYear();
    const startMonth = 0; // April = 3 (0-based index)

    useEffect(() => {
        // Trigger startDate and endDate updates on selection
        if (optionClicked === "Year" && selectedYear) {
            const start = `${selectedYear}-01-01`;
            const end = `${selectedYear}-12-31`;
            setStartDate(start);
            setEndDate(end);
        }

        if (optionClicked === "Month" && selectedYear && selectedMonth !== null) {
            const start = new Date(selectedYear, selectedMonth, 1);
            const end = new Date(selectedYear, selectedMonth + 1, 0); // last day of month

            const formatDate = (d: Date) => d.toISOString().split("T")[0];
            setStartDate(formatDate(start));
            setEndDate(formatDate(end));
        }

        if (optionClicked === "Month" && selectedMonth === null) {
            setStartDate("");
            setEndDate("");
        }

    }, [selectedYear, selectedMonth, optionClicked]);

    const getAvailableYears = () => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
    };

    const getAvailableMonths = (year: number) => {
        const allMonths = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const from = year === startYear ? startMonth : 0;
        return allMonths.map((name, index) => ({ name, index })).slice(from);
    };

    // Click outside to close calendar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setCalendarOpen(false); // Close the calendar
            }
        };

        if (calendarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [calendarOpen]);


    return (
        <section className='w-full pl-8'>
            <div className='relative flex items-center pt-4 '>
                <p>Filtrar por: </p>
                <div className='pt-1 pl-4 '>
                    <button className='flex items-center justify-center space-x-4 text-center bg-white border border-gray-200 ' onClick={() => setCalendarOpen(!calendarOpen)}>
                        <CiCalendar size={15} />
                        <p className='text-xs'>Año {startYear}</p>
                    </button>
                </div>
                {calendarOpen && (
                    <div ref={calendarRef} className='absolute lg:w-72 w-60 h-32 bg-white top-16 left-[5.5rem] rounded-md shadow-lg pt-4 z-10'>
                        <div className='flex w-full px-4'>
                            <button
                                className={`w-1/2 py-2 ${optionClicked === "Month" ? "bg-white font-semibold" : "bg-gray-200"}`}
                                onClick={() => setOptionClicked("Month")}
                            >
                                Por Mes
                            </button>
                            <button
                                className={`w-1/2 py-2 ${optionClicked === "Year" ? "bg-white font-semibold" : "bg-gray-200"}`}
                                onClick={() => {
                                    setOptionClicked("Year");
                                    setSelectedMonth(null); // reset month
                                }}
                            >
                                Por Año
                            </button>
                        </div>

                        <div className='flex items-center justify-center px-4 pt-2 space-x-4'>
                            {/* Month Selector if Month option is selected */}
                            {optionClicked === "Month" && (
                                <select
                                    className='w-full p-1 mt-2 border'
                                    value={selectedMonth ?? ""}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    <option value="" disabled>Selecciona un mes</option>
                                    {getAvailableMonths(selectedYear).map(({ name, index }) => (
                                        <option key={index} value={index}>{name}</option>
                                    ))}
                                </select>
                            )}

                            {/* Year Selector */}
                            <select
                                className={` p-1 mt-2 border ${optionClicked === "Year" ? "w-full" : "w-24"}`}
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            >
                                {getAvailableYears().map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                        </div>
                    </div>
                )}
            </div>
            {user.role === "ADMIN" && (
                <div className='lg:h-64 h-96 pt-4 pr-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(120px,1fr))] gap-4 overflow-y-auto custom-scroll'>
                    {groupData.length > 0 ? (
                        groupData.map((group) => (
                            <div key={group.id} className='w-full pt-2 pb-2 border-2 border-black rounded-lg cursor-pointer lg:w-full h-28 lg:h-full' onClick={() => setSelectedGroup(group.id)}>
                                <div className='flex justify-between w-full px-2 space-x-2'>
                                    <div className='w-2/3'>
                                        <p className='text-xs font-semibold'>{group.name}</p>
                                    </div>
                                    <div className='w-1/2'>
                                        <p className='w-full px-4 py-1 text-xs font-semibold text-center bg-gray-200 border border-gray-400 rounded-full'>Año 2025</p>
                                    </div>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className='text-xs '>Recaudado Multas:</p>
                                    <p className='text-xs font-semibold'>{group.collected} Bs</p>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className='text-xs '>Multas:</p>
                                    <p className='text-xs font-semibold'>{group.totalFines}</p>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className='text-xs '>Recaudado IVA:</p>
                                    <p className='text-xs font-semibold'>{group.totalIva?  group.totalIva.toString(): 0} Bs</p>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className='text-xs '>Recaudado ISRL:</p>
                                    <p className='text-xs font-semibold'>{group.collected} Bs</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center col-span-full">No groups found.</p>
                    )}
                </div>
            )}
            {user.role === "COORDINATOR" && (
                <div className='lg:h-64 h-64 pt-4 pr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(120px,1fr))] gap-4 overflow-y-auto custom-scroll'>
                    {groupData.length > 0 ? (
                        groupData.map((group) => (
                            <div key={group.id} className='w-full pt-2 border-2 border-black rounded-lg cursor-pointer h-28 lg:h-full'>
                                <div className='flex justify-between w-full px-2 space-x-2'>
                                    <div className='w-2/3'>
                                        <p className='text-xs font-semibold'>{group.id}</p>
                                    </div>
                                    <div className='w-1/2'>
                                        <p className='w-full px-4 py-1 text-xs font-semibold text-center bg-gray-200 border border-gray-400 rounded-full'>Año 2025</p>
                                    </div>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className='text-xs '>Recaudado Multas:</p>
                                    <p className='text-xs font-semibold'>{group.collected} Bs</p>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className='text-xs '>Multas:</p>
                                    <p className='text-xs font-semibold'>{group.totalFines}</p>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className='text-xs '>Recaudado IVA:</p>
                                    <p className='text-xs font-semibold'>{group.totalIva.toString()} Bs</p>
                                </div>
                                <div className='flex justify-between px-2 pt-2'>
                                    <p className='text-xs '>Recaudado ISLR:</p>
                                    <p className='text-xs font-semibold'>{group.collected} Bs</p>
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