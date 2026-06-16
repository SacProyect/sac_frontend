import path from "path";
import dotenv from "dotenv";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockAdminAuth, mockApis } from "./gestion-actas.helpers";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });
dotenv.config({
  path: path.resolve(process.cwd(), "../sac_backend/.env"),
  override: false,
});

/* -------------------------------------------------------------------------- */
/*  Precondiciones del entorno                                                */
/* -------------------------------------------------------------------------- */
/*                                                                            */
/*  Mismas precondiciones que `gestion-actas.spec.ts`: build con              */
/*  `VITE_ACTAS_EXPEDIENTES_ENABLED=true` y `E2E_API_URL` apuntando al dev    */
/*  server. Si la página redirige a `/gestion-personal`, el test falla con    */
/*  un timeout en `getByTestId('gestion-actas-page')` — comportamiento        */
/*  correcto (no silencioso).                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Filtra las violaciones dejando solo las de impacto `serious` o
 * `critical` (per WCAG 2.1 AA build gate documentado en
 * `plans/accesibilidad.md`).
 */
function seriousOrCriticalViolations(
  results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
) {
  return results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
}

test.describe("Centro de Mando: Actas y Expedientes — a11y (axe)", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await mockAdminAuth(page);
    await mockApis(page);
    await page.goto("/gestion-actas");
    // Asegurar que el shell terminó de montar antes de analizar.
    await expect(page.getByTestId("gestion-actas-page")).toBeVisible();
  });

  test("tab Actas: 0 violaciones serious/critical", async ({
    page,
  }: { page: Page }) => {
    // Tab Actas es el default (hash #actas).
    await expect(
      page.getByTestId("gestion-actas-panel-actas"),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      // Limitar el scan al shell del Command Center para no incluir
      // chrome de la app (sidebar, header global) que vive fuera del
      // scope de TASK-008.
      .include("[data-testid='gestion-actas-page']")
      .analyze();

    const blockers = seriousOrCriticalViolations(results);
    if (blockers.length > 0) {
      // Surface violations en el log para que el reviewer sepa qué
      // fixear sin tener que re-correr axe manualmente.
      // eslint-disable-next-line no-console
      console.log(
        "[axe] blockers en /gestion-actas#actas:",
        JSON.stringify(
          blockers.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length,
          })),
          null,
          2,
        ),
      );
    }
    expect(blockers).toEqual([]);
  });

  test("tab Expedientes: 0 violaciones serious/critical", async ({
    page,
  }: { page: Page }) => {
    // Cambiar a Expedientes.
    await page.getByTestId("gestion-actas-tab-expedientes").click();
    await expect(
      page.getByTestId("gestion-actas-panel-expedientes-content"),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include("[data-testid='gestion-actas-page']")
      // Excluir contenido que aún no terminó de pintar para evitar
      // falsos positivos de `aria-busy=true` durante la transición.
      .exclude("[aria-busy='true']")
      .analyze();

    const blockers = seriousOrCriticalViolations(results);
    if (blockers.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        "[axe] blockers en /gestion-actas#expedientes:",
        JSON.stringify(
          blockers.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length,
          })),
          null,
          2,
        ),
      );
    }
    expect(blockers).toEqual([]);
  });
});
