import React, { useState } from 'react'
import { GroupData } from './ContributionTypes';
import { BiSort, BiSortUp, BiSortDown } from "react-icons/bi";
import { X } from "lucide-react";


interface ContributionsStatisticsProps {
    groupData: GroupData[],
    selectedGroup: string,
    pdfMode?: boolean
    selectedSupervisorId: string | null;
    startDate: string;
    endDate: string;
    /** Al cerrar el panel de estadísticas, limpia la coordinación seleccionada */
    onClearSelection?: () => void;
}


function ContributionsStatistics({ groupData = [], selectedGroup, pdfMode = false, selectedSupervisorId, startDate, endDate, onClearSelection }: ContributionsStatisticsProps) {
    const [typeClicked, setTypeClicked] = useState("FP")
    const [hintDismissed, setHintDismissed] = useState(false)
    const [multiSortConfig, setMultiSortConfig] = useState<Record<string, 'asc' | 'desc' | null>>({});

    const groupStatistics = Array.isArray(groupData) ? groupData.filter((group) => group.id === selectedGroup) : [];
    const selectedGroupData = groupStatistics.length > 0 ? groupStatistics[0] : null;


    // Detectar si el API devuelve forma "completa" (members con taxpayer) o "ligera" (solo supervisorsStats)
    const membersList = selectedGroupData?.members ?? [];
    const hasMemberTaxpayerData = membersList.some(
        (m) => Array.isArray((m as { taxpayer?: unknown[] }).taxpayer) && ((m as { taxpayer: unknown[] }).taxpayer.length > 0)
    );
    const groupWithStats = selectedGroupData as GroupData & {
        supervisorsStats?: Array<{
            supervisorId: string;
            supervisorName: string;
            collectedIva?: string;
            collectedISLR?: string;
            collectedFines?: string;
            totalFines?: string;
            totalCollected?: string;
        }>;
    };
    const supervisorsStats = groupWithStats?.supervisorsStats ?? [];

    let selectedData: Array<{
        name: string;
        type?: string;
        totalWarnings: number;
        totalFines: number;
        totalCompromises: number;
        totalTaxpayers: number;
        totalCollectedFines: number;
        totalISLR: number;
        totalIVA: number;
    }> = [];

    if (!selectedGroup || !selectedGroupData) {
        selectedData = [];
    } else if (!hasMemberTaxpayerData && supervisorsStats.length > 0) {
        // API fiscal-groups: tabla desde supervisorsStats
        let statsList = [...supervisorsStats];
        if (selectedSupervisorId) {
            statsList = statsList.filter((s) => s.supervisorId === selectedSupervisorId);
        }
        selectedData = statsList.map((s) => ({
            name: s.supervisorName ?? '',
            type: typeClicked,
            totalWarnings: 0,
            totalFines: Number(s.totalFines ?? 0),
            totalCompromises: 0,
            totalTaxpayers: 0,
            totalCollectedFines: Number(s.collectedFines ?? 0),
            totalISLR: Number(s.collectedISLR ?? 0),
            totalIVA: Number(s.collectedIva ?? 0),
        }));
    } else {
        // API con member.taxpayer
        selectedData = membersList
            .filter((member) => {
                if (!selectedSupervisorId) return true;
                return (member as { supervisorId?: string }).supervisorId === selectedSupervisorId;
            })
            .map((member) => {
                const taxpayers = (member as { taxpayer?: unknown[] }).taxpayer ?? [];
                const filteredTaxpayers = (taxpayers as Array<{ process?: string; event?: Array<{ type: string; amount?: string }>; IVAReports?: Array<{ paid?: string }>; ISLRReports?: Array<{ paid?: string }> }>).filter(
                    (taxpayer) => !typeClicked || taxpayer.process === typeClicked
                );

                const totalWarnings = filteredTaxpayers.reduce((warningSum, taxpayer) => {
                    return warningSum + ((taxpayer.event?.filter(event => event.type === "WARNING").length) ?? 0);
                }, 0);

                const totalFines = filteredTaxpayers.reduce((finesSum, taxpayer) => {
                    return finesSum + ((taxpayer.event ?? []).filter(event => event.type === "FINE").length ?? 0);
                }, 0);

                const totalCompromises = filteredTaxpayers.reduce((compromisesSum, taxpayer) => {
                    return compromisesSum + ((taxpayer.event ?? []).filter((event) => event.type === "PAYMENT_COMPROMISE").length ?? 0);
                }, 0);

                const totalTaxpayers = filteredTaxpayers.length;

                const totalIVA = filteredTaxpayers.reduce((ivaSum, taxpayer) => {
                    const taxpayerIVA = taxpayer.IVAReports?.reduce(
                        (sum, report) => sum + Number(report.paid || 0),
                        0
                    ) || 0;
                    return (ivaSum + taxpayerIVA);
                }, 0);

                const totalISLR = filteredTaxpayers.reduce((islrSum, taxpayer) => {
                    const taxpayerIslr = taxpayer.ISLRReports?.reduce(
                        (sum, report) => sum + Number(report.paid || 0),
                        0
                    ) || 0;
                    return (islrSum + taxpayerIslr);
                }, 0);

                const totalCollectedFines = filteredTaxpayers.reduce((acc, taxpayer) => {
                    const events = taxpayer.event ?? [];
                    const collectedFines = events.filter((ev) => ev.type === "FINE").reduce(
                        (sum, report) => sum + Number(report.amount || 0),
                        0
                    ) || 0;
                    return acc + collectedFines;
                }, 0);

                return {
                    name: (member as { name: string }).name,
                    type: typeClicked,
                    totalWarnings,
                    totalFines,
                    totalCompromises,
                    totalTaxpayers,
                    totalCollectedFines,
                    totalISLR,
                    totalIVA: parseFloat(totalIVA.toFixed(2)),
                };
            })
            .filter((row) => row.totalTaxpayers > 0);
    }


    // Handle the sorting of each column
    const handleSort = (key: string) => {
        setMultiSortConfig((prev) => {
            const currentDirection = prev[key];
            let newDirection: 'asc' | 'desc' | null;

            // If the column is already sorted, toggle its direction
            if (currentDirection === 'asc') {
                newDirection = 'desc';
            } else if (currentDirection === 'desc') {
                newDirection = null;
            } else {
                newDirection = 'asc';
            }

            return {
                ...prev, // Keep existing sorting for other columns
                [key]: newDirection, // Update the clicked column only
            };
        });
    };


    // Sort selectedData based on sortConfig
    const sortedData = selectedData ? [...selectedData].sort((a, b) => {
        const sortKeys = Object.keys(multiSortConfig).filter((key) => multiSortConfig[key]);

        for (let key of sortKeys) {
            const direction = multiSortConfig[key];
            const valueA = a[key as keyof typeof a];
            const valueB = b[key as keyof typeof b];

            const valA = typeof valueA === "number"
                ? valueA
                : (valueA?.toString().toLowerCase() ?? "");
            const valB = typeof valueB === "number"
                ? valueB
                : (valueB?.toString().toLowerCase() ?? "");

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
        }

        return 0;
    }) : [];


    // Icon to sort each column of the table
    const SortIcon = ({ column }: { column: string }) => {
        const direction = multiSortConfig[column];
        if (!direction) return <BiSort />;
        if (direction === 'asc') return <BiSortUp />;
        return <BiSortDown />;
    };




    return (
        <section className='border border-gray-200 w-full rounded-md mb-4 lg:mb-0'>

            {selectedGroupData ? (
                <>
                    <div className='flex min-h-[52vh] lg:min-h-[52vh] flex-col'>
                    <div className='flex flex-shrink-0 items-start justify-between gap-2 pt-4 pl-4 pr-4'>
                        <p className='text-xl font-semibold text-gray-800'>
                            Estadísticas para: {selectedGroupData?.name.replace(/GRUPO/gi, 'COORDINACIÓN')}
                            {startDate && endDate
                                ? `. Desde la fecha: ${new Date(startDate).toLocaleDateString("es-VE")} hasta la fecha: ${new Date(endDate).toLocaleDateString("es-VE")}`
                                : ""}
                        </p>
                        {onClearSelection && (
                            <button
                                type="button"
                                onClick={onClearSelection}
                                className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800"
                                aria-label="Cerrar y deseleccionar coordinación"
                            >
                                <X className="h-4 w-4" />
                                Cerrar
                            </button>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className='grid w-full grid-cols-3 px-4 py-4 text-center'>
                        <div className={`w-full rounded-l-md`} >
                            <button className={`w-full ${typeClicked == "FP" ? "bg-white" : "bg-gray-200"}`} onClick={() => setTypeClicked("FP")}>FP</button>
                        </div>
                        <div className='w-full bg-gray-200'>
                            <button className={`w-full ${typeClicked == "AF" ? "bg-white" : "bg-gray-200"}`} onClick={() => setTypeClicked("AF")}>AF</button>
                        </div>
                        <div className='w-full bg-gray-200 rounded-r-md'>
                            <button className={`w-full ${typeClicked == "VDF" ? "bg-white" : "bg-gray-200"}`} onClick={() => setTypeClicked("VDF")}>VDF</button>
                        </div>
                    </div>



                    {/* Table */}
                    <div className="w-full px-4 border-collapse">
                        <div className="w-full lg:h-[20rem] h-[24rem] border border-gray-200 rounded-md overflow-y-auto overflow-x-auto ">
                            <div className="grid w-full grid-cols-10 text-xs" style={{ gridTemplateColumns: 'repeat(10, minmax(160px, 1fr))' }}>
                                <div className=''>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("name")} className="text-xs">
                                            Fiscal
                                        </button>
                                        <SortIcon column="name" />
                                    </div>
                                    {sortedData?.map((data) => (
                                        <div className='flex flex-col items-center w-full py-2 bg-gray-200 border-t-2 border-gray-300'>
                                            <p className=''>{data.name}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("type")} className="text-xs">Tipo</button>
                                        <SortIcon column="type" />
                                    </div>
                                    {sortedData?.map((data) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{typeClicked}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalCollected")} className="text-xs">Pagado Multas</button>
                                        <SortIcon column="totalCollected" />
                                    </div>
                                    {sortedData?.map((data) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalCollectedFines.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalCollected")} className="text-xs">Pagado IVA</button>
                                        <SortIcon column="totalCollected" />
                                    </div>
                                    {sortedData?.map((data) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalIVA.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalCollected")} className="text-xs">Pagado ISLR</button>
                                        <SortIcon column="totalCollected" />
                                    </div>
                                    {sortedData?.map((data) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalISLR.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalWarnings")} className="text-xs">Avisos</button>
                                        <SortIcon column="totalWarnings" />
                                    </div>
                                    {sortedData?.map((member) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{member.totalWarnings.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalFines")} className="text-xs">Multas</button>
                                        <SortIcon column="totalFines" />
                                    </div>
                                    {sortedData?.map((member) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{member.totalFines.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalCompromises")}>Compromisos</button>
                                        <SortIcon column="totalCompromises" />
                                    </div>
                                    {sortedData?.map((member) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{member.totalCompromises.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalTaxpayers")} className="text-xs">Contribuyentes</button>
                                        <div className='pr-4'>
                                            <SortIcon column="totalTaxpayers" />
                                        </div>
                                    </div>
                                    {sortedData?.map((member) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p className="text-xs">{member.totalTaxpayers.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Under the table */}
                    <div className='flex justify-between px-6 pt-1 '>
                        <div className=''>
                            <p className='text-gray-600'>Cantidad de fiscales muestreados en procedimiento {typeClicked}: {selectedData?.length}</p>
                        </div>
                        <div className=''>
                            <p className='text-gray-600'>*Deslice hacia abajo para ver la lista completa*</p>
                        </div>
                    </div>
                    </div>
                </>
            ) : (
                <>
                    {!hintDismissed && (
                        <div className="relative flex items-center justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-blue-800 shadow-sm">
                            <p className="text-sm font-medium">
                                Seleccione una coordinación arriba para ver sus estadísticas.
                            </p>
                            <button
                                type="button"
                                onClick={() => setHintDismissed(true)}
                                className="flex flex-shrink-0 items-center justify-center rounded-md p-1.5 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800"
                                aria-label="Cerrar aviso"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                    {hintDismissed && (
                        <div className="flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50/50 py-12">
                            <button
                                type="button"
                                onClick={() => setHintDismissed(false)}
                                className="text-sm text-gray-500 underline hover:text-gray-700"
                            >
                                Mostrar indicación de nuevo
                            </button>
                        </div>
                    )}
                </>
            )}








        </section>
    )
}

export default ContributionsStatistics