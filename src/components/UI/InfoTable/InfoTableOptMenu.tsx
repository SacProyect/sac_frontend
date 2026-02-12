// import React from 'react'
import { Button, OverlayArrow, Dialog, Popover, DialogTrigger } from 'react-aria-components'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { deleteTaxpayer } from '../../utils/api/taxpayerFunctions'
import { useNavigate } from 'react-router-dom'
import { Taxpayer } from '../../../types/taxpayer'
import { useEffect, useState } from 'react'
import { FaTrash } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import { HiOutlineDotsVertical } from "react-icons/hi";



const InfoTableOptMenu = ({ id, setEditingRows }: { id: string; setEditingRows: React.Dispatch<React.SetStateAction<{ [key: string]: Partial<Taxpayer> }>>; }) => {
    const { user, setUser } = useAuth()
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        } finally {
            setIsDeleteModalOpen(false); // Close modal regardless of success/failure
        }
    };

    const options = user.role == "ADMIN" ? [
        { name: 'Detalles', path: `/taxpayer/${id}` },
        { name: "Editar", onPress: () => setEditingRows((prev) => ({ ...prev, [id]: {} })) },
        { name: 'Borrar', onPress: () => setIsDeleteModalOpen(true) }
    ] : [
        { name: 'Detalles', path: `/taxpayer/${id}` },
        { name: "Editar", onPress: () => setEditingRows((prev) => ({ ...prev, [id]: {} })) },
    ]

    return (
        <div className="flex items-center justify-center w-full">
            <DialogTrigger>
                <Button
                    aria-label="Opciones del contribuyente"
                    className="inline-flex items-center justify-center w-8 h-8 text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors"
                >
                    <HiOutlineDotsVertical className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Popover
                    placement="bottom end"
                    className="bg-white rounded-lg min-w-40 border border-gray-200 shadow-lg"
                >
                    <OverlayArrow>
                        <svg
                            width={12}
                            height={12}
                            viewBox="0 0 12 12"
                            className="block w-4 h-4 rotate-180 stroke-1 stroke-gray-200 fill-white"
                        >
                            <path d="M0 0 L6 6 L12 0" />
                        </svg>
                    </OverlayArrow>

                    <Dialog className="w-full p-2">
                        {({ close }) => (
                            <ul className="flex flex-col gap-1">
                                {options.map((opt) => (
                                    <li key={opt.name}>
                                        {opt.path ? (
                                            <Link
                                                to={opt.path}
                                                className="block w-full px-3 py-2 text-sm text-left text-gray-800 rounded-md hover:bg-gray-100"
                                                onClick={() => close()}
                                            >
                                                {opt.name}
                                            </Link>
                                        ) : (
                                            <Button
                                                className="flex w-full px-3 py-2 text-sm text-left text-gray-800 bg-transparent rounded-md hover:bg-gray-100 focus:outline-none"
                                                onPress={() => {
                                                    opt.onPress?.();
                                                    close();
                                                }}
                                            >
                                                {opt.name}
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Dialog>
                </Popover>
            </DialogTrigger>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={() => setIsDeleteModalOpen(false)}
                >
                    <Dialog
                        className="flex flex-col items-center justify-center w-11/12 max-w-sm p-6 space-y-4 text-white bg-gray-700 rounded-lg shadow-lg md:w-1/3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className='flex justify-end w-full'>
                            <Button className='text-gray-300 hover:text-white' onPress={() => setIsDeleteModalOpen(false)}>
                                <IoIosClose size={30} />
                            </Button>
                        </div>
                        <div>
                            <FaTrash size={35} />
                        </div>
                        <p className="text-center text-lg">¿Seguro que desea eliminar a este contribuyente?</p>
                        <div className='flex justify-around w-full gap-3'>
                            <Button
                                className='flex-1 px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600'
                                onPress={() => setIsDeleteModalOpen(false)}
                            >
                                NO
                            </Button>
                            <Button
                                className='flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700'
                                onPress={deleteHandler}
                            >
                                SI
                            </Button>
                        </div>
                    </Dialog>
                </div>
            )}
        </div>
    )
}

export default InfoTableOptMenu