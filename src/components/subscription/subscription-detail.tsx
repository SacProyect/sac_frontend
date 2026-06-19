import { Card } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { AutomationSubscription } from '@/components/utils/api/subscription-functions';
import { getPlanDisplayName } from '@/config/subscription-plans';
import { ROLE_LABELS } from '@/config/subscription-role-config';
import { Check, X, Calendar, CreditCard, User, Clock, FileText, AlertCircle } from 'lucide-react';

interface SubscriptionDetailProps {
    subscription: AutomationSubscription;
    onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive'; icon: React.ReactNode }> = {
    PENDING: { label: 'Pendiente', variant: 'secondary', icon: <Clock className="h-3.5 w-3.5" /> },
    APPROVED: { label: 'Aprobado', variant: 'success', icon: <Check className="h-3.5 w-3.5" /> },
    REJECTED: { label: 'Rechazado', variant: 'destructive', icon: <X className="h-3.5 w-3.5" /> },
    EXPIRED: { label: 'Expirado', variant: 'destructive', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

export function SubscriptionDetail({ subscription: sub, onClose }: SubscriptionDetailProps) {
    const planName = getPlanDisplayName(sub.plan);
    const statusConfig = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.PENDING;
    const roleLabel = ROLE_LABELS[sub.user?.role ?? ''] ?? sub.user?.role ?? '—';

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card className="border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                            <CreditCard className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <p className="font-mono text-xs font-bold text-indigo-300">{sub.referenceCode}</p>
                            <p className="text-sm font-semibold text-foreground">{sub.user?.name ?? '—'}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8">
                        Cerrar
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                    <Badge variant={statusConfig.variant} className="gap-1.5">
                        {statusConfig.icon}
                        {statusConfig.label}
                    </Badge>
                    {sub.status === 'APPROVED' && sub.expiresAt && (
                        <span className="text-xs text-emerald-300/80">
                            · Activo hasta {new Date(sub.expiresAt).toLocaleDateString('es-VE')}
                        </span>
                    )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Usuario</p>
                            <p className="font-medium text-foreground">{sub.user?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{roleLabel}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
                        <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Plan</p>
                            <p className="font-medium text-foreground">{planName}</p>
                            <p className="text-xs text-muted-foreground">
                                {sub.billingCycle === 'MONTHLY' ? 'Mensual' : 'Anual'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Monto</p>
                            <p className="font-bold text-lg text-foreground">${sub.amountUsd}</p>
                            <p className="text-xs text-muted-foreground">USD</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Solicitado</p>
                            <p className="font-medium text-foreground">{formatDate(sub.requestedAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Approved/Rejected info */}
                {sub.approvedAt && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] uppercase text-emerald-400/80 tracking-wider">Aprobado el</p>
                            <p className="font-medium text-emerald-300">{formatDate(sub.approvedAt)}</p>
                        </div>
                    </div>
                )}

                {sub.notes && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <FileText className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] uppercase text-amber-400/80 tracking-wider">Notas</p>
                            <p className="font-medium text-amber-300">{sub.notes}</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}