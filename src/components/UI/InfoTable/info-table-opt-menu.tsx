// import React from 'react'
import { Button, OverlayArrow, Dialog, Popover, DialogTrigger } from 'react-aria-components'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/use-auth'
import { deleteTaxpayer } from '../../utils/api/taxpayer-functions'
import { useNavigate } from 'react-router-dom'
import { Taxpayer } from '../../../types/taxpayer'
import { useEffect, useState } from 'react'
import { MoreVertical, Eye, Edit3, Trash2, X } from 'lucide-react';



const InfoTableOptMenu = ({
    id,
    officerId,
    setEditingRows,
}: {
    id: string;
    /** Fiscal asignado al contribuyente; para FISCAL solo puede editar si coincide con `user.id`. */
    officerId?: string | null;
    setEditingRows: React.Dispatch<React.SetStateAction<{ [key: string]: Partial<Taxpayer> }>>;
}) => {
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

    const fiscalOwnsRow = user.role === 'FISCAL' && officerId != null && officerId === user.id;

    const options =
        user.role === 'ADMIN'
            ? [
                  { name: 'Detalles', path: `/taxpayer/${id}`, icon: <Eye size={14} /> },
                  {
                      name: 'Editar',
                      onPress: () => setEditingRows((prev) => ({ ...prev, [id]: {} })),
                      icon: <Edit3 size={14} />,
                  },
                  {
                      name: 'Borrar',
                      onPress: () => setIsDeleteModalOpen(true),
                      icon: <Trash2 size={14} className="text-rose-400" />,
                  },
              ]
            : user.role === 'FISCAL'
              ? [
                    { name: 'Ver detalle', path: `/taxpayer/${id}`, icon: <Eye size={14} /> },
                    ...(fiscalOwnsRow
                        ? [
                              {
                                  name: 'Editar',
                                  onPress: () => setEditingRows((prev) => ({ ...prev, [id]: {} })),
                                  icon: <Edit3 size={14} />,
                              },
                          ]
                        : []),
                ]
              : [
                    { name: 'Detalles', path: `/taxpayer/${id}`, icon: <Eye size={14} /> },
                    {
                        name: 'Editar',
                        onPress: () => setEditingRows((prev) => ({ ...prev, [id]: {} })),
                        icon: <Edit3 size={14} />,
                    },
                ];

    return (
        <div className="flex items-center justify-center w-full">
            <DialogTrigger>
                <Button
                    aria-label="Opciones del contribuyente"
                    className="inline-flex items-center justify-center w-9 h-9 text-white bg-slate-800/80 border border-slate-700/50 rounded-full hover:bg-indigo-600 hover:border-indigo-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-md"
                >
                    <MoreVertical className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                </Button>
                <Popover
                    placement="bottom end"
                    className="bg-[#1e293b] rounded-xl min-w-[160px] border border-slate-700 shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-200"
                >
                    <OverlayArrow>
                        <svg
                            width={12}
                            height={12}
                            viewBox="0 0 12 12"
                            className="block w-4 h-4 rotate-180 stroke-1 stroke-slate-700 fill-[#1e293b]"
                        >
                            <path d="M0 0 L6 6 L12 0" />
                        </svg>
                    </OverlayArrow>

                    <Dialog className="w-full p-2">
                        {({ close }) => (
                            <ul className="flex flex-col gap-0.5">
                                {options.map((opt) => (
                                    <li key={opt.name}>
                                        {opt.path ? (
                                            <Link
                                                to={opt.path}
                                                className="flex items-center gap-3 w-full px-3 py-2 text-[13px] text-left text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                                                onClick={() => close()}
                                            >
                                                {opt.icon}
                                                {opt.name}
                                            </Link>
                                        ) : (
                                            <Button
                                                className="flex items-center gap-3 w-full px-3 py-2 text-[13px] text-left text-slate-300 bg-transparent rounded-lg hover:bg-slate-800 hover:text-white focus:outline-none transition-colors border-none"
                                                onPress={() => {
                                                    opt.onPress?.();
                                                    close();
                                                }}
                                            >
                                                {opt.icon}
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
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsDeleteModalOpen(false)}
                >
                    <Dialog
                        className="flex flex-col items-center justify-center w-11/12 max-w-sm p-8 space-y-6 text-white bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-2xl relative outline-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button 
                            className='absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-full border-none bg-transparent hover:bg-slate-800 transition-all' 
                            onPress={() => setIsDeleteModalOpen(false)}
                        >
                            <X size={20} />
                        </Button>
                        
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
                            <Trash2 size={32} className="text-rose-500" />
                        </div>
                        
                        <div className="text-center space-y-2">
                             <h3 className="text-xl font-bold text-white">¿Confirmar eliminación?</h3>
                             <p className="text-sm text-slate-400">Esta acción no se puede deshacer. Se eliminarán permanentemente los datos del contribuyente.</p>
                        </div>

                        <div className='flex items-center w-full gap-3'>
                            <Button
                                className='flex-1 px-4 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all border-none'
                                onPress={() => setIsDeleteModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className='flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/20 transition-all border-none'
                                onPress={deleteHandler}
                            >
                                Sí, eliminar
                            </Button>
                        </div>
                    </Dialog>
                </div>
            )}
        </div>
    )
}

export default InfoTableOptMenu