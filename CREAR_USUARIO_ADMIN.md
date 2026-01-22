# 🚀 Crear Usuario ADMIN de Prueba - Guía Rápida

## ⚡ Pasos Rápidos

### 1️⃣ Inicia el Backend

Abre una terminal y ejecuta:

```powershell
cd sac_backend
npm run dev
```

Espera a que veas un mensaje como: `Server running on port 3000`

### 2️⃣ Crea el Usuario

En otra terminal (o cuando el backend esté corriendo), ejecuta:

```powershell
cd sac_backend
.\crear-usuario-admin.ps1
```

### 3️⃣ Usa las Credenciales

Ve a: `http://localhost:5173/login/v2`

**Credenciales:**
- **Cédula**: `12345678`
- **Contraseña**: `admin1234`

---

## ✅ Si Todo Sale Bien

Deberías ver:
```
✅ ¡Usuario creado exitosamente!

📋 CREDENCIALES PARA LOGIN:
   Cédula: 12345678
   Contraseña: admin1234
   Rol: ADMIN
```

---

## ❌ Si Hay Errores

### Error: "No se pudo conectar al servidor"
- **Solución**: Asegúrate de que el backend esté corriendo en `http://localhost:3000`

### Error: "Usuario ya existe"
- **Solución**: El usuario ya está creado. Usa las credenciales directamente:
  - Cédula: `12345678`
  - Contraseña: `admin1234`

### Error: "Contraseña debe ser mínimo de 8 caracteres"
- **Solución**: Ya está configurado con 8 caracteres. Si ves este error, algo está mal.

---

## 🎯 Listo!

Una vez creado el usuario, podrás:
- ✅ Hacer login en `/login/v2`
- ✅ Ver todas las páginas V2
- ✅ Acceder a todas las funcionalidades como ADMIN
