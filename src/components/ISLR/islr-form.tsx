import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Control, useForm } from 'react-hook-form';
import { Taxpayer } from '@/types/taxpayer';
import TaxpayerCombobox from '../UI/TaxpayerCombobox';
import { EventFormData } from '../Events/EventForm';
import toast from 'react-hot-toast';
import { createISLR, getTaxpayerForEvents } from '../utils/api/taxpayerFunctions';
import { useCachedTaxpayersForEvents } from '@/hooks/useCachedData';
import Decimal from 'decimal.js';
import { IvaReportFormData } from '../iva/IvaForm';

export interface IslrReportFormData {
    taxpayerId: string;
    incomes: string; // ← texto para permitir , o .
    costs: string;
    expent: string;
    emition_date: string;
    paid: string;
}

function IslrForm() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [searchResults, setSearchResults] = useState<Taxpayer[] | null>(null);
    const [searchAdditionalPages, setSearchAdditionalPages] = useState<Taxpayer[]>([]);
    const [searchPage, setSearchPage] = useState(2);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [additionalPages, setAdditionalPages] = useState<Taxpayer[]>([]);
    const [currentPage, setCurrentPage] = useState(2);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { taxpayersForEvents: firstPageTaxpayers, totalPages } = useCachedTaxpayersForEvents(50);
    const isSearching = searchDebounce.trim() !== '';
    const displayedFirst = isSearching ? (searchResults ?? []) : (firstPageTaxpayers || []);
    const displayedExtra = isSearching ? searchAdditionalPages : additionalPages;
    const totalPagesDisplayed = isSearching ? searchTotalPages : totalPages;
    const taxpayerArray = useMemo(
        () => [...displayedFirst, ...displayedExtra],
        [displayedFirst, displayedExtra]
    );
    const hasMorePages = 1 + Math.floor(displayedExtra.length / 50) < totalPagesDisplayed;

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    if (!user) return null;

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchDebounce(filter);
        }, 500);
        return () => clearTimeout(timeout);
    }, [filter]);

    useEffect(() => {
        const term = searchDebounce.trim();
        if (term === '') {
            setSearchResults(null);
            setSearchAdditionalPages([]);
            setSearchPage(2);
            return;
        }
        let cancelled = false;
        const fetchSearchFirst = async () => {
            setSearchLoading(true);
            try {
                const response = await getTaxpayerForEvents(1, 50, term);
                if (cancelled) return;
                const data = (response?.data?.data ?? []) as Taxpayer[];
                setSearchResults(data);
                setSearchTotalPages(response?.data?.totalPages ?? 1);
                setSearchAdditionalPages([]);
                setSearchPage(2);
            } catch (e) {
                if (!cancelled) toast.error("No se pudieron obtener los contribuyentes.");
            } finally {
                if (!cancelled) setSearchLoading(false);
            }
        };
        fetchSearchFirst();
        return () => { cancelled = true; };
    }, [searchDebounce]);

    useEffect(() => {
        if (!isSearching && currentPage <= 2) return;
        if (isSearching) return;
        const fetchPage = async () => {
            try {
                const response = await getTaxpayerForEvents(currentPage, 50);
                const data = response?.data?.data ?? [];
                setAdditionalPages(prev => (currentPage === 2 ? data : [...prev, ...data]));
            } catch (e) {
                toast.error("No se pudieron obtener los contribuyentes.");
            }
        };
        fetchPage();
    }, [currentPage, isSearching]);

    const loadMoreTaxpayers = useCallback(async () => {
        if (!hasMorePages || isLoadingMore) return;
        setIsLoadingMore(true);
        const term = searchDebounce.trim() || undefined;
        const pageToFetch = isSearching ? searchPage : currentPage;
        try {
            const response = await getTaxpayerForEvents(pageToFetch, 50, term);
            const data = (response?.data?.data ?? []) as Taxpayer[];
            if (isSearching) {
                setSearchAdditionalPages(prev => [...prev, ...data]);
                setSearchPage(prev => prev + 1);
            } else {
                setAdditionalPages(prev => (pageToFetch === 2 ? data : [...prev, ...data]));
                setCurrentPage(prev => prev + 1);
            }
        } catch (e) {
            toast.error("No se pudieron cargar más contribuyentes.");
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMorePages, isLoadingMore, searchDebounce, isSearching, searchPage, currentPage]);


    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        reset,
        watch,
    } = useForm<IslrReportFormData>({
        mode: "onChange",
        defaultValues: {
            taxpayerId: "",
        },
    });

    const onSubmit = async (data: IslrReportFormData) => {
        try {
            const formattedData = {
                taxpayerId: data.taxpayerId,
                incomes: new Decimal(data.incomes.replace(",", ".")).toString(),
                costs: new Decimal(data.costs.replace(",", ".")).toString(),
                expent: new Decimal(data.expent.replace(",", ".")).toString(),
                emition_date: new Date(data.emition_date).toISOString(),
                paid: new Decimal(data.paid.replace(",", ".")).toString(),
            };

            // console.log("Sending ISLR report:", formattedData);
            const report = await createISLR(formattedData);
            if (report) toast.success("Reporte ISLR creado exitosamente");
            reset();
            await refreshUser();
        } catch (e: any) {
            console.error("Error creating ISLR report:", e);
            toast.error(e.message);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex items-center justify-center w-full h-full lg:h-[100vh] pt-10 lg:pt-0 md:mb-4 lg:mb-0">
            <form
                onSubmit={handleSubmit(onSubmit, (formErrors) => {
                    console.error("Errores de validación:", formErrors);
                })}
                className="flex flex-col w-[90vw] sm:w-[60vw] md:w-[40vw] lg:w-[35vw] bg-white border border-gray-100 rounded-2xl shadow-xl p-8 space-y-6"
            >
                <h1 className="text-xl font-semibold text-center text-gray-800">Agregar Reporte de ISLR</h1>

                <div className="relative">
                    <label className="block mb-1 text-sm font-medium text-gray-600">Buscar Contribuyente</label>
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Buscar por nombre, RIF o número de providencia"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {showSuggestions && (
                        <div ref={menuRef} className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-64">
                            {taxpayerArray.length > 0 ? (
                                <>
                                    {taxpayerArray.map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => {
                                                setValue("taxpayerId", t.id);
                                                setFilter(t.name); // ← aquí antes lo borrabas con setFilter('')
                                                setShowSuggestions(false);
                                            }}
                                            className={`px-4 py-2 text-sm cursor-pointer transition-all hover:bg-blue-100 ${watch("taxpayerId") === t.id ? "bg-blue-200" : ""
                                                }`}
                                        >
                                            <div className="font-semibold">{t.name}</div>
                                            <div className="text-xs text-gray-500">{t.rif} — {t.process} - {new Date(t.emition_date).toLocaleDateString("es-VE")}</div>
                                        </div>
                                    ))}
                                    {hasMorePages && (
                                        <button
                                            type="button"
                                            onClick={loadMoreTaxpayers}
                                            disabled={isLoadingMore}
                                            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border-t border-gray-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                </>
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">No se encontraron resultados</div>
                            )}
                        </div>
                    )}
                </div>
                <input type="hidden" {...register("taxpayerId", { required: "Este campo es obligatorio" })} />


                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Ingresos (BS)</label>
                    <input
                        type="text"
                        {...register("incomes", {
                            required: "Este campo es obligatorio",
                            pattern: {
                                value: /^[0-9.,]+$/,
                                message: "Solo se permiten números, puntos o comas"
                            },
                            validate: (value) => {
                                const parsed = parseFloat(value.replace(",", "."));
                                return !isNaN(parsed) && parsed >= 0 || "Debe ser un número válido y positivo";
                            }
                        })}
                        placeholder="Ej: 1000.50"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>


                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Costos (BS)</label>
                    <input
                        type="text"
                        {...register("costs", {
                            required: "Este campo es obligatorio",
                            pattern: {
                                value: /^[0-9.,]+$/,
                                message: "Solo se permiten números, puntos o comas"
                            },
                        })}
                        placeholder="Ej: 500,75"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Gastos (BS)</label>
                    <input
                        type="text"
                        {...register("expent", {
                            required: "Este campo es obligatorio",
                            pattern: {
                                value: /^[0-9.,]+$/,
                                message: "Solo se permiten números, puntos o comas"
                            },
                            validate: (value) => {
                                const parsed = parseFloat(value.replace(",", "."));
                                return !isNaN(parsed) && parsed >= 0 || "Debe ser un número válido y positivo";
                            }
                        })}
                        placeholder="Ej: 250.00"
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
                                const parsed = parseFloat(value.replace(",", "."));
                                return !isNaN(parsed) && parsed >= 0 || "Debe ser un número válido y positivo";
                            }
                        })}
                        placeholder="Ej: 1000.50"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Fecha de Emisión</label>
                    <input
                        type="date"
                        {...register("emition_date", {
                            required: "Este campo es obligatorio",
                            validate: (value) =>
                                !isNaN(Date.parse(value)) || "Fecha inválida",
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-2 mt-4 text-sm font-medium text-white transition bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                    Enviar
                </button>
            </form>
        </div>
    );
}

export default IslrForm;
