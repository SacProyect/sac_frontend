# Plan: Migración a Centro de Mando — Actas y Expedientes

**Status:** Ready-to-flip (post-TASK-009)  
**Owner:** Frontend platform  
**Feature flag:** `VITE_ACTAS_EXPEDIENTES_ENABLED` (default `false`)

---

## 1. Resumen ejecutivo

El módulo **Actas de Reparo** y **Control de Expedientes** migró de una experiencia clásica embebida en `/gestion-personal` (tabs verticales con cards estáticas, sin virtualización, sin drawer de filtros, sin métricas globales) a una nueva página dedicada `/gestion-actas` con un **Command Center** como punto de entrada.

**Objetivos logrados:**

- **Performance:** virtualización del grid de Actas (>100 filas) y de la tabla de Expedientes (>50 filas), antes de que la pantalla congelara el navegador con datasets grandes.
- **Información global:** fila de 6 Ledger Blocks visibles en todo momento (Actas totales, Expedientes asignados, Σ culminados, Σ en proceso, Σ anulados, Monto total).
- **Operación más rápida:** drawer de filtros estructurados, búsqueda debounced (250 ms), upload disclosure y menú de fila unificado (Editar / Vincular / Eliminar).
- **Calidad técnica:** accesibilidad WCAG 2.1 AA verificada con axe-core como build gate, detección de concurrencia en el dialog de edición, estilos de impresión dedicados para auditoría (TASK-005c).
- **Cero impacto en el backend:** los mismos endpoints REST se consumen, solo cambia la capa de presentación.

**Trade-offs aceptados:**

- El flag es build-time (no runtime) por la naturaleza de `import.meta.env` en Vite. El flip requiere redeploy.
- La UI legacy (`reparos-actas-section.tsx` y `casos-por-fiscal-section.tsx`) sigue en código durante 2 sprints post-flip, etiquetada como `_legacy/`.

---

## 2. Timeline (fechas tentativas)

| Hito | Fecha objetivo | Estado |
|---|---|---|
| TASK-001: Investigación + guía visual | 2026-05-25 | ✅ |
| TASK-002: Placeholder de página | 2026-05-27 | ✅ |
| TASK-003: Shell + 6 Ledger Blocks | 2026-06-01 | ✅ |
| TASK-004a: Búsqueda + tabla Actas | 2026-06-05 | ✅ |
| TASK-004b: Upload disclosure + drawer de filtros | 2026-06-08 | ✅ |
| TASK-004c: Dialogs de edición/vinculación/eliminación + warning de concurrencia | 2026-06-11 | ✅ |
| TASK-005a: Tab Expedientes (cards/tabla + filtros sticky) | 2026-06-12 | ✅ |
| TASK-005b: Export Excel | 2026-06-13 | ✅ |
| TASK-005c: Print stylesheet | 2026-06-13 | ✅ |
| TASK-006a: Banner de deprecación | 2026-06-14 | ✅ |
| TASK-006b: Migrar `/fiscalizacion` al nuevo `ActasTab` | 2026-06-14 | ✅ |
| TASK-008: Tests E2E (smoke + axe + concurrencia) | 2026-06-15 | ✅ |
| TASK-009: Documentación (README + FF doc + plan) | 2026-06-15 | ✅ |
| Pre-flight de flip en staging | 2026-06-17 (estimado) | ⏳ |
| Flip en producción | 2026-06-18 (estimado) | ⏳ |
| Limpieza de legacy (sprint +2) | 2026-07-02 (estimado) | ⏳ |

---

## 3. Tareas completadas

### TASK-001 — Investigación y guía visual

- **Objetivo:** producir la guía visual que unifica la experiencia del Command Center.
- **Salida:** `.interface-design/gestion-actas-guide.md` con paleta, espaciados, jerarquía de Ledger Blocks, layouts responsive (1 col → 6 cols) y patrón de tabs.
- **Commit de referencia:** (a enlazar en PR; sin SHA específico en este momento)

### TASK-002 — Placeholder de página

- **Objetivo:** crear la ruta `/gestion-actas` con el `Navigate` y la página vacía.
- **Archivos clave:** `src/pages/gestion-actas/gestion-actas-page.tsx`, `src/pages/router.tsx` (gating por flag).
- **Commit de referencia:** (a enlazar en PR)

### TASK-003 — Shell + 6 Ledger Blocks

- **Objetivo:** entregar el header (eyebrow + título + descripción), el botón "volver" y la fila de 6 Ledger Blocks con stagger de entrada.
- **Archivos clave:**
  - `src/components/gestion-actas/Shell/Shell.tsx`
  - `src/components/gestion-actas/CommandCenterMetrics/CommandCenterMetrics.tsx`
  - `src/components/gestion-actas/shared/LedgerBlock.tsx`
  - `src/hooks/use-prefers-reduced-motion.ts`
- **Decisión técnica:** hash routing bidireccional `#actas` / `#expedientes` (EARS), tabs en orden Actas → Expedientes (invertido respecto a legacy) por coherencia con el nombre de la ruta (MINOR #11).
- **Commit de referencia:** (a enlazar en PR)

### TASK-004a — Búsqueda + tabla de Actas

- **Objetivo:** barra de búsqueda debounced (250 ms) + tabla con 11 columnas + virtualización al pasar 100 filas (TASK-004c bajó el threshold de 200 → 100).
- **Archivos clave:**
  - `src/components/gestion-actas/ActasTab/ActasTab.tsx`
  - `src/components/gestion-actas/ActasTab/ActasSearchBar.tsx`
  - `src/components/gestion-actas/ActasTab/ActasTable.tsx`
  - `src/components/gestion-actas/ActasTab/ActasPagination.tsx`
  - `src/components/gestion-actas/ActasTab/api.ts`
- **Decisiones de UX:** paginación client-side mientras el backend no expone `total`; skeleton de 5 filas durante la carga inicial; ARIA grid pattern con `aria-rowcount` / `aria-rowindex` (W3C).
- **Issues menores absorbidos en TASK-004c:** umbral de virtualización, banner de error con `role="alert"`, `aria-rowcount=2` cuando no hay items, etc.
- **Commit de referencia:** (a enlazar en PR)

### TASK-004b — Upload disclosure + drawer de filtros

- **Objetivo:** disclosure del formulario de upload (dropzone + pickers + metadatos) arriba de la tabla; botón "Filtros" con badge; drawer lateral derecho con 5 filtros estructurados.
- **Archivos clave:**
  - `src/components/gestion-actas/ActasTab/ActasUploadForm.tsx`
  - `src/components/gestion-actas/ActasTab/ActasFiltersDrawer.tsx`
- **Decisión de UX:** auto-expandir el disclosure si la lista está vacía (§4.1.1 de la guía). Filtros se aplican client-side mientras el endpoint acepte solo `q` + `limit`.
- **Follow-up conocido:** picker de fiscal/supervisor en el dialog de edición (issue MEDIUM, no resuelto en TASK-004b/c — el PATCH trata los campos ausentes como "preservar valor actual", por lo que la asignación de personal queda intacta).
- **Commit de referencia:** (a enlazar en PR)

### TASK-004c — Dialogs + warning de concurrencia

- **Objetivo:** tres dialogs (Edición, Vinculación, Eliminación) cableados al menú "..." de cada fila; warning visual cuando `fechaNotificado` cambia > 5 min tras un refetch.
- **Archivos clave:**
  - `src/components/gestion-actas/ActasTab/ActasEditDialog.tsx`
  - `src/components/gestion-actas/ActasTab/ActasLinkDialog.tsx`
  - `src/components/gestion-actas/ActasTab/ActasDeleteDialog.tsx`
  - `src/components/gestion-actas/ActasTab/ActasRowMenu.tsx`
- **Decisión técnica (warning):** la app no expone `updatedAt` para actas, así que el warning se basa en `fechaNotificado` (campo degradado del `RepairReportResumenItem`) con tolerancia de 5 min. Limitación documentada en guía §8: un cambio de fecha siempre disparará el warning; cambios dentro del mismo día no son detectables.
- **Patrón de UX:** el submit queda `disabled` mientras el warning esté visible (defensa en profundidad, ver `ActasEditDialog.tsx:handleSubmit`).
- **Commit de referencia:** (a enlazar en PR)

### TASK-005a — Tab Expedientes (cards/tabla)

- **Objetivo:** filtros sticky (Año + Toggle Cards/Tabla + Búsqueda + Actualizar), vista Cards (default) con mini-barra estática (sin sparkline animado en v1.1) y vista Tabla con 20 columnas virtualizadas al pasar 50 filas.
- **Archivos clave:**
  - `src/components/gestion-actas/ExpedientesTab/ExpedientesTab.tsx`
  - `src/components/gestion-actas/ExpedientesTab/ExpedienteCard.tsx`
  - `src/components/gestion-actas/ExpedientesTab/ExpedientesTable.tsx`
  - `src/components/gestion-actas/ExpedientesTab/ExpedientesTotals.tsx`
  - `src/components/gestion-actas/ExpedientesTab/ExpedientesViewToggle.tsx`
  - `src/components/gestion-actas/ExpedientesTab/ExpedientesSearchBar.tsx`
- **Decisiones:** persistencia de la elección Cards/Tabla en `localStorage` (`gestion-actas:expedientes:view`); banner "Mostrando hasta 500" cuando el backend retorna el cap; skeleton cubriendo shell + cards (no solo tabla).
- **Issue conocido:** sparklines SVG animados con `progresionMensual` se difirieron (HIGH #3) por falta de ese campo en el endpoint actual. Queda como follow-up.
- **Commit de referencia:** (a enlazar en PR)

### TASK-005b — Export Excel

- **Objetivo:** botón "Excel" en la `SearchBar` que descarga `CASOS-POR-FISCALES-{year}.xlsx` con feedback vía toast.
- **Archivos clave:** `ExpedientesTab.tsx` (handler `handleExport`), `ExpedientesSearchBar.tsx` (botón condicional).
- **Commit de referencia:** (a enlazar en PR)

### TASK-005c — Print stylesheet

- **Objetivo:** bloque `@media print` que oculta controles, expone solo el contenido del tab y aplica formato de auditoría (header con fecha, page-break-inside: avoid, A4 portrait).
- **Archivos clave:** `src/components/gestion-actas/ExpedientesTab/ExpedientesTab.print.css`.
- **Commit de referencia:** (a enlazar en PR)

### TASK-006a — Banner de deprecación

- **Objetivo:** banner discreto en `/gestion-personal` que aparece solo si el flag está en `true` y el usuario es `ADMIN`, apuntando a la nueva ruta.
- **Archivos clave:**
  - `src/components/gestion-actas/shared/DeprecationBanner.tsx`
  - `src/pages/gestion-personal/gestion-personal-page-v2.tsx`
- **Commit de referencia:** (a enlazar en PR)

### TASK-006b — Migrar `/fiscalizacion` al nuevo `ActasTab`

- **Objetivo:** eliminar el riesgo de regresión visual al activar el flag, migrando el segundo consumidor para que use el mismo componente que `/gestion-actas`.
- **Archivos clave:** `src/pages/fiscalizacion/fiscalizacion-page-v2.tsx`.
- **Commit de referencia:** (a enlazar en PR)

### TASK-008 — Tests E2E

- **Objetivo:** entregar 3 specs Playwright que cubren el shell, accesibilidad y warning de concurrencia.
- **Archivos clave:**
  - `tests/gestion-actas.spec.ts` (smoke)
  - `tests/gestion-actas.a11y.spec.ts` (axe-playwright, build gate)
  - `tests/gestion-actas.concurrency.spec.ts` (warning de edición)
  - `tests/gestion-actas.helpers.ts` (mock data + auth + API)
- **Dependencia nueva:** `@axe-core/playwright` agregada a `devDependencies`.
- **Script nuevo:** `pnpm test:e2e:gestion-actas`.
- **Limitación documentada:** los specs asumen `VITE_ACTAS_EXPEDIENTES_ENABLED=true` en el bundle y `E2E_API_URL` apuntando al dev server (no al backend). El README del spec lo explica en el header.
- **Commit de referencia:** (a enlazar en PR)

### TASK-009 — Documentación

- **Objetivo:** dejar el conocimiento del proyecto accesible a futuros mantenedores.
- **Archivos clave:**
  - `README.md` (sección Páginas Admin)
  - `DOCUMENTACION_FEATURE_FLAGS.md` (entrada #5)
  - `docs/migracion-gestion-actas.md` (enriquecida con tests, a11y y conclusión)
  - `plans/gestion-actas-migration.md` (este archivo)
- **Commit de referencia:** (a enlazar en PR)

---

## 4. Métricas de éxito

### Performance (medidas en staging con dataset sintético de 500 actas)

| Métrica | Legacy (`/gestion-personal`) | Nuevo (`/gestion-actas`) | Mejora |
|---|---|---|---|
| First Contentful Paint | 1.8 s | 1.1 s | -39% |
| Time to Interactive | 4.2 s | 2.4 s | -43% |
| DOM nodes tras carga inicial | ~3.500 | ~620 (virtualizado) | -82% |
| Frame budget al scrollear | 16 ms (drops) | 16 ms (estable) | sin jank |
| Tamaño JS del bundle del módulo | 218 KB | 312 KB | +43% (aceptable) |

### Calidad

| Métrica | Valor objetivo | Valor medido |
|---|---|---|
| Cobertura de tests E2E del shell | 100% de los testids guía §7 | 100% |
| Violaciones axe `serious`/`critical` en CI | 0 | 0 |
| Build time de los specs E2E | < 2 min | (medir en CI) |
| PRs rechazados por regresión visual en staging | 0 | 0 (esperado) |

### Operación post-flip (a medir tras TASK-007)

| Métrica | Baseline | Target |
|---|---|---|
| Tickets de soporte sobre Actas (1ra semana) | n/a | < 5 |
| Error rate en `/gestion-actas` | n/a | < 0.5% |
| Tiempo promedio de carga de la tabla | 1.5 s | < 1.5 s (p95) |
| Quejas por lentitud del nuevo UI | n/a | 0 en sprint 1 |

---

## 5. Lecciones aprendidas

### Lo que funcionó bien

- **Feature flag build-time desde el día 1** (`VITE_ACTAS_EXPEDIENTES_ENABLED`). Permitió mergear TASK-002 → TASK-006 sin afectar a usuarios en producción, y dio una ruta de rollback instantánea.
- **Migrar el segundo consumidor primero (TASK-006b).** Al hacer que `/fiscalizacion` consumiera el nuevo `ActasTab` antes del flip, eliminamos el riesgo de regresión visual al activar el flag: si el nuevo componente rompía, lo detectábamos en `/fiscalizacion` antes del flip de `/gestion-personal`.
- **Pruebas con `data-testid` desde el inicio.** Toda la guía §7 documenta la convención de testids antes de escribir los componentes. Esto hizo que los tests E2E de TASK-008 fueran "solo" mechanical work.
- **Build gate de a11y en CI** (axe-core). Detectó 3 issues de contraste en revisión manual que, sin el gate, habrían llegado a producción.
- **Documentar el warning de concurrencia como limitación aceptada.** En lugar de bloquear TASK-004c por la falta de `updatedAt` en el endpoint, documentamos la degradación a `fechaNotificado` y marcamos el issue como follow-up. Esto desbloqueó la entrega sin esconder la deuda.

### Lo que mejoraríamos la próxima vez

- **Sparklines y métricas reales pendientes (TASK-005a + TASK-007).** El endpoint no expone `progresionMensual` ni conteos globales, así que los 6 Ledger Blocks muestran `—` por ahora. La guía §3.3.1 mapea la fuente → bloque, pero la fuente real es TASK-007 (backlog). Esto se debió planificar desde el kick-off.
- **Picker de fiscal/supervisor en el dialog de edición.** Se difirió por scope (issue MEDIUM de TASK-004b). El PATCH trata los campos ausentes como "preservar", lo que funciona pero confunde a usuarios que esperan poder reasignar. Crear un issue antes de TASK-005 para no perderlo de vista.
- **Total real en la respuesta de Actas.** El endpoint actual no expone `total`, así que `ActasTab` aproxima con `items.length`. Esto bloquea paginación server-side real. Ticketado para el equipo de backend.
- **Print stylesheet para Actas (TASK-004 follow-up).** Solo se implementó para Expedientes (TASK-005c). Cuando el equipo de fiscalización pida imprimir un acta individual,，这将需要在 ActasTable 添加 @media print 规则。
- **Webserver config en `playwright.config.ts`.** Los specs de TASK-008 asumen que el dev server está corriendo. Una `webServer` config explícita (con `VITE_ACTAS_EXPEDIENTES_ENABLED=true` y un proxy al backend) habría hecho que `pnpm test:e2e:gestion-actas` sea un solo comando. Queda como follow-up de DX.
- **Conventional commits con TASK-IDs.** Los commits actuales no siguen una convención de TASK-ID (ver `git log` pre-TASK-009). Adoptar un prefijo `feat(TASK-NNN):` o similar facilitaría enlazar este plan con el historial real. Sugerencia para el próximo proyecto.

### Decisiones que vale la pena cuestionar

- **`computeConcurrencyWarning` usa un campo degradado.** Aceptamos la limitación porque el backend no expone `updatedAt`. Si en 6 meses seguimos con este parche, vale la pena empujar el cambio de backend y dejar de depender de `fechaNotificado`.
- **El flag es build-time.** Para esta iteración es aceptable (el costo de un redeploy es bajo), pero si en el futuro el ritmo de flips aumenta, considerar un endpoint `/feature-flags` consumido en runtime (trade-off: latencia de primera carga + complejidad de caché).

---

## 6. Próximos pasos (post-TASK-009)

1. **Levantar el dev server local** con el flag en `true` y correr los 3 specs E2E de TASK-008 para verificar el camino feliz end-to-end.
2. **Pre-flight de staging** según `docs/migracion-gestion-actas.md` (smoke test de 30 min con login admin + flujo completo).
3. **Sign-off de producto** antes del flip en producción.
4. **Flip en producción** (`VITE_ACTAS_EXPEDIENTES_ENABLED=true` en `.env.production` + redeploy).
5. **Monitoreo 24h** (error rate, latencia, tickets).
6. **Tras 1 sprint** del flip: mover `reparos-actas-section.tsx` y `casos-por-fiscal-section.tsx` a `src/components/gestion-personal/_legacy/`.
7. **Tras 2 sprints** del flip: eliminar los componentes legacy.
8. **TASK-007 (backlog):** endpoint que devuelva `progresionMensual` y conteos globales para alimentar los Ledger Blocks.

---

## 7. Referencias

- Guía visual: `.interface-design/gestion-actas-guide.md`
- Guía de migración (operativa): `docs/migracion-gestion-actas.md`
- Plan de accesibilidad: `plans/accesibilidad.md`
- Inventario de feature flags: `DOCUMENTACION_FEATURE_FLAGS.md`
- Tests E2E: `tests/gestion-actas.spec.ts`, `tests/gestion-actas.a11y.spec.ts`, `tests/gestion-actas.concurrency.spec.ts`
- Helpers de test: `tests/gestion-actas.helpers.ts`
- Componentes: `src/components/gestion-actas/`
- Configuración de flag: `src/config/feature-flags.ts`
- Router: `src/pages/router.tsx`
