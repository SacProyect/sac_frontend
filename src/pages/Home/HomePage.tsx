import { useMemo, useEffect, useState } from 'react';
import TaxpayerTable from '../../components/Taxpayer/TaxpayerTable';
import { useAuth } from '../../hooks/useAuth';
import { Input, Label, SearchField } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useFilter } from 'react-aria';
import { useNavigate } from 'react-router-dom';
import { Taxpayer } from '@/types/taxpayer';
import { useDebounce } from '@/hooks/useDebounce';
import { getTaxpayers } from '@/components/utils/api/taxpayerFunctions';
import toast from 'react-hot-toast';
import { TableSkeleton } from '@/components/UI/TableSkeleton';
import { 
    Search, 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight, 
    Filter,
    Users as UsersIcon,
    Building2,
    BarChart3 as StatsIcon,
    ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';

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

                const haystack = `${item.rif} ${item.process} ${item.name} ${item.address} ${item.user.name} ${item.providenceNum}`.toLowerCase();
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
        <div className="w-full space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Administración</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Panel de Contribuyentes</h1>
                    <p className="text-slate-400 text-sm max-w-2xl">
                        Gestiona y supervisa la base de datos de contribuyentes, revisa procesos emitidos y filtra por periodos fiscales.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-3 py-1">
                        Total: {total.toLocaleString()}
                    </Badge>
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Contribuyentes', value: total, icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Procesos Activos', value: '4,231', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Recaudación Mes', value: '+12.5%', icon: StatsIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Pendientes', value: '18', icon: ArrowUpRight, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <Card key={i} className="bg-slate-900/40 border-slate-800/50 p-4 flex items-center gap-4 hover:border-slate-700/50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="bg-slate-900/40 border-slate-800/50 overflow-hidden shadow-2xl shadow-black/20">
                {/* Filters Bar */}
                <div className="p-6 border-b border-slate-800/50 bg-slate-800/20 backdrop-blur-sm">
                    <div className="flex flex-col lg:flex-row items-end justify-between gap-6">
                        <div className="w-full lg:flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Search className="w-3 h-3" /> Buscar Contribuyente
                                </Label>
                                <Controller
                                    control={control}
                                    name='search'
                                    render={({ field: { name, value, onChange, onBlur } }) => (
                                        <SearchField name={name} value={value} onChange={onChange} onBlur={onBlur} className="w-full">
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                                <Input
                                                    className="w-full pl-10 pr-4 py-2.5 text-slate-200 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                                                    placeholder="RIF, nombre, proceso..."
                                                    onChange={onChange}
                                                />
                                            </div>
                                        </SearchField>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Año Fiscal
                                </Label>
                                <Controller
                                    control={control}
                                    name='year'
                                    render={({ field }) => (
                                        <div className="relative group">
                                            <select
                                                {...field}
                                                className="w-full appearance-none pl-4 pr-10 py-2.5 text-slate-200 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                                            >
                                                {years.map(y => (
                                                    <option key={y} value={y} className="bg-slate-900">{y}</option>
                                                ))}
                                            </select>
                                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                {loading ? 'Cargando...' : taxpayers.length > 0 ? (
                                    <>
                                        Vista <span className="text-indigo-400 font-bold">{((currentPage - 1) * limit + 1)} - {Math.min(currentPage * limit, total)}</span> de <span className="text-slate-300 font-bold">{total}</span>
                                    </>
                                ) : '0 resultados'}
                            </div>
                            
                            <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1 || loading}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-all"
                                    title="Primera página"
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1 || loading}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-all"
                                    title="Anterior"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                
                                <div className="px-3 min-w-[100px] text-center">
                                    <span className="text-xs font-bold text-slate-300">
                                        Pág. {currentPage} / {totalPages}
                                    </span>
                                </div>
                                
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || loading}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-all"
                                    title="Siguiente"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages || loading}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-all"
                                    title="Última página"
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full min-h-[400px] relative overflow-hidden bg-slate-950/20">
                    {loading ? (
                        <div className="p-8">
                            <TableSkeleton
                                columns={11}
                                rows={10}
                                columnWidths={['w-14', 'w-16', 'flex-1', 'w-24', 'w-20', 'flex-1', 'w-20', 'w-24', 'flex-1', 'w-24', 'w-16']}
                                className="border-slate-800 bg-slate-900/50"
                                skeletonClassName="bg-slate-800"
                            />
                        </div>
                    ) : (
                        <div className="p-0 overflow-x-auto custom-scrollbar">
                            <TaxpayerTable propRows={filteredItems} visibleCount={visibleCount}
                                setVisibleCount={setVisibleCount}
                            />
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

export default HomePage;
