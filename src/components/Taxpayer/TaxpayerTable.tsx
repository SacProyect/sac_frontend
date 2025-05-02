// TaxpayerTable.tsx
import React, { useState, useMemo, useEffect } from 'react';
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
    rif: 'min-w-[0.5rem] max-w-[1rem] w-[0.5rem]',  // Adjusted for rif column to shrink between 0.5rem and 1rem
    contract_type: 'min-w-[10ch] max-w-[16ch] w-[14ch]',
    address: 'min-w-[16ch] max-w-[32ch] w-[28ch]',
    emition_date: 'min-w-[10ch] max-w-[12ch] w-[11ch]',
    officerName: 'min-w-[12ch] max-w-[18ch] w-[16ch]',
    options: 'min-w-[6ch] max-w-[8ch] w-[7ch]',
};

const TaxpayerTable: React.FC<TaxpayerTableProps> = ({ propRows }) => {
    const [rows, setRows] = useState(propRows);

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

    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: 'providenceNum',
        direction: 'ascending'
    });

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

    useEffect(() => {
        setRows(propRows);
    }, [propRows]);

    return (
        <div className="overflow-x-auto lg:overflow-x-hidden w-[80vw]">
            <Table
                aria-label="Contribuyentes"
                selectionMode="multiple"
                selectionBehavior="replace"
                sortDescriptor={sortDescriptor}
                onSortChange={(d) =>
                    setSortDescriptor({
                        column: d.column as keyof Taxpayer,
                        direction: d.direction
                    })
                }
                className="min-w-full text-xs table-fixed"  // Apply table-fixed layout here
            >
                {/* HEADER */}
                <InfoTableHeader columns={columns}>
                    {(column: any) => (
                        <InfoTableColumn
                            isRowHeader={column.isRowHeader}
                            allowsSorting={column.id !== 'options'}// Adjust width for rif column dynamically
                        >
                            {column.name}
                        </InfoTableColumn>
                    )}
                </InfoTableHeader>

                {/* BODY */}
                <TableBody items={sortedItems}>
                    {(item) => (
                        <InfoTableRow columns={columns}>
                            {(column: any) => (
                                <Cell
                                    className={`px-1 pl-4 py-[4px] text-[12px] break-words  whitespace-normal align-middle ${columnWidths[column.id] || ''}`}
                                    style={column.id === 'rif' ? { minWidth: '0.5rem', maxWidth: '1rem', width: '1rem' } : {}}
                                >
                                    {column.id === 'options' ? (
                                        <InfoTableOptMenu id={item.id} />
                                    ) : column.id === 'emition_date' ? (
                                        new Date(item.emition_date).toLocaleDateString()
                                    ) : (
                                        String(item[column.id as keyof Taxpayer])
                                    )}
                                </Cell>
                            )}
                        </InfoTableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default TaxpayerTable;