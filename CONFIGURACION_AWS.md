# ☁️ Configuración para AWS - SAC V2.0

## 📋 Verificación de Sincronización con Backend AWS

### ✅ Estado de Verificación

#### 1. Configuración de API ✅
- ✅ **Todos los componentes V2 usan `apiConnection`**
- ✅ **No hay llamadas `fetch()` directas en V2**
- ✅ **No hay URLs hardcodeadas** (localhost, IPs, etc.)
- ✅ **Endpoints son relativos** (usan `/taxpayer`, `/user`, etc.)

#### 2. Endpoints Verificados ✅

Todos los componentes V2 usan los siguientes endpoints (relativos):

**Autenticación:**
- `POST /user` - Login
- `GET /user/all/` - Obtener funcionarios
- `PATCH /user/update-password/:id` - Cambiar contraseña

**Contribuyentes:**
- `GET /taxpayer` - Listar contribuyentes
- `POST /taxpayer` - Crear contribuyente
- `PUT /taxpayer/update-taxpayer/:id` - Actualizar contribuyente
- `DELETE /taxpayer/:id` - Eliminar contribuyente
- `GET /taxpayer/get-iva/:taxpayerId?` - Obtener reportes IVA
- `GET /taxpayer/get-islr/:taxpayerId?` - Obtener reportes ISLR

**Eventos:**
- `POST /taxpayer/create-event` - Crear evento (multa, aviso, compromiso)
- `GET /taxpayer/get-events/:taxpayerId?` - Obtener eventos

**Observaciones:**
- `POST /taxpayer/create-observation` - Crear observación
- `GET /taxpayer/get-observations/:taxpayerId` - Obtener observaciones
- `PUT /taxpayer/update-observation/:id` - Actualizar observación
- `DELETE /taxpayer/delete-observation/:id` - Eliminar observación

**Reportes:**
- `GET /reports/fine/:taxpayerId?` - Historial de multas
- `GET /reports/payments/:taxpayerId?` - Historial de pagos
- `GET /reports/get-fiscal-info/:id` - Información del fiscal
- `GET /reports/get-fiscal-taxpayers/:id` - Contribuyentes del fiscal
- `GET /reports/get-global-performance` - Rendimiento global
- `GET /reports/get-group-performance` - Rendimiento por grupo
- `GET /reports/get-global-kpi` - KPIs globales
- `GET /reports/get-contributions` - Contribuciones

**Censo:**
- `GET /taxpayer-census` - Listar censo
- `DELETE /taxpayer-census/:id` - Eliminar del censo

**Índice IVA:**
- `POST /taxpayer/create-index-iva` - Crear índice IVA
- `PUT /taxpayer/modify-individual-index-iva/:taxpayerId` - Modificar índice individual

**Errores:**
- `POST /errors` - Reportar error

---

## 🔧 Configuración para AWS

### Paso 1: Configurar Variable de Entorno

**En tu instancia AWS, crear archivo `.env` en `sac_frontend/`:**

```env
VITE_BASE_URL=https://api.tudominio.com
```

**O si tu backend está en un subdominio específico:**

```env
VITE_BASE_URL=https://backend.tudominio.com
```

**O si usas una IP pública de AWS:**

```env
VITE_BASE_URL=https://54.123.45.67:3000
```

### Paso 2: Verificar Backend en AWS

#### 2.1. Verificar que el Backend esté Corriendo

```bash
# SSH a tu instancia AWS
ssh -i tu-key.pem ubuntu@tu-instancia-aws.com

# Verificar que el backend esté corriendo
cd sac_backend
pm2 list  # Si usas PM2
# O
ps aux | grep node  # Verificar procesos Node
```

#### 2.2. Verificar Accesibilidad del Backend

```bash
# Desde tu máquina local, probar:
curl https://api.tudominio.com/health
# O
curl https://api.tudominio.com/user/all/
```

#### 2.3. Verificar CORS

Asegúrate de que el backend permita requests desde tu dominio de frontend:

```typescript
// En tu backend (sac_backend/index.ts o similar)
app.use(cors({
  origin: [
    'https://tudominio.com',
    'https://www.tudominio.com',
    'http://localhost:5173' // Para desarrollo
  ],
  credentials: true
}));
```

### Paso 3: Base de Datos - Migraciones

#### ✅ Verificación: No se Requieren Nuevas Migraciones

**Análisis del Schema:**
- ✅ V2.0 es **solo un rediseño visual del frontend**
- ✅ **No hay cambios en el schema de Prisma**
- ✅ **No hay nuevas tablas o campos**
- ✅ Los componentes V2 usan los mismos endpoints que V1

**Conclusión:** Si tu base de datos en AWS ya está actualizada con las migraciones existentes, **no necesitas correr migraciones adicionales**.

#### Si Necesitas Verificar Migraciones:

```bash
# SSH a tu instancia AWS
cd sac_backend

# Verificar estado de migraciones
npx prisma migrate status

# Si hay migraciones pendientes (no debería haberlas para V2):
npx prisma migrate deploy
```

### Paso 4: Build con URL de Producción

```bash
cd sac_frontend

# 1. Crear .env con URL de AWS
echo "VITE_BASE_URL=https://api.tudominio.com" > .env

# 2. Verificar que se creó correctamente
cat .env

# 3. Build
npm run build

# 4. Verificar que el build se generó
ls -la dist/
```

### Paso 5: Desplegar Frontend a AWS

#### Opción A: S3 + CloudFront (Recomendado)

```bash
# 1. Subir contenido de dist/ a S3
aws s3 sync dist/ s3://tu-bucket-sac-frontend/ --delete

# 2. Invalidar cache de CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

#### Opción B: Servidor Web (Nginx/Apache)

```bash
# 1. Copiar dist/ al servidor
scp -r dist/* ubuntu@tu-instancia-aws.com:/var/www/sac-frontend/

# 2. Configurar Nginx
sudo nano /etc/nginx/sites-available/sac-frontend
```

**Configuración Nginx ejemplo:**

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /var/www/sac-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🧪 Pruebas Post-Despliegue en AWS

### 1. Verificar Conexión con Backend

Abre la consola del navegador (F12) y verifica:

```javascript
// Debería mostrar la URL de producción
console.log(import.meta.env.VITE_BASE_URL)
// Resultado esperado: "https://api.tudominio.com"
```

### 2. Probar Endpoints

```bash
# Desde el navegador, verificar que las peticiones van a AWS:
# Network tab → Ver que las requests van a:
# https://api.tudominio.com/taxpayer
# https://api.tudominio.com/user
# etc.
```

### 3. Probar Funcionalidades Críticas

- [ ] Login funciona
- [ ] Crear contribuyente funciona
- [ ] Crear aviso funciona
- [ ] Crear multa funciona
- [ ] Estadísticas cargan
- [ ] Reportes funcionan

---

## ⚠️ Problemas Comunes y Soluciones

### Problema: "Network Error" o "CORS Error"

**Causa**: Backend no permite requests desde el dominio del frontend.

**Solución**:
1. Verificar configuración CORS en el backend
2. Agregar el dominio del frontend a la lista de orígenes permitidos
3. Reiniciar el backend

### Problema: "401 Unauthorized"

**Causa**: Token de autenticación no se está enviando correctamente.

**Solución**:
1. Verificar que `apiConnection` tenga el interceptor de tokens
2. Verificar que el token se guarde en `localStorage` como `authToken`
3. Verificar formato del token en el backend

### Problema: "404 Not Found" en endpoints

**Causa**: URL base incorrecta o endpoints mal configurados.

**Solución**:
1. Verificar `.env` tiene `VITE_BASE_URL` correcto
2. Verificar que el build se hizo DESPUÉS de configurar `.env`
3. Verificar que los endpoints en el código sean relativos (empiezan con `/`)

### Problema: Datos no cargan

**Causa**: Backend no está accesible o base de datos no conectada.

**Solución**:
1. Verificar que el backend esté corriendo en AWS
2. Verificar conectividad de base de datos
3. Verificar logs del backend para errores

---

## 📊 Resumen de Endpoints por Componente V2

| Componente V2 | Endpoints Usados |
|---------------|------------------|
| `LoginPageV2` | `POST /user` |
| `AdminPageV2` | `GET /taxpayer`, `POST /taxpayer`, `DELETE /taxpayer/:id` |
| `AddContribuyenteModalV2` | `POST /taxpayer` |
| `AddAvisoModalV2` | `POST /taxpayer/create-event` (type: warning) |
| `AddMultaModalV2` | `POST /taxpayer/create-event` (type: fine) |
| `CensusTablePageV2` | `GET /taxpayer-census`, `DELETE /taxpayer-census/:id` |
| `FiscalReviewPageV2` | `GET /taxpayer/get-fiscals-for-review` |
| `ObservationsPageV2` | `GET /taxpayer/get-observations/:id`, `POST /taxpayer/create-observation`, `PUT /taxpayer/update-observation/:id`, `DELETE /taxpayer/delete-observation/:id` |
| `StatsDashboardV2` | `GET /reports/get-global-performance`, `GET /reports/get-global-kpi`, `GET /reports/get-group-performance` |
| `FiscalStatsDashboardV2` | `GET /reports/get-fiscal-info/:id`, `GET /reports/get-fiscal-monthly-performance/:id` |
| `ContributionsPageV2` | `GET /reports/get-contributions` |
| `SettingsPageV2` | `PATCH /user/update-password/:id` |
| `ErrorsReportV2` | `POST /errors` |

---

## ✅ Checklist Pre-Despliegue AWS

- [ ] Backend corriendo en AWS y accesible
- [ ] CORS configurado para permitir requests del frontend
- [ ] Base de datos conectada y migraciones aplicadas
- [ ] `.env` creado con `VITE_BASE_URL` apuntando a AWS
- [ ] Build hecho con variables de producción
- [ ] Frontend desplegado (S3, CloudFront, o servidor web)
- [ ] HTTPS configurado
- [ ] Pruebas de funcionalidades críticas realizadas

---

## 🎯 Conclusión

**Estado de Sincronización**: ✅ **COMPLETO**

- ✅ Todos los componentes V2 usan `apiConnection` correctamente
- ✅ No hay URLs hardcodeadas
- ✅ Endpoints son relativos y compatibles con el backend existente
- ✅ No se requieren nuevas migraciones de base de datos
- ✅ Solo falta configurar `VITE_BASE_URL` con la URL de AWS

**La V2.0 está lista para conectarse al backend en AWS.**
