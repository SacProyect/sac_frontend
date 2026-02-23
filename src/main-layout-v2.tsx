import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/UI/sheet';
import { Button } from '@/components/UI/button';
import { Breadcrumb, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/UI/breadcrumb';
import { Avatar, AvatarFallback } from '@/components/UI/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/UI/dropdown-menu';
import { Menu, LogOut, Settings } from 'lucide-react';

/**
 * MainLayoutV2 - Layout con diseño Shadcn UI v2.0
 * 
 * Este layout coexiste con MainLayout en rutas paralelas (/v2/*)
 * para permitir pruebas sin afectar el layout actual.
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
            { href: '/v2/admin', label: 'Administración', icon: '🏠' },
            { href: '/v2/census', label: 'Tabla Censo', icon: '📋' },
            { href: '/v2/fiscal-review', label: 'Revisión Fiscal', icon: '✅' },
            { href: '/v2/gen-reports', label: 'Reportes', icon: '📊' },
            { href: '/v2/settings', label: 'Ajustes', icon: '⚙️' },
            { href: '/v2/stats', label: 'Estadísticas', icon: '📈' },
        ];

        // Rutas adicionales según rol
        if (user.role === 'ADMIN' || user.role === 'COORDINATOR') {
            baseRoutes.push(
                { href: '/v2/iva', label: 'Reporte IVA', icon: '📄' },
                { href: '/v2/islr', label: 'Reporte ISLR', icon: '📄' },
                { href: '/v2/index-iva', label: 'Índice IVA', icon: '📑' },
                { href: '/v2/contributions', label: 'Contribuciones', icon: '💰' }
            );
        } else if (user.role === 'SUPERVISOR') {
            baseRoutes.push(
                { href: `/v2/stats/fiscal/${user.id}`, label: 'Estadísticas', icon: '📈' },
                { href: '/v2/iva', label: 'Reporte IVA', icon: '📄' },
                { href: '/v2/islr', label: 'Reporte ISLR', icon: '📄' },
                { href: '/v2/contributions', label: 'Contribuciones', icon: '💰' }
            );
        } else {
            // FISCAL role
            baseRoutes.push(
                { href: `/v2/stats/fiscal/${user.id}`, label: 'Estadísticas', icon: '📈' },
                { href: '/v2/iva', label: 'Reporte IVA', icon: '📄' },
                { href: '/v2/islr', label: 'Reporte ISLR', icon: '📄' }
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
        <div className="flex flex-col h-full space-y-4 py-4 px-4 bg-slate-900 text-slate-100">
            <div className="px-2 py-4 border-b border-slate-700">
                <h1 className="text-lg font-bold text-white">Administración Fiscal</h1>
                <p className="text-xs text-slate-400 mt-1">v2.0</p>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href || 
                                   (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
                                isActive
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-400 px-3">© 2024 Sistemas Fiscales</p>
            </div>
        </div>
    );

    // Sidebar para desktop
    const DesktopSidebar = () => (
        <div className="hidden md:flex flex-col w-64 bg-slate-900 min-h-screen border-r border-slate-800">
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
            <header className="bg-card border-b border-border sticky top-0 z-40">
                <div className="flex items-center justify-between px-4 md:px-6 py-3">
                    <div className="flex items-center gap-4">
                        <MobileSidebar />
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumbs.map((crumb, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            {idx > 0 && <BreadcrumbSeparator />}
                                            {crumb.href ? (
                                                <BreadcrumbLink asChild>
                                                    <Link to={crumb.href} className="text-sm">
                                                        {crumb.label}
                                                    </Link>
                                                </BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage className="text-sm">{crumb.label}</BreadcrumbPage>
                                            )}
                                        </div>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 pr-2">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium">{user?.name || 'Usuario'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {user?.role === 'COORDINATOR' ? 'COORDINADOR' : user?.role || 'Usuario'}
                                        </p>
                                    </div>
                                    <Avatar className="h-9 w-9 border border-border">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
            <DropdownMenuItem
              onClick={() => navigate('/v2/settings')}
              className="gap-2 cursor-pointer text-slate-300 focus:bg-slate-700 focus:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Ajustes</span>
            </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="gap-2 cursor-pointer text-red-400 focus:bg-slate-700 focus:text-red-300 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
        );
    };

    return (
        <div className="flex min-h-screen">
            <DesktopSidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 bg-slate-950 overflow-auto">
                    <div className="p-4 md:p-6 min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayoutV2;
