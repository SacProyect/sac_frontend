// import React from 'react'
import { Collection, TableHeader } from 'react-aria-components'

const InfoTableHeader = ({ columns, children }: {columns: any, children: any})  => {

    return (
        <TableHeader>
            <Collection items={columns}>
                {children}
            </Collection>
        </TableHeader>
    )
}

export default InfoTableHeader