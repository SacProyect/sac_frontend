// import React from 'react'
import { Collection, Row } from 'react-aria-components'

const InfoTableRow = (props) => {
    const { id, columns, children, ...otherProps } = props
    return (
        <Row id={id} {...otherProps}
            className="outline-none cursor-default even:bg-slate-100 selected:bg-slate-600 selected:text-white group focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-600 focus-visible:-outline-offset-4 selected:focus-visible:outline-white">
            <Collection items={columns}>
                {children}
            </Collection>
        </Row>
    )
}

export default InfoTableRow