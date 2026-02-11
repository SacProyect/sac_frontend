import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/v2';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton de la página de Contribuciones.
 * Refleja la estructura: header, filtro, grid de tarjetas de coordinación, área de estadísticas.
 */
export default function ContributionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estadísticas por Coordinación"
        description="Consulta y análisis de contribuciones por grupo"
      />
      <Card className="bg-slate-800 border-slate-700 p-6 transition-all duration-200">
        {/* Header interno */}
        <div className="w-full">
          <div className="pt-2 pb-4">
            <Skeleton className="h-7 w-72 bg-slate-700" />
            <Skeleton className="mt-2 h-4 w-96 bg-slate-700" />
          </div>
        </div>

        {/* Filtro: "Filtrar por" + botón año */}
        <section className="w-full">
          <div className="flex items-center pt-2 pb-4">
            <Skeleton className="h-4 w-20 bg-slate-700" />
            <Skeleton className="ml-4 h-9 w-24 rounded bg-slate-700" />
          </div>
        </section>

        {/* Grid de tarjetas de coordinación (5 columnas) */}
        <div className="grid grid-cols-2 gap-4 pt-2 pr-4 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex h-52 flex-col rounded-lg border-2 border-slate-600 bg-slate-800/50 p-3"
            >
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 bg-slate-700" />
                <Skeleton className="h-6 w-14 rounded-full bg-slate-700" />
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Skeleton className="h-7 w-full rounded bg-slate-700" />
                <Skeleton className="h-7 w-full rounded bg-slate-700" />
                <Skeleton className="h-7 w-full rounded bg-slate-700" />
                <Skeleton className="h-7 w-3/4 rounded bg-slate-700" />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-full bg-slate-700" />
                <Skeleton className="h-3 w-full bg-slate-700" />
                <Skeleton className="h-3 w-2/3 bg-slate-700" />
              </div>
            </div>
          ))}
        </div>

        {/* Área de estadísticas (tabla) */}
        <div className="mt-8 w-full rounded-md border border-slate-600 lg:h-[52vh]">
          <div className="flex items-center justify-between border-b border-slate-600 p-4">
            <Skeleton className="h-5 w-64 bg-slate-700" />
          </div>
          <div className="grid grid-cols-10 gap-2 p-4" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
            {Array.from({ length: 10 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-full bg-slate-700" />
                {Array.from({ length: 6 }).map((_, row) => (
                  <Skeleton key={row} className="h-8 w-full bg-slate-700/80" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
