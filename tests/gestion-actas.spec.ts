import path from "path";
import dotenv from "dotenv";
import { test, expect, type Page } from "@playwright/test";
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
/*  Estos tests asumen que el dev server está sirviendo el bundle con         */
/*  `VITE_ACTAS_EXPEDIENTES_ENABLED=true` (de lo contrario el router         */
/*  redirige a `/gestion-personal`). El flag es build-time: el equipo de     */
/*  TASK-009 lo activa localmente con `VITE_ACTAS_EXPEDIENTES_ENABLED=true   */
/*  pnpm dev` o vía la pre-flight de `docs/migracion-gestion-actas.md`.       */
/*                                                                            */
/*  También se asume `E2E_API_URL` apuntando al dev server (no al backend),   */
/*  ya que `page.goto('/gestion-actas')` necesita un servidor que sirva el    */
/*  SPA. Si esto no se cumple, los selectores no resuelven y los tests       */
/*  fallan con un error claro (no en silencio).                              */
/* -------------------------------------------------------------------------- */

test.describe("Centro de Mando: Actas y Expedientes — Smoke", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await mockAdminAuth(page);
    await mockApis(page);
    await page.goto("/gestion-actas");
  });

  test("renderiza el shell con header, back y tabs", async ({
    page,
  }: { page: Page }) => {
    // El shell completo es el contenedor raíz del Command Center.
    await expect(page.getByTestId("gestion-actas-page")).toBeVisible();

    // Botón "volver" (enrutado a /admin).
    await expect(page.getByTestId("gestion-actas-back")).toBeVisible();

    // Tabs principales — orden invertido respecto a /gestion-personal
    // (Actas primero por coherencia con el nombre de la ruta).
    const tabActas = page.getByTestId("gestion-actas-tab-actas");
    const tabExpedientes = page.getByTestId("gestion-actas-tab-expedientes");
    await expect(tabActas).toBeVisible();
    await expect(tabExpedientes).toBeVisible();
  });

  test("los 6 Ledger Blocks del Command Center están presentes", async ({
    page,
  }: { page: Page }) => {
    // El contenedor de la fila de métricas.
    await expect(page.getByTestId("gestion-actas-ledger")).toBeVisible();

    // Los 6 testids individuales — guide §7.1 / §3.3.
    const ledgerTestIds = [
      "gestion-actas-ledger-actas-totales",
      "gestion-actas-ledger-expedientes-asignados",
      "gestion-actas-ledger-culminados",
      "gestion-actas-ledger-en-proceso",
      "gestion-actas-ledger-anulados",
      "gestion-actas-ledger-monto-total",
    ] as const;

    for (const testId of ledgerTestIds) {
      await expect(
        page.getByTestId(testId),
        `Ledger block faltante: ${testId}`,
      ).toBeVisible();
    }
  });

  test("el tab Actas queda activo por defecto (hash #actas)", async ({
    page,
  }: { page: Page }) => {
    // Esperar a que el hash quede sincronizado con el state inicial.
    await expect(async () => {
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash).toBe("#actas");
    }).toPass({ timeout: 5_000 });

    // El panel de Actas debe estar montado.
    await expect(
      page.getByTestId("gestion-actas-panel-actas"),
    ).toBeVisible();
  });

  test("click en tab Expedientes cambia el hash a #expedientes", async ({
    page,
  }: { page: Page }) => {
    await page.getByTestId("gestion-actas-tab-expedientes").click();

    // El efecto del Shell sincroniza activeTab → location.hash (ver
    // Shell.tsx useEffect).
    await expect(async () => {
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash).toBe("#expedientes");
    }).toPass({ timeout: 5_000 });

    // El panel de Expedientes queda montado tras el cambio de tab.
    await expect(
      page.getByTestId("gestion-actas-panel-expedientes-content"),
    ).toBeVisible();
  });

  test("click en tab Actas vuelve al hash #actas", async ({
    page,
  }: { page: Page }) => {
    // Primero saltar a Expedientes.
    await page.getByTestId("gestion-actas-tab-expedientes").click();
    await expect(async () => {
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash).toBe("#expedientes");
    }).toPass({ timeout: 5_000 });

    // Volver a Actas.
    await page.getByTestId("gestion-actas-tab-actas").click();
    await expect(async () => {
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash).toBe("#actas");
    }).toPass({ timeout: 5_000 });
  });

  test("la búsqueda en Actas filtra la lista client-side", async ({
    page,
  }: { page: Page }) => {
    // Esperar a que la tabla renderice al menos una fila del mock.
    await expect(page.getByTestId("actas-row-act-mock-1")).toBeVisible();

    // Escribir un término que solo coincide con el segundo mock.
    await page.getByTestId("actas-search").fill("BETA");

    // El debounce del ActasTab es 250ms; dar tiempo para que se aplique
    // el filtro client-side (filteredItems memo).
    await expect(page.getByTestId("actas-row-act-mock-1")).toHaveCount(0, {
      timeout: 5_000,
    });
    await expect(page.getByTestId("actas-row-act-mock-2")).toBeVisible();
  });

  test("el toggle de vista de Expedientes (cards ↔ tabla) funciona", async ({
    page,
  }: { page: Page }) => {
    // Cambiar a Expedientes.
    await page.getByTestId("gestion-actas-tab-expedientes").click();
    await expect(
      page.getByTestId("gestion-actas-panel-expedientes-content"),
    ).toBeVisible();

    // En cards (default) debe haber al menos una card.
    await expect(
      page.getByTestId("expedientes-card-f-mock-1"),
    ).toBeVisible();

    // Click en "Tabla" → cambia la vista y aparece la tabla.
    await page.getByTestId("expedientes-view-table").click();
    await expect(page.getByTestId("expedientes-table")).toBeVisible();
    await expect(
      page.getByTestId("expedientes-row-f-mock-1"),
    ).toBeVisible();

    // Volver a "Tarjetas" → la card vuelve a ser visible.
    await page.getByTestId("expedientes-view-cards").click();
    await expect(
      page.getByTestId("expedientes-card-f-mock-1"),
    ).toBeVisible();
  });
});
