import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
    Check,
    X,
    Clock,
    RefreshCw,
    CreditCard,
    DollarSign,
    Users,
    Search,
    Eye,
    Loader2,
    AlertCircle,
    FileSearch,
} from 'lucide-react';
import { PageHeader } from '@/components/UI/v2/page-header';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/UI/table';
import {
    listAllSubscriptions,
    approveSubscription,
    rejectSubscription,
    AutomationSubscription,
} from '@/components/utils/api/subscription-functions';
import { getPlanDisplayName } from '@/config/subscription-plans';
import { ROLE_LABELS } from '@/config/subscription-role-config';
import { ConfirmDialog } from '@/components/subscription/confirm-dialog';
import { SubscriptionDetail } from '@/components/subscription/subscription-detail';
import { ApprovalsFilters } from '@/components/subscription/approvals-filters';

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
    PENDING: { label: 'Pendiente', variant: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    APPROVED: { label: 'Aprobado', variant: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    REJECTED: { label: 'Rechazado', variant: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    EXPIRED: { label: 'Expirado', variant: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

function SubscriptionRowActions({
    sub,
    isActing,
    onApprove,
    onReject,
    onView,
}: {
    sub: AutomationSubscription;
    isActing: boolean;
    onApprove: (sub: AutomationSubscription) => void;
    onReject: (sub: AutomationSubscription) => void;
    onView: (sub: AutomationSubscription) => void;
}) {
    return (
        <div className="flex items-center gap-2 justify-end">
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onView(sub)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Ver detalle"
            >
                <Eye className="h-4 w-4" />
            </Button>
            {sub.status === 'PENDING' && (
                <>
                    <Button
                        size="sm"
                        onClick={() => onApprove(sub)}
                        disabled={isActing}
                        className="bg-emerald-600 hover:bg-emerald-500 h-8 px-3"
                    >
                        {isActing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <>
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Aprobar
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(sub)}
                        disabled={isActing}
                        className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 h-8 px-3"
                    >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Rechazar
                    </Button>
                </>
            )}
        </div>
    );
}

function PendingSubscriptionCard({
    sub,
    isActing,
    onApprove,
    onReject,
    onView,
}: {
    sub: AutomationSubscription;
    isActing: boolean;
    onApprove: (sub: AutomationSubscription) => void;
    onReject: (sub: AutomationSubscription) => void;
    onView: (sub: AutomationSubscription) => void;
}) {
    const plan = getPlanDisplayName(sub.plan);
    const statusInfo = STATUS_LABELS[sub.status] ?? STATUS_LABELS.PENDING;
    const roleLabel = ROLE_LABELS[sub.user?.role ?? ''] ?? sub.user?.role ?? '—';

    return (
        <Card className="p-4 border-border bg-card/60 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-indigo-300">{sub.referenceCode}</p>
                    <p className="font-semibold text-sm mt-1 truncate">{sub.user?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusInfo.variant}`}>
                    {statusInfo.label}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Plan</p>
                    <p className="font-medium">{plan}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Monto</p>
                    <p className="font-medium">${sub.amountUsd} USD</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Ciclo</p>
                    <p>{sub.billingCycle === 'MONTHLY' ? 'Mensual' : 'Anual'}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Fecha</p>
                    <p className="text-xs">{new Date(sub.requestedAt).toLocaleDateString('es-VE')}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(sub)}
                    className="flex-1 h-8 text-muted-foreground"
                >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Ver detalle
                </Button>
                {sub.status === 'PENDING' && (
                    <>
                        <Button
                            size="sm"
                            onClick={() => onApprove(sub)}
                            disabled={isActing}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-8"
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Aprobar
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(sub)}
                            disabled={isActing}
                            className="flex-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 h-8"
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Rechazar
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
}

export default function SubscriptionApprovalsPage() {
    const [subscriptions, setSubscriptions] = useState<AutomationSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [planFilter, setPlanFilter] = useState('ALL');
    const [selectedSub, setSelectedSub] = useState<AutomationSubscription | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'approve' | 'reject';
        subId: string;
        subName: string;
    }>({ open: false, type: 'approve', subId: '', subName: '' });

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listAllSubscriptions();
            setSubscriptions(data);
        } catch {
            setError('No se pudieron cargar las solicitudes. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleApprove = async () => {
        const { subId } = confirmDialog;
        setActionId(subId);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
            await approveSubscription(subId);
            toast.success('Suscripción aprobada y activada');
            window.dispatchEvent(new Event('sac-subscription-changed'));
            await load();
        } catch {
            toast.error('Error al aprobar la solicitud');
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async () => {
        const { subId } = confirmDialog;
        setActionId(subId);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
            await rejectSubscription(subId);
            toast.success('Solicitud rechazada');
            window.dispatchEvent(new Event('sac-subscription-changed'));
            await load();
        } catch {
            toast.error('Error al rechazar la solicitud');
        } finally {
            setActionId(null);
        }
    };

    const openApproveDialog = (sub: AutomationSubscription) => {
        setConfirmDialog({
            open: true,
            type: 'approve',
            subId: sub.id,
            subName: sub.user?.name ?? 'este usuario',
        });
    };

    const openRejectDialog = (sub: AutomationSubscription) => {
        setConfirmDialog({
            open: true,
            type: 'reject',
            subId: sub.id,
            subName: sub.user?.name ?? 'este usuario',
        });
    };

    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter((sub) => {
            // Tab filter
            if (activeTab === 'pending' && sub.status !== 'PENDING') return false;
            if (activeTab === 'history' && sub.status === 'PENDING') return false;

            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesName = sub.user?.name?.toLowerCase().includes(searchLower);
                const matchesRef = sub.referenceCode.toLowerCase().includes(searchLower);
                if (!matchesName && !matchesRef) return false;
            }

            // Status filter
            if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;

            // Role filter
            if (roleFilter !== 'ALL' && sub.user?.role !== roleFilter) return false;

            // Plan filter
            if (planFilter !== 'ALL' && sub.plan !== planFilter) return false;

            return true;
        });
    }, [subscriptions, activeTab, search, statusFilter, roleFilter, planFilter]);

    const pendingCount = subscriptions.filter((s) => s.status === 'PENDING').length;
    const historyCount = subscriptions.filter((s) => s.status !== 'PENDING').length;
    const pendingUsd = subscriptions
        .filter((s) => s.status === 'PENDING')
        .reduce((sum, s) => sum + Number(s.amountUsd), 0);
    const totalUsd = subscriptions.reduce((sum, s) => sum + Number(s.amountUsd), 0);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <PageHeader
                title="Aprobaciones de pago"
                description="Verifica comprobantes de WhatsApp y activa planes de automatización para tu equipo."
                action={
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                }
            />

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingCount}</p>
                            <p className="text-xs text-muted-foreground">Pendientes</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-indigo-500/20 bg-indigo-500/5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{subscriptions.length}</p>
                            <p className="text-xs text-muted-foreground">Total solicitudes</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">${pendingUsd}</p>
                            <p className="text-xs text-muted-foreground">USD pendientes</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <ApprovalsFilters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
                planFilter={planFilter}
                onPlanFilterChange={setPlanFilter}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                totalCount={filteredSubscriptions.length}
                pendingCount={pendingCount}
                historyCount={historyCount}
            />

            {/* Loading state */}
            {loading && (
                <Card className="border-border">
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span>Cargando solicitudes...</span>
                    </div>
                </Card>
            )}

            {/* Error state */}
            {error && !loading && (
                <Card className="border-rose-500/20 bg-rose-500/5 p-6">
                    <div className="flex items-center gap-3 text-rose-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                </Card>
            )}

            {/* Empty state */}
            {!loading && !error && filteredSubscriptions.length === 0 && (
                <Card className="border-border">
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        {hasFiltersApplied(search, statusFilter, roleFilter, planFilter, activeTab) ? (
                            <>
                                <Search className="h-10 w-10 mb-3 opacity-40" />
                                <p className="text-sm font-medium">No hay resultados</p>
                                <p className="text-xs mt-1 text-center max-w-sm px-4">
                                    Ajusta los filtros o busca otro término.
                                </p>
                            </>
                        ) : activeTab === 'pending' ? (
                            <>
                                <CreditCard className="h-10 w-10 mb-3 opacity-40" />
                                <p className="text-sm font-medium">No hay solicitudes pendientes</p>
                                <p className="text-xs mt-1 text-center max-w-sm px-4">
                                    Cuando un fiscal, supervisor o coordinador pague por WhatsApp, aparecerá aquí.
                                </p>
                            </>
                        ) : (
                            <>
                                <FileSearch className="h-10 w-10 mb-3 opacity-40" />
                                <p className="text-sm font-medium">Sin historial</p>
                                <p className="text-xs mt-1 text-center max-w-sm px-4">
                                    Las solicitudes aprobadas o rechazadas aparecerán aquí.
                                </p>
                            </>
                        )}
                    </div>
                </Card>
            )}

            {/* Mobile cards */}
            {!loading && !error && filteredSubscriptions.length > 0 && (
                <div className="space-y-3 md:hidden">
                    {filteredSubscriptions.map((sub) => (
                        <PendingSubscriptionCard
                            key={sub.id}
                            sub={sub}
                            isActing={actionId === sub.id}
                            onApprove={openApproveDialog}
                            onReject={openRejectDialog}
                            onView={setSelectedSub}
                        />
                    ))}
                </div>
            )}

            {/* Desktop table */}
            {!loading && !error && filteredSubscriptions.length > 0 && (
                <Card className="border-border overflow-hidden hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Referencia</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Ciclo</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubscriptions.map((sub) => {
                                const planName = getPlanDisplayName(sub.plan);
                                const statusInfo = STATUS_LABELS[sub.status] ?? STATUS_LABELS.PENDING;
                                const isActing = actionId === sub.id;
                                const roleLabel = ROLE_LABELS[sub.user?.role ?? ''] ?? sub.user?.role ?? '—';

                                return (
                                    <TableRow key={sub.id} className="group">
                                        <TableCell className="font-mono text-xs font-bold text-indigo-300">
                                            {sub.referenceCode}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{sub.user?.name ?? '—'}</p>
                                                <p className="text-xs text-muted-foreground">{roleLabel}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{planName}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {sub.billingCycle === 'MONTHLY' ? 'Mensual' : 'Anual'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold">${sub.amountUsd}</span>
                                            <span className="text-xs text-muted-foreground ml-1">USD</span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(sub.requestedAt).toLocaleDateString('es-VE')}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.variant}`}>
                                                {statusInfo.label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <SubscriptionRowActions
                                                sub={sub}
                                                isActing={isActing}
                                                onApprove={openApproveDialog}
                                                onReject={openRejectDialog}
                                                onView={setSelectedSub}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Detail sidebar/modal could go here - using setSelectedSub pattern */}

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                title={confirmDialog.type === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
                description={
                    confirmDialog.type === 'approve'
                        ? `¿Confirmas que ${confirmDialog.subName} ha pagado y deseas activar su plan de automatización?`
                        : `¿Estás seguro de rechazar la solicitud de ${confirmDialog.subName}? Esta acción no se puede deshacer.`
                }
                confirmLabel={confirmDialog.type === 'approve' ? 'Sí, aprobar' : 'Sí, rechazar'}
                cancelLabel="Cancelar"
                onConfirm={confirmDialog.type === 'approve' ? handleApprove : handleReject}
                variant={confirmDialog.type === 'approve' ? 'approve' : 'reject'}
                loading={actionId !== null}
            />
        </div>
    );
}

function hasFiltersApplied(
    search: string,
    statusFilter: string,
    roleFilter: string,
    planFilter: string,
    activeTab: 'pending' | 'history',
): boolean {
    return search !== '' || statusFilter !== 'ALL' || roleFilter !== 'ALL' || planFilter !== 'ALL' || activeTab !== 'pending';
}