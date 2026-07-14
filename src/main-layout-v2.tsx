import { Outlet, Link, useLocation, useNavigate, useNavigation } from "react-router-dom";
import { useState } from 'react';
import { GlobalLoader } from '@/components/UI/global-loader';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/UI/sheet';
import { Button } from '@/components/UI/button';
import { Breadcrumb, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/UI/breadcrumb';
import { Avatar, AvatarFallback } from '@/components/UI/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/UI/dropdown-menu';
import { Menu, LogOut, Settings, Landmark, Moon, Sun } from 'lucide-react';
import { useNavItems } from '@/hooks/use-nav-items';
import { useTheme } from '@/hooks/theme-provider';
import { isInternalAuditFeatureEnabled, isThemeToggleEnabled } from '@/config/feature-flags';
import { NotificationBell } from "@/components/Navigation/notification-bell";
import { MaintenanceNotice } from "@/components/maintenance/maintenance-notice";
import { useDemoMode } from '@/hooks/use-demo-mode';
import { usePresenceHeartbeat } from '@/hooks/use-presence-heartbeat';
import DevFiscalGroupSwitcher from "@/components/dev/debug-fiscal-group-switcher";
import { AnnouncementQueue } from "@/components/announcements/AnnouncementQueue";

/**
 * ./main-layout-v2 - Layout con diseño Shadcn UI v2.0
 * 
 * Layout principal de la aplicación (rutas en /).
 * 
 * Adaptado de V0_reference/components/layout-shell.tsx y sidebar.tsx
 * - Reemplaza Next.js Link por React Router Link
 * - Reemplaza usePathname por useLocation
 * - Reemplaza useRouter por useNavigate
 * - Integra useAuth para obtener datos del usuario
 * - Mapea rutas de v0_reference a rutas reales del proyecto
 */
const MainLayoutV2 = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isDemoModeActive } = useDemoMode();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    usePresenceHeartbeat({
        enabled: Boolean(user && !isDemoModeActive),
    });

    // Ítems de navegación resueltos según el rol del usuario (Strategy Pattern)
    const navItems = useNavItems();

    const isRouteActive = (currentPath: string, targetPath: string): boolean => {
        if (currentPath === targetPath) return true;
        if (targetPath === "/") return currentPath === "/";
        return currentPath.startsWith(`${targetPath}/`);
    };

    const isInternalAuditRoute = location.pathname === "/auditoria-interna";

    const buildInternalAuditTabHref = (tab: "kpis" | "fiscales" | "actividad" | "alertas") => {
        const params = new URLSearchParams(location.search);
        params.set("tab", tab);
        params.delete("page");
        return `/auditoria-interna?${params.toString()}`;
    };

    const currentInternalAuditTab = new URLSearchParams(location.search).get("tab") ?? "kpis";

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Contenido del panel lateral (Sheet en todas las resoluciones)
    const SidebarContent = () => (
        <div className="flex flex-col h-full text-card-foreground">
            <div className="p-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">S.O.T</h1>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Organización Tributaria</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 py-2 overflow-y-auto invisible-scrollbar">
                <div className="space-y-1">
                    <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menú Principal</p>
                    {navItems.map((item) => {
                        const isActive = isRouteActive(location.pathname, item.href);
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative ${isActive
                                        ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 font-medium'
                                        : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-5 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
                                )}
                                <span className={`${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
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

    /** Navegación lateral: mismo Sheet en móvil, tablet y escritorio (sidebar no fijo en PC). */
    const SidebarMenu = () => (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:bg-muted/80 shrink-0"
                    aria-label="Abrir menú de navegación"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="p-0 w-[min(18rem,calc(100vw-2rem))] sm:w-72 max-w-full pl-safe pt-safe pb-safe"
            >
                <SidebarContent />
            </SheetContent>
        </Sheet>
    );

    // Header con breadcrumbs y menú de usuario
    const Header = ({ breadcrumbs }: { breadcrumbs?: Array<{ label: string; href?: string }> }) => {
        const { theme, toggleTheme } = useTheme();
        const userInitials = user?.name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';

        return (
            <header className="bg-card/95 dark:bg-card/95 backdrop-blur-md border-b border-border sticky top-0 z-40 transition-all duration-300 pt-safe">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <SidebarMenu />
                        {breadcrumbs && breadcrumbs.length > 0 ? (
                            <Breadcrumb className="min-w-0 overflow-hidden">
                                <BreadcrumbList className="flex-nowrap overflow-hidden">
                                    {breadcrumbs.map((crumb, idx) => (
                                        <div key={idx} className="flex items-center gap-2 min-w-0">
                                            {idx > 0 && <BreadcrumbSeparator className="text-muted-foreground shrink-0" />}
                                            {crumb.href ? (
                                                <BreadcrumbLink asChild>
                                                    <Link to={crumb.href} className="text-xs font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[9rem] sm:max-w-none">
                                                        {crumb.label}
                                                    </Link>
                                                </BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage className="text-xs font-semibold text-foreground uppercase tracking-wider truncate max-w-[10rem] sm:max-w-none">{crumb.label}</BreadcrumbPage>
                                            )}
                                        </div>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        ) : (
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-500 uppercase tracking-[0.2em] leading-tight">Dashboard</span>
                                <h2 className="text-sm font-bold text-foreground tracking-tight truncate">Resumen General</h2>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        {isThemeToggleEnabled && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="hidden sm:inline-flex shrink-0 border-border text-foreground"
                                onClick={toggleTheme}
                                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                            >
                                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </Button>
                        )}
                        <div className="h-6 w-px bg-border hidden sm:block mx-1" />
                        {isInternalAuditRoute && (
                            <div className="hidden md:grid md:grid-cols-4 gap-2 shrink-0 w-full max-w-xl lg:max-w-2xl px-2">
                                {[
                                    { id: "kpis", label: "KPIs" },
                                    { id: "fiscales", label: "Fiscales" },
                                    { id: "actividad", label: "Actividad de uso" },
                                    { id: "alertas", label: "Alertas" },
                                ].map((tab) => {
                                    const active = currentInternalAuditTab === tab.id;
                                    return (
                                        <Link
                                            key={tab.id}
                                            to={buildInternalAuditTabHref(tab.id as "kpis" | "fiscales" | "actividad" | "alertas")}
                                            className={`min-h-9 min-w-0 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors border text-center leading-tight flex items-center justify-center ${active
                                                    ? "bg-slate-800 text-cyan-300 border-slate-700"
                                                    : "bg-slate-900/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/70"
                                                }`}
                                        >
                                            {tab.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 justify-end">
                            <NotificationBell />
                            <div className="h-6 w-[1px] bg-border hidden sm:block mx-1" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="hover:bg-muted/80 p-1 sm:pl-3 h-9 sm:h-10 rounded-full border border-border gap-2 sm:gap-3 group transition-all shrink-0">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs font-bold text-foreground leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user?.name || 'Usuario'}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                {user?.role === 'COORDINATOR' ? 'Coordinador' : user?.role || 'Usuario'}
                                            </p>
                                        </div>
                                        <Avatar className="h-8 w-8 ring-2 ring-border group-hover:ring-indigo-500/50 transition-all">
                                            <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                                                {userInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mb-1 border-b border-border">Mi Cuenta</div>
                                    {isThemeToggleEnabled && (
                                        <DropdownMenuItem
                                            onClick={toggleTheme}
                                            className="gap-2 cursor-pointer py-2.5"
                                        >
                                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                            <span className="text-sm font-medium">{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => navigate('/settings')}
                                        className="gap-2 cursor-pointer py-2.5"
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span className="text-sm font-medium">Configuración</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="gap-2 cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 transition-all py-2.5"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="text-sm font-medium">Cerrar Sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DevFiscalGroupSwitcher />
                        </div>
                    </div>
                </div>
                {isInternalAuditRoute && (
                    <div className="px-4 md:px-8 pb-2 md:hidden">
                        <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto">
                            {[
                                { id: "kpis", label: "KPIs" },
                                { id: "fiscales", label: "Fiscales" },
                                { id: "actividad", label: "Actividad de uso" },
                                { id: "alertas", label: "Alertas" },
                            ].map((tab) => {
                                const active = currentInternalAuditTab === tab.id;
                                return (
                                    <Link
                                        key={tab.id}
                                        to={buildInternalAuditTabHref(tab.id as "kpis" | "fiscales" | "actividad" | "alertas")}
                                        className={`min-h-10 min-w-0 px-2 py-2 rounded-md text-xs font-semibold transition-colors border text-center leading-snug flex items-center justify-center ${active
                                                ? "bg-slate-800 text-cyan-300 border-slate-700"
                                                : "bg-slate-900/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/70"
                                            }`}
                                    >
                                        {tab.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </header>
        );
    };

    const navigation = useNavigation();
    const isPageLoading = navigation.state === 'loading';

    return (
        <div className="flex h-app overflow-hidden bg-background text-foreground">
        <AnnouncementQueue />
            <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full">
                {isPageLoading && <GlobalLoader />}
                {!isDemoModeActive && <Header />}
                <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar relative overscroll-y-contain">
                    {/* Subtle glow effect in the corner */}
                    <div className="absolute top-0 right-0 w-[min(500px,100%)] h-[min(500px,70vh)] bg-indigo-500/[0.07] dark:bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
                    <div className="absolute bottom-0 left-0 w-[min(500px,100%)] h-[min(500px,70vh)] bg-blue-500/[0.06] dark:bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />

                    <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-7 lg:px-10 lg:py-8 xl:px-12 max-w-full min-w-0 pb-safe relative z-10 transition-all duration-500">
                        {!isDemoModeActive && <MaintenanceNotice />}
                        <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayoutV2;


