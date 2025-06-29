import React, { useEffect, useState } from 'react'
import { getContributions } from '../utils/api/reportFunctions';
import toast from 'react-hot-toast';
import { GroupData } from './ContributionTypes';
import { BiSort, BiSortUp, BiSortDown } from "react-icons/bi";


interface ContributionsStatisticsProps {
    groupData: GroupData[],
    selectedGroup: string,
    pdfMode?: boolean // <-- nueva prop opcional
    selectedSupervisorId: string | null;
}


function ContributionsStatistics({ groupData, selectedGroup, pdfMode = false, selectedSupervisorId }: ContributionsStatisticsProps) {
    const [typeClicked, setTypeClicked] = useState("FP")
    const [multiSortConfig, setMultiSortConfig] = useState<Record<string, 'asc' | 'desc' | null>>({});
    const [groupId, supervisorId] = selectedGroup.split("_");


    // Filter the statistics to show based on the selected group
    const groupStatistics = groupData.filter((group) => group.id === selectedGroup);
    const selectedGroupData = groupStatistics.length > 0 ? groupStatistics[0] : null;


    // Selected data based on process type inside of taxpayers
    const selectedData = selectedGroupData?.members
        ?.filter((member) => {
            // Si hay filtro por supervisor, solo tomar los que coinciden
            if (!selectedSupervisorId) return true;
            return member.supervisorId === selectedSupervisorId;
        }).map((member) => {
            // Filter taxpayers based on the selected type
            const filteredTaxpayers = member.taxpayer.filter(
                (taxpayer) => !typeClicked || taxpayer.process === typeClicked
            );

            // Sum up payments only for the filtered taxpayers
            const totalCollected = filteredTaxpayers ? filteredTaxpayers.reduce((memberSum, taxpayer) => {
                const taxpayerTotal = (taxpayer.payment ?? []).reduce(
                    (sum, pay) => sum + Number(pay.amount),
                    0
                );
                return memberSum + taxpayerTotal;
            }, 0) : 0;

            const totalWarnings = filteredTaxpayers.reduce((warningSum, taxpayer) => {
                return warningSum + (taxpayer.event?.filter(event => event.type === "WARNING").length ?? 0);
            }, 0);

            const totalFines = filteredTaxpayers.reduce((finesSum, taxpayer) => {
                return finesSum + (taxpayer.event.filter(event => event.type === "FINE").length ?? 0);
            }, 0);

            const totalCompromises = filteredTaxpayers.reduce((compromisesSum, taxpayer) => {
                return compromisesSum + (taxpayer.event.filter((event) => event.type === "PAYMENT_COMPROMISE").length ?? 0);
            }, 0);


            const totalTaxpayers = filteredTaxpayers.length;


            // ✅ Nuevo cálculo del total IVA
            const totalIVA = filteredTaxpayers.reduce((ivaSum, taxpayer) => {
                const taxpayerIVA = taxpayer.IVAReports?.reduce(
                    (sum, report) => sum + Number(report.paid || 0),
                    0
                ) || 0;
                return (ivaSum + taxpayerIVA);
            }, 0);

            return {
                ...member,
                taxpayer: filteredTaxpayers, // Keep only the filtered taxpayers
                totalCollected, // Store the total collected amount
                totalWarnings,
                totalFines,
                totalCompromises,
                totalTaxpayers,
                totalIVA: parseFloat(totalIVA.toFixed(2)),
            };
        })
        .filter((member) => member.taxpayer.length > 0); // Remove members with no taxpayers matching the filter


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
        <section className=' border border-gray-200 w-full lg:h-[52vh] h-[80vh] rounded-md mb-4 lg:mb-0'>

            {/* Section header */}
            {selectedGroupData ? (
                <>
                    <div className='flex justify-between w-full'>
                        <p className='pt-4 pl-4 text-xl font-semibold'>Estadisticas para: {selectedGroupData?.name} - Abril 2025</p>
                        {/* <button className='font-normal text-gray-500'>Close</button> */}
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
                                        <button onClick={() => handleSort("totalCollected")} className="text-xs">Recaudado Multas</button>
                                        <SortIcon column="totalCollected" />
                                    </div>
                                    {sortedData?.map((data) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalCollected}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalCollected")} className="text-xs">Recaudado IVA</button>
                                        <SortIcon column="totalCollected" />
                                    </div>
                                    {sortedData?.map((data) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalIVA}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalCollected")} className="text-xs">Recaudado ISLR</button>
                                        <SortIcon column="totalCollected" />
                                    </div>
                                    {sortedData?.map((data) => (
                                        <div className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalCollected}</p>
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
                                            <p>{member.totalWarnings}</p>
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
                                            <p>{member.totalFines}</p>
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
                                            <p>{member.totalCompromises}</p>
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
                                            <p className="text-xs">{member.totalTaxpayers}</p>
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
                </>
            ) : (
                <div className='flex items-center justify-center w-full h-full'>
                    <p className='pt-4 pl-4 text-2xl'>Seleccione un grupo por favor</p>
                </div>
            )}








        </section>
    )
}

export default ContributionsStatistics