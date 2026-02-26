import { useMemo, useEffect, useState } from 'react';
import TaxpayerTable from '@/components/Taxpayer/taxpayer-table';
import { useAuth } from '@/hooks/use-auth';
import { Input, Label, SearchField } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useFilter } from 'react-aria';
import { useNavigate } from 'react-router-dom';
import { Taxpayer } from '@/types/taxpayer';
import { useDebounce } from '@/hooks/use-debounce';
import { getTaxpayers } from '@/components/utils/api/taxpayer-functions';
import toast from 'react-hot-toast';
import { TableSkeleton } from '@/components/UI/TableSkeleton';

function HomePage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [visibleCount, setVisibleCount] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(50);
    const [loading, setLoading] = useState(false);




    if (!user) {
        navigate("/login");
        return null;
    }

    // useEffect(() => {
    //     refreshUser();
    // }, []);

    const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);

    const { contains } = useFilter({ sensitivity: "base" });
    const { control, watch } = useForm({
        defaultValues: {
            search: '',
            year: 'Todos'
        }
    });

    const searchValue = watch('search');
    const selectedYear = watch('year');
    const debouncedSearch = useDebounce(searchValue.toLowerCase(), 800);

    useEffect(() => {
        const loadTaxpayers = async () => {
            try {
                setLoading(true);

                // Convertir el año seleccionado a número, o dejar undefined si es "Todos"
                const yearFilter =
                    selectedYear && selectedYear !== 'Todos'
                        ? parseInt(selectedYear, 10)
                        : undefined;

                // Usar el texto buscado (debounced) como filtro de backend si no está vacío
                const searchFilter = debouncedSearch.trim() || undefined;

                const response = await getTaxpayers(currentPage, limit, yearFilter, searchFilter);

                setTaxpayers(response.data);
                setTotal(response.total);
                setTotalPages(response.totalPages);

            } catch (e) {
                console.error(e);
                toast.error("No se pudieron obtener los contribuyentes.");
            } finally {
                setLoading(false);
            }
        }

        loadTaxpayers();
        // selectedYear es un string (por ejemplo "2025" o "Todos")
    }, [currentPage, limit, selectedYear, debouncedSearch]);

    const filteredItems = useMemo(() => {
        const term = debouncedSearch.trim();

        const result = taxpayers
            .map(item => {
                const officerName = item.user?.name || "Desconocido";

                return {
                    ...item,
                    contractTypeLabel: item.contract_type === "ORDINARY" ? 'ORDINARIO' : 'ESPECIAL',
                    address: item.address || 'N/A',
                    officerName,
                };
            })
            .filter(item => {
                // ✅ CORRECCIÓN CRÍTICA 2026: Usar UTC para obtener el año fiscal correcto
                // El problema era que getFullYear() usaba la zona horaria local, causando que
                // fechas como "2025-12-31T23:00:00.000Z" se interpretaran como 2025 en lugar de 2026
                const emitionDate = item.emition_date ? new Date(item.emition_date) : null;
                const itemYear = emitionDate ? emitionDate.getUTCFullYear().toString() : '';

                const yearMatches = selectedYear === 'Todos' || itemYear === selectedYear;
                if (!yearMatches) return false;

                if (!term) return true;

                const haystack = `${item.rif} ${item.process} ${item.name} ${item.address} ${item.user?.name} ${item.providenceNum}`.toLowerCase();
                return contains(haystack, term);
            });
        return result;
    }, [taxpayers, debouncedSearch, user, contains, selectedYear]);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return ['Todos', ...Array.from({ length: currentYear - 2022 }, (_, i) => (2023 + i).toString())];
    }, []);




    useEffect(() => {
        // reset cuando se filtra o cambia de año
        setVisibleCount(25);

        // Al cambiar de año o filtro de búsqueda, volvemos a la primera página
        setCurrentPage(1);
    }, [debouncedSearch, selectedYear]);




    return (
        <div className="w-full px-0 py-0 overflow-hidden">
            <div className="w-full mx-auto xl:max-w-full lg:max-w-screen-lg">
                <h2 className="mb-4 text-2xl font-bold text-center text-black">Administración</h2>

                <div className="flex flex-col flex-wrap items-stretch justify-between gap-2 px-4 mb-4 md:flex-row">
                    <Controller
                        control={control}
                        name='search'
                        render={({ field: { name, value, onChange, onBlur } }) => (
                            <SearchField name={name} value={value} onChange={onChange} onBlur={onBlur} className="flex-1 px-2 lg:px-0">
                                <Label className="mb-1 text-sm font-medium text-gray-700">Buscar</Label>
                                <Input
                                    className="w-full p-2 text-black transition bg-white border border-gray-300 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Buscar por RIF, nombre, proceso..."
                                    onChange={onChange}
                                />
                            </SearchField>
                        )}
                    />

                    <Controller
                        control={control}
                        name='year'
                        render={({ field }) => (
                            <div className="px-2 lg:w-auto lg:px-0">
                                <Label className="mb-1 text-sm font-medium text-gray-700">Año</Label>
                                <select
                                    {...field}
                                    className="w-full p-2 text-black transition bg-white border border-gray-300 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    />
                </div>

                {/* Controles de Paginación (arriba de la tabla) */}
                <div className="flex flex-col items-center justify-between gap-4 px-4 mb-4 md:flex-row">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        Mostrando {loading ? '...' : taxpayers.length > 0 ? ((currentPage - 1) * limit + 1) : 0} - {loading ? '...' : Math.min(currentPage * limit, total)} de {loading ? '...' : total} contribuyentes
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || loading}
                            className="hidden px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg md:block disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Primera
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Anterior
                        </button>
                        
                        <span className="px-4 py-1 text-sm font-medium text-gray-700">
                            Página {currentPage} de {totalPages}
                        </span>
                        
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Siguiente
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || loading}
                            className="hidden px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg md:block disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Última
                        </button>
                    </div>
                </div>

                <div className="w-full min-h-[320px] overflow-x-auto">
                    {loading ? (
                        <TableSkeleton
                            columns={11}
                            rows={10}
                            columnWidths={['w-14', 'w-16', 'flex-1', 'w-24', 'w-20', 'flex-1', 'w-20', 'w-24', 'flex-1', 'w-24', 'w-16']}
                            className="border-gray-200 bg-white"
                        />
                    ) : (
                        <TaxpayerTable propRows={filteredItems} visibleCount={visibleCount}
                            setVisibleCount={setVisibleCount}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default HomePage;
