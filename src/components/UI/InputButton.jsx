import React from 'react'
import { Button } from 'react-aria-components'

function InputButton(props) {
    const { children, ...otherProps } = props;
    return (
        <Button {...otherProps} className={"w-6 h-6 box-content p-0 text-xs bg-[#3498db] text-white"}>
            {children}
        </Button>
    );
}

export default InputButton