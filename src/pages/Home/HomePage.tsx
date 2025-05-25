import { useMemo, useEffect, useState } from 'react';
import TaxpayerTable from '../../components/Taxpayer/TaxpayerTable';
import { useAuth } from '../../hooks/useAuth';
import { Input, Label, SearchField } from 'react-aria-components';
import { Controller, useForm } from 'react-hook-form';
import { useFilter } from 'react-aria';
import { useNavigate } from 'react-router-dom';
import { contract_type, Taxpayer } from '@/types/taxpayer';
import { useDebounce } from '@/hooks/useDebounce';

function HomePage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    // Si no hay usuario, redirige
    if (!user) {
        navigate("/login");
        return null;
    }

    // Refresca una vez al montar
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // Estado base de taxpayers
    const [taxpayers, setTaxpayers] = useState<Taxpayer[]>(user.taxpayer || []);

    // Carga inicial de taxpayers según rol (solo cuando user cambie)
    useEffect(() => {
        if (user.role === "FISCAL" || user.role === "ADMIN") {
            setTaxpayers(user.taxpayer || []);
        } else if (user.role === "COORDINATOR") {
            const group = user.coordinatedGroup?.members?.flatMap(m => m.taxpayer) || [];
            setTaxpayers(group);
        }
    }, [user]);

    // Prepara el mapa de officerId -> officerName
    const officerMap = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        if (user.role === "FISCAL" || user.role === "ADMIN") {
            // En estos casos, todos usan el mismo nombre
            const name = user.name;
            (taxpayers).forEach(t => { map[t.officerId || ""] = name; });
        } else if (user.role === "COORDINATOR") {
            user.coordinatedGroup?.members?.forEach(m => {
                map[m.id] = m.name;
            });
        }
        return map;
    }, [user, taxpayers]);

    // Preparar filtro
    const { contains } = useFilter({ sensitivity: "base" });
    const { control, watch } = useForm({ defaultValues: { search: '' } });
    const searchValue = watch('search');
    const debouncedSearch = useDebounce(searchValue.toLowerCase(), 400);

    // Filtrado + enriquecimiento (un solo useMemo)
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
                    // keep original contract_type and add a new label
                    contractTypeLabel: item.contract_type === "ORDINARY" ? 'ORDINARIO' : 'ESPECIAL',
                    address: item.address || 'N/A',
                    officerName,
                };
            })
            .filter(item => {
                if (!term) return true;
                const haystack = `${item.rif} ${item.process} ${item.name} ${item.address} ${item.officerName}`.toLowerCase();
                return contains(haystack, term);
            });
    }, [taxpayers, debouncedSearch, user, contains, officerMap]);

    
    // Un solo log para ver tamaño de la lista filtrada
    // useEffect(() => {
    //     console.log(`📊 Filtered items: ${filteredItems.length}`);
    // }, [filteredItems.length]);

    return (
        <div className='flex justify-center w-full lg:pt-8 sm:mt-0'>
            <div className='flex-col items-center justify-center ml-0'>
                <h2 className="w-full text-2xl font-bold text-center text-black">Administración</h2>
                <Controller
                    control={control}
                    name='search'
                    render={({ field: { name, value, onChange, onBlur } }) => (
                        <SearchField
                            name={name}
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            className="flex flex-col ml-0 lg:ml-4"
                        >
                            <Label>Buscar</Label>
                            <Input
                                className="w-full lg:w-1/2 p-1 mb-4 border border-[#ccc] rounded-lg bg-slate-50 text-black"
                                onChange={onChange}
                            />
                        </SearchField>
                    )}
                />
                <div>
                    <TaxpayerTable propRows={filteredItems} />
                </div>
            </div>
        </div>
    );
}

export default HomePage;
