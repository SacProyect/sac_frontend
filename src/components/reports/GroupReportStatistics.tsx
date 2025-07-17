import { GroupRecordProcess, GroupRecordsApiResponse } from '@/types/groupRecords';
import { useState } from 'react'
import { BiSort, BiSortUp, BiSortDown } from "react-icons/bi";

type GroupReportStatisticsProps = {
    groupData: GroupRecordsApiResponse | null;
    selectedGroup: string;
    pdfMode: boolean;
    forceType?: 'FP' | 'AF' | 'VDF';
}

type RecordType = GroupRecordsApiResponse['records'][number];

function GroupReportStatistics({ groupData, pdfMode = false, forceType }: GroupReportStatisticsProps) {
    const [typeClicked, setTypeClicked] = useState<GroupRecordProcess>(forceType || "FP");
    const [multiSortConfig, setMultiSortConfig] = useState<Record<string, 'asc' | 'desc' | null>>({});

    // Filter records by process type
    const selectedData = groupData?.records
        ?.filter((record: RecordType) => !typeClicked || record.process === typeClicked)
        .map((record: RecordType) => ({
            ...record,
            totalCollected: Number(record.collectedFines ?? 0),
            totalIVA: Number(record.collectedIVA ?? 0),
            totalISLR: Number(record.collectedISLR ?? 0),
            totalWarnings: record.warnings ?? 0,
            totalFines: record.fines ?? 0,
            totalCompromises: record.compromises ?? 0,
            totalTaxpayers: record.taxpayers ?? 0,
            name: record.fiscal.name ?? 0,
        }));

    // Handle the sorting of each column
    const handleSort = (key: string) => {
        setMultiSortConfig((prev) => {
            const currentDirection = prev[key];
            let newDirection: 'asc' | 'desc' | null;
            if (currentDirection === 'asc') {
                newDirection = 'desc';
            } else if (currentDirection === 'desc') {
                newDirection = null;
            } else {
                newDirection = 'asc';
            }
            return {
                ...prev,
                [key]: newDirection,
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
            const valA = typeof valueA === "number" ? valueA : valueA?.toString().toLowerCase();
            const valB = typeof valueB === "number" ? valueB : valueB?.toString().toLowerCase();
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
        }
        return 0;
    }) : [];

    const SortIcon = ({ column }: { column: string }) => {
        const direction = multiSortConfig[column];
        if (!direction) return <BiSort />;
        if (direction === 'asc') return <BiSortUp />;
        return <BiSortDown />;
    };

    return (
        <section
            className="mb-4 border border-gray-200 rounded-md"
            style={{
                width: pdfMode ? '210mm' : '100%',
                margin: pdfMode ? '0 auto' : undefined,
                maxHeight: pdfMode ? 'none' : undefined,
                overflow: pdfMode ? 'visible' : undefined,
            }}
        >
            {groupData ? (
                <>
                    <div className='flex justify-between w-full'>
                        <p className='pt-4 pl-4 text-xl font-semibold'>Estadisticas para: {groupData.groupName}</p>
                    </div>
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
                    <div className="w-full border-collapse">
                        <div className="w-full lg:h-[20rem] h-[24rem] border border-gray-200 rounded-md overflow-y-auto overflow-x-auto ">
                            <div
                                className="grid w-full text-xs"
                                style={{
                                    gridTemplateColumns: pdfMode
                                        ? 'repeat(10, 100px)'
                                        : 'repeat(10, 139px)',
                                }}
                            >
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("name")} className="text-xs">
                                            Fiscal
                                        </button>
                                        <SortIcon column="name" />
                                    </div>
                                    {sortedData?.map((data, idx) => (
                                        <div key={idx} className='flex flex-col items-center w-full py-2 bg-gray-200 border-t-2 border-gray-300'>
                                            <p>{data.name}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalCollected")} className="text-xs">Rec.Multas</button>
                                        <SortIcon column="totalCollected" />
                                    </div>
                                    {sortedData?.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalCollected.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalIVA")} className="text-xs">IVA</button>
                                        <SortIcon column="totalIVA" />
                                    </div>
                                    {sortedData?.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalIVA.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalISLR")} className="text-xs">ISLR</button>
                                        <SortIcon column="totalISLR" />
                                    </div>
                                    {sortedData?.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalISLR.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalWarnings")} className="text-xs">Avisos</button>
                                        <SortIcon column="totalWarnings" />
                                    </div>
                                    {sortedData?.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalWarnings.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalFines")} className="text-xs">Multas</button>
                                        <SortIcon column="totalFines" />
                                    </div>
                                    {sortedData?.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalFines.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center">
                                        <button onClick={() => handleSort("totalCompromises")}>Compromisos</button>
                                        <SortIcon column="totalCompromises" />
                                    </div>
                                    {sortedData?.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p>{data.totalCompromises.toLocaleString()}</p>
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
                                    {sortedData?.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center py-2 bg-gray-200 border-t-2 border-gray-300">
                                            <p className="text-xs">{data.totalTaxpayers.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex justify-between px-6 pt-1 '>
                        <div>
                            <p className='text-gray-600'>Cantidad de fiscales muestreados en procedimiento {typeClicked}: {sortedData?.length ?? 0}</p>
                        </div>
                        <div>
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

export default GroupReportStatistics