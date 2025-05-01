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

const TaxpayerTable: React.FC<TaxpayerTableProps> = ({ propRows }) => {
    const [rows, setRows] = useState(propRows);

    // 1. COLUMNAS EN EL ORDEN EXACTO QUE QUIERES QUE APAREZCAN
    const columns: Column[] = [
        { name: 'Nro. Providencia', id: 'providenceNum', isRowHeader: true },
        { name: 'Procedimiento', id: 'process' },
        { name: 'Razón Social', id: 'name' },
        { name: 'RIF', id: 'rif' },
        { name: 'Tipo de Contribuyente', id: 'contract_type' },
        { name: 'Dirección', id: 'address' },
        { name: 'Fecha de Emisión', id: 'emition_date' },  // ← penúltima
        { name: 'Opciones', id: 'options' },       // ← ÚLTIMA
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
                // Comparador numérico
                cmp = Number(a.providenceNum) - Number(b.providenceNum);
            } else {
                // Comparador de cadenas
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
        <div className="overflow-x-auto lg:overflow-x-hidden text-xs w-[80vw]">
            <Table
                aria-label="Contribuyentes"
                selectionMode="multiple"
                selectionBehavior="replace"
                sortDescriptor={sortDescriptor}
                onSortChange={d => setSortDescriptor({ column: d.column as keyof Taxpayer, direction: d.direction })}
                className="min-w-full table-fixed"
            >
                {/* HEADER */}
                <InfoTableHeader columns={columns}>
                    {(column: { isRowHeader: boolean | undefined; id: string; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
                        <InfoTableColumn
                            isRowHeader={column.isRowHeader}
                            allowsSorting={column.id !== 'options'}
                        >
                            {column.name}
                        </InfoTableColumn>
                    )}
                </InfoTableHeader>

                {/* BODY */}
                <TableBody items={sortedItems}>
                    {item => (
                        <InfoTableRow columns={columns}>
                            {(column: { id: string; }) => (
                                <Cell className="px-4 py-2 text-sm truncate whitespace-normal">
                                    {column.id === 'options'
                                        ? <InfoTableOptMenu id={item.id} />
                                        : column.id === 'emition_date'
                                            ? new Date(item.emition_date).toLocaleDateString()
                                            : String(item[column.id as keyof Taxpayer])}
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
