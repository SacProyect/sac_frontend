# 🔍 Guía de Revisión de Páginas V2

## 🚀 Cómo Revisar Cada Página V2

### Paso 1: Iniciar el Servidor
```powershell
cd sac_frontend
pnpm dev
```

El servidor debería iniciar en `http://localhost:5173`

### Paso 2: Acceder a las Rutas V2

**IMPORTANTE**: Todas las rutas V2 requieren autenticación EXCEPTO:
- `/login/v2` - Login V2 (sin autenticación)
- `/v2-preview/admin` - Preview sin autenticación (temporal)

---

## 📋 LISTA COMPLETA DE PÁGINAS V2

### 1. 🔐 Autenticación
**Ruta**: `http://localhost:5173/login/v2`
- ✅ Verificar diseño moderno con branding lateral
- ✅ Verificar formulario de login
- ✅ Verificar toggle de visibilidad de contraseña
- ✅ Verificar manejo de errores
- ✅ Verificar redirección después del login

**Cómo acceder**: Directamente en el navegador (no requiere login)

---

### 2. 🏠 Administración
**Ruta**: `http://localhost:5173/v2/admin`
- ✅ Verificar filtros (búsqueda, año, estado)
- ✅ Verificar contadores (Total, Especiales, Ordinarios, Activos)
- ✅ Verificar tabla con acciones (Editar, Borrar)
- ✅ Verificar modales de acción rápida (Agregar Contribuyente, Multa, Aviso)
- ✅ Verificar diseño dark mode
- ✅ Verificar responsive (móvil/tablet/desktop)

**Cómo acceder**: Después de hacer login, navegar a `/v2/admin` o usar el sidebar

---

### 3. ⚙️ Ajustes
**Ruta**: `http://localhost:5173/v2/settings`
- ✅ Verificar Tab "Mi Perfil" (Foto, Nombre, Rol, Cédula, Email, Teléfono)
- ✅ Verificar Tab "Seguridad" (Cambio de contraseña con validaciones)
- ✅ Verificar Tab "Notificaciones" (Switches para todas las notificaciones)
- ✅ Verificar navegación entre tabs
- ✅ Verificar guardado de cambios

**Cómo acceder**: Después de hacer login, navegar a `/v2/settings` o usar el sidebar

---

### 4. 📊 Estadísticas Globales
**Ruta**: `http://localhost:5173/v2/stats`
- ✅ Verificar dashboard con KPIs
- ✅ Verificar gráficos de recaudación mensual
- ✅ Verificar distribución de cumplimiento
- ✅ Verificar leaderboards (fiscales, supervisores)
- ✅ Verificar selector de año
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/stats` o usar el sidebar

---

### 5. 📈 Estadísticas de Fiscal
**Ruta**: `http://localhost:5173/v2/stats/fiscal/:fiscalId`
**Ejemplo**: `http://localhost:5173/v2/stats/fiscal/123` (reemplaza 123 con un ID real)
- ✅ Verificar estadísticas individuales por fiscal
- ✅ Verificar gráfico de desempeño vs meta
- ✅ Verificar alertas y VDF status
- ✅ Verificar ranking del fiscal
- ✅ Verificar botón de volver

**Cómo acceder**: 
1. Ir a `/v2/fiscal-review`
2. Hacer clic en un fiscal
3. O navegar directamente con un ID válido

---

### 6. 📋 Tabla Censo
**Ruta**: `http://localhost:5173/v2/census`
- ✅ Verificar tabla de contribuyentes censados
- ✅ Verificar filtros de búsqueda
- ✅ Verificar contadores (Total, Especiales, Ordinarios)
- ✅ Verificar acciones de eliminación (solo ADMIN)
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/census` o usar el sidebar

---

### 7. 👤 Detalle de Contribuyente
**Ruta**: `http://localhost:5173/v2/taxpayer/:taxpayer`
**Ejemplo**: `http://localhost:5173/v2/taxpayer/123` (reemplaza 123 con un RIF o ID real)
- ✅ Verificar estadísticas individuales
- ✅ Verificar botones de acción rápida con permisos
- ✅ Verificar tabs para historial (Multas, IVA, ISLR)
- ✅ Verificar navegación entre tabs
- ✅ Verificar botón de volver

**Cómo acceder**: 
1. Ir a `/v2/admin`
2. Hacer clic en "Ver" en un contribuyente
3. O navegar directamente con un RIF/ID válido

---

### 8. ✅ Revisión Fiscal
**Ruta**: `http://localhost:5173/v2/fiscal-review`
- ✅ Verificar lista de fiscales con búsqueda
- ✅ Verificar estadísticas (Total, Fiscales Activos, Supervisores)
- ✅ Verificar navegación a estadísticas individuales
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/fiscal-review` o usar el sidebar

---

### 9. 📝 Observaciones
**Ruta**: `http://localhost:5173/v2/observations/:taxpayerId`
**Ejemplo**: `http://localhost:5173/v2/observations/123` (reemplaza 123 con un ID real)
- ✅ Verificar formulario de nueva observación
- ✅ Verificar lista de observaciones con edición/eliminación
- ✅ Verificar validaciones de formulario
- ✅ Verificar botón de volver

**Cómo acceder**: 
1. Ir a `/v2/taxpayer/:taxpayer`
2. Hacer clic en botón de observaciones
3. O navegar directamente con un ID válido

---

### 10. ⚠️ Multas
**Ruta**: `http://localhost:5173/v2/fine/:taxpayerId`
**Ejemplo**: `http://localhost:5173/v2/fine/123` (reemplaza 123 con un ID real)
- ✅ Verificar formulario para agregar multas
- ✅ Verificar integración con EventForm
- ✅ Verificar validaciones
- ✅ Verificar botón de volver

**Cómo acceder**: 
1. Ir a `/v2/taxpayer/:taxpayer`
2. Hacer clic en botón de multas
3. O navegar directamente con un ID válido

---

### 11. 🔔 Avisos
**Ruta**: `http://localhost:5173/v2/warning/:taxpayerId`
**Ejemplo**: `http://localhost:5173/v2/warning/123` (reemplaza 123 con un ID real)
- ✅ Verificar formulario para agregar avisos
- ✅ Verificar integración con EventForm
- ✅ Verificar validaciones
- ✅ Verificar botón de volver

**Cómo acceder**: 
1. Ir a `/v2/taxpayer/:taxpayer`
2. Hacer clic en botón de avisos
3. O navegar directamente con un ID válido

---

### 12. 💰 Pagos
**Ruta**: `http://localhost:5173/v2/payment/:taxpayerId`
**Ejemplo**: `http://localhost:5173/v2/payment/123` (reemplaza 123 con un ID real)
- ✅ Verificar formulario para registrar pagos
- ✅ Verificar integración con EventForm
- ✅ Verificar loader de pagos pendientes
- ✅ Verificar validaciones
- ✅ Verificar botón de volver

**Cómo acceder**: 
1. Ir a `/v2/taxpayer/:taxpayer`
2. Hacer clic en botón de pagos
3. O navegar directamente con un ID válido

---

### 13. 🤝 Compromisos de Pago
**Ruta**: `http://localhost:5173/v2/payment_compromise/:taxpayerId`
**Ejemplo**: `http://localhost:5173/v2/payment_compromise/123` (reemplaza 123 con un ID real)
- ✅ Verificar formulario para compromisos de pago
- ✅ Verificar integración con EventForm
- ✅ Verificar loader de pagos pendientes
- ✅ Verificar validaciones
- ✅ Verificar botón de volver

**Cómo acceder**: 
1. Ir a `/v2/taxpayer/:taxpayer`
2. Hacer clic en botón de compromisos
3. O navegar directamente con un ID válido

---

### 14. 📊 Generar Reportes
**Ruta**: `http://localhost:5173/v2/gen-reports/:taxpayer?`
**Ejemplo**: `http://localhost:5173/v2/gen-reports` o `http://localhost:5173/v2/gen-reports/123`
- ✅ Verificar búsqueda de contribuyentes
- ✅ Verificar generación de reportes individuales y por grupo
- ✅ Verificar integración con GenerateReport
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/gen-reports` o usar el sidebar

---

### 15. 💵 Contribuciones
**Ruta**: `http://localhost:5173/v2/contributions`
- ✅ Verificar estadísticas por coordinación
- ✅ Verificar filtros de fecha y supervisor
- ✅ Verificar tablas de contribuciones
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/contributions` o usar el sidebar

---

### 16. 📄 Reporte IVA
**Ruta**: `http://localhost:5173/v2/iva`
- ✅ Verificar formulario de reporte IVA
- ✅ Verificar gestión de compras, ventas y pagos
- ✅ Verificar integración con IvaForm
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/iva` o usar el sidebar

---

### 17. 📄 Reporte ISLR
**Ruta**: `http://localhost:5173/v2/islr`
- ✅ Verificar formulario de reporte ISLR
- ✅ Verificar gestión de ingresos, costos y gastos
- ✅ Verificar integración con IslrForm
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/islr` o usar el sidebar

---

### 18. 📑 Índice IVA
**Ruta**: `http://localhost:5173/v2/index-iva`
- ✅ Verificar actualización de índices IVA
- ✅ Verificar gestión de índices ordinarios y especiales
- ✅ Verificar integración con IndexIvaForm
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/index-iva` o usar el sidebar

---

### 19. 🐛 Reporte de Errores
**Ruta**: `http://localhost:5173/v2/report/errors`
- ✅ Verificar formulario de reporte de errores
- ✅ Verificar subida de imágenes (drag & drop)
- ✅ Verificar categorización de errores
- ✅ Verificar validaciones con Zod
- ✅ Verificar diseño dark mode

**Cómo acceder**: Después de hacer login, navegar a `/v2/report/errors` o usar el sidebar

---

## ✅ CHECKLIST DE VERIFICACIÓN POR PÁGINA

Para cada página, verifica:

### Diseño Visual
- [ ] Fondo oscuro (`bg-slate-950` o `bg-slate-800`)
- [ ] Texto legible (blanco/gris claro)
- [ ] Bordes con color `border-slate-700`
- [ ] Cards con estilo dark mode
- [ ] Botones con variantes correctas de shadcn
- [ ] Inputs con estilo dark mode
- [ ] Tablas con estilo dark mode

### Componentes
- [ ] Usa componentes shadcn correctamente
- [ ] Estados de carga (`LoadingState`)
- [ ] Estados de error (`ErrorState`)
- [ ] Estados vacíos (`EmptyState`)
- [ ] Headers de página (`PageHeader`)
- [ ] Botones de volver (`BackButton`)

### Funcionalidad
- [ ] Formularios con validaciones
- [ ] Botones con estados de carga
- [ ] Manejo de errores
- [ ] Navegación funciona correctamente
- [ ] Modales se abren/cierran correctamente
- [ ] Filtros funcionan
- [ ] Búsquedas funcionan

### Responsive
- [ ] Se ve bien en móvil
- [ ] Se ve bien en tablet
- [ ] Se ve bien en desktop
- [ ] Sidebar se oculta en móvil
- [ ] Tablas son responsive

---

## 🎯 ORDEN SUGERIDO DE REVISIÓN

1. **Login V2** (`/login/v2`) - Sin autenticación
2. **Admin V2** (`/v2/admin`) - Página principal
3. **Settings V2** (`/v2/settings`) - Configuración
4. **Stats V2** (`/v2/stats`) - Dashboard
5. **Census V2** (`/v2/census`) - Tabla
6. **Fiscal Review V2** (`/v2/fiscal-review`) - Lista
7. **Taxpayer Detail V2** (`/v2/taxpayer/:id`) - Detalle
8. **Eventos** (Fine, Notice, Payment, Comitment) - Formularios
9. **Reportes** (Reports, Contributions, IVA, ISLR, Index IVA) - Reportes
10. **Errors V2** (`/v2/report/errors`) - Formulario especial

---

## 💡 TIPS PARA LA REVISIÓN

1. **Abre la consola del navegador** (F12) para ver errores
2. **Revisa el Network tab** para ver llamadas a la API
3. **Prueba en diferentes tamaños de pantalla** (responsive)
4. **Prueba con diferentes roles** (ADMIN, COORDINATOR, FISCAL)
5. **Toma screenshots** de cada página para documentar
6. **Anota errores o problemas** que encuentres

---

## 🐛 SI ENCUENTRAS PROBLEMAS

1. **Anota la URL exacta** donde ocurre el problema
2. **Toma un screenshot** del error
3. **Copia el error de la consola** (F12 → Console)
4. **Describe qué estabas haciendo** cuando ocurrió
5. **Indica qué debería pasar** vs qué está pasando

---

## 📝 NOTAS

- Todas las rutas V2 están bajo `/v2/*`
- Las rutas V2 coexisten con las originales
- El sidebar V2 tiene enlaces a todas las páginas V2
- Algunas rutas requieren parámetros (IDs) que debes obtener de otras páginas
