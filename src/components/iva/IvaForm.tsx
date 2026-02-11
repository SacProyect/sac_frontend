import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Control, useForm } from 'react-hook-form';
import { Taxpayer } from '@/types/taxpayer';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';
import { EventFormData } from '../Events/EventForm';
import toast from 'react-hot-toast';
import { createIVA, getTaxpayerForEvents } from '../utils/api/taxpayerFunctions';
import { IslrReportFormData } from '../ISLR/IslrForm';
import Decimal from 'decimal.js';

export interface IvaReportFormData {
    taxpayerId: string;
    iva?: Decimal;
    purchases: Decimal;
    sells: Decimal;
    excess?: Decimal;
    date: string;
    paid: Decimal;
}


function IvaForm() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [nextAllowedMonth, setNextAllowedMonth] = useState<number | null>(null);
    const [nextAllowedYear, setNextAllowedYear] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [decemberReached, setDecemberReached] = useState(false);
    const [loadingMonthInfo, setLoadingMonthInfo] = useState(true);
    const [taxpayerArray, setTaxpayerArray] = useState<Taxpayer[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    if (!user) return null;


    useEffect(() => {
        const fetchTaxpayers = async () => {
            try {
                const response = await getTaxpayerForEvents(currentPage, 50);
                
                if (currentPage === 1) {
                    setTaxpayerArray(response.data.data);
                } else {
                    setTaxpayerArray(prev => [...prev, ...response.data.data]);
                }
                
                setHasMorePages(response.data.page < response.data.totalPages);
            } catch (e) {
                toast.error("No se pudieron obtener los contribuyentes.");
            }
        };

        fetchTaxpayers();
    }, [currentPage]);

    const loadMoreTaxpayers = async () => {
        if (!hasMorePages || isLoadingMore) return;
        setIsLoadingMore(true);
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        reset,
        watch,
    } = useForm<IvaReportFormData>({
        mode: "onChange",
        defaultValues: {
            taxpayerId: "",
            date: "",
        },
    });

    const onSubmit = async (data: IvaReportFormData) => {
        // console.log("Submitting data:", data);

        try {
            const formattedData = {
                taxpayerId: data.taxpayerId,
                date: data.date,
                iva: data.iva !== undefined && data.iva !== null
                    ? new Decimal(String(data.iva).replace(",", "."))
                    : undefined,
                purchases: new Decimal(String(data.purchases).replace(",", ".")),
                sells: new Decimal(String(data.sells).replace(",", ".")),
                paid: new Decimal(String(data.paid).replace(",", ".")),
                excess: data.excess && String(data.excess).trim() !== ""
                    ? new Decimal(String(data.excess).replace(",", "."))
                    : undefined,
            };

            const report = await createIVA(formattedData);
            if (report) {
                reset();
                await refreshUser();
                setTimeout(() => {
                    setValue("taxpayerId", data.taxpayerId);
                }, 500);
                toast.success("Reporte creado exitosamente");
            }
        } catch (e: any) {
            console.error("Error creating IVA report:", e);
            toast.error(e.message);
        }
    };

    const ivaValue = watch("iva");
    const excessValue = watch("excess");
    const dateValue = watch('date');


    // console.log("TAXPAYERS: " + JSON.stringify(taxpayerArray));

    const taxpayerId = watch("taxpayerId");

    const selectedTaxpayer = taxpayerArray.find(t => t.id === taxpayerId);


    // Recalcular mes siguiente cuando cambie el contribuyente
    useEffect(() => {
        setLoadingMonthInfo(true);
        if (!selectedTaxpayer) {
            setNextAllowedMonth(null);
            setNextAllowedYear(null);
            setDecemberReached(false);
            setLoadingMonthInfo(false);
            setValue('date', '');
            return;
        }

        const sorted = [...(selectedTaxpayer.IVAReports || [])]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // console.log(selectedTaxpayer?.IVAReports)

        const emitionYear = new Date(selectedTaxpayer.emition_date).getUTCFullYear();
        let year = emitionYear;
        let monthNumber = 1;

        if (sorted.length === 0) {
            year = emitionYear;
            monthNumber = 1;
            setDecemberReached(false);
        } else if (sorted.length >= 12) {
            setNextAllowedMonth(null);
            setNextAllowedYear(null);
            setDecemberReached(true);
            setLoadingMonthInfo(false);
            setValue('date', '');
            return;
        } else {
            const [lastYearStr, lastMonthStr] = sorted[0].date.split('-');
            const lastMonth = parseInt(lastMonthStr, 10);
            year = parseInt(lastYearStr, 10);
            monthNumber = lastMonth + 1;

            if (monthNumber > 12) {
                setNextAllowedMonth(null);
                setNextAllowedYear(null);
                setDecemberReached(true);
                setLoadingMonthInfo(false);
                setValue('date', '');
                return;
            } else {
                setDecemberReached(false);
            }
        }

        setNextAllowedMonth(monthNumber);
        setNextAllowedYear(year);
        const isoDate = new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString();
        setValue('date', isoDate);
        setLoadingMonthInfo(false);
    }, [selectedTaxpayer, setValue]);

    const filteredTaxpayers = taxpayerArray.filter(t =>
        `${t.name} ${t.rif} ${t.process} ${t.providenceNum}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowDropdown(false);
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex items-center justify-center w-full h-full lg:h-[90vh] pt-10 lg:pt-0 md:my-4">
            <form
                onSubmit={handleSubmit(onSubmit, (formErrors) => {
                    console.error("Errores de validación:", formErrors);
                })}
                className="flex flex-col w-[90vw] sm:w-[60vw] md:w-[40vw] lg:w-[35vw] bg-white border border-gray-100 rounded-2xl shadow-xl p-8 space-y-6"
            >
                <h1 className="text-xl font-semibold text-center text-gray-800">Agregar Reporte de IVA</h1>

                <div className="relative">
                    <label className="block mb-1 text-sm font-medium text-gray-600">Contribuyente</label>
                    <input
                        type="text"
                        placeholder="Buscar contribuyente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full px-3 py-2 mb-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="hidden"
                        {...register("taxpayerId", { required: "Este campo es obligatorio" })}
                        value={selectedId}
                    />
                    {errors.taxpayerId && (
                        <p className="mt-1 text-xs text-red-500">{errors.taxpayerId.message}</p>
                    )}
                    {showDropdown && filteredTaxpayers.length > 0 && (
                        <div ref={menuRef} className="absolute z-10 w-full overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md max-h-64">
                            {filteredTaxpayers.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => {
                                        setSearch(`${t.name} — ${t.process} — ${t.providenceNum}`);
                                        setValue("taxpayerId", t.id);
                                        setSelectedId(t.id);
                                        setShowDropdown(false);
                                    }}
                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-500 hover:text-white"
                                >
                                    {t.name} — {t.process} — {t.providenceNum} - {new Date(t.emition_date).toLocaleDateString("es-VE")}
                                </div>
                            ))}
                            {hasMorePages && (
                                <button
                                    type="button"
                                    onClick={loadMoreTaxpayers}
                                    disabled={isLoadingMore}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border-t border-gray-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingMore && (
                                        <svg className="w-4 h-4 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                    {isLoadingMore ? 'Cargando...' : 'Cargar más contribuyentes'}
                                </button>
                            )}
                        </div>
                    )}
                </div>



                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Monto de IVA (BS)</label>
                    <input
                        type="text"
                        {...register("iva", {
                            required: excessValue ? false : "Este campo es obligatorio",
                            pattern: {
                                value: /^[0-9]+([.,][0-9]{1,2})?$/, // acepta decimales con punto o coma
                                message: "Debe ser un número válido, use punto o coma como decimal",
                            },
                            validate: (value) => {
                                const parsed = parseFloat(String(value).replace(",", "."));
                                if (isNaN(parsed) || parsed < 0) return "Debe ser un número positivo";
                                return true;
                            }
                        })}
                        placeholder="Introduzca el monto de IVA..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <p className="block mb-0 text-sm font-medium text-gray-600">Compras (BS)</p>
                    <input
                        type="text"
                        {...register("purchases", {
                            required: "Este campo es obligatorio",
                            pattern: {
                                value: /^[0-9]+([.,][0-9]{1,2})?$/,
                                message: "Debe ser un número válido con punto o coma decimal"
                            },
                            validate: (value) => {
                                const parsed = parseFloat(String(value).replace(",", "."));
                                return !isNaN(parsed) && parsed >= 0 || "Debe ser un número válido y positivo";
                            }
                        })}
                        placeholder="Monto de compras..."
                        className="w-full px-3 py-2 mt-0 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Ventas (BS)</label>
                    <input
                        type="text"
                        {...register("sells", {
                            required: "Este campo es obligatorio",
                            pattern: {
                                value: /^[0-9]+([.,][0-9]{1,2})?$/,
                                message: "Debe ser un número válido con punto o coma decimal"
                            },
                            validate: (value) => {
                                const parsed = parseFloat(String(value).replace(",", "."));
                                return !isNaN(parsed) && parsed >= 0 || "Debe ser un número válido y positivo";
                            }
                        })}
                        placeholder="Monto de ventas..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Pagado (BS)</label>
                    <input
                        type="text"
                        {...register("paid", {
                            required: "Este campo es obligatorio",
                            pattern: {
                                value: /^[0-9.,]+$/,
                                message: "Solo se permiten números, puntos o comas"
                            },
                            validate: (value) => {
                                const parsed = parseFloat(String(value).replace(",", "."));
                                return !isNaN(parsed) && parsed >= 0 || "Debe ser un número válido y positivo";
                            }
                        })}
                        placeholder="Ej: 1000.50"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Excedente (BS)</label>
                    <input
                        type="text"
                        {...register("excess", {
                            pattern: {
                                value: /^[0-9]+([.,][0-9]{1,2})?$/,
                                message: "Debe ser un número válido con punto o coma decimal"
                            },
                            validate: (value) => {
                                if (!value) return true;
                                const parsed = parseFloat(String(value).replace(",", "."));
                                return !isNaN(parsed) && parsed >= 0 || "Debe ser un número válido y positivo";
                            }
                        })}
                        placeholder="Monto de excedente (opcional)..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                    />
                    {/* // disabled={typeof ivaValue === "number" && !isNaN(ivaValue) && ivaValue > 0} */}
                    {/* {typeof ivaValue === "number" && !isNaN(ivaValue) && ivaValue > 0 && (
                        <p className="mt-1 text-xs text-yellow-600">
                            Este campo está deshabilitado porque ya se introdujo un monto de IVA.
                        </p>
                    )} */}
                </div>


                <input
                    type="hidden"
                    {...register('date', { required: true })}
                />


                {nextAllowedMonth !== null && nextAllowedYear !== null && (
                    <p className="mt-1 text-sm text-gray-600">
                        La fecha del reporte debe ser del mes de: <strong>
                            {new Date(nextAllowedYear, nextAllowedMonth - 1)
                                .toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                        </strong>
                    </p>
                )}



                <button
                    type="submit"
                    disabled={loadingMonthInfo || decemberReached}
                    className={`w-full py-2 mt-4 text-sm font-medium text-white rounded-lg transition ${loadingMonthInfo || decemberReached
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                >
                    {loadingMonthInfo
                        ? "Cargando información..."
                        : decemberReached
                            ? "Todos los reportes del año han sido cargados"
                            : "Enviar"}
                </button>
            </form>
        </div>
    );
}

export default IvaForm;