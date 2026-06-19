import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';

interface ApprovalsFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    roleFilter: string;
    onRoleFilterChange: (value: string) => void;
    planFilter: string;
    onPlanFilterChange: (value: string) => void;
    activeTab: 'pending' | 'history';
    onTabChange: (tab: 'pending' | 'history') => void;
    totalCount: number;
    pendingCount: number;
    historyCount: number;
}

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'APPROVED', label: 'Aprobado' },
    { value: 'REJECTED', label: 'Rechazado' },
];

const ROLE_OPTIONS = [
    { value: 'ALL', label: 'Todos' },
    { value: 'FISCAL', label: 'Fiscal' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'COORDINATOR', label: 'Coordinador' },
];

const PLAN_OPTIONS = [
    { value: 'ALL', label: 'Todos' },
    { value: 'BASIC', label: 'Fiscal Pro' },
    { value: 'PLUS', label: 'Fiscal Plus' },
    { value: 'PREMIUM', label: 'Fiscal IA' },
];

export function ApprovalsFilters({
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    roleFilter,
    onRoleFilterChange,
    planFilter,
    onPlanFilterChange,
    activeTab,
    onTabChange,
    totalCount,
    pendingCount,
    historyCount,
}: ApprovalsFiltersProps) {
    const hasActiveFilters = search !== '' || statusFilter !== 'ALL' || roleFilter !== 'ALL' || planFilter !== 'ALL';

    const clearFilters = () => {
        onSearchChange('');
        onStatusFilterChange('ALL');
        onRoleFilterChange('ALL');
        onPlanFilterChange('ALL');
    };

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border w-fit">
                <button
                    type="button"
                    onClick={() => onTabChange('pending')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                    Pendientes
                    {pendingCount > 0 && (
                        <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                            activeTab === 'pending'
                                ? 'bg-amber-500 text-white'
                                : 'bg-muted-foreground/30 text-muted-foreground'
                        }`}>
                            {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => onTabChange('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'history'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                    Historial
                    <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                        activeTab === 'history'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-muted-foreground/30 text-muted-foreground'
                    }`}>
                        {historyCount > 9 ? '9+' : historyCount}
                    </span>
                </button>
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nombre o referencia..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9 bg-background"
                    />
                </div>

                {/* Filter dropdowns */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50"
                        aria-label="Filtrar por estado"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <select
                        value={roleFilter}
                        onChange={(e) => onRoleFilterChange(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50"
                        aria-label="Filtrar por rol"
                    >
                        {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <select
                        value={planFilter}
                        onChange={(e) => onPlanFilterChange(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/50"
                        aria-label="Filtrar por plan"
                    >
                        {PLAN_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-9 px-2 text-muted-foreground hover:text-foreground"
                            aria-label="Limpiar filtros"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Active filters summary */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Filter className="h-3 w-3" />
                    <span>Filtros activos · {totalCount} resultado{totalCount !== 1 ? 's' : ''}</span>
                </div>
            )}
        </div>
    );
}