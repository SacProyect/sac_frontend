import { MapLocation } from "@/types/census-map";
import { Badge } from "@/components/UI/badge";
import { ImageOff } from "lucide-react";

interface CensusPopupProps {
  location: MapLocation;
}

const STATUS_COLORS: Record<MapLocation["data_integrity_status"], string> = {
  COMPLETE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  PENDING_DATA: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  NOT_VERIFIED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const STATUS_LABELS: Record<MapLocation["data_integrity_status"], string> = {
  COMPLETE: "Datos completos",
  PENDING_DATA: "Pendiente de datos",
  NOT_VERIFIED: "No verificado",
};

export function CensusPopup({ location }: CensusPopupProps) {
  return (
    <div className="min-w-[240px] max-w-[280px]">
      <div className="rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900 shadow-lg">
        {location.photo_url ? (
          <div className="h-[120px] w-full overflow-hidden">
            <img
              src={location.photo_url}
              alt="Fachada"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="h-[120px] w-full bg-slate-800 flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-slate-500" />
          </div>
        )}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-sm text-slate-100 truncate" title={location.commercial_name}>
            {location.commercial_name}
          </h3>
          {location.address && (
            <p className="text-xs text-slate-400 truncate" title={location.address}>
              {location.address}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
              Censo: {location.taxpayer_id}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0.5 ${STATUS_COLORS[location.data_integrity_status]}`}
            >
              {STATUS_LABELS[location.data_integrity_status]}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
