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

function HomePage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [visibleCount, setVisibleCount] = useState(25);




    if (!user) {
        navigate("/login");
        return null;
    }

    // useEffect(() => {
    //     refreshUser();
    // }, []);

    const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);


    useEffect(() => {
        const loadTaxpayers = async () => {
            try {
                const response = await getTaxpayers();

                setTaxpayers(response);

            } catch (e) {
                console.error(e);
                toast.error("No se pudieron obtener los contribuyentes.");
            }
        }

        loadTaxpayers();
    }, [])

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
                const itemYear = new Date(item.emition_date || '').getFullYear().toString();

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
        setVisibleCount(25); // reset cuando se filtra
    }, [debouncedSearch, selectedYear]);




    return (
        <div className="w-full px-0 py-0 overflow-x-hidden">
            <div className="w-full mx-auto xl:max-w-full lg:max-w-screen-lg">
                <h2 className="my-4 text-2xl font-bold text-center text-black">Administración</h2>

                <div className="flex flex-col flex-wrap items-stretch justify-between gap-2 px-4 mb-4 sm:flex-row">
                    <Controller
                        control={control}
                        name='search'
                        render={({ field: { name, value, onChange, onBlur } }) => (
                            <SearchField name={name} value={value} onChange={onChange} onBlur={onBlur} className="flex-1 px-2 lg:w-11/12 lg:px-0">
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
                            <div className="px-2 lg:w-1/12 lg:px-0">
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

                <div className="flex items-center justify-center w-full pl-2 overflow-x-auto lg:pl-0">
                    <TaxpayerTable propRows={filteredItems} visibleCount={visibleCount}
                        setVisibleCount={setVisibleCount}
                    />
                </div>
            </div>
        </div>
    );
}

export default HomePage;
