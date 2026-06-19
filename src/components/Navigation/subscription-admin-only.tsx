import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';
import { isSubscriptionAdmin } from '@/config/subscription-admin';

export function SubscriptionAdminOnly({ children }: { children: React.ReactNode }) {
    const { user, devRoleOverride } = useAuth();

    if (!user) return <Navigate to="/login" replace />;
    if (!isSubscriptionAdmin(user, devRoleOverride)) return <Navigate to="/admin" replace />;

    return <>{children}</>;
}
