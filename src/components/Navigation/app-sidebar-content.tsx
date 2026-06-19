import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Landmark } from 'lucide-react';
import type { NavGroup, NavItem } from '@/types/nav';
import { usePendingSubscriptionCount } from '@/hooks/use-pending-subscription-count';
import { ActivePlanBadge } from '@/components/subscription/active-plan-badge';

function isRouteActive(currentPath: string, targetPath: string): boolean {
    if (currentPath === targetPath) return true;
    if (targetPath === '/') return currentPath === '/';
    return currentPath.startsWith(`${targetPath}/`);
}

export interface AppSidebarContentProps {
    navGroups: NavGroup[];
    settingsItem: NavItem | null;
    pathname: string;
    openGroups: Record<string, boolean>;
    onToggleGroup: (groupId: string) => void;
    onNavigate?: () => void;
}

export const AppSidebarContent = memo(function AppSidebarContent({
    navGroups,
    settingsItem,
    pathname,
    openGroups,
    onToggleGroup,
    onNavigate,
}: AppSidebarContentProps) {
    const { count: pendingApprovals, isAdmin: isSubAdmin } = usePendingSubscriptionCount();

    return (
        <div className="flex flex-col h-full text-card-foreground">
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">SAC FISCAL</h1>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Plataforma v2.0</p>
                    </div>
                </div>
            </div>

            {/* Active plan badge */}
            <div className="px-4 pb-3">
                <ActivePlanBadge />
            </div>

            <div className="flex-1 px-4 py-2 overflow-y-auto invisible-scrollbar">
                <div className="space-y-1">
                    <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menú Principal</p>
                    {navGroups.map((group) => {
                        const isOpen = openGroups[group.id] ?? false;
                        const hasActiveChild = group.items.some((item) => isRouteActive(pathname, item.href));

                        return (
                            <div key={group.id} className="mb-1">
                                <button
                                    type="button"
                                    onClick={() => onToggleGroup(group.id)}
                                    aria-expanded={isOpen}
                                    className={`w-full group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 text-left ${
                                        hasActiveChild
                                            ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-400'
                                            : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <span className={`shrink-0 ${hasActiveChild ? 'text-indigo-700 dark:text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                        {group.icon}
                                    </span>
                                    <span className="text-sm font-medium flex-1 truncate">{group.label}</span>
                                    <ChevronDown
                                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <div
                                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="mt-0.5 ml-3 pl-3 border-l border-border/60 space-y-0.5 pb-0.5">
                                            {group.items.map((item) => {
                                                const isActive = isRouteActive(pathname, item.href);
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        to={item.href}
                                                        onClick={onNavigate}
                                                        className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors duration-200 relative text-sm ${
                                                            isActive
                                                                ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 font-medium'
                                                                : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    >
                                                        <span className={`shrink-0 ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                            {item.icon}
                                                        </span>
                                                        <span className="truncate">{item.label}</span>
                                                        {isSubAdmin && item.href === '/aprobaciones-suscripcion' && pendingApprovals > 0 && (
                                                            <span className="ml-auto shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                                                                {pendingApprovals > 9 ? '9+' : pendingApprovals}
                                                            </span>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {settingsItem && (() => {
                        const isActive = isRouteActive(pathname, settingsItem.href);
                        return (
                            <Link
                                to={settingsItem.href}
                                onClick={onNavigate}
                                className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 relative mt-2 ${
                                    isActive
                                        ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 font-medium'
                                        : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-5 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
                                )}
                                <span className={`${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
                                    {settingsItem.icon}
                                </span>
                                <span className="text-sm">{settingsItem.label}</span>
                            </Link>
                        );
                    })()}
                </div>
            </div>

            <div className="p-4 mt-auto">
                <div className="bg-muted/50 dark:bg-slate-800/40 rounded-xl p-3 border border-border">
                    <p className="text-[10px] text-muted-foreground text-center font-medium italic">
                        Sistema Automatizado de Contribuyentes
                    </p>
                </div>
            </div>
        </div>
    );
});
