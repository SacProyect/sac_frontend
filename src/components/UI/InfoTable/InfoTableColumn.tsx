// import React from 'react'
import { Group } from 'react-aria-components'
import { Column } from 'react-aria-components'


interface InfoTableColumn {
    children?: React.ReactNode;
    allowsSorting?: boolean;
    isRowHeader?: boolean;
}


const InfoTableColumn = (props : InfoTableColumn) => {
    return (
        <Column {...props} className="sticky text-white top-0 p-0 border-0 border-b border-solid border-slate-300 bg-[#2c3e50] font-bold text-left cursor-default first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap outline-none">
            {({ allowsSorting, sortDirection }) => <>
                <div className="flex items-center pl-4 min-w-[4rem] max-w-[14rem]">
                    <Group
                        role="presentation"
                        tabIndex={-1}
                        className="flex items-center overflow-hidden rounded outline-none focus-visible:ring-2 ring-slate-200"
                    >
                        <span className="truncate">{props.children}</span>
                        {allowsSorting && (
                            <span
                                className={`ml-1 w-4 h-4 flex items-center justify-center transition`}
                            >
                                {sortDirection === 'ascending' ? '▲' : '▼'}
                            </span>
                        )
                        }
                    </Group>
                </div>
            </>}
        </Column>
    )
}

export default InfoTableColumn