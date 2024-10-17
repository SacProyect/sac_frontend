import React from 'react'
import { Group } from 'react-aria-components'
import { Column } from 'react-aria-components'

const InfoTableColumn = (props) => {
    return (
        <Column {...props} className="sticky text-white top-0 p-0 border-0 border-b border-solid border-slate-300 bg-[#2c3e50] font-bold text-left cursor-default first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap outline-none w-fit">
            {({ allowsSorting, sortDirection }) => <>
                <div className="flex items-center pl-4 py-1">
                    <Group
                        role="presentation"
                        tabIndex={-1}
                        className="flex flex-1 items-center overflow-hidden outline-none rounded focus-visible:ring-2 ring-slate-200 mx-1"
                    >
                        <span className="flex-1 truncate">{props.children}</span>
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