# SAC - Interface de Gestión Tributaria 🏛️

Frontend del **Sistema de Administración Central (SAC)**. Una plataforma robusta diseñada para la visualización y gestión de procesos tributarios complejos.

## 🚀 Stack Tecnológico
- **Framework:** React (Vite) + TypeScript
- **Estilos:** Tailwind CSS
- **Herramientas de IA:** v0 & Vercel
- **Estado & API:** React Query / Axios


## 📚 Documentación del Proyecto

- [`docs/controles-ingreso.md`](docs/controles-ingreso.md) — Flujo de generación de documentos, UX de creación, requisitos técnicos y decisiones de arquitectura del módulo Controles de Ingreso.
- [`docs/migracion-gestion-actas.md`](docs/migracion-gestion-actas.md) — Proceso de flip del feature flag `VITE_ACTAS_EXPEDIENTES_ENABLED` y plan de migración del módulo Actas de Reparo / Control de Expedientes.

## 🛡️ Páginas Admin

### Centro de Mando: Actas y Expedientes (`/gestion-actas`)

Página admin-only con UI renovada para la gestión integral de Actas de Reparo y Control de Expedientes. Reemplaza (por feature flag) la experiencia clásica disponible en `/gestion-personal`.

- **Acceso:** solo administradores (rol `ADMIN`).
- **Feature flag:** `VITE_ACTAS_EXPEDIENTES_ENABLED` (default `false`). Mientras esté en `false`, el router redirige a `/gestion-personal`.
- **Activación:** ver [`docs/migracion-gestion-actas.md`](docs/migracion-gestion-actas.md) para el proceso completo de flip (pre-flight, smoke test post-deploy, rollback).
- **Componentes:** [`src/components/gestion-actas/`](src/components/gestion-actas/) — Shell, `ActasTab`, `ExpedientesTab`, `CommandCenterMetrics` y utilidades compartidas.
- **Plan y métricas:** [`plans/gestion-actas-migration.md`](plans/gestion-actas-migration.md).
- **Accesibilidad:** [`plans/accesibilidad.md`](plans/accesibilidad.md) — WCAG 2.1 AA, build gate con axe-core en CI.
- **Tests E2E:** `tests/gestion-actas.spec.ts` (smoke), `tests/gestion-actas.a11y.spec.ts` (axe), `tests/gestion-actas.concurrency.spec.ts` (warning de edición concurrente).
- **Helpers de test:** `tests/gestion-actas.helpers.ts` — mock data de actas/expedientes y setup de auth/API.

## 🔒 Propiedad Intelectual
**Copyright (c) 2026 Gabriel Longa. Todos los derechos reservados.**

Este repositorio contiene la lógica de interfaz y diseño desarrollada íntegramente por **Gabriel Longa**. Queda prohibida la reproducción, copia o distribución de este código sin autorización previa. El sistema cuenta con registro de patente vigente.

---
*Desarrollado por [Gabriel Longa](https://github.com/gabo3454675)*
