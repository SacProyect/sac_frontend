import { useMemo, useEffect, useState } from 'react';
import TaxpayerTable from '../../components/Taxpayer/TaxpayerTable';
import { useAuth } from '../../hooks/useAuth';
import { Input, Label, SearchField } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useFilter } from 'react-aria';
import { useNavigate } from 'react-router-dom';
import { Taxpayer } from '@/types/taxpayer';
import { useDebounce } from '@/hooks/useDebounce';

function HomePage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate("/login");
        return null;
    }

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const [taxpayers, setTaxpayers] = useState<Taxpayer[]>(user.taxpayer || []);

    useEffect(() => {
        if (["FISCAL", "ADMIN", "COORDINATOR", "SUPERVISOR"].includes(user.role)) {
            setTaxpayers(user.taxpayer || []);
        }
    }, [user]);

    const officerMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (["FISCAL", "ADMIN"].includes(user.role)) {
            const name = user.name;
            taxpayers.forEach(t => { map[t.officerId || ""] = name; });
        } else if (user.role === "COORDINATOR") {
            user.coordinatedGroup?.members?.forEach(m => {
                map[m.id] = m.name;
            });
        }
        return map;
    }, [user, taxpayers]);

    const { contains } = useFilter({ sensitivity: "base" });
    const { control, watch } = useForm({
        defaultValues: {
            search: '',
            year: 'Todos'
        }
    });

    const searchValue = watch('search');
    const selectedYear = watch('year');
    const debouncedSearch = useDebounce(searchValue.toLowerCase(), 400);

    const filteredItems = useMemo(() => {
        const term = debouncedSearch.trim();

        return taxpayers
            .map(item => {
                const officerName =
                    item.user?.id === user.id || user.role === "FISCAL"
                        ? user.name
                        : user.role === "ADMIN"
                            ? (item.user?.name || 'Desconocido')
                            : officerMap[item.officerId || ""] || 'Desconocido';

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
    }, [taxpayers, debouncedSearch, user, contains, officerMap, selectedYear]);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return ['Todos', ...Array.from({ length: currentYear - 2022 }, (_, i) => (2023 + i).toString())];
    }, []);

    return (
        <div className="w-full px-0 py-0 overflow-x-hidden">
            <div className="w-full max-w-screen-lg mx-auto">
                <h2 className="my-4 text-2xl font-bold text-center text-black">Administración</h2>

                <div className="flex flex-col flex-wrap items-stretch justify-between gap-2 mb-4 sm:flex-row">
                    <Controller
                        control={control}
                        name='search'
                        render={({ field: { name, value, onChange, onBlur } }) => (
                            <SearchField name={name} value={value} onChange={onChange} onBlur={onBlur} className="flex-1 min-w-[200px] px-2 lg:px-0">
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
                            <div className="min-w-[140px] px-2 lg:px-0">
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

                <div className="w-full overflow-x-auto pl-2 lg:pl-0">
                    <TaxpayerTable propRows={filteredItems} />
                </div>
            </div>
        </div>
    );
}

export default HomePage;
