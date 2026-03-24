// import React from 'react'
import { Button } from 'react-aria-components'
import { OverlayArrow } from 'react-aria-components'
import { Dialog } from 'react-aria-components'
import { Popover } from 'react-aria-components'
import { DialogTrigger } from 'react-aria-components'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/use-auth'
import { deleteTaxpayer } from '../../utils/api/taxpayer-functions'
import { useNavigate } from 'react-router-dom'
import { Taxpayer } from '../../../types/taxpayer'
import { useEffect, useState } from 'react'
import { FaTrash } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";



const InfoTableOptMenu = ({ id, setEditingRows }: { id: string; setEditingRows: React.Dispatch<React.SetStateAction<{ [key: string]: Partial<Taxpayer> }>>; }) => {
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
            await deleteTaxpayer(id);
            navigate(0); // Forzar refetch con useEffect o SWR, react-query, etc.
        } catch (error) {
            console.error(error);
        }
    };

    const options = user.role == "ADMIN" ? [
        { name: 'Detalles', path: `/taxpayer/${id}` },
        { name: "Editar", onPress: () => setEditingRows((prev) => ({ ...prev, [id]: {} })) },
        { name: 'Borrar', onPress: () => setIsTryingToDelete(true) }
    ] : [
        { name: 'Detalles', path: `/taxpayer/${id}` },
        { name: "Editar", onPress: () => setEditingRows((prev) => ({ ...prev, [id]: {} })) },
    ]



    const handleDeleteClick = () => {
        setIsTryingToDelete(true);
        setPopOverOpen(false); // Close the popover when clicking "Borrar"
    };


    return (
        <div>
            {isTryingToDelete &&
                <div className='absolute top-10 right-0 flex justify-center items-center w-[81.5vw]'>
                    <div className="z-50 flex flex-col items-center justify-center w-1/3 p-2 space-y-4 text-white bg-gray-500 rounded-lg h-52">
                        <div className='flex items-end justify-end w-full h-8 pr-4'>
                            <button className='cursor-pointer ' onClick={() => setIsTryingToDelete(false)}>
                                <IoIosClose size={30} />
                            </button>
                        </div>
                        <div>
                            <FaTrash size={35} />
                        </div>
                        <p>¿Seguro que desea eliminar a este contribuyente?</p>
                        <div className='flex justify-around w-full'>
                            <button className='px-4 py-2 bg-green-400 rounded-md' onClick={() => setIsTryingToDelete(false)}>NO</button>
                            <button className='px-4 py-2 bg-red-500 rounded-md' onClick={() => deleteHandler()}>SI</button>
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
                                                className="inline-flex items-center justify-center p-0 text-center bg-inherit hover:border-white"
                                                onPress={() => {
                                                    opt.onPress?.(); // ejecuta Editar o Borrar según el caso
                                                    setPopOverOpen(false); // cierra el menú
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