import type { Page } from "@playwright/test";

/* -------------------------------------------------------------------------- */
/*  Mock data                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Shape mínimo de `RepairReportResumenItem` (definido en
 * `src/components/utils/api/fiscal-operaciones-functions.ts`) necesario para
 * que `ActasTab` y `ActasTable` rendericen filas estables en los tests.
 *
 * Se mantienen campos opcionales en `null` para reflejar el contrato real
 * (algunos endpoints exponen `fechaNotificado` y otros no).
 */
type ActaReparoMock = {
  id: string;
  pdf_url: string;
  taxpayerId: string;
  contribuyente: string;
  rif: string;
  fiscalId: string | null;
  fiscalNombre: string | null;
  vinculadoAOperativo: boolean;
  fechaEntrega: string | null;
  fiscalActuante: string | null;
  supervisorNombre: string | null;
  fiscalActuanteUserId: string | null;
  supervisorUserId: string | null;
  fiscalGroupId: string | null;
  fiscalGroupName: string | null;
  impuestoTipo: string | null;
  numeroExpediente: string | null;
  ejercicioFiscalPeriodo: string | null;
  numeroReparo: string | null;
  fechaNotificado: string | null;
  montoIslr: number | null;
  montoIva: number | null;
  montoAceptacionPago: number | null;
  montoTotal: number | null;
};

/**
 * `fechaNotificado` está deliberadamente separado ~5min del segundo item
 * para que el filtro de búsqueda client-side (por `q`) produzca
 * resultados predecibles, y para que el test de concurrencia pueda
 * demostrar el warning al cambiar ese campo > 5min (ver
 * `ActasEditDialog.tsx:CONCURRENCY_TOLERANCE_MS`).
 */
export const MOCK_ACTAS: ActaReparoMock[] = [
  {
    id: "act-mock-1",
    pdf_url: "https://example.com/actas/act-mock-1.pdf",
    taxpayerId: "tp-mock-1",
    contribuyente: "ACME Servicios S.A.",
    rif: "J-12345678-9",
    fiscalId: "f-mock-1",
    fiscalNombre: "Ana Fiscal Demo",
    vinculadoAOperativo: false,
    fechaEntrega: "2026-01-15T00:00:00.000Z",
    fiscalActuante: "Ana Fiscal Demo",
    supervisorNombre: "Sol Supervisor",
    fiscalActuanteUserId: "u-mock-1",
    supervisorUserId: "u-mock-2",
    fiscalGroupId: "g-mock-1",
    fiscalGroupName: "Grupo Norte Demo",
    impuestoTipo: "IVA",
    numeroExpediente: "2026-1000",
    ejercicioFiscalPeriodo: "2025-01/2025-12",
    numeroReparo: "R-2026-001",
    fechaNotificado: "2026-01-20T09:30:00.000Z",
    montoIslr: 0,
    montoIva: 1500.5,
    montoAceptacionPago: 1500.5,
    montoTotal: 1500.5,
  },
  {
    id: "act-mock-2",
    pdf_url: "https://example.com/actas/act-mock-2.pdf",
    taxpayerId: "tp-mock-2",
    contribuyente: "BETA Industrial C.A.",
    rif: "J-98765432-1",
    fiscalId: "f-mock-2",
    fiscalNombre: "Bea Fiscal Demo",
    vinculadoAOperativo: true,
    fechaEntrega: "2026-02-10T00:00:00.000Z",
    fiscalActuante: "Bea Fiscal Demo",
    supervisorNombre: "Sol Supervisor",
    fiscalActuanteUserId: "u-mock-3",
    supervisorUserId: "u-mock-2",
    fiscalGroupId: "g-mock-1",
    fiscalGroupName: "Grupo Norte Demo",
    impuestoTipo: "ISLR",
    numeroExpediente: "2026-2000",
    ejercicioFiscalPeriodo: "2025-01/2025-12",
    numeroReparo: "R-2026-002",
    fechaNotificado: "2026-02-15T14:45:00.000Z",
    montoIslr: 800.25,
    montoIva: 0,
    montoAceptacionPago: 0,
    montoTotal: 800.25,
  },
];

/**
 * Shape mínimo de `CasosPorFiscalRow` (ver
 * `fiscal-operaciones-functions.ts:CasosPorFiscalRow`) para que
 * `ExpedientesTab` renderice cards en la vista por defecto.
 */
type ExpedienteMock = {
  fiscalId: string;
  funcionario: string;
  cedula: string;
  nroCasos: number;
  vdfTotal: number;
  vdfCulminados: number;
  vdfEnProceso: number;
  vdfAnulados: number;
  afTotal: number;
  afPuntuales: number;
  afIntegrales: number;
  afCulmPuntuales: number;
  afCulmIntegrales: number;
  afProcPuntuales: number;
  afProcIntegrales: number;
  afAnulPuntuales: number;
  afAnulIntegrales: number;
  totalCulminados: number;
  totalEnProceso: number;
  coordinacion: number | null;
  observaciones: string;
};

export const MOCK_EXPEDIENTES: ExpedienteMock[] = [
  {
    fiscalId: "f-mock-1",
    funcionario: "Ana Fiscal Demo",
    cedula: "12345678",
    nroCasos: 5,
    vdfTotal: 5,
    vdfCulminados: 3,
    vdfEnProceso: 2,
    vdfAnulados: 0,
    afTotal: 0,
    afPuntuales: 0,
    afIntegrales: 0,
    afCulmPuntuales: 0,
    afCulmIntegrales: 0,
    afProcPuntuales: 0,
    afProcIntegrales: 0,
    afAnulPuntuales: 0,
    afAnulIntegrales: 0,
    totalCulminados: 3,
    totalEnProceso: 2,
    coordinacion: 1,
    observaciones: "",
  },
  {
    fiscalId: "f-mock-2",
    funcionario: "Bea Fiscal Demo",
    cedula: "87654321",
    nroCasos: 3,
    vdfTotal: 3,
    vdfCulminados: 1,
    vdfEnProceso: 2,
    vdfAnulados: 0,
    afTotal: 0,
    afPuntuales: 0,
    afIntegrales: 0,
    afCulmPuntuales: 0,
    afCulmIntegrales: 0,
    afProcPuntuales: 0,
    afProcIntegrales: 0,
    afAnulPuntuales: 0,
    afAnulIntegrales: 0,
    totalCulminados: 1,
    totalEnProceso: 2,
    coordinacion: 1,
    observaciones: "",
  },
];

/* -------------------------------------------------------------------------- */
/*  Auth                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * `User` mínimo que satisface los guards de `useAuth` y `router.tsx`
 * para enrutar a `/gestion-actas`. Solo se necesitan los campos que el
 * router lee (`id`, `name`, `role`, `personId`); el resto los rellena
 * el backend al autenticar.
 */
const ADMIN_USER = {
  id: "admin-mock-1",
  name: "Admin Test (E2E)",
  role: "ADMIN",
  personId: "12345678",
};

/**
 * Inyecta el `user` admin en `localStorage` antes de que el código de la
 * app corra. Necesario porque `useAuth` se inicializa leyendo
 * `localStorage.user` (ver `src/hooks/use-auth.tsx`).
 *
 * `authToken` se setea con un valor JSON-encoded para respetar el
 * `JSON.parse` defensivo del interceptor de `api-connection.tsx`.
 */
export async function mockAdminAuth(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    window.localStorage.setItem("user", JSON.stringify(user));
    window.localStorage.setItem("authToken", JSON.stringify("e2e-fake-token"));
  }, ADMIN_USER);
}

/* -------------------------------------------------------------------------- */
/*  API mocking                                                               */
/* -------------------------------------------------------------------------- */

type ReparosResponse = {
  success: boolean;
  items: ActaReparoMock[];
};

type CasosResponse = {
  success: boolean;
  year: number;
  meta: {
    filtroEmision: string;
    anuladosRegla: string;
    observacionesFuente: string;
  };
  totals: Omit<ExpedienteMock, "fiscalId">;
  rows: ExpedienteMock[];
};

/**
 * Builder de la respuesta mockeada de `/fiscal-operaciones/reparos`. Se
 * exporta para que el test de concurrencia pueda devolver una variante
 * con `fechaNotificado` alterada en el segundo fetch.
 */
export function buildReparosResponse(
  overrides?: (item: ActaReparoMock) => ActaReparoMock,
): ReparosResponse {
  return {
    success: true,
    items: MOCK_ACTAS.map((item) =>
      overrides ? overrides(item) : item,
    ),
  };
}

/**
 * Builder de la respuesta mockeada de
 * `/fiscal-operaciones/reporte/casos-por-fiscal/datos`.
 */
export function buildCasosResponse(): CasosResponse {
  // El endpoint exige `totals` con todos los campos numéricos. Se derivan
  // del array de filas para mantener el mock simple.
  const totals = MOCK_EXPEDIENTES.reduce(
    (acc, row) => {
      (Object.keys(row) as Array<keyof ExpedienteMock>).forEach((key) => {
        if (key === "fiscalId") return;
        if (typeof row[key] === "number") {
          const k = key as Exclude<keyof ExpedienteMock, "fiscalId">;
          acc[k] = (acc[k] ?? 0) + (row[k] as number);
        }
      });
      return acc;
    },
    {} as Record<string, number | null>,
  );

  return {
    success: true,
    year: new Date().getFullYear(),
    meta: {
      filtroEmision: "fechaEmision",
      anuladosRegla: "regla-demo",
      observacionesFuente: "manual",
    },
    totals: {
      funcionario: "TOTAL",
      cedula: "",
      nroCasos: (totals.nroCasos as number) ?? 0,
      vdfTotal: (totals.vdfTotal as number) ?? 0,
      vdfCulminados: (totals.vdfCulminados as number) ?? 0,
      vdfEnProceso: (totals.vdfEnProceso as number) ?? 0,
      vdfAnulados: (totals.vdfAnulados as number) ?? 0,
      afTotal: (totals.afTotal as number) ?? 0,
      afPuntuales: (totals.afPuntuales as number) ?? 0,
      afIntegrales: (totals.afIntegrales as number) ?? 0,
      afCulmPuntuales: (totals.afCulmPuntuales as number) ?? 0,
      afCulmIntegrales: (totals.afCulmIntegrales as number) ?? 0,
      afProcPuntuales: (totals.afProcPuntuales as number) ?? 0,
      afProcIntegrales: (totals.afProcIntegrales as number) ?? 0,
      afAnulPuntuales: (totals.afAnulPuntuales as number) ?? 0,
      afAnulIntegrales: (totals.afAnulIntegrales as number) ?? 0,
      totalCulminados: (totals.totalCulminados as number) ?? 0,
      totalEnProceso: (totals.totalEnProceso as number) ?? 0,
      coordinacion: null,
      observaciones: "",
    },
    rows: MOCK_EXPEDIENTES,
  };
}

/**
 * Mockea los endpoints consumidos al montar `/gestion-actas` con los
 * builders por defecto. Cada test puede sobreescribir las rutas después
 * de llamar a este helper para escenarios específicos (concurrencia).
 */
export async function mockApis(page: Page): Promise<void> {
  await page.route(
    /\/fiscal-operaciones\/reparos(?:\?.*)?$/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildReparosResponse()),
      });
    },
  );

  await page.route(
    /\/fiscal-operaciones\/reporte\/casos-por-fiscal\/datos(?:\?.*)?$/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildCasosResponse()),
      });
    },
  );
}

/**
 * User-Agent u origen no determinístico: el test corre contra el dev
 * server configurado en `playwright.config.ts` (o `E2E_API_URL`).
 * El flag `VITE_ACTAS_EXPEDIENTES_ENABLED` debe estar en `true` en el
 * build del front (no se puede cambiar en runtime). Ver
 * `docs/migracion-gestion-actas.md` para el proceso de flip.
 */
