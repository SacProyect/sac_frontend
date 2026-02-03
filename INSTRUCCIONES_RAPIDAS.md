# 🚀 Instrucciones Rápidas - Crear Usuario ADMIN

## ⚠️ PROBLEMA: Backend necesita PORT

El backend necesita un archivo `.env` con el puerto. **Ya lo creé por ti.**

## 📋 PASOS:

### 1. Reinicia el Backend

En la terminal donde está corriendo el backend:
- Presiona `Ctrl+C` para detenerlo
- Ejecuta de nuevo: `npm run dev`

Deberías ver: `Server running on port 3000`

### 2. Crea el Usuario

En otra terminal, ejecuta:

```powershell
cd sac_backend
.\crear-usuario-admin.ps1
```

### 3. Usa las Credenciales

Ve a: `http://localhost:5173/login/v2`

**Credenciales:**
- **Cédula**: `12345678`
- **Contraseña**: `admin1234`

---

## ✅ Listo!

Con estas credenciales podrás ver **todas las páginas V2** como ADMIN.
