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
import { useEffect, useState } from 'react'
import { FaTrash } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";



const InfoTableOptMenu = ({ id }: { id: string }) => {
    const { user, setUser } = useAuth()
    const [isTryingToDelete, setIsTryingToDelete] = useState(false);
    const [popOverOpen, setPopOverOpen] = useState(false);

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
        { name: 'Borrar', onPress: () => setIsTryingToDelete(true) }
    ] : [
        { name: 'Detalles', path: `/taxpayer/${id}` }

    ]



    const handleDeleteClick = () => {
        setIsTryingToDelete(true);
        setPopOverOpen(false); // Close the popover when clicking "Borrar"
    };


    return (
        <div>
            {isTryingToDelete &&
                <div className='absolute top-10 right-0 flex justify-center items-center w-[81.5vw]'>
                    <div className=" w-1/3 h-52 bg-gray-500 text-white p-2 rounded-lg flex flex-col items-center justify-center space-y-4">
                        <div className='flex items-end justify-end w-full pr-4 h-8'>
                            <button className=' cursor-pointer' onClick={() => setIsTryingToDelete(false)}>
                                <IoIosClose size={30} />
                            </button>
                        </div>
                        <div>
                            <FaTrash size={35} />
                        </div>
                        <p>¿Seguro que desea eliminar a este contribuyente?</p>
                        <div className='flex justify-around w-full'>
                            <button className='bg-green-400 px-4 py-2 rounded-md' onClick={() => setIsTryingToDelete(false)}>NO</button>
                            <button className='bg-red-500 px-4 py-2 rounded-md' onClick={() => deleteHandler()}>SI</button>
                        </div>
                    </div>
                </div>
            }
            <DialogTrigger onOpenChange={() => setPopOverOpen(true)} >
                <Button className={"bg-inherit inline-flex items-center justify-center text-center"}>
                    ...
                </Button>
                {popOverOpen &&
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
                                                onPress={() => {
                                                    handleDeleteClick();
                                                }}
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
                }
            </DialogTrigger>
        </div>
    )
}

export default InfoTableOptMenu