import { Skeleton } from '@/components/UI/skeleton';

/**
 * Skeleton de la página de Contribuciones.
 * Versión pensada para la página original (/contributions):
 * header simple, filtro y grid de tarjetas de coordinación,
 * seguido de un área de estadísticas tipo tabla.
 */
export default function ContributionsPageSkeleton() {
  return (
    <aside className="h-full w-full overflow-y-auto lg:w-[82vw]">
      {/* Header (ContributionsHeader): título y texto de ayuda */}
      <header className="w-full">
        <div className="pt-8 pl-8">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
      </header>

      {/* Filtro: \"Filtrar por\" + botón año (mismo layout que ContributionsFilter) */}
      <section className="w-full pl-8">
        <div className="relative flex items-center pt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-4 h-9 w-24 rounded" />
        </div>

        {/* Grid de tarjetas de coordinación (como en ContributionsFilter) */}
        <div className="lg:h-64 h-full pt-4 pr-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(140px,1fr))] gap-4 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-full h-full pt-2 rounded-lg border-2 border-slate-300 bg-slate-100 px-2"
            >
              {/* Fila superior: nombre de coordinación + vista + badge de año */}
              <div className="flex w-full justify-between space-x-2">
                <div className="w-2/3 space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="w-1/2">
                  <Skeleton className="h-6 w-full rounded-full" />
                </div>
              </div>

              {/* Lista de supervisores / botones */}
              <div className="mt-2 flex flex-col gap-1">
                <Skeleton className="h-7 w-full rounded-md" />
                <Skeleton className="h-7 w-full rounded-md" />
                <Skeleton className="h-7 w-[85%] rounded-md" />
                <Skeleton className="h-7 w-full rounded-md" />
              </div>

              {/* Resumen de estadísticas de la coordinación */}
              <div className="mt-2 lg:px-0 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Área de estadísticas inferior (ContributionsStatistics) */}
      <div className="pt-8 pb-16 pl-8 pr-4 lg:pb-0">
        <div className="w-full rounded-md border border-slate-300 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
          <div
            className="grid gap-2 p-4"
            style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
          >
            {Array.from({ length: 10 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-full" />
                {Array.from({ length: 6 }).map((_, row) => (
                  <Skeleton key={row} className="h-8 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
