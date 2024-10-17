import React from 'react'
import { Button } from 'react-aria-components'
import { OverlayArrow } from 'react-aria-components'
import { Dialog } from 'react-aria-components'
import { Popover } from 'react-aria-components'
import { DialogTrigger } from 'react-aria-components'
import { Link } from 'react-router-dom'

const InfoTableOptMenu = ({ id }) => {
    const options = [{
        name: 'Detalles', path: `/contribuyente/${id}`
    }
    ]
    return (
        <DialogTrigger>
            <Button className={"bg-inherit inline-flex items-center justify-center text-center"}>
                ...
            </Button>
            <Popover className={"bg-white rounded-lg min-w-40 border border-black"}>
                <OverlayArrow>
                    <svg width={12} height={12} viewBox="0 0 12 12"
                        className="block stroke-black fill-white stroke-1 rotate-180 w-4 h-4">
                        <path d="M0 0 L6 6 L12 0" />
                    </svg>
                </OverlayArrow>
                <Dialog className='p-4 w-full'>
                    <ul>
                        {options.map((opt) => (
                            <li key={opt.name}>
                                <Link to={opt.path} className='w-full'>
                                    <span className='text-black'>
                                        {opt.name}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Dialog>
            </Popover>
        </DialogTrigger>
    )
}

export default InfoTableOptMenu