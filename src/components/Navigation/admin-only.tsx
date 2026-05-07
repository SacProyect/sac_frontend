import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

/**
 * Permite el render solo a usuarios con rol ADMIN.
 * Si el usuario no está autenticado, redirige a /login.
 * Si está autenticado pero NO es ADMIN, redirige al dashboard principal.
 */
export const AdminOnly = ({ children }: { children: ReactNode }) => {
	const { user } = useAuth();
	if (!user) return <Navigate to="/login" replace />;
	if (user.role !== "ADMIN") return <Navigate to="/" replace />;
	return <>{children}</>;
};
