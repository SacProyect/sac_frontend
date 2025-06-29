import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CiCalendar } from "react-icons/ci";
import { GroupData } from './ContributionTypes';

interface ContributionsFilterProps {
    groupData: GroupData[];
    setStartDate: (startDate: string) => void;
    setEndDate: (endDate: string) => void;
    setSelectedGroup: (groupId: string) => void; // <- NUEVO
    setSelectedSupervisorId: (supervisorId: string | null) => void; // <- NUEVO
}

function ContributionsFilter({
    groupData,
    setStartDate,
    setEndDate,
    setSelectedGroup,
    setSelectedSupervisorId,
}: ContributionsFilterProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [optionClicked, setOptionClicked] = useState("Year");
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedSupervisors, setSelectedSupervisors] = useState<Record<string, string | null>>({});

    const calendarRef = useRef<HTMLDivElement>(null);
    const startYear = new Date().getFullYear();
    const startMonth = 0;

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (optionClicked === "Year" && selectedYear) {
            setStartDate(`${selectedYear}-01-01`);
            setEndDate(`${selectedYear}-12-31`);
        }

        if (optionClicked === "Month" && selectedYear && selectedMonth !== null) {
            const start = new Date(selectedYear, selectedMonth, 1);
            const end = new Date(selectedYear, selectedMonth + 1, 0);
            const formatDate = (d: Date) => d.toISOString().split("T")[0];
            setStartDate(formatDate(start));
            setEndDate(formatDate(end));
        }

        if (optionClicked === "Month" && selectedMonth === null) {
            setStartDate("");
            setEndDate("");
        }
    }, [selectedYear, selectedMonth, optionClicked]);

    const getAvailableYears = () => [startYear];
    const getAvailableMonths = (year: number) => {
        const allMonths = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const from = year === startYear ? startMonth : 0;
        return allMonths.map((name, index) => ({ name, index })).slice(from);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setCalendarOpen(false);
            }
        };
        if (calendarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [calendarOpen]);

    return (
        <section className='w-full pl-8'>
            <div className='relative flex items-center pt-4'>
                <p>Filtrar por: </p>
                <div className='pt-1 pl-4'>
                    <button
                        className='flex items-center justify-center space-x-4 text-center bg-white border border-gray-200'
                        onClick={() => setCalendarOpen(!calendarOpen)}
                    >
                        <CiCalendar size={15} />
                        <p className='text-xs'>Año {startYear}</p>
                    </button>
                </div>
                {calendarOpen && (
                    <div ref={calendarRef} className='absolute lg:w-72 w-60 h-32 bg-white top-16 left-[5.5rem] rounded-md shadow-lg pt-4 z-10'>
                        <div className='flex w-full px-4'>
                            <button className={`w-1/2 py-2 ${optionClicked === "Month" ? "bg-white font-semibold" : "bg-gray-200"}`} onClick={() => setOptionClicked("Month")}>Por Mes</button>
                            <button className={`w-1/2 py-2 ${optionClicked === "Year" ? "bg-white font-semibold" : "bg-gray-200"}`} onClick={() => {
                                setOptionClicked("Year");
                                setSelectedMonth(null);
                            }}>Por Año</button>
                        </div>
                        <div className='flex items-center justify-center px-4 pt-2 space-x-4'>
                            {optionClicked === "Month" && (
                                <select className='w-full p-1 mt-2 border' value={selectedMonth ?? ""} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                                    <option value="" disabled>Selecciona un mes</option>
                                    {getAvailableMonths(selectedYear).map(({ name, index }) => (
                                        <option key={index} value={index}>{name}</option>
                                    ))}
                                </select>
                            )}
                            <select className={`p-1 mt-2 border ${optionClicked === "Year" ? "w-full" : "w-24"}`} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                {getAvailableYears().map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className='lg:h-64 h-full pt-4 pr-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(140px,1fr))] gap-4 overflow-y-auto custom-scroll'>
                {groupData.map(group => {
                    const selectedId = selectedSupervisors[group.id] ?? null;
                    const stats = selectedId
                        ? group.supervisorsStats.find(s => s.supervisorId === selectedId)
                        : null;

                    const collected = stats?.totalCollected ?? group.collected;
                    const fines = stats?.totalFines ?? group.totalFines;
                    const iva = stats?.collectedIva ?? group.totalIva;
                    const islr = stats?.collectedISLR ?? group.totalIslr;

                    const selectedIndex = selectedId
                        ? group.supervisorsStats.findIndex(s => s.supervisorId === selectedId)
                        : -1;

                    return (
                        <div key={group.id} className='w-full h-full pt-2 border-2 border-black rounded-lg cursor-pointer'>
                            <div className='flex justify-between w-full px-2 space-x-2'>
                                <div className='w-2/3'>
                                    <p className='text-xs font-semibold'>{group.name}</p>
                                    <p className='text-[11px] text-gray-500'>
                                        Vista: {selectedIndex >= 0 ? `Supervisor ${selectedIndex + 1}` : "Grupo completo"}
                                    </p>
                                </div>
                                <div className='w-1/2'>
                                    <p className='w-full px-4 py-1 text-xs font-semibold text-center bg-gray-200 border border-gray-400 rounded-full'>Año {selectedYear}</p>
                                </div>
                            </div>

                            <div className='flex flex-col gap-1 px-2 mt-2'>
                                {group.supervisorsStats.map((supervisorStat, index) => (
                                    <button
                                        key={supervisorStat.supervisorId}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedSupervisors(prev => ({
                                                ...prev,
                                                [group.id]: supervisorStat.supervisorId
                                            }));
                                            setSelectedGroup(group.id); // Selecciona el grupo
                                            setSelectedSupervisorId(supervisorStat.supervisorId); // Selecciona supervisor
                                        }}
                                        className='px-2 py-1 text-xs bg-blue-100 border border-gray-400 rounded-md hover:bg-blue-200'
                                    >
                                        Supervisor {index + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSupervisors(prev => ({
                                            ...prev,
                                            [group.id]: null
                                        }));
                                        setSelectedGroup(group.id); // Selecciona el grupo
                                        setSelectedSupervisorId(null); // Borra filtro de supervisor
                                    }}
                                    className='px-2 py-1 text-xs bg-gray-100 border border-gray-400 rounded-md hover:bg-gray-200'
                                >
                                    Ver Grupo Completo
                                </button>
                            </div>
                            <div className='lg:px-2'>
                                <div className='flex justify-between w-full pt-2'>
                                    <p className='text-xs '>Multas:</p>
                                    <p className='text-xs font-semibold'>{Number(fines).toLocaleString()}</p>
                                </div>
                                <div className='flex justify-between pt-2'>
                                    <p className='text-xs '>Rec. IVA:</p>
                                    <p className='text-xs font-semibold'>{Number(iva).toLocaleString()} Bs.S</p>
                                </div>
                                <div className='flex justify-between pt-2'>
                                    <p className='text-xs '>Rec. ISLR:</p>
                                    <p className='text-xs font-semibold'>{Number(islr).toLocaleString()} Bs.S</p>
                                </div>
                                <div className='flex justify-between pt-2'>
                                    <p className='text-xs '>Rec. Total:</p>
                                    <p className='text-xs font-semibold'>{Number(collected).toLocaleString()} Bs.S</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default ContributionsFilter;
