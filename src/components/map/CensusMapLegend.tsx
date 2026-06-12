import { Card } from "@/components/UI/card";

interface CensusMapLegendProps {
  className?: string;
}

const LEGEND_ITEMS = [
  { color: "#22c55e", label: "Datos completos" },
  { color: "#eab308", label: "Pendiente de datos" },
  { color: "#ef4444", label: "No verificado" },
];

export function CensusMapLegend({ className }: CensusMapLegendProps) {
  return (
    <Card className={`absolute bottom-4 right-4 z-[1000] p-3 bg-slate-900/95 border-slate-700/50 shadow-lg ${className ?? ""}`}>
      <h4 className="text-xs font-semibold text-slate-200 mb-2">Estado de Censo</h4>
      <div className="space-y-1.5">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.color} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
