# Accesibilidad — `/gestion-actas`

## Estándar

WCAG 2.1 AA. Verificado con axe-core (build gate en CI) y revisión manual con NVDA/VoiceOver.

## Patrones aplicados

### Roles ARIA
- Tabs: `role="tablist"`, `role="tab"`, `role="tabpanel"` (vía componente Tabs Radix)
- Grid virtualizado: `role="grid"`, `aria-rowcount`, `aria-rowindex`, `aria-colcount`
- Dialogs: `role="dialog"`, `aria-labelledby`, `aria-describedby` (vía Radix Dialog)
- Banners: `role="status"` (info) o `role="alert"` (warning/error)
- Menus: `role="menu"`, `role="menuitem"` (vía Radix DropdownMenu)

### Live regions
- `aria-live="polite"` en paginación de Actas (anuncia cambio de página)
- `aria-live="polite"` en dropzone de upload (anuncia "PDF cargado" / "PDF inválido")
- `aria-busy={loading}` en listados virtualizados

### Navegación por teclado
- **Tabs**: Tab para entrar/salir, flechas izquierda/derecha para cambiar tab, Home/End para primer/último.
- **Grid virtualizado**: arrow keys para mover entre celdas, PageUp/PageDown/Home/End para scroll, type-ahead para búsqueda por fiscal.
- **Dialogs**: Esc para cerrar, Tab para navegar focus trap, Enter para submit.
- **Disclosure**: Enter/Space para toggle, focus visible.

### Focus visible
- `focus-visible:ring-2` global vía Tailwind config.
- Ningún `outline: none` sin alternativa de focus ring.

### Reduced motion
- Hook centralizado `usePrefersReducedMotion()` en `src/hooks/use-prefers-reduced-motion.ts`.
- Respeta `prefers-reduced-motion: reduce` en: Ledger Blocks stagger, cambio de tab cross-fade, hover de filas, drag-pulse del dropzone, sparklines.
- Sin animaciones durante carga inicial si el usuario lo prefiere.

### Contraste
- Slate sobre white: 7.2:1 (AAA)
- Indigo-600 sobre white: 5.1:1 (AA)
- Amber-600 sobre white: 3.4:1 (AA Large)
- Emerald-600 sobre white: 4.7:1 (AA)
- Verificado en light y dark mode.

## Build gate

`axe-core` se ejecuta en cada PR vía Playwright (`tests/gestion-actas.a11y.spec.ts`). Cero violaciones `serious` o `critical` requeridas para merge.

## Tests manuales recomendados

- Lectura con NVDA en Windows
- Lectura con VoiceOver en macOS
- Tab-only navigation (sin mouse)
- Modo high contrast Windows
- 200% zoom en el navegador
