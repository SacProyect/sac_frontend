# 🔧 Guía de Variables de Entorno - SAC V2.0

## 📋 ¿Qué es el archivo `.env`?

El archivo `.env` contiene variables de configuración que cambian según el entorno (desarrollo, producción, etc.). **Nunca debe subirse a Git** (ya está en `.gitignore`).

## 🎯 ¿Para qué sirve `VITE_BASE_URL`?

`VITE_BASE_URL` es la URL base de tu API backend. El frontend la usa para hacer todas las peticiones HTTP.

### Cómo funciona:

1. **En desarrollo local**:
   ```env
   VITE_BASE_URL=http://localhost:3000
   ```
   - El frontend (puerto 5173) se conecta al backend (puerto 3000)

2. **En producción**:
   ```env
   VITE_BASE_URL=https://api.tudominio.com
   ```
   - El frontend se conecta al backend en producción

## 📝 Cómo crear y usar el `.env`

### Paso 1: Crear el archivo

En la carpeta `sac_frontend`, crea un archivo llamado `.env`:

```bash
cd sac_frontend
# En Windows (PowerShell):
New-Item -Path .env -ItemType File

# En Linux/Mac:
touch .env
```

### Paso 2: Agregar la configuración

Abre el archivo `.env` y agrega:

**Para desarrollo local:**
```env
VITE_BASE_URL=http://localhost:3000
```

**Para producción:**
```env
VITE_BASE_URL=https://api.tudominio.com
```

### Paso 3: Reiniciar el servidor

Después de crear o modificar `.env`, **debes reiniciar el servidor de desarrollo**:

```bash
# Detener el servidor (Ctrl+C)
# Luego iniciar de nuevo:
npm run dev
```

## ⚠️ Importante

1. **El archivo `.env` NO se incluye en el build**
   - Vite inyecta las variables durante el build
   - Una vez hecho el build, las variables quedan "quemadas" en el código

2. **Para producción, configura las variables ANTES del build**:
   ```bash
   # 1. Crear .env con la URL de producción
   echo "VITE_BASE_URL=https://api.tudominio.com" > .env
   
   # 2. Hacer el build
   npm run build
   
   # 3. El build en dist/ ya tiene la URL de producción
   ```

3. **O usa variables de entorno del sistema**:
   ```bash
   # En Linux/Mac:
   VITE_BASE_URL=https://api.tudominio.com npm run build
   
   # En Windows (PowerShell):
   $env:VITE_BASE_URL="https://api.tudominio.com"; npm run build
   ```

## 🔍 Verificar que funciona

Después de configurar `.env`, puedes verificar en la consola del navegador:

```javascript
console.log(import.meta.env.VITE_BASE_URL)
```

Deberías ver la URL que configuraste.

## 🚨 Problemas Comunes

### Problema: "baseURL is empty" o errores de conexión

**Solución**: Verifica que:
1. El archivo `.env` existe en `sac_frontend/`
2. La variable se llama exactamente `VITE_BASE_URL` (con `VITE_` al inicio)
3. Reiniciaste el servidor después de crear/modificar `.env`

### Problema: El build usa localhost en producción

**Solución**: Asegúrate de configurar `VITE_BASE_URL` **antes** de hacer el build:
```bash
# ❌ Incorrecto: Build primero, luego cambiar .env
npm run build
# Cambiar .env aquí no afecta el build ya hecho

# ✅ Correcto: Configurar .env primero, luego build
echo "VITE_BASE_URL=https://api.tudominio.com" > .env
npm run build
```

## 📚 Referencias

- [Vite: Variables de Entorno](https://vitejs.dev/guide/env-and-mode.html)
- [Axios: Configuración Base URL](https://axios-http.com/docs/config_defaults)
