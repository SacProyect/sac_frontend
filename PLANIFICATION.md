Planificación de Cambios Realizados

1. Nuevo Componente: FiscalDashboard.tsx
   - Ubicación: src/components/fiscal-review/FiscalDashboard.tsx
   - Funcionalidad:
     - Muestra una barra con tres botones interactivos: "Contribuyentes", "Procesos Activos" y "Completados".
     - Al hacer clic en cada botón, realiza llamadas a las rutas backend correspondientes para obtener la lista filtrada de contribuyentes relacionados con un fiscal específico.
     - Utiliza el componente TaxpayerList para mostrar la lista sencilla de contribuyentes acorde a la plataforma.
     - Maneja estados de carga y errores con notificaciones.

2. Funciones API para Backend
   - Ubicación: src/components/utils/api/fiscalReviewApi.ts
   - Funciones:
     - getActiveProcesses(fiscalId): Llama a la ruta /processes/active con filtro por fiscal.
     - getCompletedProcesses(fiscalId): Llama a la ruta /processes/completed con filtro por fiscal.

3. Modificación en TaxpayerList.tsx
   - Ajuste para aceptar la lista de contribuyentes como prop opcional.
   - Evita errores de tipos al recibir datos desde FiscalDashboard.

4. Pendientes y Recomendaciones
   - Instalar dependencias y tipos de React para evitar errores de compilación:
     - npm install react react-dom
     - npm install --save-dev @types/react @types/react-dom
   - Ajustar el tipo FiscalInfo para que coincida con las props que se pasan a TaxpayerList.
   - Realizar pruebas funcionales en el componente FiscalDashboard para verificar la correcta interacción y visualización de datos.

Este plan asegura que la parte del menú con números sea interactiva y muestre las listas correspondientes relacionadas a cada fiscal y sus contribuyentes, cumpliendo con la solicitud del usuario.
