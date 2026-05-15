# Documentacion de Feature Flags (FF) - SAC Frontend

## Fecha de actualizacion
- **2026-05-04**

## Objetivo
Mantener una referencia centralizada y detallada de las FF activas del proyecto para saber:
- Que funcionalidades estan habilitadas o deshabilitadas por entorno.
- Que partes del codigo dependen de cada flag.
- En que lineas de trabajo esta avanzando actualmente el equipo.

## Fuente de verdad tecnica
- Archivo principal: `src/config/feature-flags.ts`
- Funcion comun de parseo: `normalizeBooleanFlag(value, defaultValue)`
- Valores aceptados como `true`: `1`, `true`, `yes`, `on`
- Valores aceptados como `false`: `0`, `false`, `no`, `off`

## Inventario de Feature Flags

### 1) Notificaciones
- **Variable de entorno:** `VITE_NOTIFICATIONS_ENABLED`
- **Constante de app:** `isNotificationsFeatureEnabled`
- **Default en codigo:** `true`
- **Valor actual en `.env` local:** `false`
- **Estado funcional actual:** Deshabilitada en entorno local.
- **Impacto principal en UI y API:**
  - Se oculta/restringe la navegacion a notificaciones.
  - Se evita inicializar sockets y llamadas API relacionadas a notificaciones.
- **Uso detectado en codigo:**
  - `src/hooks/use-notifications.tsx`
  - `src/components/settings/notifications-tab-v2.tsx`
  - `src/components/settings/escalation-config-tab.tsx`
  - `src/components/utils/api/notifications-functions.ts`
  - `src/pages/Settings/settings-page-v2.tsx`
  - `src/pages/router.tsx`
  - `src/config/nav-strategies.ts`
- **Trabajo en curso asociado:** Endurecimiento del gating para que toda la experiencia de notificaciones quede protegida por FF en UI, rutas y consumo de servicios.

### 2) Auditoria Interna
- **Variable de entorno:** `VITE_INTERNAL_AUDIT_ENABLED`
- **Constante de app:** `isInternalAuditFeatureEnabled`
- **Default en codigo:** `false`
- **Valor actual en `.env` local:** `false`
- **Estado funcional actual:** Deshabilitada en entorno local.
- **Impacto principal en UI:**
  - Se bloquea acceso por ruta cuando la FF esta desactivada.
  - Se filtran entradas de navegacion relacionadas.
- **Uso detectado en codigo:**
  - `src/pages/router.tsx`
  - `src/config/nav-strategies.ts`
- **Trabajo en curso asociado:** Preparacion de release controlado por FF para evitar exposicion prematura del modulo.

### 3) Dashboard de Contribuyente
- **Variable de entorno:** `VITE_TAXPAYER_DASHBOARD_ENABLED`
- **Constante de app:** `isTaxpayerDashboardFeatureEnabled`
- **Default en codigo:** `false`
- **Valor actual en `.env` local:** `true`
- **Estado funcional actual:** Habilitada en entorno local.
- **Impacto principal en UI y rutas:**
  - Activa navegacion y render condicional de vistas asociadas al dashboard del contribuyente.
- **Uso detectado en codigo:**
  - `src/pages/router.tsx`
  - `src/pages/reports/taxpayer-report-page.tsx` (lectura directa de `import.meta.env`)
- **Trabajo en curso asociado:** Consolidar el uso de la FF en una sola fuente (`src/config/feature-flags.ts`) para evitar divergencias de comportamiento.

## Estado actual consolidado (.env local)
- `VITE_NOTIFICATIONS_ENABLED='false'`
- `VITE_INTERNAL_AUDIT_ENABLED='false'`
- `VITE_TAXPAYER_DASHBOARD_ENABLED='true'`

## Recomendaciones operativas
1. Centralizar todas las lecturas de FF en `src/config/feature-flags.ts`.
2. Evitar lecturas directas de `import.meta.env` para FF en componentes/paginas.
3. Mantener esta documentacion actualizada en cada cambio de FF (alta, baja o cambio de default).
4. Agregar en PR una nota corta indicando el impacto funcional de la FF modificada.

## Historial de cambios de esta documentacion
- **2026-05-04:** Creacion inicial del inventario detallado de FF activas, estado local y frentes de trabajo.
