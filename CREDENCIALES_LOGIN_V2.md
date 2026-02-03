# 🔐 Credenciales para Login V2

## ⚠️ IMPORTANTE

El sistema **NO tiene credenciales de prueba predefinidas**. Necesitas:

1. **Tener el backend corriendo** con la base de datos configurada
2. **Crear un usuario** en la base de datos, O
3. **Usar un usuario existente** si ya tienes datos en la BD

---

## 🚀 OPCIÓN 1: Crear un Usuario Admin (Recomendado)

### Paso 1: Asegúrate de que el backend esté corriendo

```powershell
cd sac_backend
npm run dev
# o
pnpm dev
```

### Paso 2: Crear un usuario usando la API

Puedes usar **Postman**, **Thunder Client** (VS Code), o **curl**:

#### Usando curl (PowerShell):

```powershell
# Reemplaza localhost:3000 con tu URL del backend
# NOTA: El id se genera automáticamente, no es necesario incluirlo
$body = @{
    personId = 12345678
    password = "admin1234"
    name = "Admin Test"
    role = "ADMIN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/user/sign-up" -Method POST -Body $body -ContentType "application/json"
```

**IMPORTANTE**: Si el endpoint requiere `id`, puedes usar cualquier UUID o dejarlo vacío si el backend lo genera automáticamente.

#### Usando Postman o Thunder Client:

**URL**: `POST http://localhost:3000/user/sign-up`

**Body (JSON)**:
```json
{
  "personId": 12345678,
  "password": "admin1234",
  "name": "Admin Test",
  "role": "ADMIN"
}
```

### Paso 3: Usar las credenciales creadas

**Cédula**: `12345678`  
**Contraseña**: `admin1234`

---

## 🎯 ROLES DISPONIBLES

Según el schema de Prisma, los roles disponibles son:

- `ADMIN` - Administrador (acceso completo)
- `COORDINATOR` - Coordinador
- `FISCAL` - Fiscal
- `SUPERVISOR` - Supervisor

**Recomendación**: Usa `ADMIN` para ver todas las páginas V2.

---

## 📋 CREDENCIALES DE EJEMPLO

### Usuario ADMIN (Recomendado para pruebas)
```
Cédula: 12345678
Contraseña: admin1234
```

### Usuario COORDINATOR
```
Cédula: 87654321
Contraseña: coord1234
```

### Usuario FISCAL
```
Cédula: 11223344
Contraseña: fiscal1234
```

### Usuario SUPERVISOR
```
Cédula: 44332211
Contraseña: super1234
```

**Nota**: Estas son solo ejemplos. Debes crear estos usuarios usando el endpoint `/sign-up` antes de usarlos.

---

## 🔍 OPCIÓN 2: Verificar Usuarios Existentes en la BD

Si ya tienes usuarios en la base de datos, puedes:

### Opción A: Consultar directamente la BD

```sql
SELECT personId, name, role, status FROM user;
```

### Opción B: Usar Prisma Studio

```powershell
cd sac_backend
npx prisma studio
```

Esto abrirá una interfaz web donde puedes ver todos los usuarios.

---

## 🛠️ OPCIÓN 3: Crear Usuario desde Prisma Studio

1. Abre Prisma Studio:
   ```powershell
   cd sac_backend
   npx prisma studio
   ```

2. Ve a la tabla `user`
3. Haz clic en "Add record"
4. Completa los campos:
   - `id`: Se genera automáticamente (UUID)
   - `name`: "Admin Test"
   - `personId`: 12345678
   - `role`: ADMIN (o el que prefieras)
   - `password`: Debe estar hasheado (usa bcrypt)

**⚠️ Problema**: La contraseña debe estar hasheada. Es mejor usar la API.

---

## ✅ VERIFICAR QUE FUNCIONA

1. **Crea el usuario** usando la API (Opción 1)
2. **Ve a**: `http://localhost:5173/login/v2`
3. **Ingresa las credenciales**:
   - Cédula: `12345678`
   - Contraseña: `admin1234`
4. **Deberías ser redirigido** a `/v2/admin`

---

## 🐛 SI NO FUNCIONA

### Error: "Usuario no encontrado"
- Verifica que el usuario existe en la BD
- Verifica que el `personId` es correcto (debe ser numérico)

### Error: "Las credenciales no son correctas"
- Verifica que la contraseña es correcta
- Si creaste el usuario manualmente, asegúrate de que la contraseña esté hasheada

### Error: "No response from server"
- Verifica que el backend esté corriendo
- Verifica la URL del backend en `sac_frontend/.env` o `vite.config.js`

---

## 📝 NOTA SOBRE CONTRASEÑAS

- **Mínimo 8 caracteres** (según el código)
- Se hashean automáticamente al crear con la API
- Si creas manualmente en la BD, debes hashearla con bcrypt

---

## 🎯 RECOMENDACIÓN FINAL

**Para pruebas rápidas**, crea un usuario ADMIN con:

```json
{
  "personId": 12345678,
  "password": "admin1234",
  "name": "Admin Test",
  "role": "ADMIN"
}
```

Esto te dará acceso a **todas las páginas V2** sin restricciones.
