// import React from 'react'
import { Button } from 'react-aria-components'
import { OverlayArrow } from 'react-aria-components'
import { Dialog } from 'react-aria-components'
import { Popover } from 'react-aria-components'
import { DialogTrigger } from 'react-aria-components'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { deleteTaxpayer } from '../../utils/api/taxpayerFunctions'
import { useNavigate } from 'react-router-dom'
import { Taxpayer } from '../../../types/taxpayer'
import { useEffect } from 'react'

const InfoTableOptMenu = ({ id }: {id: string}) => {
    const { user, setUser } = useAuth()

    const navigate = useNavigate()

    if (!user) {
        navigate('/login');
        return null;  // Prevent rendering
    }

    const deleteHandler = async () => {
        try {
            await deleteTaxpayer(id)
            const auxTaxpayerArray = user.taxpayer
            const auxUser = user
            const deletedTaxpayerIndex = auxTaxpayerArray.findIndex((taxpayer: Taxpayer) => taxpayer.id === id)
            auxTaxpayerArray.splice(deletedTaxpayerIndex, 1)
            auxUser.taxpayer = auxTaxpayerArray
            setUser(auxUser)
            navigate(0);
        } catch (error) {
            console.log(error)
        }

    }

    const options = user.role == "ADMIN" ? [
        { name: 'Detalles', path: `/taxpayer/${id}` },
        { name: 'Borrar', onPress: () => deleteHandler }
    ] : [
        { name: 'Detalles', path: `/taxpayer/${id}` }

    ]
    return (
        <DialogTrigger>
            <Button className={"bg-inherit inline-flex items-center justify-center text-center"}>
                ...
            </Button>
            <Popover className={"bg-white rounded-lg min-w-40 border border-black"}>
                <OverlayArrow>
                    <svg width={12} height={12} viewBox="0 0 12 12"
                        className="block w-4 h-4 rotate-180 stroke-1 stroke-black fill-white">
                        <path d="M0 0 L6 6 L12 0" />
                    </svg>
                </OverlayArrow>
                <Dialog className='w-full p-4'>
                    <ul>
                        {options.map((opt) => (
                            <li key={opt.name}>
                                {opt.path ?
                                    <Link to={opt.path} className='w-full'>
                                        <span className='text-black'>
                                            {opt.name}
                                        </span>
                                    </Link> :
                                    <Button
                                        className={"bg-inherit p-0 inline-flex items-center justify-center text-center hover:border-white selected:border-white"}
                                        onPress={deleteHandler}
                                    >
                                        <span className='text-black'>
                                            {opt.name}
                                        </span>
                                    </Button>
                                }
                            </li>
                        ))}
                    </ul>
                </Dialog>
            </Popover>
        </DialogTrigger>
    )
}

export default InfoTableOptMenu