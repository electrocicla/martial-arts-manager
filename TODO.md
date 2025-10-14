# TODO List - Martial Arts Manager

## 🐛 Bugs Pendientes

### 🔴 CRÍTICO: Error al actualizar datos de estudiante
**Fecha reportado**: 13 de Octubre, 2025  
**Ubicación**: StudentEditModal → PUT /api/students  
**Descripción**: Al intentar actualizar los datos de un estudiante, el sistema arroja un error.

**Errores en consola**:
```
[Detalles del error a verificar en la próxima sesión]
```

**Archivos involucrados**:
- `src/components/students/StudentEditModal.tsx`
- `functions/api/students.ts` (onRequestPut)
- `src/hooks/useStudents.ts` (updateStudent)

**Posibles causas**:
1. Discrepancia entre tipos de datos enviados y esperados
2. Campo `joinDate` vs `join_date` (camelCase vs snake_case)
3. Formato de fecha incorrecto
4. Validación de campos faltante en el backend
5. Problema con la conversión de tipos Discipline

**Pasos para reproducir**:
1. Abrir modal de detalles de un estudiante
2. Hacer clic en "Editar Estudiante"
3. Modificar cualquier campo
4. Hacer clic en "Actualizar Estudiante"
5. Error aparece

**Prioridad**: 🔴 ALTA  
**Asignado**: Pendiente  
**Estado**: 🔍 Investigación requerida

---

## ✨ Mejoras Completadas

### ✅ Diseño de tarjetas de estudiantes mejorado
- [x] Tarjetas más grandes y legibles
- [x] Avatar de 20x20 con gradiente
- [x] Botones "Ver" y "Editar" con tamaño adecuado
- [x] Indicador de estado activo/inactivo
- [x] Iconos con fondos de color
- [x] Hover effects y animaciones
- [x] Grid responsive (1/2/3/4 columnas)
- [x] Soporte para avatar_url desde R2

### ✅ Sistema de filtrado avanzado (COMPLETADO 2025-01-26)
- [x] Filtro por disciplina con conteos de estudiantes
- [x] Filtro completo de cinturones de todas las disciplinas
- [x] Conteos de estudiantes por cinturón
- [x] Filtrado dinámico: cinturones se actualizan según disciplina seleccionada
- [x] Traducciones EN/ES agregadas
- [x] Optimización de rendimiento con useMemo
- [x] Interfaz responsive y accesible
- [x] Investigación completa de sistemas de cinturones:
  * Karate: White, Yellow, Orange, Green, Blue, Purple, Brown, Black
  * BJJ: White, Blue, Purple, Brown, Black, Red/White (Coral 7th), Red/White (Coral 8th), Red (9th-10th)
  * Taekwondo: White, Yellow, Green, Blue, Red, Black
  * Judo: Similar to BJJ with dans and kyus
  * Otros estilos documentados en constants.ts

### ✅ Integración de Cloudflare R2
- [x] Bucket creado: `martial-arts-manager-bucket`
- [x] Endpoint POST /api/students/avatar
- [x] Endpoint DELETE /api/students/avatar
- [x] Validaciones de tipo y tamaño
- [x] Columna avatar_url en tabla students

### ✅ CRUD Completo de Estudiantes
- [x] Create (POST)
- [x] Read (GET)
- [x] Update (PUT) - ⚠️ Con bug
- [x] Delete (DELETE) - Soft delete

### ✅ Modal de Detalles
- [x] Diseño profesional con Tailwind
- [x] Secciones organizadas
- [x] Botones de acción (Editar/Eliminar)
- [x] Confirmación de eliminación
- [x] Upload de avatar

---

## 📋 Tareas Pendientes

### 🔧 Correcciones Necesarias

#### 1. Fix: Error al actualizar estudiante
- [ ] Investigar error específico en consola
- [ ] Verificar tipos de datos en StudentEditModal
- [ ] Revisar transformación de datos antes de enviar
- [ ] Comprobar validación en backend
- [ ] Agregar logging detallado en onRequestPut
- [ ] Probar con diferentes campos modificados

#### 2. Mejoras de UX para Upload de Avatar
- [ ] Eliminar `window.location.reload()` 
- [ ] Implementar actualización optimista del estado
- [ ] Agregar progress bar durante upload
- [ ] Mostrar preview antes de subir
- [ ] Agregar opción de recortar imagen
- [ ] Implementar drag & drop

#### 3. Configurar Dominio Público R2
- [ ] Ejecutar: `wrangler r2 bucket domain add martial-arts-manager-bucket`
- [ ] Actualizar URL en `functions/api/students/avatar.ts`
- [ ] Configurar CORS para el bucket
- [ ] Documentar dominio final en README

#### 4. Optimización de Imágenes
- [ ] Integrar Cloudflare Images
- [ ] Generar thumbnails automáticos
- [ ] Conversión a WebP
- [ ] Lazy loading de imágenes

### 🎨 Mejoras de UI/UX

#### Vista de Lista
- [ ] Mejorar diseño de la vista de lista (actualmente básica)
- [ ] Agregar acciones inline
- [ ] Hacer responsive

#### Filtros y Búsqueda
- [ ] Agregar búsqueda por teléfono
- [ ] Filtro por fecha de ingreso
- [ ] Búsqueda avanzada con múltiples campos
- [ ] Guardar filtros en localStorage

#### Dashboard
- [ ] Agregar gráficas de estadísticas
- [ ] Timeline de actividad reciente
- [ ] Métricas de asistencia
- [ ] Próximos exámenes de cinturón

### 🔒 Seguridad

#### Validaciones
- [ ] Validar email único en registro
- [ ] Prevenir registros duplicados
- [ ] Rate limiting en API endpoints
- [ ] Sanitización de inputs

#### Permisos
- [ ] Sistema de roles (admin, instructor, student)
- [ ] Permisos granulares por recurso
- [ ] Audit log de cambios importantes

### 📱 Responsive Design
- [ ] Optimizar modales para móvil
- [ ] Menú hamburguesa funcional
- [ ] Touch gestures para acciones
- [ ] PWA capabilities

### 🧪 Testing
- [ ] Unit tests para hooks
- [ ] Integration tests para API
- [ ] E2E tests con Playwright
- [ ] Test de carga para R2 uploads

### 📚 Documentación
- [ ] API documentation con Swagger
- [ ] User guide en español
- [ ] Video tutorials
- [ ] Deployment guide completo

### ⚡ Performance
- [ ] Implementar pagination para estudiantes
- [ ] Virtual scrolling para listas largas
- [ ] Cachear datos frecuentes
- [ ] Optimizar bundle size
- [ ] Implementar service worker

### 🌐 Internacionalización
- [ ] Completar traducciones en inglés
- [ ] Agregar portugués
- [ ] Selector de idioma en settings
- [ ] Formateo de fechas por locale

---

## 🚀 Roadmap Futuro

### Fase 2: Gestión de Clases
- [ ] CRUD completo de clases
- [ ] Calendario interactivo
- [ ] Sistema de inscripciones
- [ ] Límites de cupo
- [ ] Notificaciones automáticas

### Fase 3: Sistema de Pagos
- [ ] CRUD completo de pagos
- [ ] Tracking de mensualidades
- [ ] Reportes financieros
- [ ] Integración con Stripe/PayPal
- [ ] Facturación automática

### Fase 4: Asistencia
- [ ] Check-in con QR code
- [ ] Tracking de asistencia
- [ ] Reportes de asistencia
- [ ] Alertas por ausencias

### Fase 5: Exámenes de Cinturón
- [ ] Programación de exámenes
- [ ] Evaluación de técnicas
- [ ] Certificados digitales
- [ ] Historial de promociones

### Fase 6: Comunicación
- [ ] Sistema de mensajería interno
- [ ] Notificaciones push
- [ ] Email automation
- [ ] Recordatorios de clases

---

## 📝 Notas Técnicas

### Stack Actual
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Auth**: JWT con HS256
- **Deployment**: Wrangler CLI

### Commits Recientes Importantes
- `174633b` - Integración R2 para avatares
- `cf39c74` - Traducciones modales
- `bf75879` - Modales de detalles y edición
- `46960cd` - Endpoints PUT y DELETE

### URLs de Producción
- **App**: https://martial-arts-manager.pages.dev
- **Latest Deploy**: https://f10d6462.martial-arts-manager.pages.dev
- **Repository**: https://github.com/electrocicla/martial-arts-manager

---

**Última actualización**: 13 de Octubre, 2025
