import path from "path";
import dotenv from "dotenv";
import { test, expect, type Page, type Route } from "@playwright/test";
import {
  buildReparosResponse,
  mockAdminAuth,
  MOCK_ACTAS,
} from "./gestion-actas.helpers";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });
dotenv.config({
  path: path.resolve(process.cwd(), "../sac_backend/.env"),
  override: false,
});

/* -------------------------------------------------------------------------- */
/*  Precondiciones del entorno                                                */
/* -------------------------------------------------------------------------- */
/*                                                                            */
/*  Mismas precondiciones que `gestion-actas.spec.ts`. El test re-routea      */
/*  la respuesta de `/fiscal-operaciones/reparos` después de abrir el        */
/*  dialog de edición para simular el refetch que dispara el warning de       */
/*  concurrencia (ver `ActasEditDialog.tsx:computeConcurrencyWarning`).       */
/* -------------------------------------------------------------------------- */

/**
 * Devuelve una respuesta mockeada de reparos en la que el item con id
 * `targetId` tiene su `fechaNotificado` desplazado más allá de la
 * ventana de tolerancia de 5 minutos (ver
 * `ActasEditDialog.tsx:CONCURRENCY_TOLERANCE_MS`). Esto fuerza el path
 * `concurrency.show = true` y, por tanto, el render del warning
 * `actas-edit-concurrency-warning`.
 */
function buildConcurrenciaResponse(targetId: string) {
  return buildReparosResponse((item) => {
    if (item.id !== targetId) return item;
    // Empujar la fecha notificado ~24h hacia adelante — claramente
    // fuera de la ventana de tolerancia.
    const original = new Date(item.fechaNotificado ?? Date.now());
    original.setHours(original.getHours() + 24);
    return { ...item, fechaNotificado: original.toISOString() };
  });
}

test.describe("Centro de Mando: Actas y Expedientes — concurrencia", () => {
  test("muestra el warning cuando fechaNotificado cambia tras el refetch", async ({
    page,
  }: { page: Page }) => {
    const targetId = MOCK_ACTAS[0].id;

    // 1) Mock inicial: respuesta normal. La tabla se llena con MOCK_ACTAS.
    let reparosCallCount = 0;
    await mockAdminAuth(page);
    await page.route(
      /\/fiscal-operaciones\/reparos(?:\?.*)?$/,
      async (route: Route) => {
        reparosCallCount += 1;
        if (reparosCallCount === 1) {
          // Primera llamada: payload inicial con fecha original.
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(buildReparosResponse()),
          });
          return;
        }
        // Llamadas siguientes (refetch manual desde la app o desde el
        // test): payload con la fecha alterada para forzar el warning.
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildConcurrenciaResponse(targetId)),
        });
      },
    );
    // Mockear también el endpoint de expedientes (no es foco del test,
    // pero la página lo llama al montar el tab; sin respuesta, el
    // Promise.all interno no rompe el flujo del tab Actas).
    await page.route(
      /\/fiscal-operaciones\/reporte\/casos-por-fiscal\/datos(?:\?.*)?$/,
      async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, year: 2026, meta: {}, totals: {}, rows: [] }),
        });
      },
    );

    await page.goto("/gestion-actas");
    await expect(page.getByTestId("gestion-actas-page")).toBeVisible();

    // 2) Esperar a que la fila mock esté en la tabla.
    const targetRow = page.getByTestId(`actas-row-${targetId}`);
    await expect(targetRow).toBeVisible();

    // 3) Abrir el menú de la fila y disparar la acción "Editar". El
    // menú es un Radix DropdownMenu que se monta en `body` cuando se
    // abre; usamos el testid `actas-edit-{id}` del item.
    await page.getByTestId(`actas-row-${targetId}-menu`).click();
    await page.getByTestId(`actas-edit-${targetId}`).click();

    // 4) El dialog debe estar visible con los datos originales.
    const dialog = page.getByTestId("actas-edit-dialog");
    await expect(dialog).toBeVisible();

    // Inicialmente no hay warning (la fila en el estado del padre aún
    // tiene la fecha original).
    await expect(
      page.getByTestId("actas-edit-concurrency-warning"),
    ).toHaveCount(0);

    // 5) Disparar el refetch que la app ejecutaría al pulsar
    // "Recargar" — esto vuelve a llamar al endpoint mockeado, que
    // ahora devuelve la respuesta con la fecha alterada.
    // El botón `actas-edit-reload` solo aparece si `concurrency.show`
    // ya es true, por lo que invocamos el callback `onReload` del
    // padre directamente: el botón "Actualizar" del search bar fuerza
    // un refetch (ver `ActasTab.tsx:onRefresh`).
    await page.getByTestId("actas-refresh").click();

    // 6) El padre re-fetchea, el `useEffect` de `ActasTable.tsx`
    // detecta que el `editingRow` cambió y propaga la nueva versión
    // al `ActasEditDialog`, cuyo `computeConcurrencyWarning` evalúa
    // la diferencia > 5min y muestra el banner.
    await expect(
      page.getByTestId("actas-edit-concurrency-warning"),
    ).toBeVisible({ timeout: 10_000 });

    // 7) El submit queda deshabilitado mientras el warning esté
    // visible (defensa en profundidad, ver
    // `ActasEditDialog.tsx:handleSubmit`).
    const submit = page.getByTestId("actas-edit-submit");
    await expect(submit).toBeDisabled();

    // 8) El botón "Recargar" del warning existe y permite recuperar
    // el estado limpio tras un refetch adicional.
    await expect(page.getByTestId("actas-edit-reload")).toBeVisible();
  });
});
