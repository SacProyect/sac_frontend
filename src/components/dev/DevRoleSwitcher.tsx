import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Shield, UserCog, UserCheck, User, X, ChevronRight, RotateCcw } from "lucide-react";

const ROLES: Array<{ id: "ADMIN" | "COORDINATOR" | "SUPERVISOR" | "FISCAL"; label: string; color: string; icon: any }> = [
	{ id: "ADMIN", label: "Administrador", color: "text-violet-400 bg-violet-400/10 border-violet-400/20", icon: Shield },
	{ id: "COORDINATOR", label: "Coordinador", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: UserCog },
	{ id: "SUPERVISOR", label: "Supervisor", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: UserCheck },
	{ id: "FISCAL", label: "Fiscal", color: "text-sky-400 bg-sky-400/10 border-sky-400/20", icon: User },
];

export default function DevRoleSwitcher() {
	const { user, devRoleOverride, setDevRoleOverride } = useAuth();
	const [open, setOpen] = useState<boolean>(false);

	// Solo mostrar en desarrollo local (localhost)
	const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
	if (!import.meta.env.DEV || !isLocal) return null;

	const currentRole = user?.role || "GUEST";

	return (
		<div className="fixed bottom-6 left-6 z-[9999] font-sans">
			{!open ? (
				<button
					onClick={() => setOpen(true)}
					className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/50 text-slate-100 text-[11px] font-bold shadow-2xl backdrop-blur-xl hover:border-blue-500/50 transition-all active:scale-95"
				>
					<div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:animate-pulse">
						<Shield className="h-3 w-3" />
					</div>
					<span className="tracking-wider uppercase opacity-80 group-hover:opacity-100">DevTool: {currentRole}</span>
					<ChevronRight className="h-3 w-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
				</button>
			) : (
				<div className="rounded-3xl border border-slate-700/50 bg-slate-950/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 min-w-[280px] animate-in fade-in zoom-in-95 duration-200">
					<div className="flex items-center justify-between mb-5">
						<div className="flex items-center gap-2">
							<div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
								<Shield className="w-4 h-4" />
							</div>
							<div className="flex flex-col">
								<span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Debugger</span>
								<span className="text-xs font-bold text-white">Selector de Roles</span>
							</div>
						</div>
						<button
							onClick={() => setOpen(false)}
							className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					<div className="grid grid-cols-1 gap-2.5">
						{ROLES.map((r) => {
							const isActive = r.id === currentRole;
							const Icon = r.icon;
							return (
								<button
									key={r.id}
									onClick={() => {
										setDevRoleOverride(r.id);
									}}
									className={`group flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98] ${
										isActive
											? `${r.color} shadow-lg shadow-black/20`
											: "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/80"
									}`}
								>
									<div className="flex items-center gap-3">
										<div className={`p-2 rounded-lg ${isActive ? "bg-white/10" : "bg-slate-800 group-hover:bg-slate-700"}`}>
											<Icon className="w-4 h-4" />
										</div>
										<span className="text-xs font-bold">{r.label}</span>
									</div>
									{isActive && <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
								</button>
							);
						})}
					</div>

					<div className="mt-5 pt-4 border-t border-slate-800/50 flex items-center justify-between">
						<button
							onClick={() => setDevRoleOverride(null)}
							className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-rose-400 transition-colors"
						>
							<RotateCcw className="w-3 w-3" />
							Limpiar Override
						</button>
						<span className="text-[9px] font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded uppercase tracking-tighter">
							Frontend-only
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
