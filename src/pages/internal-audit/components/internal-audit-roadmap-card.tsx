import { Card } from "@/components/UI/card";

/**
 * Ideas de producto documentadas en UI (sin archivo .md adicional).
 * Ajustar según prioridad de negocio.
 */
export function InternalAuditRoadmapCard() {
  return (
    <Card className="border-slate-700 bg-slate-950/40 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-200">Próximas mejoras sugeridas</h4>
      <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5 marker:text-slate-500">
        <li>
          <strong className="text-slate-300 font-medium">Umbral configurable</strong>: marcar en rojo fiscales sin actividad
          tras N días y notificar al coordinador por correo o sistema.
        </li>
        <li>
          <strong className="text-slate-300 font-medium">Comparativa periodo anterior</strong>: variación % de eventos de
          auditoría y de cargas IVA entre dos ventanas.
        </li>
        <li>
          <strong className="text-slate-300 font-medium">Drill-down</strong>: click en fiscal abre drawer con últimos 50
          eventos sin salir del panel.
        </li>
        <li>
          <strong className="text-slate-300 font-medium">Mapa de calor</strong>: eventos por hora/día para detectar
          picos anómalos.
        </li>
        <li>
          <strong className="text-slate-300 font-medium">API paginada</strong> para la línea de tiempo con cursor, si el
          volumen de auditoría crece mucho.
        </li>
        <li>
          <strong className="text-slate-300 font-medium">Integración BI</strong>: endpoint agregado compatible con
          herramientas externas (Power BI / Metabase) en solo lectura.
        </li>
      </ul>
    </Card>
  );
}
