# Interface Design Guide — `/gestion-actas`

> Especificación visual canónica para la nueva página **Centro de Mando: Actas y Expedientes**.
> Esta guía es **aditiva** al design system existente en `.interface-design/system.md`; no introduce tokens, patrones ni componentes paralelos.

---

## Changelog v1.1

Esta versión resuelve los 2 blockers críticos y los 5 issues high + 4 medium/minor señalados por el crítico sobre la v1.0. **No introduce cambios de scope respecto al plan v3.1 aprobado**; en particular, la refactorización de `ReparosActasSection` y `CasosPorFiscalSection` vía TASK-004a/b/c y TASK-005a/b/c queda explícitamente autorizada (ver §13).

### 🔴 CRÍTICOS (bloqueantes resueltos)

- **CRÍTICO #1 — Contradicción de scope §4.1 ↔ §13:** §13 reescrito para reflejar que **la refactorización de `ReparosActasSection` (TASK-004a/b/c) y `CasosPorFiscalSection` (TASK-005a/b/c) SÍ está autorizada**. §4.1 conserva los detalles visuales (siguen siendo válidos) pero ahora operan sobre los componentes refactorizados, no sobre el código actual sin tocar.
- **CRÍTICO #2 — `updatedAt` fantasma:** §8 degradado a un **warning opcional basado en `fechaNotificado`** (campo que sí existe en `RepairReportResumenItem`). Limitación documentada explícitamente: la heurística no detecta colisiones dentro del mismo minuto. Mejora con `updatedAt` real queda como follow-up de backend.

### 🟡 HIGH (resueltos)

- **HIGH #3 — Sparkline data faltante:** §4.2.2 reemplaza el sparkline SVG animado por una **mini-barra estática** con `bg-emerald-500` (culminados) + `bg-amber-400` (en proceso), calculada como `totalCulminados / (totalCulminados + totalEnProceso)`. El sparkline queda como follow-up cuando backend exponga progresión mensual.
- **HIGH #4 — Origen de los 6 Ledger Blocks:** añadida sub-sección §3.3.1 "Origen de datos" con tabla de mapeo fuente → bloque, documentando el límite de 250 items de `listRepairReportsResumen`.
- **HIGH #5 — Conteo erróneo de columnas:** §4.1.2 corregido de "7 columnas semánticas" a **11 columnas**, enumeradas exactamente como aparecen en `reparos-actas-section.tsx:940-953`.
- **HIGH #6 — 4to dialog "Subir PDF" sin entry-point:** eliminado de §4.1.4. El dropzone inline (§4.1.1) cubre todos los casos; documentado para evitar reintroducción.
- **HIGH #7 — Diferenciador visual no diferencia:** el color de **Σ Culm. pasa a `text-emerald-700 dark:text-emerald-400`** en esta página para evocar "reparos validados" (más fuerte que el `indigo-600` neutro del personal). Reflejado en §3.3, §9 y wireframe §11.1.

### 🟢 MEDIUM (resueltos)

- **MEDIUM #8 — A11y complementario:** añadida sub-sección §9.1 con `aria-live`, `aria-busy`, `role="alert"` y respeto a `prefers-reduced-motion` en el `animate-pulse` del dropzone.
- **MEDIUM #9 — Status TASK-004a/b/c y TASK-005a/b/c:** nota explícita añadida en §13. Esta guía **prescribe los ajustes visuales** que la refactorización debe implementar.
- **MEDIUM #10 — Usar `react-dropzone`:** §4.1.1 reescrita para usar `useDropzone` de `react-dropzone` (ya en `package.json` y usado en `errors-report-v2.tsx` y `announcement-form-modal.tsx`).

### 🔵 MINOR (resueltos)

- **MINOR #11 — Orden de tabs invertido:** decisión documentada en §3.4 con justificación explícita (coherencia con el nombre de página `/gestion-actas`).
- **MINOR #12 — Math del wireframe:** números de §11.1 ajustados para que Actas 1,234 = Σ Culm 1,000 + Σ Proc 200 + Σ Anul 34.
- **MINOR #13 — `fiscalId` undefined en data-testid:** nota añadida en §7 con fallback `expedientes-card-{index}` para iteraciones futuras.

## Changelog v1.1.1 (editorial)

- §4.2.3: conteo de columnas corregido de 19 a 20
- §9: token de Σ Culm. corregido de emerald-600 a emerald-700 para alinear con diferenciador HIGH #7

---

## 1. Resumen ejecutivo

- **Propósito:** Página dedicada para que fiscales/supervisores/administradores carguen PDFs de **actas de reparo**, editen metadatos, vinculen actas a operativos y consulten el **control de expedientes por fiscal**. Hoy estas dos superficies viven como tabs de `/gestion-personal`; esta guía las extrae a una ruta propia sin sacrificar la coherencia visual.
- **Diferenciador visual vs `/gestion-personal`:** Mismo lenguaje (Command Center + Ledger Blocks + Roster Rows), pero con un **panel de métricas globales de 6 bloques** siempre visible en la parte superior, en lugar del panel de personal. La pista de color cambia a **`indigo-600` en el eyebrow** (vs. el `indigo-600` neutro del personal) y se mantiene la paleta slate/indigo/amber/emerald del system.md. **Diferenciador funcional:** el número del bloque **Σ Culm.** se renderiza con `text-emerald-700 dark:text-emerald-400` (más fuerte que el `emerald-600` usado en `/gestion-personal`) para evocar "reparos validados" como dominio distintivo de esta página. El resto de tokens slate/indigo/amber se mantiene idéntico al system.md.
- **Skills aplicadas:**
  - `design-taste-frontend` — filosofía anti-slop, sistema único, paleta coherente, sin defaults AI.
  - `emil-design-eng` — micro-interacciones discretas (focus rings, hover táctiles, motion justificado).
  - `minimalist-ui` — jerarquía editorial (`text-[10px] uppercase tracking-wide` + `text-3xl tabular-nums`), bento/restrained.
  - `animation-designer` — transiciones específicas con framer-motion (stagger de Ledger Blocks, cross-fade de tabs, `pathLength` de sparklines).
- **Lectura de diseño (una línea):** *B2B government fiscal-ops dashboard, con un lenguaje "official dispatcher's ledger" — autoridad administrativa, sin theatrics, alta densidad.*

---

## 2. Tokens aplicados del system.md (confirmación explícita)

Esta guía **NO** introduce tokens nuevos. Todo lo que aparece aquí proviene del contrato ya fijado en `system.md`:

| Aspecto | Token / clase a usar | Fuente |
|---|---|---|
| **Paleta — backbone** | `slate-*` (bordes, texto secundario, dividers) | system.md §"Palette" |
| **Paleta — superficie** | `bg-background` (base), `bg-muted/30` (Ledger Block), `bg-card` (cards estándar) | system.md §"Surfaces" |
| **Paleta — autoridad** | `indigo-600` (primary/eyebrow), `indigo-400` (dark mode) | system.md §"Ink Blue" |
| **Paleta — alerta** | `amber-500` / `amber-600` (pendientes, warnings) | system.md §"Alert Amber" |
| **Paleta — validación** | `emerald-500` / `emerald-600` (culminados, vinculado) | system.md §"Validated Green" |
| **Profundidad** | Bordes `border-border/60` + tints `bg-muted/30`. **PROHIBIDO** drop-shadows decorativos. | system.md §"Depth" |
| **Tipografía — labels** | `text-[10px] uppercase tracking-wide` (también `tracking-widest` o `tracking-[0.2em]` para eyebrows) | system.md §"Typography" |
| **Tipografía — métricas** | `text-3xl tabular-nums tracking-tight font-bold` | system.md §"Numbers" |
| **Tipografía — títulos** | `text-2xl md:text-3xl font-bold tracking-tight` | inferido del ref `gestion-personal-page-v2.tsx:24` |
| **Espaciado** | Base `4px`. `gap-1.5` icon-text, `space-y-6` bloques, `space-y-5` contenedor | system.md §"Spacing" |
| **Radius** | `rounded-xl` para `Card` (ya en el componente), `rounded-md`/`rounded-lg` para sub-grupos. Consistencia con el resto del proyecto. | Card component default |
| **Patrón — métricas** | **Ledger Block**: `bg-muted/30 border-border/60 py-3 px-4` sin shadow, label arriba, número `text-3xl tabular-nums` debajo. | system.md §"The Ledger Block" |
| **Patrón — filas** | **Roster Row**: fila densa con `border-l` dividiendo bloques semánticos, `hover:bg-muted/40`, sin shadows. | system.md §"The Roster Row" |
| **Patrón — orquestador** | **Command Center**: métricas pinned arriba + tabs abajo con sub-componentes profundos por tab. | system.md §"The Command Center" |
| **Iconos** | `lucide-react` (familia ya en uso en todo el proyecto). `strokeWidth` por defecto. | inspección de imports |
| **Componentes UI** | Respetar `src/components/UI/*` (Card, Button, Input, Label, Select, Dialog, Sheet, Table, Badge, Skeleton, Tabs, etc.) — **no reimplementar**. | inspección del UI library |

**Regla de coherencia:** Si algo no está especificado en system.md, se delega al componente UI ya implementado. Si un detalle visual no aparece ni en system.md ni en el componente, se resuelve con la convención dominante en el archivo `gestion-personal-page-v2.tsx`.

---

## 3. Layout del Command Center

### 3.1 Estructura vertical (single column, `max-w-[1680px] mx-auto pb-8`)

```
[0] BackButton           ← `to="/admin"`, `hideLabelOnMobile`, `mb-2`
[1] Header de página     ← eyebrow + h1 + descripción
[2] Fila de Ledger Blocks ← 6 bloques en `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3`
[3] Tabs (sub-navegación) ← 2 TabsTriggers
[4] Contenido del tab activo
```

### 3.2 Header (slot [1])

| Elemento | Estilo | Contenido |
|---|---|---|
| Eyebrow | `text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400` | `SAC Fiscal · Operaciones de Reparo` |
| H1 | `text-2xl md:text-3xl font-bold tracking-tight text-foreground` | `Centro de Mando: Actas y Expedientes` |
| Descripción | `text-muted-foreground max-w-2xl text-sm leading-relaxed` | "Vista global del cuadrante, carga de expedientes y estado del equipo. Las métricas principales se mantienen visibles mientras explora el detalle de casos y actas." |

> **Decisión:** El H1 sigue literalmente la fórmula del Command Center existente en `gestion-personal-page-v2.tsx:24-28`, sustituyendo solo el subject ("Personal" → "Actas y Expedientes"). El eyebrow gana un sufijo "Reparo" para diferenciar el dominio.

### 3.3 Fila de Ledger Blocks (slot [2]) — 6 métricas globales

Layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3` dentro de un `space-y-5`.

| # | Label (uppercase tracking-wide) | Valor | Color del número | Ícono lucide |
|---|---|---|---|---|
| 1 | `Actas totales` | conteo de `RepairReportResumenItem` | `text-foreground` | `ScrollText` |
| 2 | `Expedientes asignados` | suma de `nroCasos` de fiscales activos | `text-foreground` | `Briefcase` |
| 3 | `Σ Culminados` | suma de `totalCulminados` | `text-emerald-700 dark:text-emerald-400` | `CheckCircle2` |
| 4 | `Σ En proceso` | suma de `totalEnProceso` | `text-amber-600 dark:text-amber-400` | `Clock` |
| 5 | `Σ Anulados` | suma de `vdfAnulados + afAnul*` | `text-amber-700 dark:text-amber-400` | `XCircle` |
| 6 | `Monto total reparos` | suma de `montoTotal` formateado `es-VE` | `text-foreground` + `font-mono text-base` | `Wallet` |

> **Diferenciador visual (HIGH #7):** El bloque 3 (Σ Culm.) usa `emerald-700 dark:emerald-400` deliberadamente un escalón más fuerte que el `emerald-600` típico del system.md, para que el ojo identifique la página `/gestion-actas` por su "ledger de reparos validados". Aplica también a `Σ Culm.` dentro de las cards de fiscal (§4.2.2) y a la fila TOTAL. **No** aplicar a badges de "Vinculado" (esos siguen siendo `emerald-500/10` + `text-emerald-600` por convención del system.md).

#### 3.3.1 Origen de datos (HIGH #4)

Los 6 bloques globales requieren agregaciones que **no existen en un único endpoint** del backend. La página compone client-side a partir de las funciones del módulo `fiscal-operaciones`:

| Ledger Block | Fuente | Notas |
|---|---|---|
| **Actas totales** | `listRepairReportsResumen` (length, sin filtros) | Limit hard-cap `limit=250` del endpoint. Si el conteo retornado es `>= 250`, mostrar banner discreto "Mostrando hasta 250 actas (límite actual)". Un endpoint paginado es follow-up de backend. |
| **Expedientes asignados** | `getCasosPorFiscalReport(year)` (length de fiscales retornados) | Limitado implícitamente a fiscales con al menos un caso en el año. Fiscales sin casos no aparecen, por lo que el número representa "fiscales activos con carga", no la planilla completa. |
| **Σ Culminados** | Suma de `vdfCulminados + afCulmPuntuales + afCulmIntegrales` | Computado client-side iterando el array de `getCasosPorFiscalReport`. |
| **Σ En proceso** | Suma de `vdfEnProceso + afProcPuntuales + afProcIntegrales` | Idem. |
| **Σ Anulados** | Suma de `vdfAnulados + afAnulPuntuales + afAnulIntegrales` | Idem. |
| **Monto total reparos** | Suma de `r.montoTotal` sobre `listRepairReportsResumen` | **Mismo límite de 250 items** que el bloque 1. Banner "Monto parcial: hasta 250 actas" si se excede. |

> **Limitación documentada:** Las métricas globales son **aproximaciones compuestas** y no authoritative. Para cifras oficiales se debe usar el módulo de reportes (futuro). El límite de 250 es la restricción actual del endpoint `/reparos` del plan v3.1; la mejora con un endpoint paginado o de agregación queda como follow-up de backend.

**Estructura interna de cada bloque (replica el patrón del ref `personal-fiscal-panel.tsx`):**

- Contenedor: `bg-muted/30 border border-border/60 rounded-lg py-3 px-4` (sin `shadow-sm`).
- Fila 1: ícono lucide a la izquierda (`h-3.5 w-3.5 text-muted-foreground`) + label `text-[10px] uppercase tracking-wide text-muted-foreground font-semibold`.
- Fila 2: valor principal con la clase del color correspondiente + `text-3xl font-bold tabular-nums tracking-tight`.
- Fila 3 (opcional): delta o tooltip con `text-[10px] text-muted-foreground` (ej. "vs. mes anterior: +12%").

**Responsive:**
- `< 768px` (mobile): 1 columna, stack vertical.
- `≥ 768px` (tablet): 2 columnas.
- `≥ 1024px` (laptop): 3 columnas, 2 filas.
- `≥ 1280px` (desktop): 6 columnas, 1 fila.

### 3.4 Sub-navegación (slot [3]) — 2 tabs

Patrón idéntico al ref `gestion-personal-page-v2.tsx:41-63` pero reducido a 2 triggers:

- `TabsList`: `flex flex-wrap h-auto gap-1 p-1 bg-muted/30 border border-border/60 rounded-lg w-full justify-start`.
- Trigger inactivo: `border border-transparent`.
- Trigger activo: `data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/60`.
- `TabsContent`: `mt-6 focus-visible:outline-none`.

| Tab | `value` | Label visible | Ícono lucide |
|---|---|---|---|
| 1 | `actas` | `Actas de Reparo` | `ScrollText` |
| 2 | `expedientes` | `Control de Expedientes` | `Table2` (default) / `LayoutGrid` (alterna en doc) |

> **Decisión:** El ref original tenía 3 tabs ("Control de Expedientes" primero). Para `/gestion-actas` se invierte el orden: el subject de la página (actas) es el primer tab; "Control de Expedientes" pasa a ser el segundo, ya con su `YearSelector` interno (no se reubica al header).
>
> **MINOR #11 — justificación del orden invertido:** Se acepta la inconsistencia con `/gestion-personal` (donde el orden histórico es expedientes → carga de actas) como **costo deliberado de la nueva identidad de página**. Justificación:
> 1. **Coherencia con el nombre de ruta y título:** `/gestion-actas` y el H1 "Centro de Mando: Actas y Expedientes" ponen "Actas" primero. La tab por defecto debe reflejar ese orden.
> 2. **Función primaria de la página:** la subida y edición de actas es la acción que da origen al expediente; operacionalmente, abrir en "Actas" reduce un click al usuario que entra a cargar/auditar.
> 3. **Las dos vistas son ahora pares:** en `/gestion-actas` ninguna es "subordinada" — son dos facetas del mismo dominio. En `/gestion-personal` el orden histórico refleja que la planilla de fiscales es el anchor.
>
> Si en el futuro se restaura `/gestion-personal` y se descubre fricción por el orden distinto, se evalúa mover "Actas" a la primera tab también allí. Por ahora, esta guía **fija el orden Actas → Expedientes como inmutable** dentro de `/gestion-actas`.

### 3.5 Slot inferior (slot [4])

Renderiza uno de los dos sub-componentes profundos:

- Tab `actas` → `<ReparosActasSection />` (extraído tal cual de `gestion-personal` con los ajustes de §4.1).
- Tab `expedientes` → `<CasosPorFiscalSection year onYearChange />` con el `year` controlado por la página (state local) en vez de interno.

---

## 4. Especificación visual por tab

### 4.1 Tab 1: Actas de Reparo (`value="actas"`)

#### 4.1.1 Sub-sección de carga de PDF (arriba, colapsable)

**Trigger de colapso:** `<details>` nativo o un `Disclosure` con animación. Estado inicial: **colapsado** cuando ya hay actas cargadas; **expandido** cuando la lista está vacía. El icono `ChevronDown` rota 180° al abrir.

**Drag-and-drop zone (cuando está expandido):**

Implementar con `useDropzone` de **`react-dropzone`** (ya en `package.json`, usado en `errors-report-v2.tsx` y `announcement-form-modal.tsx` — convención ya establecida en el proyecto). **No** reimplementar el ciclo `dragenter/dragover/drop` con HTML manual.

- Hook: `const { getRootProps, getInputProps, isDragActive } = useDropzone({ accept: { "application/pdf": [".pdf"] }, maxSize: 20 * 1024 * 1024, onDrop, onDropRejected });`
- Contenedor (wrapper de `getRootProps()`): `border-2 border-dashed border-border/60 rounded-lg p-8 text-center bg-muted/20 transition-colors`.
- Input hidden (de `getInputProps()`): se renderiza automáticamente; **no** crear un `<input type="file">` adicional.
- Estado `isDragActive`: `border-indigo-500 bg-indigo-500/5` con `transition-colors duration-150`.
- Texto: ícono `FileUp` (`h-8 w-8 mx-auto text-muted-foreground`), label `text-sm font-medium` "Arrastre el PDF del acta de reparo", helper `text-xs text-muted-foreground` "o haga clic para seleccionar (max 20 MB)".
- **Pulse en drag-over (MEDIUM #8):** `animate-pulse` se aplica al contenedor **solo si `isDragActive && !prefers-reduced-motion`**. Usar el helper `useReducedMotion()` de `framer-motion` o `window.matchMedia("(prefers-reduced-motion: reduce)")` y agregar la clase condicionalmente.
- **A11y (MEDIUM #8):** el contenedor de dropzone lleva `aria-live="polite"` para que screen readers anuncien "PDF cargado" / "PDF inválido" cuando `onDrop` / `onDropRejected` resuelvan.

**Formulario de metadatos (debajo del dropzone, grid responsive):**

- Grid: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`.
- Cada `Label`: `text-[10px] uppercase tracking-wide text-muted-foreground font-semibold` (subir desde el actual `text-xs` del ref para alinearse con system.md).
- Inputs: `<Input className="bg-background border-border" />` con helper `text-[10px] text-muted-foreground` debajo.
- Textareas: `<Textarea className="bg-background border-border min-h-[72px]" />` para "Ejercicio fiscal / período".

**Vista previa del contribuyente** (cuando se selecciona):

- Contenedor: `bg-muted/30 border-border/60 rounded-md p-3` (no Card, no shadow — superficie plana del estilo Ledger).
- Layout: `flex justify-between items-start gap-2` con bloque de info + botón `Cambiar` (ghost, `size="sm"`).

**Selección de fiscal + supervisor:**

- **Patrón "Card-as-picker"** (NO dropdowns nativos): replica el `UsuarioActaPicker` del ref `reparos-actas-section.tsx:201-313`.
- Estado vacío: `<Input>` de búsqueda + `<ul>` de resultados con `divide-y divide-border`, items `hover:bg-muted/60`.
- Estado con valor: `<Card className="border-border bg-muted/20">` con datos del usuario y botón "Cambiar" (`variant="ghost" size="sm"`).
- Debounce de búsqueda: 300ms (ya implementado en el ref).

**Botón primario de subida:** sticky al final del sub-form, `bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5`, ícono `FileUp`, label "Subir acta".

#### 4.1.2 Tabla principal (Roster Row pattern)

- Contenedor: `rounded-xl border border-border bg-card overflow-hidden` (sin `shadow-sm`).
- Wrapper scrollable: `overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto` (ya en el ref).
- **Sticky header:** `sticky top-0 z-10 bg-muted/95 dark:bg-slate-900/95 backdrop-blur-sm`. Borde inferior `border-border`.
- Filas densas con `border-l border-border/40` dividiendo las **11 columnas semánticas** (en el orden exacto de `reparos-actas-section.tsx:940-953`):
  1. **Contribuyente** (con UUID truncado debajo en `text-[10px] font-mono text-muted-foreground`).
  2. **RIF** (`font-mono`).
  3. **N.º exp.**
  4. **N.º reparo** (`font-mono`).
  5. **Impuesto** (chip con la opción de `IMPUESTO_OPTIONS`).
  6. **Total** (`fmtMoney` + `font-mono tabular-nums text-right`).
  7. **Fiscal (acta)** (nombre del fiscal asignado al acta).
  8. **Fiscal SAC** (nombre del usuario SAC responsable).
  9. **Operativo** (Badge `Vinculado` o `Pendiente` — colores de la tabla de badges abajo).
  10. **PDF** (botón `ExternalLink` `size="icon" variant="ghost"` que abre el storage URL).
  11. **Acciones** (grupo de 3 botones: `Pencil` editar, `Link2` vincular, `Trash2` eliminar).
- Hover: `hover:bg-muted/40` (instantáneo, sin `transition`).
- `text-foreground` para celda primaria, `text-muted-foreground` para celdas secundarias, `font-mono` para cédulas, RIF, N° reparo y montos.

**Badges de estado** (`Badge` con variant custom o `className` directo):

| Estado | Clases |
|---|---|
| `Vinculado` | `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20` |
| `Pendiente` | `bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20` |
| `Anulado` | `bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20` |

**Acciones inline (iconos lucide, `size="icon" variant="ghost"`):**

| Acción | Ícono | Tamaño |
|---|---|---|
| Abrir PDF | `ExternalLink` | `h-4 w-4` |
| Editar | `Pencil` | `h-4 w-4` |
| Vincular a operativo | `Link2` | `h-4 w-4` |
| Eliminar | `Trash2` | `h-4 w-4` (color `text-rose-500` en hover) |

**Virtualización:** cuando `items.length > 100`, renderizar con `react-window` (`FixedSizeList`, `itemSize={48}`). Por debajo de 100, mantener la tabla nativa (mejor accesibilidad de screen readers).

**Barra de búsqueda y export** (header del sub-componente, encima de la tabla):

- `<Input>` con `pl-9` (ícono `Search` absoluto a la izquierda) — placeholder "Buscar por contribuyente, RIF, N° acta…".
- Botón `Actualizar` (`RefreshCw`, `variant="outline"`, `size="sm"`, con `animate-spin` mientras carga).
- Botón `XLSX` (`FileSpreadsheet`, `bg-emerald-600` — solo si `user.role === "ADMIN"`).
- Botón `CSV` (`FileDown`, `variant="outline"`).
- Botón toggle de filtros (`Filter` / `SlidersHorizontal`): abre el **Sheet de filtros** lateral derecho.

#### 4.1.3 Drawer de filtros (Sheet lateral derecho)

- Componente: `Sheet` de `@/components/UI/sheet.tsx` (Radix), `side="right"`, ancho `sm:max-w-md`.
- Header: `SheetHeader` con `SheetTitle` "Filtros" + `SheetDescription` "Acota la lista de actas cargadas."
- Contenido (`SheetContent`):
  - **Rango de fechas:** dos `<Input type="date">` en grid `grid-cols-2 gap-2`, label `text-[10px] uppercase tracking-wide`.
  - **Impuesto:** `<Select>` con opciones `["", "IVA-ISLR", "ISLR", "IVA"]` (mismas que el ref `IMPUESTO_OPTIONS`).
  - **Fiscal:** card-picker (mismo componente del §4.1.1, reutilizado).
  - **Supervisor:** card-picker (mismo componente del §4.1.1, reutilizado).
  - **Estado:** `<Select>` con `["Todos", "Vinculado", "Pendiente", "Anulado"]`.
- Footer: `<SheetFooter>` con dos botones:
  - `Limpiar` (`variant="ghost"`, izquierda).
  - `Aplicar` (`bg-indigo-600 hover:bg-indigo-500 text-white`, derecha).
- **Cierre automático** al hacer click fuera o pulsar `Esc` (default Radix).

#### 4.1.4 Dialogs (Radix `Dialog` de `@/components/UI/dialog.tsx`)

| Dialog | Tamaño | Contenido clave | Botones |
|---|---|---|---|
| **Edición de acta** | `max-w-3xl` | Reutiliza `ActaMetadataFields` + `UsuarioActaPicker` (fiscal, supervisor) + banner de concurrencia (ver §8). | `Cancelar` (ghost) · `Guardar cambios` (indigo-600) |
| **Vinculación a operativo** | `max-w-lg` | Dropdown de operativo + `<Textarea>` para notas + preview del acta. | `Cancelar` · `Vincular` (indigo-600) |
| **Confirmación de eliminación** | `max-w-md` | Texto "¿Eliminar el acta N° {{numeroReparo}}? Esta acción no se puede deshacer." | `Cancelar` · `Eliminar` (`bg-rose-600 hover:bg-rose-500 text-white`) |

> **HIGH #6 — Subir PDF se hace exclusivamente desde el dropzone inline (§4.1.1).** No se añadió un 4to dialog modal "Subir PDF" para evitar entry points redundantes: si el usuario quiere subir un acta, expande el disclosure del dropzone — ese es el único flujo. Si en una iteración futura se necesita un botón "Nueva acta" en el header, **primero** se discute si el disclosure del dropzone puede ser el disparador (auto-expand + scroll), **después** se autoriza la reintroducción de un dialog aquí. Esta guía lo deja explícitamente fuera del scope.

> **Regla de anidamiento:** El Sheet de filtros NO se abre dentro de un Dialog. Son flujos independientes.

---

### 4.2 Tab 2: Control de Expedientes (`value="expedientes"`)

Reutiliza el componente `CasosPorFiscalSection` del ref (`casos-por-fiscal-section.tsx`), **reubicando** el `YearSelector` que en la página actual es interno:

- El `year` se promueve a state en la página `/gestion-actas` y se pasa como `prop`. (Esto permite pre-cargar el año en la URL con `?year=2025` en el futuro.)
- El `YearSelector` interno del ref se oculta cuando se recibe `year` como prop controlada. Alternativa: el componente acepta `year: number | "self"`; si es `"self"` mantiene su state interno (backward compat con `/gestion-personal`).

#### 4.2.1 Filtros sticky arriba

Patrón: `sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/60 pb-3` para que persista al hacer scroll dentro del tab.

Tres controles en una fila responsive (`flex flex-wrap items-end gap-3`):

| Control | Tipo | Default | Comportamiento |
|---|---|---|---|
| **Año** | `YearSelector` (existente en `UI/v2/year-selector.tsx`) o `<Input type="number" min={2000} max={2100}>` con `w-[112px]` | año actual | Cambia el reporte cargado |
| **Toggle vista** | Grupo de 2 botones en `flex rounded-md border border-border p-0.5 bg-muted/40` | `tarjetas` | Cambia entre vista Cards y Tabla |
| **Búsqueda** | `<Input>` con `pl-9` (ícono `Search`), `flex-1 min-w-[200px] max-w-md` | vacío | Filtra por funcionario / cédula / coordinación / observaciones |

A la derecha del bloque:

- `Actualizar` (`RefreshCw`, `variant="outline"`, `size="sm"`, con `animate-spin` durante load).
- `Excel` (`FileDown`, `bg-emerald-600 hover:bg-emerald-500 text-white`, sticky con la barra).

#### 4.2.2 Vista Cards (default) — bento de fiscales

**Layout:** lista vertical de cards (NO grid — preserva el patrón Roster Row). `flex flex-col gap-2`. En `< 640px` se apila a una sola columna, en `≥ 640px` la card pasa a `md:flex-row`.

**Card structure** (basada en `CasoFiscalTarjeta` del ref, refactorizada):

```
┌────────────────────────────────────────────────────────────────────┐
│ Funcionario        │ Casos │ Progreso (mini-barra estática)│ …   │
│ CI 12.345.678      │  42   │ ████████░░ 32 CULM / 8 PROC  │ …   │
│ Coord. X           │       │  Σ Culm: 32  Σ Proc: 8       │ …   │
└────────────────────────────────────────────────────────────────────┘
```

- Contenedor: `flex flex-col md:flex-row md:items-center gap-4 p-4 border border-border/60 bg-card rounded-md hover:bg-muted/10 transition-colors`.
- **Bloque 1 — Identidad** (`min-w-[200px] flex-shrink-0`):
  - `h3 text-sm font-bold text-foreground` — `r.funcionario`.
  - `text-[10px] font-mono text-muted-foreground mt-0.5` — `CI {r.cedula} · {r.coordinacion}`.
- **Bloque 2 — Métricas** (`flex-1 grid grid-cols-2 sm:grid-cols-6 gap-4 md:gap-6 items-center`):
  - `Casos` (nroCasos, `text-lg font-bold tabular-nums`).
  - `Progreso global` (col-span-2, oculto `< sm`):
    - Header inline: label `text-[10px] uppercase tracking-wide text-muted-foreground` + counter `text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-medium` (`{r.totalCulminados} CULM / {r.totalEnProceso} PROC`).
    - **Mini-barra estática de progreso** (HIGH #3): contenedor `h-1.5 w-full bg-muted overflow-hidden flex rounded-full` con dos segmentos calculados client-side:
      - `bg-emerald-500` con `width: ${(totalCulminados / (totalCulminados + totalEnProceso || 1)) * 100}%` (culminados).
      - `bg-amber-400` con `width: ${(totalEnProceso / (totalCulminados + totalEnProceso || 1)) * 100}%` (en proceso).
      - Sin sparkline, sin SVG, sin `motion.path`. La barra se anima de `width: 0` a `${pct}%` en 400ms con delay proporcional al índice de la card (ver §6).
    - **Nota (HIGH #3):** el sparkline SVG sobre `progresionMensual`/`monthly` **se omite en v1.1** porque el shape actual de `CasoFiscalResumenItem` (en `casos-por-fiscal-section.tsx`) no expone serie temporal. Reintroducir como mejora futura cuando el backend publique un endpoint de progresión mensual;届时只需要在这个 cell 插回 `<motion.path>` con `pathLength: 0 → 1` (ver §6) sin tocar la barra estática.
  - `VDF / AF` (text-base, `font-semibold tabular-nums`).
  - `Σ Culm.` (`text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400` — diferenciador de página, ver §3.3).
  - `Σ Proc.` (`text-lg font-bold tabular-nums text-amber-600 dark:text-amber-500`).
- **Bloque 3 — Observaciones** (`md:w-[180px] flex-shrink-0 md:border-l border-border/60 md:pl-4`):
  - `text-xs text-muted-foreground line-clamp-2` con `title={observaciones}` para hover completo.

**Fila de totales al final de la lista:**

- Card: `border border-border bg-muted/40`.
- Contenido: nombre del fiscal "TOTAL" + celdas con `tabular-nums` separadas por `·` o `|`.
- Colores: `Σ Culm.` en `emerald-700 dark:text-emerald-400` (diferenciador de página, ver §3.3 nota), `Σ Proc.` en `amber-700 dark:text-amber-400`.

#### 4.2.3 Vista Tabla — 20 columnas alineadas al Excel

- Mismas 20 columnas que el ref `casos-por-fiscal-section.tsx:295-317` (Funcionario, Cédula, N° casos, VDF, VDF culm., VDF proc., VDF anul., AF total, Punt., Integ., AF culm. P, AF culm. I, AF proc. P, AF proc. I, AF anul. P, AF anul. I, Σ culm., Σ proc., Coord., Observaciones). **No se cambia el orden ni la cantidad** (alineado al export Excel).
- Contenedor: `rounded-xl border border-border bg-card overflow-hidden` (sin `shadow-sm`).
- Sticky header: `sticky top-0 z-10 bg-muted/95 dark:bg-slate-900/95 backdrop-blur-sm`.
- Fila de totales al final del `TableBody` con `bg-muted/60 dark:bg-slate-800/80 border-t-2 border-border font-semibold` (idéntica al ref).
- **Virtualización:** cuando `filasFiltradas.length > 50`, renderizar con `react-window` (`VariableSizeList` con `itemSize={56}` para header de 2 líneas).

---

## 5. Patrones de skeleton states

**Cobertura obligatoria:** el skeleton debe replicar la forma final del layout, no solo la tabla. Cobertura por estado:

| Vista | Cobertura del skeleton |
|---|---|
| Página cargando | BackButton + header + 6 Ledger Blocks (`h-20` cada uno) + TabsList |
| Tab `actas` cargando | Dropzone (`h-32`) + 8 filas de tabla (`h-12`) con celdas mezcladas |
| Tab `expedientes` (cards) | 6 cards `h-48` con mini-barra de progreso (`h-1.5`) y bloques de texto |
| Tab `expedientes` (tabla) | 6 filas de tabla con 8 columnas, sticky header |
| Sub-componente de búsqueda (fiscal/supervisor) | `<Skeleton className="h-9 w-full" />` para input + 3-4 items de `h-10` cada uno |

**Convención visual de placeholders (coherente con system.md):**

- Skeleton base: `<Skeleton className="h-4 w-3/4" />` para textos, `<Skeleton className="h-10 w-full rounded-md" />` para inputs/botones.
- Animación: `animate-pulse` (default del componente, no se reescribe).
- **Labels de placeholder en zonas superiores** (opcional, ayuda a screen readers): `text-[10px] uppercase tracking-wide text-transparent` con `Skeleton` superpuesto que actúa de barra visible.
- **Nunca** mostrar un spinner circular genérico en estas vistas (regla del design-taste-frontend §4.5 "avoid generic circular spinners").

---

## 6. Microinteracciones (framer-motion)

Toda animación es **opcional y se omite bajo `prefers-reduced-motion: reduce`**. Helper:

```ts
const reduce = useReducedMotion();
const baseTransition = reduce ? { duration: 0 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] };
```

| Momento | Animación | Implementación |
|---|---|---|
| **Entrada de los 6 Ledger Blocks** | Stagger desde arriba. `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` con `delay: i * 0.04`. Duración 180ms. | `<motion.div>` con `AnimatePresence`. `staggerChildren: 0.04` en el contenedor. |
| **Cambio de tab** | Cross-fade en ≤ 200ms. | `AnimatePresence mode="wait"` envolviendo el `TabsContent`. `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}` con `transition={{ duration: 0.18 }}`. |
| **Hover en filas** | `bg-muted/40` instantáneo. **NO** `transition` ni motion. | Tailwind nativo, `transition-none` explícito. |
| **Hover en cards de fiscal** | `bg-muted/10` con `transition-colors duration-150`. **No** `scale` ni `translate`. | Tailwind nativo. |
| **Drag PDF (dropzone)** | Borde dashed `border-indigo-500` + `animate-pulse` mientras `isDragActive && !prefers-reduced-motion`. | Tailwind nativo + state `isDragActive` (de `useDropzone`); `animate-pulse` se aplica condicionalmente. |
| **Sparkline del fiscal** | — (HIGH #3: no se renderiza en v1.1 por falta de `progresionMensual` en el shape. Reservado para follow-up cuando backend publique la serie.) | — |
| **Mini-barras de progreso** | Ancho animado de 0 a `%` en 400ms, delay proporcional al índice de la card. | `<motion.div style={{ width: 0 }} animate={{ width: \`${pct}%\` }} transition={{ duration: 0.4, delay: 0.05 * i }} />`. |
| **Apertura/cierre de Sheet/Dialog** | Default Radix (200ms fade + slide). **No override.** | Default. |
| **Drag del dropzone** | Borde con `animate-pulse` + scale `1.005` en hover (sutil, no bouncing). | Tailwind `hover:scale-[1.005] transition-transform duration-150`. |

**Regla absoluta:** ninguna animación usa `window.addEventListener('scroll')`, `useState` con `scrollY`, ni RAF que toque state de React. Solo Motion (`motion/react`) y Tailwind transitions.

---

## 7. Convención de `data-testid` (CRÍTICA para E2E)

Naming: **lowercase, kebab-case, namespace + acción/objeto**. Estructura fija:

```
gestion-actas-{slot}
actas-{acción}-{objeto?}[-{id}]
expedientes-{acción}-{objeto?}[-{id}]
```

### 7.1 Shell de la página

| Elemento | `data-testid` |
|---|---|
| Contenedor de página | `gestion-actas-page` |
| BackButton (volver) | `gestion-actas-back` |
| Header h1 | `gestion-actas-title` |
| Eyebrow | `gestion-actas-eyebrow` |
| Fila de Ledger Blocks (contenedor) | `gestion-actas-ledger` |
| Cada Ledger Block | `gestion-actas-ledger-{slug}` (`actas-totales`, `expedientes-asignados`, `culminados`, `en-proceso`, `anulados`, `monto-total`) |

### 7.2 Tabs

| Elemento | `data-testid` |
|---|---|
| Tab trigger "Actas de Reparo" | `gestion-actas-tab-actas` |
| Tab trigger "Control de Expedientes" | `gestion-actas-tab-expedientes` |
| Tab content Actas | `gestion-actas-panel-actas` |
| Tab content Expedientes | `gestion-actas-panel-expedientes` |

### 7.3 Tab Actas

| Elemento | `data-testid` |
|---|---|
| Toggle del dropzone (Disclosure) | `actas-upload-toggle` |
| Dropzone | `actas-upload-dropzone` |
| Input file (hidden dentro del dropzone) | `actas-upload-input` |
| Botón "Subir acta" (submit) | `actas-upload-button` |
| Picker de contribuyente (input) | `actas-taxpayer-search` |
| Picker de fiscal (input) | `actas-fiscal-search` |
| Picker de supervisor (input) | `actas-supervisor-search` |
| Toggle del Sheet de filtros | `actas-filters-toggle` |
| Sheet de filtros (contenedor) | `actas-filters-sheet` |
| Botón "Aplicar" del Sheet | `actas-filters-apply` |
| Botón "Limpiar" del Sheet | `actas-filters-clear` |
| Barra de búsqueda (input principal) | `actas-search` |
| Botón "Actualizar" | `actas-refresh` |
| Botón "XLSX" | `actas-export-xlsx` |
| Botón "CSV" | `actas-export-csv` |
| Tabla (contenedor) | `actas-table` |
| Header de la tabla | `actas-table-header` |
| Fila de la tabla | `actas-row-{id}` (id = `RepairReportResumenItem.id`) |
| Celda badge de estado | `actas-row-{id}-status` |
| Botón "Abrir PDF" en fila | `actas-row-{id}-open-pdf` |
| Botón "Editar" en fila | `actas-edit-{id}` |
| Botón "Vincular" en fila | `actas-link-{id}` |
| Botón "Eliminar" en fila | `actas-delete-{id}` |
| Dialog de edición | `actas-edit-dialog` |
| Dialog de vinculación | `actas-link-dialog` |
| Dialog de confirmación de borrado | `actas-delete-dialog` |
| Banner de concurrencia (ver §8) | `actas-concurrency-warning` |

### 7.4 Tab Expedientes

| Elemento | `data-testid` |
|---|---|
| Año (selector) | `expedientes-year` |
| Toggle "Tarjetas" | `expedientes-view-cards` |
| Toggle "Tabla" | `expedientes-view-table` |
| Búsqueda (input) | `expedientes-search` |
| Botón "Actualizar" | `expedientes-refresh` |
| Botón "Excel" | `expedientes-export` |
| Card de fiscal | `expedientes-card-{fiscalId}` |
| Mini-barra de progreso (culm) | `expedientes-progress-culm-{fiscalId}` |
| Mini-barra de progreso (proc) | `expedientes-progress-proc-{fiscalId}` |
| Sparkline de la card | ~~`expedientes-sparkline-{fiscalId}`~~ (HIGH #3: removido en v1.1 por falta de `progresionMensual`. Reservado para v1.2.) |
| Tabla (contenedor) | `expedientes-table` |
| Fila de la tabla | `expedientes-row-{fiscalId}` |
| Fila de totales | `expedientes-row-totals` |
| Card de "Criterios de datos" (details) | `expedientes-meta-disclosure` |

> **MINOR #13 — `fiscalId` y fallback:** En el shape actual de `CasoFiscalResumenItem`, el campo `fiscalId` (o equivalente) está **siempre presente** y se usa directamente en `expedientes-card-{fiscalId}` / `expedientes-row-{fiscalId}`. Si en una iteración futura el backend admite fiscales con `fiscalId` null (caso edge: funcionario sin ficha completa), el fallback es `expedientes-card-{index}` / `expedientes-row-{index}` usando el índice de iteración de `.map()`. Documentar este contrato en el JSDoc del componente al implementar.

---

## 8. Patrón de warning de concurrencia (basado en `fechaNotificado`)

> **CRÍTICO #2 — limitación documentada:** El shape de `RepairReportResumenItem` (ver `fiscal-operaciones-functions.ts:87-112`) **no expone** `updatedAt`, `updated_at` ni `modifiedAt`. La v1.0 de esta guía basaba el warning en `updatedAt` (campo fantasma). En v1.1 se degrada el patrón a un **warning opcional** basado en `fechaNotificado` (campo real del shape), que es la mejor aproximación disponible. **El warning no detecta cambios simultáneos en el mismo minuto**: si dos usuarios guardan entre dos `refetch` consecutivos con timestamps idénticos al minuto, la colisión pasa desapercibida. Esto es **aceptable para v1.1**. Una mejora con `updatedAt` real (timestamp de última escritura, server-side) queda como **follow-up explícito de backend** en el backlog. La sección §8 se mantiene porque prescribe el comportamiento visual y de UX que se activará automáticamente cuando el campo exista.

### 8.1 Disparador

Al abrir el dialog de edición, se compara la `fechaNotificado` que vino con la fila (almacenada en el `TableRow` como `data-row-fecha-notificado={r.fechaNotificado}`) contra el valor más reciente del backend al reabrir (o, si no hay re-fetch, contra el `Date.now()` del momento en que se cargó la lista, con tolerancia de **5 minutos**).

> **Heurística:** si `backend.fechaNotificado > cargada.fechaNotificado + 5min`, asumimos que "otro usuario modificó la fila entre que se cargó la lista y se abrió el dialog". Los 5 minutos absorben re-fetches normales del cache de TanStack Query.

### 8.2 Comportamiento visual

Banner en la parte superior del `DialogContent` del dialog de edición:

- Contenedor: `border border-amber-500/60 bg-amber-500/10 rounded-md px-3 py-2 flex items-start gap-2`.
- `role="alert"` (MEDIUM #8) para que screen readers anuncien el warning apenas aparece.
- Ícono: `AlertTriangle` (`h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0`).
- Texto: `text-sm text-amber-700 dark:text-amber-300` con la plantilla:
  > "Esta fila pudo haber sido modificada por otro usuario a las **HH:MM** (fecha de notificación). Recargue antes de guardar."
- Botón secundario: `Recargar` (`variant="outline" size="sm"`, ícono `RefreshCw`).
- **Botón "Guardar cambios" deshabilitado** (`disabled`, `opacity-50 cursor-not-allowed`) hasta que el usuario pulse "Recargar". El click en "Recargar" re-fetch la fila, repuebla el form y rehabilita el botón.

### 8.3 Edge cases

- Si el usuario cierra el dialog con el banner visible, al reabrir se vuelve a comparar (no se asume que ya recargó).
- Si el backend responde con error de "stale" al hacer PATCH (defensa en profundidad), se re-muestra el banner con copy específico: "Otro usuario guardó cambios. Sus cambios no se aplicaron." y se descartan los del form.
- **Si `fechaNotificado` es `null` o `undefined` en la fila (registros legacy):** el banner **no se muestra** y el botón guardar queda habilitado normalmente. Esto evita falsos positivos en datos antiguos.

### 8.4 No se replica para `expedientes-*`

La vista de expedientes es read-only, no hay dialog de edición que proteger. **No** añadir banner de concurrencia allí.

### 8.5 Follow-up de backend

Para que el warning detecte colisiones reales y no por timestamp de notificación, pedir al backend que añada `updatedAt: string` (ISO) a `RepairReportResumenItem` con trigger `BEFORE UPDATE`. Cuando esté disponible, sustituir `fechaNotificado` por `updatedAt` en §8.1 sin tocar §8.2-§8.4 (el comportamiento visual es idéntico).

---

## 9. Modo oscuro

El proyecto define los tokens oscuros ya en cada componente (`dark:bg-...`). Esta guía **NO** introduce paleta oscura propia. La regla es:

| Elemento | Light | Dark |
|---|---|---|
| Base | `bg-background` (slate-50) | `bg-slate-950` |
| Texto primario | `text-foreground` (slate-900) | `text-slate-100` |
| Texto secundario | `text-muted-foreground` (slate-500) | `text-slate-400` |
| Ledger Block | `bg-muted/30` sobre `bg-background` | `bg-slate-900/30` sobre `bg-slate-950` |
| Bordes | `border-border/60` (slate-200) | `border-slate-800` |
| Sticky header de tabla | `bg-muted/95 backdrop-blur-sm` | `bg-slate-900/95 backdrop-blur-sm` |
| Eyebrow | `text-indigo-600` | `text-indigo-400` |
| Σ Culm. | `text-emerald-700` | `text-emerald-400` |
| Σ Proc. | `text-amber-600` | `text-amber-400` |
| Fila de totales | `bg-muted/60` | `bg-slate-800/80` |
| BackButton | (default — hereda de Button) | `text-slate-300 hover:text-white` (ya en `v2/back-button.tsx:42`) |

**Verificación de contraste obligatoria (WCAG AA mínimo, AAA para body):**

| Combinación | Ratio mínimo | Verificar |
|---|---|---|
| `text-foreground` sobre `bg-background` | 7:1 (AAA body) | OK |
| `text-muted-foreground` sobre `bg-background` | 4.5:1 (AA body) | OK (slate-500/600) |
| `text-indigo-600` sobre `bg-background` | 4.5:1 | OK |
| `text-indigo-400` sobre `bg-slate-950` | 4.5:1 | OK |
| `text-emerald-600` sobre `bg-background` | 4.5:1 | OK |
| `text-emerald-400` sobre `bg-slate-950` | 4.5:1 | OK |
| `text-amber-600` sobre `bg-background` | 4.5:1 | OK (slate-50 con amber-600) |
| `text-amber-400` sobre `bg-slate-950` | 4.5:1 | OK |
| Badge "Vinculado" (`bg-emerald-500/10` + `text-emerald-600`) | 4.5:1 | OK |
| Badge "Pendiente" (`bg-amber-500/10` + `text-amber-600`) | 4.5:1 | OK |
| **`text-emerald-700` sobre `bg-background`** (Σ Culm. diferenciador, HIGH #7) | 4.5:1 | OK (emerald-700 es AA sobre slate-50). Dark: `text-emerald-400` sobre `bg-slate-950` también OK. |

**Modo oscuro por defecto:** seguir `prefers-color-scheme` (regla del design-taste-frontend §6.C). El proyecto no expone toggle manual en `/gestion-actas`.

### 9.1 A11y complementario (MEDIUM #8)

Más allá del contraste verificado arriba, la página añade las siguientes mejoras de accesibilidad que **no son opcionales**:

| Zona | Atributo / comportamiento | Razón |
|---|---|---|
| **Dropzone de PDF (§4.1.1)** | `aria-live="polite"` en el contenedor del dropzone | Anuncia "PDF cargado" / "PDF inválido" cuando `onDrop` / `onDropRejected` resuelvan, sin interrumpir al usuario. |
| **Listados virtualizados** (`actas-table`, `expedientes-table`, `expedientes-card-*`) | `aria-busy="true"` mientras `isFetching` o `isLoading` del query | Screen readers saben que el contenido está en transición y evitan anunciar filas stale. Se quita al settle del refetch. |
| **Banner de concurrencia (§8)** | `role="alert"` en el contenedor del banner | Garantiza que el warning sea anunciado apenas aparece, sin esperar a un foco. |
| **`animate-pulse` en dropzone** (§4.1.1) | Aplicar la clase **solo si `!prefers-reduced-motion`**. Usar `useReducedMotion()` de `framer-motion` o `window.matchMedia("(prefers-reduced-motion: reduce)")` y agregar la clase condicionalmente. | Cumple WCAG 2.3.3 (Animation from Interactions) y la regla global de la guía de respetar `prefers-reduced-motion`. |
| **Sparkline (cuando se reintroduzca)** | `aria-label="Progresión mensual de {N} culminados sobre {M} meses"` y `<title>` SVG | Cuando el sparkline vuelva en v1.2, no debe ser inaccesible. |
| **Tabs** | Heredan el patrón accesible de Radix (`role="tablist"`, `aria-selected`, navegación con flechas). | No customizar. |
| **Dialogs** | Heredan el focus-trap y `aria-labelledby` de Radix. | No customizar. |

> **Implementación:** centralizar el helper `usePrefersReducedMotion()` en `src/hooks/use-prefers-reduced-motion.ts` (sigue la convención del proyecto) y consumirlo en los 3 puntos arriba. No duplicar el `matchMedia` en cada componente.

---

## 10. Print stylesheet (TASK-005c)

Bloque `@media print { ... }` aplicado solo a `/gestion-actas` (scope: el contenedor `data-testid="gestion-actas-page"` o un wrapper equivalente).

**Reglas:**

```css
@media print {
  /* Ocultar controles interactivos */
  [data-testid="gestion-actas-back"],
  [data-testid="actas-search"],
  [data-testid="actas-refresh"],
  [data-testid="actas-export-xlsx"],
  [data-testid="actas-export-csv"],
  [data-testid="actas-filters-toggle"],
  [data-testid="expedientes-search"],
  [data-testid="expedientes-view-cards"],
  [data-testid="expedientes-view-table"],
  [data-testid="expedientes-refresh"],
  [data-testid="expedientes-export"],
  [data-testid="actas-upload-toggle"],
  /* Botones de acción de fila */
  [data-testid^="actas-edit-"],
  [data-testid^="actas-delete-"],
  [data-testid^="actas-link-"],
  [data-testid^="actas-row-"][data-testid$="-open-pdf"] {
    display: none !important;
  }

  /* Header de auditoría visible */
  .print-audit-header {
    display: flex !important;
  }

  /* Card de expediente en una sola página A4 */
  [data-testid^="expedientes-card-"] {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Tabla con paginación automática */
  [data-testid="actas-table"],
  [data-testid="expedientes-table"] {
    page-break-inside: auto;
  }
  [data-testid^="actas-row-"],
  [data-testid^="expedientes-row-"] {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Forzar colores */
  body { background: white !important; color: black !important; }
  .text-emerald-600, .text-emerald-400 { color: #047857 !important; }
  .text-amber-600, .text-amber-400 { color: #b45309 !important; }
}
```

**Header de auditoría (visible SOLO en print, oculto en pantalla):**

- Contenedor: `class="print-audit-header hidden print:flex items-center justify-between border-b border-black pb-2 mb-4"`.
- Contenido izquierdo: logo SAC + `text-xs uppercase tracking-wide` "SAC Fiscal · Auditoría".
- Contenido derecho: `text-xs font-mono` con dos líneas:
  - `Impreso: {new Date().toLocaleString("es-VE")}`
  - `Usuario: {user.name} ({user.role})`.
- Las clases `hidden print:flex` ya están soportadas por Tailwind.

**Page setup:**

- `@page { size: A4; margin: 16mm 12mm; }`.
- Tabs no se imprimen (se imprime solo el tab activo). Antes de `window.print()` se puede forzar el tab que se quiere exportar.

---

## 11. Wireframes textuales (OBLIGATORIOS)

### 11.1 Wireframe 1 — Vista desktop del Command Center (tab Actas activo)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Volver]                                                                   │
│                                                                              │
│ SAC FISCAL · OPERACIONES DE REPARO                                          │
│ Centro de Mando: Actas y Expedientes                                        │
│ Vista global del cuadrante, carga de expedientes y estado del equipo.       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ACTAS    │ │EXPED.   │ │Σ CULM.  │ │Σ PROC.  │ │Σ ANUL.  │ │MONTO    │    │
│ │  1,234  │ │    567  │ │  1,000  │ │    200  │ │     34  │ │$12,540  │    │
│ │ totals  │ │asignados│ │emerald-7│ │ amber-6 │ │ amber-7 │ │font-mono│    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📜 Actas de Reparo] [📊 Control de Expedientes]                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ▸ Subir nueva acta (colapsado por default)                                  │
│                                                                              │
│ [🔍 Buscar por contribuyente, RIF, N° acta…] [↻] [⬇ XLSX] [⬇ CSV] [⚙]    │
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │CONTRIB.│RIF  │N°EXP│N°REP│IMPUESTO│TOTAL│FISC(A)│FISC(S)│OPER│PDF│ACCS│ │
│ │ ─────── │──── │──── │──── │────── │──── │────── │────── │────│───│────│ │
│ │Juan P.  │J-12…│E-21 │A-001│ISLR   │1,250│M. Ríos│L. Dáv.│ 🟢 │ ⤴ │✎⛓🗑│ │
│ │V-12345  │     │     │     │       │     │       │       │    │   │    │ │
│ │A. Mora  │J-34…│E-22 │A-002│IVA    │  890│A. Mora│C. Sol.│ 🟡 │ ⤴ │✎⛓🗑│ │
│ │V-67890  │     │     │     │       │     │       │       │    │   │    │ │
│ │... (virtualizado si >100 filas, 11 columnas totales)                    │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **MINOR #12 — math del wireframe:** Los números de los Ledger Blocks están coordinados para que **Actas totales = Σ Culm + Σ Proc + Σ Anul** (1,234 = 1,000 + 200 + 34). Esto refleja la composición real de las actas: cada acta está en exactamente uno de los tres estados (no pueden sumar más ni menos que el total). El bloque "Expedientes asignados" (567) es una vista agregada independiente — no se suma a las actas porque un expediente puede tener 0, 1 o N actas. **El monto** ($12,540) tampoco cuadra con los conteos porque `montoTotal` viene de `listRepairReportsResumen` y se trunca al límite de 250 items (ver §3.3.1). El wireframe usa estos números solo a modo ilustrativo; los valores reales dependerán de la data en producción.

### 11.2 Wireframe 2 — Tab Control de Expedientes, vista Cards (mobile-friendly)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Año [2025 ▾]  [Tarjetas|📊]   [🔍 buscar funcionario…]    [↻] [⬇ Excel]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐    │
│ │ María Ríos                       Casos  Progreso 32 CULM / 8 PROC   │    │
│ │ CI 12.345.678 · Coord. A          42   ████████░░ (mini-barra)      │    │
│ │                                            Σ Culm: 32 Σ Proc: 8     │    │
│ │  VDF 18 / AF 24                                                ⚲ obs. │    │
│ └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐    │
│ │ Andrés Mora                     Casos  Progreso 28 CULM / 14 PROC  │    │
│ │ CI 18.765.432 · Coord. B          42   ██████░░░░ (mini-barra)      │    │
│ │                                            Σ Culm: 28 Σ Proc: 14    │    │
│ │  VDF 12 / AF 30                                                ⚲ obs. │    │
│ └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐    │
│ │ TOTAL                        84   │ CULM 60 (emerald-7) │ PROC 22 │ VDF 30 │ AF 54│    │
│ └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Wireframe 3 — Mobile (< 768px), tab Actas

```
┌─────────────────────────────┐
│ [←]                          │
│ SAC FISCAL · OPER. REPARO    │
│ Centro de Mando: Actas y     │
│   Expedientes                │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ ACTAS TOTALES           │ │
│ │ 1,234                   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ EXPEDIENTES ASIGNADOS   │ │
│ │ 567                     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Σ CULMINADOS            │ │
│ │ 1,000 (emerald-700)     │ │
│ └─────────────────────────┘ │
│ ... (6 bloques, 1 col)      │
├─────────────────────────────┤
│ [📜 Actas][📊 Expedientes] │
├─────────────────────────────┤
│ ▸ Subir nueva acta           │
│ [🔍 buscar…]                │
│ Tabla con scroll horizontal  │
│ (sticky header)              │
└─────────────────────────────┘
```

---

## 12. Mapeo skill → decisión

| Decisión de diseño | Skill que la origina | Sección de la skill |
|---|---|---|
| **Filosofía anti-slop:** no usar glassmorphism, gradientes AI, ni cards con shadow para datos. Mantener un solo sistema (el del proyecto). | `design-taste-frontend` | §4.4, §4.7, §5 |
| **Coherencia con tokens existentes** (slate/indigo/amber/emerald, `border-border/60`, `text-[10px] uppercase tracking-wide`, `tabular-nums`). | `design-taste-frontend` | §0, §4.1-4.2 |
| **Contraste WCAG AA/AAA verificado en light + dark.** | `design-taste-frontend` | §6.C, §8 |
| **Pre-flight check:** una sola paleta por página, no emoji decorativo, no radiuses mezclados, labels con `uppercase tracking` solo donde el sistema ya los usa (no agregar nuevos). | `design-taste-frontend` | §4.7 (eyebrow restraint, shape lock) |
| **Microinteracciones justas:** focus rings visibles, hover tactile (`-translate-y-[1px]` o `scale-[0.98]` en active), preferir transform/opacity. | `emil-design-eng` | (resumen de la skill — focus on the invisible details) |
| **Sparkline con `motion.path` + `pathLength: 0 → 1`** para revelar datos sin distraer. | `animation-designer` + `emil-design-eng` | (transición de chart) — *Reservado para v1.2 cuando backend exponga `progresionMensual`; en v1.1 se omite (HIGH #3).* |
| **Cross-fade en cambio de tab con `mode="wait"`** y duración ≤ 200ms. | `animation-designer` | (transitions spec) |
| **Respeto a `prefers-reduced-motion`** en todas las animaciones. | `design-taste-frontend` + `animation-designer` | §6.B |
| **Bento grid en cards de fiscal** (mezcla de tamaños con sparkline + barras + métricas inline). | `minimalist-ui` | (bento pattern) |
| **Jerarquía editorial:** uppercase tracking-wide para labels, `text-3xl tabular-nums tracking-tight` para métricas. | `minimalist-ui` | (typographic hierarchy) |
| **Tactile feedback:** `-translate-y-[1px]` en `:active` para botones primarios (subir acta, aplicar filtros). | `emil-design-eng` | (invisible details) |
| **Print stylesheet con page-break-inside: avoid** en cards de fiscal. | `design-taste-frontend` | §4.5 (no aplica directo, pero coherente con el principio de "shapes match final layout" del skeleton pattern) |

---

## 13. Out-of-scope explícito

Para evitar scope creep en la implementación:

- **No** se rediseña la paleta ni se introducen nuevos colores.
- **No** se introducen nuevos componentes UI (todo se compone de `Card`, `Button`, `Input`, `Label`, `Select`, `Dialog`, `Sheet`, `Table`, `Badge`, `Skeleton`, `Tabs` ya existentes).
- **No** se modifica `gestion-personal-page-v2.tsx`. La página `/gestion-actas` es un **archivo nuevo** que importa los sub-componentes refactorizados. La pestaña "Actas" en `/gestion-personal` queda apuntando a la versión anterior hasta que se decida migrarla (fuera del scope de esta guía).
- **No** se definen APIs ni endpoints. Esta guía es puramente visual.
- **No** se cubren las vistas de "Fiscal" y "Coordinador" que filtren el contenido según rol. La página `/gestion-actas` hereda las mismas reglas de acceso que `/gestion-personal` (ADMIN).

### 13.1 Refactorización autorizada (CRÍTICO #1 + MEDIUM #9)

> **Decisión final (alineada con el plan v3.1):** La refactorización de `ReparosActasSection` y `CasosPorFiscalSection` **SÍ está autorizada** y forma parte del scope de las sub-tareas del plan v3.1:
>
> | Componente | Sub-tareas del plan v3.1 | Ajustes visuales que esta guía prescribe |
> |---|---|---|
> | `ReparosActasSection` | **TASK-004a** extracción del dropzone y formulario de metadatos · **TASK-004b** extracción del Sheet de filtros · **TASK-004c** virtualización, banner de concurrencia, print stylesheet, dialog de edición | §4.1.1 (dropzone con `react-dropzone`), §4.1.2 (11 columnas), §4.1.3 (Sheet de filtros), §4.1.4 (3 dialogs), §8 (warning de concurrencia), §10 (print) |
> | `CasosPorFiscalSection` | **TASK-005a** promoción de `year` a prop controlada · **TASK-005b** refactor de `CasoFiscalTarjeta` con mini-barra estática · **TASK-005c** print stylesheet, virtualización de tabla > 50 filas | §4.2.1 (filtros sticky), §4.2.2 (vista Cards con mini-barra), §4.2.3 (vista Tabla 20 columnas), §10 (print) |
>
> Esta guía **no prescribe la arquitectura de la refactorización** (eso es trabajo de implementación y revisión de código), sino que **fija los ajustes visuales y de comportamiento** que la refactorización debe entregar. Cualquier divergencia entre lo que el código refactorizado produce y lo que esta guía describe se resuelve **a favor de la guía** (con excepción de los follow-ups documentados: `updatedAt` real, `progresionMensual`, endpoint paginado de `/reparos`).

---

## 14. Checklist de aceptación visual

Antes de dar por terminada la implementación, verificar:

- [ ] Header: BackButton, eyebrow, h1, descripción con estilos exactos del §3.2.
- [ ] 6 Ledger Blocks en grid responsive, sin shadows, con label uppercase y número `text-3xl tabular-nums`. **Σ Culm. usa `emerald-700 dark:emerald-400`** (HIGH #7, diferenciador).
- [ ] Banner "Mostrando hasta 250 actas" si `listRepairReportsResumen` retorna el límite (HIGH #4).
- [ ] Tabs con icono lucide, orden Actas → Expedientes (MINOR #11 documentado).
- [ ] Tab Actas: dropzone colapsable implementado con `useDropzone` (no HTML manual, MEDIUM #10), pulse en drag **solo si `!prefers-reduced-motion`** (MEDIUM #8), picker de fiscal/supervisor como Card (no Select), tabla con **11 columnas** (HIGH #5) y sticky header `bg-muted/95`, badges emerald/amber.
- [ ] Tab Actas: Sheet de filtros a la derecha con los 5 controles.
- [ ] Tab Actas: **3 dialogs** (Edición, Vinculación, Eliminación) — no hay dialog "Subir PDF" (HIGH #6).
- [ ] Tab Actas: banner de concurrencia basado en `fechaNotificado` con tolerancia de 5 min, `role="alert"`, botón guardar deshabilitado hasta "Recargar" (CRÍTICO #2 + MEDIUM #8).
- [ ] Tab Expedientes: filtros sticky arriba (Año, Toggle, Búsqueda, Actualizar, Excel).
- [ ] Tab Expedientes: vista Cards con **mini-barra estática** (emerald/amber, sin sparkline — HIGH #3), fila TOTAL al final con `Σ Culm.` en `emerald-700`.
- [ ] Tab Expedientes: vista Tabla con 20 columnas, sticky header, fila de totales, virtualización si > 50 filas.
- [ ] Skeletons replican la forma final (no spinners circulares en estas vistas).
- [ ] Animaciones respetan `prefers-reduced-motion` en TODA la página.
- [ ] A11y: `aria-live="polite"` en dropzone, `aria-busy` en listados virtualizados, `role="alert"` en banner de concurrencia (MEDIUM #8).
- [ ] Contraste WCAG AA/AAA verificado en light y dark para todas las combinaciones del §9 (incluida la nueva fila `emerald-700`).
- [ ] `data-testid` siguiendo el namespace del §7 (con fallback `expedientes-card-{index}` documentado en MINOR #13).
- [ ] Print stylesheet oculta controles, muestra header de auditoría, fuerza A4.
- [ ] Refactor de `ReparosActasSection` (TASK-004a/b/c) y `CasosPorFiscalSection` (TASK-005a/b/c) entregado según §13.1.
