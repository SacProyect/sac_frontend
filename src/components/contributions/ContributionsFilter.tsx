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
    const currentYear = new Date().getFullYear();
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [optionClicked, setOptionClicked] = useState("Year");
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedSupervisors, setSelectedSupervisors] = useState<Record<string, string | null>>({});

    const calendarRef = useRef<HTMLDivElement>(null);
    const startMonth = 0;

    // Rango de años para el selector (ej: 2024, 2025, 2026)
    const getAvailableYears = () => {
        const from = currentYear - 2;
        const to = currentYear + 1;
        return Array.from({ length: to - from + 1 }, (_, i) => from + i);
    };

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

    const getAvailableMonths = (year: number) => {
        const allMonths = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const from = year === currentYear ? startMonth : 0;
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

    // console.log(groupData.map((group) => group.supervisorsStats));

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
                        <p className='text-xs'>Año {selectedYear}</p>
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
                    const collectedFines = stats?.collectedFines ?? group.collectedFines;

                    const selectedIndex = selectedId
                        ? group.supervisorsStats.findIndex(s => s.supervisorId === selectedId)
                        : -1;

                    return (
                        <div key={group.id} className='w-full h-full pt-2 border-2 border-black rounded-lg cursor-pointer'>
                            <div className='flex justify-between w-full px-2 space-x-2'>
                                <div className='w-2/3'>
                                    <p className='text-xs font-semibold'>{group.name.replace(/GRUPO/gi, 'COORDINACIÓN')}</p>
                                    <p className='text-[11px] text-gray-500'>
                                        Vista: {selectedIndex >= 0 ? `Supervisor ${selectedIndex + 1}` : "Coordinación completa"}
                                    </p>
                                </div>
                                <div className='w-1/2'>
                                    <p className='w-full px-4 py-1 text-xs font-semibold text-center bg-gray-200 border border-gray-400 rounded-full'>Año {selectedYear}</p>
                                </div>
                            </div>

                            <div className='flex flex-col gap-1 px-2 mt-2'>
                                {group.supervisorsStats.map((supervisorStat, index) => {
                                    // Función para reemplazar nombre solo en coordinación 1
                                    const getDisplayName = (name: string, groupName: string) => {
                                        const normalizedGroupName = groupName.replace(/GRUPO/gi, 'COORDINACIÓN');
                                        if (normalizedGroupName === 'COORDINACIÓN 1' && name === 'Alieska Yepez') {
                                            return 'Estefany Rincon';
                                        }
                                        return name;
                                    };
                                    
                                    return (
                                        <button
                                            key={supervisorStat.supervisorId}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSupervisors(prev => ({
                                                    ...prev,
                                                    [group.id]: supervisorStat.supervisorId
                                                }));
                                            setSelectedGroup(group.id); // Selecciona la coordinación
                                            setSelectedSupervisorId(supervisorStat.supervisorId); // Selecciona supervisor
                                            }}
                                            className='px-2 py-1 text-xs bg-blue-100 border border-gray-400 rounded-md hover:bg-blue-200'
                                        >
                                            {getDisplayName(supervisorStat.supervisorName, group.name)}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSupervisors(prev => ({
                                            ...prev,
                                            [group.id]: null
                                        }));
                                        setSelectedGroup(group.id); // Selecciona la coordinación
                                        setSelectedSupervisorId(null); // Borra filtro de supervisor
                                    }}
                                    className='px-2 py-1 text-xs bg-gray-100 border border-gray-400 rounded-md hover:bg-gray-200'
                                >
                                    Ver Coordinación Completa
                                </button>
                            </div>
                            <div className='lg:px-2'>
                                <div className='flex justify-between w-full pt-2'>
                                    <p className='text-xs '>Multas Pagadas:</p>
                                    <p className='text-xs font-semibold'>{Number(fines).toLocaleString()}</p>
                                </div>
                                <div className='flex justify-between w-full pt-2'>
                                    <p className='text-xs '>Cob. Multas:</p>
                                    <p className='text-xs font-semibold'>{Number(collectedFines).toLocaleString()}</p>
                                </div>
                                <div className='flex justify-between pt-2'>
                                    <p className='text-xs '>Pag. IVA:</p>
                                    <p className='text-xs font-semibold'>{Number(iva).toLocaleString()} Bs.S</p>
                                </div>
                                <div className='flex justify-between pt-2'>
                                    <p className='text-xs '>Pag. ISLR:</p>
                                    <p className='text-xs font-semibold'>{Number(islr).toLocaleString()} Bs.S</p>
                                </div>
                                <div className='flex justify-between pt-2'>
                                    <p className='text-xs '>Cob. Total:</p>
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
