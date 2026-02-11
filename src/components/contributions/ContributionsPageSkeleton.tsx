import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton de la página de Contribuciones (versión 1).
 * Replica el layout de /contributions: header, filtro, grid de tarjetas, bloque de estadísticas.
 * Sin Card ni PageHeader (diseño claro, aside).
 */
export default function ContributionsPageSkeleton() {
  return (
    <aside className="h-full w-full overflow-y-auto lg:w-[82vw]">
      {/* Header (ContributionsHeader): título + subtítulo */}
      <header className="w-full">
        <div className="pt-8 pl-8">
          <Skeleton className="h-8 w-64 bg-gray-300" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full bg-gray-200" />
        </div>
      </header>

      {/* Filtro: "Filtrar por" + botón año */}
      <section className="w-full pl-8">
        <div className="flex items-center pt-4">
          <Skeleton className="h-4 w-16 bg-gray-300" />
          <Skeleton className="ml-4 h-9 w-24 rounded border border-gray-300 bg-gray-100" />
        </div>

        {/* Grid de tarjetas de coordinación (misma grid que ContributionsFilter) */}
        <div className="grid h-full grid-cols-2 gap-4 overflow-y-auto pt-4 pr-4 sm:grid-cols-2 md:grid-cols-3 lg:h-64 lg:grid-cols-[repeat(5,minmax(140px,1fr))]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex w-full flex-col rounded-lg border-2 border-gray-300 bg-white px-2 pt-2 shadow-sm"
            >
              {/* Fila superior: nombre + vista | badge año */}
              <div className="flex w-full justify-between space-x-2">
                <div className="w-2/3 space-y-1">
                  <Skeleton className="h-3.5 w-24 bg-gray-200" />
                  <Skeleton className="h-3 w-28 bg-gray-200" />
                </div>
                <Skeleton className="h-6 w-14 flex-shrink-0 rounded-full bg-gray-200" />
              </div>

              {/* Botones supervisores + Ver Coordinación Completa */}
              <div className="mt-2 flex flex-col gap-1">
                <Skeleton className="h-7 w-full rounded-md bg-gray-100" />
                <Skeleton className="h-7 w-full rounded-md bg-gray-100" />
                <Skeleton className="h-7 w-[85%] rounded-md bg-gray-100" />
                <Skeleton className="h-7 w-full rounded-md bg-gray-100" />
              </div>

              {/* Líneas de estadísticas */}
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20 bg-gray-200" />
                  <Skeleton className="h-3 w-12 bg-gray-200" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20 bg-gray-200" />
                  <Skeleton className="h-3 w-12 bg-gray-200" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16 bg-gray-200" />
                  <Skeleton className="h-3 w-14 bg-gray-200" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16 bg-gray-200" />
                  <Skeleton className="h-3 w-14 bg-gray-200" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16 bg-gray-200" />
                  <Skeleton className="h-3 w-14 bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bloque de estadísticas (ContributionsStatistics) */}
      <div className="pt-8 pb-16 pl-8 pr-4 lg:pb-0">
        <div className="rounded-md border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <Skeleton className="h-5 w-48 bg-gray-200" />
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <div key={row} className="flex gap-4">
                  <Skeleton className="h-9 w-32 bg-gray-100" />
                  <Skeleton className="h-9 flex-1 bg-gray-100" />
                  <Skeleton className="h-9 w-20 bg-gray-100" />
                  <Skeleton className="h-9 w-20 bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
