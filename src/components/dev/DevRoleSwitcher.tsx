import { useEffect, useState } from "react";
import { DEV_MODE, getDevFakeRole, setDevFakeRole } from "@/hooks/use-auth";

const ROLES: Array<{ id: "ADMIN" | "COORDINATOR" | "SUPERVISOR" | "FISCAL"; label: string; color: string }> = [
	{ id: "ADMIN", label: "Admin", color: "bg-violet-600" },
	{ id: "COORDINATOR", label: "Coordinador", color: "bg-emerald-600" },
	{ id: "SUPERVISOR", label: "Supervisor", color: "bg-amber-600" },
	{ id: "FISCAL", label: "Fiscal", color: "bg-sky-600" },
];

export default function DevRoleSwitcher() {
	const [role, setRole] = useState<string>("ADMIN");
	const [open, setOpen] = useState<boolean>(true);

	useEffect(() => {
		if (!DEV_MODE) return;
		setRole(getDevFakeRole());
	}, []);

	if (!DEV_MODE) return null;

	return (
		<div className="fixed bottom-4 right-4 z-[9999] select-none">
			{!open ? (
				<button
					onClick={() => setOpen(true)}
					className="px-3 py-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-100 text-xs shadow-lg backdrop-blur"
					title="Dev role switcher"
				>
					DEV · {role}
				</button>
			) : (
				<div className="rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur shadow-2xl p-3 min-w-[260px]">
					<div className="flex items-center justify-between mb-2">
						<div className="text-xs uppercase tracking-wider text-slate-400">Dev role</div>
						<button
							onClick={() => setOpen(false)}
							className="text-slate-400 hover:text-white text-xs"
							aria-label="Cerrar"
						>
							×
						</button>
					</div>
					<div className="grid grid-cols-2 gap-2">
						{ROLES.map((r) => {
							const isActive = r.id === role;
							return (
								<button
									key={r.id}
									onClick={() => {
										if (r.id !== role) setDevFakeRole(r.id);
									}}
									className={`px-3 py-2 rounded-lg text-xs font-medium transition border ${
										isActive
											? `${r.color} text-white border-transparent shadow`
											: "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
									}`}
								>
									{r.label}
								</button>
							);
						})}
					</div>
					<div className="text-[10px] text-slate-500 mt-2">
						Recarga la app al cambiar.
					</div>
				</div>
			)}
		</div>
	);
}
