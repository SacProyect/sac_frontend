import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/UI/sheet';
import { Button } from '@/components/UI/button';
import { Breadcrumb, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/UI/breadcrumb';
import { Avatar, AvatarFallback } from '@/components/UI/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/UI/dropdown-menu';
import { Menu, LogOut, Settings, LayoutDashboard, Users, CheckCircle, FileBarChart, Settings2, BarChart3, FileText, ClipboardList, Wallet, Landmark } from 'lucide-react';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Mapeo de rutas: v0_reference -> rutas reales del proyecto
    const getNavItems = () => {
        if (!user) return [];

        // Rutas base según el rol del usuario
        const baseRoutes = [
            { href: '/admin', label: 'Administración', icon: <LayoutDashboard className="w-4 h-4" /> },
            { href: '/census', label: 'Tabla Censo', icon: <Users className="w-4 h-4" /> },
            { href: '/fiscal-review', label: 'Revisión Fiscal', icon: <CheckCircle className="w-4 h-4" /> },
            { href: '/gen-reports', label: 'Reportes', icon: <FileBarChart className="w-4 h-4" /> },
            { href: '/settings', label: 'Ajustes', icon: <Settings2 className="w-4 h-4" /> },
            { href: '/stats', label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
        ];

        // Rutas adicionales según rol
        if (user.role === 'ADMIN' || user.role === 'COORDINATOR') {
            baseRoutes.push(
                { href: '/iva', label: 'Reporte IVA', icon: <FileText className="w-4 h-4" /> },
                { href: '/islr', label: 'Reporte ISLR', icon: <FileText className="w-4 h-4" /> },
                { href: '/index-iva', label: 'Índice IVA', icon: <ClipboardList className="w-4 h-4" /> },
                { href: '/contributions', label: 'Contribuciones', icon: <Wallet className="w-4 h-4" /> }
            );
        } else if (user.role === 'SUPERVISOR') {
            baseRoutes.push(
                { href: `/stats/fiscal/${user.id}`, label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
                { href: '/iva', label: 'Reporte IVA', icon: <FileText className="w-4 h-4" /> },
                { href: '/islr', label: 'Reporte ISLR', icon: <FileText className="w-4 h-4" /> },
                { href: '/contributions', label: 'Contribuciones', icon: <Wallet className="w-4 h-4" /> }
            );
        } else {
            // FISCAL role
            baseRoutes.push(
                { href: `/stats/fiscal/${user.id}`, label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
                { href: '/iva', label: 'Reporte IVA', icon: <FileText className="w-4 h-4" /> },
                { href: '/islr', label: 'Reporte ISLR', icon: <FileText className="w-4 h-4" /> }
            );
        }

        // Filtro especial para usuario específico (igual que en Sidebar.tsx original)
        if (user.id === "dc6734e1-77be-42bb-b708-27979e931f08") {
            return baseRoutes.filter(
                (opt) => !["/fine", "/iva", "/islr", "/census", "/show-census", "/taxpayer", "/index-iva", "/warning"].includes(opt.href)
            );
        }

        return baseRoutes;
    };

    const navItems = getNavItems();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Componente del contenido del sidebar (reutilizable para desktop y mobile)
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#0f172a] text-slate-300">
            <div className="p-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight leading-none">SAC FISCAL</h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Plataforma v2.0</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 py-2 overflow-y-auto invisible-scrollbar">
                <div className="space-y-1">
                    <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Menú Principal</p>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href || 
                                       (item.href !== '/' && location.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                                    isActive
                                        ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                                        : 'hover:bg-slate-800/50 hover:text-slate-100'
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full" />
                                )}
                                <span className={`${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'} transition-colors`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 mt-auto">
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[10px] text-slate-500 text-center font-medium italic">
                        Sistema Automatizado de Contribuyentes
                    </p>
                </div>
            </div>
        </div>
    );

    // Sidebar para desktop
    const DesktopSidebar = () => (
        <div className="hidden md:flex flex-col w-64 bg-[#0f172a] h-screen border-r border-slate-800/50 sticky top-0 self-start">
            <SidebarContent />
        </div>
    );

    // Sidebar móvil (Sheet)
    const MobileSidebar = () => (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
            </SheetContent>
        </Sheet>
    );

    // Header con breadcrumbs y menú de usuario
    const Header = ({ breadcrumbs }: { breadcrumbs?: Array<{ label: string; href?: string }> }) => {
        const userInitials = user?.name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';

        return (
            <header className="bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-40 transition-all duration-300">
                <div className="flex items-center justify-between px-4 md:px-8 py-3">
                    <div className="flex items-center gap-4">
                        <MobileSidebar />
                        {breadcrumbs && breadcrumbs.length > 0 ? (
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumbs.map((crumb, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            {idx > 0 && <BreadcrumbSeparator className="text-slate-600" />}
                                            {crumb.href ? (
                                                <BreadcrumbLink asChild>
                                                    <Link to={crumb.href} className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors">
                                                        {crumb.label}
                                                    </Link>
                                                </BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage className="text-xs font-semibold text-slate-100 uppercase tracking-wider">{crumb.label}</BreadcrumbPage>
                                            )}
                                        </div>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] leading-tight">Dashboard</span>
                                <h2 className="text-sm font-bold text-white tracking-tight">Resumen General</h2>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-6 w-[1px] bg-slate-800 hidden sm:block mx-1" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="hover:bg-slate-800/50 p-1 pl-3 h-10 rounded-full border border-slate-700/30 gap-3 group transition-all">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold text-slate-100 leading-tight group-hover:text-indigo-400 transition-colors">{user?.name || 'Usuario'}</p>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                                            {user?.role === 'COORDINATOR' ? 'Coordinador' : user?.role || 'Usuario'}
                                        </p>
                                    </div>
                                    <Avatar className="h-8 w-8 ring-2 ring-slate-800 group-hover:ring-indigo-500/50 transition-all">
                                        <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-[#1e293b] border-slate-700 shadow-xl shadow-black/40">
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 mb-1 border-b border-slate-700/50">Mi Cuenta</div>
                                <DropdownMenuItem
                                    onClick={() => navigate('/settings')}
                                    className="gap-2 cursor-pointer text-slate-300 focus:bg-indigo-600 focus:text-white transition-all py-2.5"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span className="text-sm font-medium">Configuración</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700/50" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="gap-2 cursor-pointer text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 transition-all py-2.5"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="text-sm font-medium">Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
        );
    };

    return (
        <div className="flex min-h-screen bg-[#020617]">
            <DesktopSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-auto overflow-x-hidden relative">
                    {/* Subtle glow effect in the corner */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />
                    
                    <div className="px-4 py-6 md:px-10 md:py-8 lg:px-12 min-h-full max-w-full relative z-10 transition-all duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayoutV2;
