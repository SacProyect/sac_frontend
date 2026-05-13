import { useMemo } from "react";

export type DesgloseComercialProps = {
	actividades: Record<string, number>;
	className?: string;
	title?: string;
	emptyText?: string;
};

export default function DesgloseComercial({
	actividades,
	className,
	title = "Desglose comercial",
	emptyText = "Sin visitas registradas en el período seleccionado.",
}: DesgloseComercialProps) {
	const ordenado = useMemo(() => {
		return Object.entries(actividades)
			.map(([k, v]) => ({ k, v }))
			.sort((a, b) => b.v - a.v);
	}, [actividades]);

	const max = ordenado[0]?.v ?? 0;

	return (
		<div className={className}>
			<div className="text-sm font-semibold mb-3 flex items-center gap-2">
				<span className="inline-block w-1 h-4 bg-amber-400 rounded-sm" />
				{title}
			</div>
			{ordenado.length === 0 ? (
				<p className="text-xs text-muted-foreground italic">{emptyText}</p>
			) : (
				<ul className="space-y-2.5">
					{ordenado.map(({ k, v }, i) => (
						<li
							key={k}
							className="text-xs"
							style={{ animation: `dvBarIn 320ms ease-out both`, animationDelay: `${i * 35}ms` }}
						>
							<div className="flex items-center justify-between mb-1">
								<span className="font-medium">{k}</span>
								<span className="text-amber-400 tabular-nums font-semibold">{v}</span>
							</div>
							<div className="h-2 rounded-full bg-muted overflow-hidden">
								<div
									className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400 transition-all"
									style={{
										width: max > 0 ? `${(v / max) * 100}%` : "0%",
										transitionDuration: "500ms",
									}}
								/>
							</div>
						</li>
					))}
				</ul>
			)}
			<style>{`
				@keyframes dvBarIn {
					from { opacity: 0; transform: translateX(-6px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>
		</div>
	);
}
