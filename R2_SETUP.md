# Configuración de R2 para Avatares de Estudiantes

## ✅ Implementación Completada

### Bucket R2 Creado
- **Nombre**: `martial-arts-manager-bucket`
- **Estado**: ✅ Activo y configurado

### Tabla de Base de Datos Actualizada
- **Columna agregada**: `avatar_url TEXT` en tabla `students`
- **Estado**: ✅ Columna existe en producción

### Endpoints API Implementados

#### POST `/api/students/avatar`
Sube una foto de perfil para un estudiante.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers: `Authorization: Bearer <JWT_TOKEN>`
- Body:
  - `avatar`: File (imagen)
  - `studentId`: String (ID del estudiante)

**Validaciones**:
- ✅ Autenticación JWT requerida
- ✅ Verifica propiedad del estudiante (created_by = user_id)
- ✅ Tipos permitidos: JPEG, PNG, GIF, WebP
- ✅ Tamaño máximo: 5MB

**Response**:
```json
{
  "success": true,
  "avatarUrl": "https://avatars.martial-arts-manager.pages.dev/avatars/{userId}/{studentId}-{timestamp}.{ext}"
}
```

**Estructura en R2**:
- Path: `avatars/{userId}/{studentId}-{timestamp}.{extension}`
- Metadata:
  - `userId`: ID del usuario que subió
  - `studentId`: ID del estudiante
  - `uploadedAt`: Timestamp ISO

#### DELETE `/api/students/avatar?studentId={id}`
Elimina la foto de perfil de un estudiante.

**Request**:
- Method: `DELETE`
- Headers: `Authorization: Bearer <JWT_TOKEN>`
- Query Params: `studentId=<ID>`

**Validaciones**:
- ✅ Autenticación JWT requerida
- ✅ Verifica propiedad del estudiante

**Response**:
```json
{
  "success": true
}
```

### Frontend Implementado

**StudentDetailsModal.tsx**:
- ✅ Input de archivo con overlay hover
- ✅ Validación de tipo y tamaño
- ✅ Loading state durante upload
- ✅ Actualización automática después del upload
- ✅ Muestra avatar si existe, iniciales si no

**Flujo de Usuario**:
1. Usuario hace clic en el avatar
2. Selecciona imagen del sistema
3. Validación en frontend (tipo y tamaño)
4. Upload vía FormData con JWT
5. R2 almacena la imagen
6. D1 guarda la URL en `students.avatar_url`
7. Página se recarga para mostrar nueva imagen

### Configuración Actual

**wrangler.toml**:
```toml
[[r2_buckets]]
binding = "AVATARS"
bucket_name = "martial-arts-manager-bucket"

[env.production]
r2_buckets = [
  { binding = "AVATARS", bucket_name = "martial-arts-manager-bucket" }
]
```

**functions/types/index.ts**:
- ✅ Tipos R2 completos agregados
- ✅ Interface `Env` actualizada con `AVATARS: R2Bucket`

## 📋 Pasos Pendientes para Producción

### 1. Configurar Dominio Público para R2

El bucket R2 necesita un dominio público para servir las imágenes.

**Opción A: R2.dev Domain (Temporal)**
```bash
wrangler r2 bucket domain add martial-arts-manager-bucket
```
Esto genera un dominio: `https://pub-xxxxx.r2.dev`

**Opción B: Custom Domain (Recomendado)**
1. Ir a Cloudflare Dashboard
2. R2 → `martial-arts-manager-bucket` → Settings → Public Access
3. Conectar dominio personalizado: `avatars.martial-arts-manager.pages.dev`
4. Cloudflare automáticamente:
   - Crea certificado SSL
   - Configura DNS
   - Habilita acceso público

### 2. Actualizar URL en el Código

Después de obtener el dominio público, actualizar en:

**functions/api/students/avatar.ts** (línea ~75):
```typescript
// Cambiar de:
const avatarUrl = `https://avatars.martial-arts-manager.pages.dev/${fileName}`;

// A tu dominio real:
const avatarUrl = `https://TU-DOMINIO-R2.r2.dev/${fileName}`;
// o
const avatarUrl = `https://avatars.martial-arts-manager.pages.dev/${fileName}`;
```

### 3. Configurar CORS (Opcional pero Recomendado)

Para permitir acceso desde el frontend:

```bash
# Crear archivo cors-policy.json
{
  "corsRules": [
    {
      "allowedOrigins": ["https://martial-arts-manager.pages.dev"],
      "allowedMethods": ["GET"],
      "allowedHeaders": ["*"],
      "maxAgeSeconds": 3600
    }
  ]
}

# Aplicar política
wrangler r2 bucket cors put martial-arts-manager-bucket --file cors-policy.json
```

### 4. Optimización de Imágenes (Futuro)

Considerar usar Cloudflare Images para:
- ✅ Redimensionamiento automático
- ✅ Conversión a WebP
- ✅ CDN global integrado
- ✅ Transformaciones on-the-fly

## 🔒 Seguridad Implementada

- ✅ **Autenticación**: JWT requerido en todos los endpoints
- ✅ **Autorización**: Solo el creador puede subir/eliminar avatares
- ✅ **Validación**: Tipos y tamaños de archivo
- ✅ **Metadata**: Tracking de quién subió y cuándo
- ✅ **Path structure**: Organizado por usuario para evitar colisiones
- ✅ **Soft delete**: Datos preservados para auditoría

## 📊 Estructura de Datos

### Tabla students
```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  belt TEXT,
  discipline TEXT,
  join_date TEXT,
  date_of_birth TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  avatar_url TEXT,              -- ✅ NUEVA COLUMNA
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);
```

### R2 Bucket Structure
```
martial-arts-manager-bucket/
├── avatars/
│   ├── {userId1}/
│   │   ├── {studentId1}-{timestamp}.jpg
│   │   ├── {studentId2}-{timestamp}.png
│   │   └── ...
│   ├── {userId2}/
│   │   └── ...
```

## 🚀 Testing

### Test Upload
```bash
# Obtener token JWT primero
TOKEN="your-jwt-token"

# Subir imagen
curl -X POST https://martial-arts-manager.pages.dev/api/students/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@/path/to/image.jpg" \
  -F "studentId=student-id-here"
```

### Test Delete
```bash
curl -X DELETE "https://martial-arts-manager.pages.dev/api/students/avatar?studentId=student-id-here" \
  -H "Authorization: Bearer $TOKEN"
```

## 📦 Deployment Status

- ✅ **Commit**: `174633b`
- ✅ **Build**: Exitoso sin errores
- ✅ **Deployment**: https://f10d6462.martial-arts-manager.pages.dev
- ✅ **R2 Bucket**: Configurado y funcionando
- ✅ **Database**: Columna avatar_url agregada

## 📝 Notas Adicionales

1. **Nombres de archivo únicos**: Se usa timestamp para evitar colisiones
2. **Path por usuario**: Cada usuario tiene su carpeta para organización
3. **No hay borrado de archivos antiguos**: Cuando se sube nueva imagen, la anterior permanece en R2 (considerar limpieza periódica)
4. **Reload después de upload**: Por simplicidad, se hace reload completo de la página (puede mejorarse con state management)

## 🎯 Próximas Mejoras

1. **Image optimization**: Integrar Cloudflare Images
2. **Thumbnails**: Generar versiones pequeñas para lista de estudiantes
3. **Cleanup job**: Worker programado para borrar avatares huérfanos
4. **Drag & drop**: Mejorar UX del upload
5. **Progress bar**: Mostrar progreso durante upload
6. **Image cropping**: Permitir al usuario recortar antes de subir
