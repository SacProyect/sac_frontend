import { AutomationCtaBanner } from '@/components/subscription/automation-cta-banner';
import { useSubscriptionFeatures } from '@/hooks/use-subscription-features';
import { useAuth } from '@/hooks/use-auth';
import { getRolePlanContext, isSubscriptionExempt } from '@/config/subscription-role-config';

interface AutomationPromoBannerProps {
    className?: string;
}

/**
 * Banner CTA solo para fiscales, supervisores y coordinadores sin plan activo.
 * Los administradores tienen acceso completo sin suscripción.
 */
export function AutomationPromoBanner({ className }: AutomationPromoBannerProps) {
    const { user } = useAuth();
    const { active, loading } = useSubscriptionFeatures();

    if (loading || !user || isSubscriptionExempt(user.role) || active) {
        return null;
    }

    const roleContext = getRolePlanContext(user.role);
    if (!roleContext) return null;

    return (
        <div className={className}>
            <AutomationCtaBanner
                title={roleContext.bannerTitle}
                subtitle={roleContext.bannerSubtitle}
            />
        </div>
    );
}
