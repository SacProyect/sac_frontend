import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/UI/button';
import type { SubscriptionFeatureKey } from '@/types/subscription-features';

const FEATURE_LABELS: Record<SubscriptionFeatureKey, string> = {
    bulkImport: 'importación masiva de contribuyentes',
    ivaAutomation: 'carga automática de reportes IVA',
    aiAssistant: 'asistente fiscal con IA',
};

interface SubscriptionFeatureGateProps {
    feature: SubscriptionFeatureKey;
    enabled: boolean;
    loading?: boolean;
    children: React.ReactNode;
    compact?: boolean;
}

export function SubscriptionFeatureGate({
    feature,
    enabled,
    loading,
    children,
    compact,
}: SubscriptionFeatureGateProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 animate-pulse">
                <div className="h-4 bg-muted/50 rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted/30 rounded w-1/2" />
            </div>
        );
    }
    if (enabled) return <>{children}</>;

    if (compact) {
        return (
            <Button asChild size="sm" variant="outline" className="border-violet-500/40 text-violet-300">
                <Link to="/automatizacion/planes">
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Desbloquear
                </Link>
            </Button>
        );
    }

    return (
        <div className="rounded-xl border border-violet-500/25 bg-violet-950/20 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-violet-200">Función premium</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        La {FEATURE_LABELS[feature]} requiere un plan de automatización activo.
                    </p>
                </div>
            </div>
            <Button asChild className="bg-violet-600 hover:bg-violet-500 shrink-0">
                <Link to="/automatizacion/planes">Ver planes</Link>
            </Button>
        </div>
    );
}
