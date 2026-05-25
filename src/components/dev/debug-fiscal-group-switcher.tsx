import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listFiscalGroups } from "@/components/utils/api/documentos-functions";
import type { FiscalGroupInfo } from "@/types/documents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";
import { Badge } from "@/components/UI/badge";
import { Button } from "@/components/UI/button";
import { Sliders, RotateCcw, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

export default function DevFiscalGroupSwitcher() {
	const { user } = useAuth();
	const [groups, setGroups] = useState<FiscalGroupInfo[]>([]);
	const [activeId, setActiveId] = useState<string>("DEFAULT");
	const [loading, setLoading] = useState(false);

	// Solo mostrar en desarrollo local (localhost)
	const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
	const isAllowedRole = user?.role === "ADMIN" || user?.role === "COORDINATOR";

	useEffect(() => {
		const stored = localStorage.getItem("debugFiscalGroupId");
		if (stored) {
			setActiveId(stored);
		}
	}, []);

	useEffect(() => {
		if (!import.meta.env.DEV || !isLocal || !user || !isAllowedRole) return;

		setLoading(true);
		listFiscalGroups()
			.then((res) => {
				if (res.success && Array.isArray(res.data)) {
					setGroups(res.data);
				}
			})
			.catch((err) => {
				console.error("Error loading groups for dev switcher:", err);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [user, isLocal, isAllowedRole]);

	if (!import.meta.env.DEV || !isLocal || !isAllowedRole) return null;

	const handleValueChange = (val: string) => {
		if (val === "DEFAULT") {
			localStorage.removeItem("debugFiscalGroupId");
			setActiveId("DEFAULT");
			toast.success("Filtro de grupo depuración desactivado");
		} else {
			localStorage.setItem("debugFiscalGroupId", val);
			setActiveId(val);
			toast.success("Grupo de depuración activado");
		}
		// Recargar la página para que se aplique la query modificada por el interceptor de axios
		setTimeout(() => {
			window.location.reload();
		}, 300);
	};

	const handleClear = () => {
		localStorage.removeItem("debugFiscalGroupId");
		setActiveId("DEFAULT");
		toast.success("Filtro de grupo depuración desactivado");
		setTimeout(() => {
			window.location.reload();
		}, 300);
	};

	const isActive = activeId !== "DEFAULT";

	return (
		<div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-950/20 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm shrink-0">
			<div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
				<Sliders className={`w-3.5 h-3.5 ${isActive ? "text-amber-500 animate-pulse" : ""}`} />
				<span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Grupo Dev:</span>
			</div>

			<Select value={activeId} onValueChange={handleValueChange} disabled={loading}>
				<SelectTrigger className="h-7 w-[120px] md:w-[160px] text-[11px] font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20">
					<SelectValue placeholder="Default (mi grupo)" />
				</SelectTrigger>
				<SelectContent className="z-[99999]">
					<SelectItem value="DEFAULT" className="text-[11px] font-medium text-slate-500">
						Default (mi grupo)
					</SelectItem>
					{groups.map((g) => (
						<SelectItem key={g.id} value={g.id} className="text-[11px] font-semibold">
							{g.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{isActive && (
				<>
					<Badge variant="success" className="text-[9px] px-1.5 py-0 h-5 font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20 animate-pulse gap-1">
						<ShieldAlert className="w-2.5 h-2.5" />
						Filtro Activo
					</Badge>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleClear}
						className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
						title="Limpiar filtro de depuración"
					>
						<RotateCcw className="w-3 h-3" />
					</Button>
				</>
			)}
		</div>
	);
}
