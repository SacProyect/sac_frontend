import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Cell, Table, TableBody } from 'react-aria-components';
import InfoTableHeader from '../UI/InfoTable/InfoTableHeader';
import InfoTableColumn from '../UI/InfoTable/InfoTableColumn';
import InfoTableRow from '../UI/InfoTable/InfoTableRow';
import InfoTableOptMenu from '../UI/InfoTable/InfoTableOptMenu';
import { Taxpayer } from '../../types/taxpayer';

interface Column {
    name: string;
    id: keyof Taxpayer | 'options';
    isRowHeader?: boolean;
}

interface SortDescriptor {
    column: keyof Taxpayer;
    direction: 'ascending' | 'descending';
}

interface TaxpayerTableProps {
    propRows: Taxpayer[];
}

const columnWidths: Record<string, string> = {
    providenceNum: 'min-w-[8ch] max-w-[12ch] w-[10ch]',
    process: 'min-w-[4ch] max-w-[10ch] w-[4ch]',
    name: 'min-w-[12ch] max-w-[20ch] w-[18ch]',
    rif: 'min-w-[0.5rem] max-w-[1rem] w-[0.5rem]',
    contract_type: 'min-w-[10ch] max-w-[16ch] w-[14ch]',
    address: 'min-w-[16ch] max-w-[32ch] w-[28ch]',
    emition_date: 'min-w-[10ch] max-w-[12ch] w-[11ch]',
    officerName: 'min-w-[12ch] max-w-[18ch] w-[16ch]',
    options: 'min-w-[6ch] max-w-[8ch] w-[7ch]',
};

const styleRif = { minWidth: '0.5rem', maxWidth: '1rem', width: '1rem' };

// Extracted columns constant (no need to recreate every render)
const columns: Column[] = [
    { name: 'Nro. Providencia', id: 'providenceNum', isRowHeader: true },
    { name: 'Procedimiento', id: 'process' },
    { name: 'Razón Social', id: 'name' },
    { name: 'RIF', id: 'rif' },
    { name: 'Tipo de Contribuyente', id: 'contract_type' },
    { name: 'Dirección', id: 'address' },
    { name: 'Fecha de Emisión', id: 'emition_date' },
    { name: 'Fiscal', id: 'officerName' },
    { name: 'Opciones', id: 'options' },
];

// Helper function for cell content
const getCellContent = (item: Taxpayer, columnId: keyof Taxpayer | 'options') => {
    if (columnId === 'options') return <InfoTableOptMenu id={item.id} />;
    if (columnId === 'emition_date')
        return new Date(item.emition_date).toLocaleDateString();
    return String(item[columnId as keyof Taxpayer]);
};

const TaxpayerTable: React.FC<TaxpayerTableProps> = ({ propRows }) => {
    const [rows, setRows] = useState(propRows);
    const [visibleCount, setVisibleCount] = useState(25);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Sort descriptor state
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: 'providenceNum',
        direction: 'ascending',
    });

    // Sort rows based on descriptor, memoized
    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => {
            const { column, direction } = sortDescriptor;
            let cmp: number;

            if (column === 'providenceNum') {
                cmp = Number(a.providenceNum) - Number(b.providenceNum);
            } else {
                const fa = String(a[column]);
                const fb = String(b[column]);
                cmp = fa.localeCompare(fb);
            }

            return direction === 'ascending' ? cmp : -cmp;
        });
    }, [rows, sortDescriptor]);

    // Visible items for infinite scroll or pagination, memoized
    const visibleItems = useMemo(() => sortedItems.slice(0, visibleCount), [
        sortedItems,
        visibleCount,
    ]);

    // Reset rows if propRows changes
    useEffect(() => {
        setRows(propRows);
    }, [propRows]);

    // Scroll handler to load more rows, debounced with timeout
    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const handleScroll = () => {
            if (debounceTimer) clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                if (
                    container.scrollTop + container.clientHeight >=
                    container.scrollHeight - 10 &&
                    !isLoadingMore &&
                    visibleCount < sortedItems.length
                ) {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                        setVisibleCount((prev) =>
                            Math.min(prev + 25, sortedItems.length)
                        );
                        setIsLoadingMore(false);
                    }, 600);
                }
            }, 100);
        };

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (debounceTimer) clearTimeout(debounceTimer!);
        };
    }, [sortedItems.length, visibleCount, isLoadingMore]);

    // Memoized onSortChange handler
    const onSortChange = useCallback(
        (d: any) => {
            setSortDescriptor({
                column: d.column as keyof Taxpayer,
                direction: d.direction,
            });
        },
        []
    );

    // Memoize classes per column to avoid string recreation
    const classesByColumn = useMemo(() => {
        return columns.reduce<Record<string, string>>((acc, col) => {
            acc[col.id] = `px-1 pl-4 py-[4px] text-[12px] break-words whitespace-normal align-middle ${columnWidths[col.id] || ''
                }`;
            return acc;
        }, {});
    }, []);

    return (
        <div
            className="overflow-x-auto h-full lg:overflow-x-hidden w-[80vw] lg:overflow-y-auto lg:h-[83.5vh] custom-scroll"
            ref={tableContainerRef}
        >
            <Table
                aria-label="Contribuyentes"
                selectionMode="multiple"
                selectionBehavior="replace"
                sortDescriptor={sortDescriptor}
                onSortChange={onSortChange}
                className="min-w-full text-xs table-fixed"
            >
                {/* HEADER */}
                <InfoTableHeader columns={columns}>
                    {(column: Column) => (
                        <InfoTableColumn
                            isRowHeader={column.isRowHeader}
                            allowsSorting={column.id !== 'options'}
                        >
                            {column.name}
                        </InfoTableColumn>
                    )}
                </InfoTableHeader>

                {/* BODY */}
                <TableBody items={visibleItems}>
                    {(item: Taxpayer) => (
                        <InfoTableRow columns={columns} key={item.id}>
                            {(column: Column) => (
                                <Cell
                                    key={column.id}
                                    className={classesByColumn[column.id]}
                                    style={column.id === 'rif' ? styleRif : undefined}
                                >
                                    {getCellContent(item, column.id)}
                                </Cell>
                            )}
                        </InfoTableRow>
                    )}
                </TableBody>
            </Table>

            {isLoadingMore && (
                <div className="flex justify-center py-2">
                    <div className="w-5 h-5 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
                </div>
            )}
        </div>
    );
};

export default TaxpayerTable;
