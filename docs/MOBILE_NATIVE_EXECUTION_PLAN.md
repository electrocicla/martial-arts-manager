# 📱 Mobile Native Execution Plan (Android + iOS)

**Proyecto:** Martial Arts Manager  
**Fecha:** 2026-02-16  
**Objetivo:** convertir el sistema actual en apps móviles de alto rendimiento, integración completa y despliegue en stores.

---

## 1) Decisión técnica (objetivo de arquitectura)

### Recomendación principal
- **Android:** Kotlin + Jetpack Compose
- **iOS:** Swift + SwiftUI
- **Dominio compartido opcional (recomendado):** Kotlin Multiplatform (KMP) para networking, modelos, reglas y sincronización.

### Por qué esta opción
- Máxima performance en UI y cámara QR.
- Integración nativa completa (push, biometría, deep links, background sync).
- Mejor experiencia de usuario y estabilidad en dispositivos reales.

---

## 2) Plan de ejecución en 8 sprints (2 semanas c/u)

## Sprint 1 — Foundation & Governance
**Objetivo:** dejar lista la base técnica y operativa.

**Entregables**
- Repos/monorepo móvil definidos (`android-app`, `ios-app`, `mobile-shared` opcional).
- CI inicial para build y tests móviles.
- Lineamientos de arquitectura y convenciones de código.
- Plan de telemetría (crashes, logs, performance).

**Backlog (prioridad alta)**
1. Arquitectura base (Clean + MVVM/MVI).
2. Gestión de secretos por entorno (dev/stage/prod).
3. Pipelines CI para compilación y lint.
4. Matriz de dispositivos objetivo.

**Criterio de salida**
- Ambos clientes compilan en dev y tienen pipeline verde.

---

## Sprint 2 — Auth móvil segura
**Objetivo:** sesión robusta y segura para apps nativas.

**Entregables**
- Login/logout nativo en Android/iOS.
- Refresh token flow móvil (no dependiente de cookie web).
- Almacenamiento seguro (Keystore/Keychain).

**Backlog (prioridad alta)**
1. Endpoint de refresh compatible mobile-token.
2. Interceptor de auth con retry y renovación de token.
3. Manejo de sesión expirada y revocación.
4. Cifrado en reposo para tokens sensibles.

**Criterio de salida**
- Reautenticación automática estable y sin loops.

---

## Sprint 3 — Data layer & Offline-First v1
**Objetivo:** base de datos local y sincronización incremental.

**Entregables**
- Persistencia local (`Room` Android / `CoreData` o `GRDB` iOS).
- Sync pull incremental por `updated_at`.
- Cola de cambios local para operaciones pendientes.

**Backlog (prioridad alta)**
1. Repositorios de Students/Classes/Attendance.
2. Estrategia de conflictos (última escritura + marca de conflicto).
3. Modo sin red con lectura local.

**Criterio de salida**
- App usable sin internet para lectura y cola de acciones.

---

## Sprint 4 — Módulos Core (Students + Classes)
**Objetivo:** cubrir operaciones de mayor uso diario.

**Entregables**
- Listado, detalle y edición de estudiantes.
- Listado y gestión de clases por rol.
- Upload de avatar desde app nativa.

**Backlog (prioridad alta)**
1. Pantallas con paginación virtual.
2. Búsqueda y filtros performantes.
3. Formularios con validación local + server.

**Criterio de salida**
- Flujos CRUD críticos listos para beta interna.

---

## Sprint 5 — Attendance + QR nativo (valor diferencial)
**Objetivo:** experiencia QR premium y confiable.

**Entregables**
- Escaneo QR nativo:
  - Android: ML Kit Barcode
  - iOS: AVFoundation
- Flujo check-in robusto con feedback inmediato.
- Historial local de escaneos + reintentos.

**Backlog (prioridad alta)**
1. Scanner con fallback manual de código.
2. Gestión de permisos de cámara por plataforma.
3. Telemetría de éxito/fallo de escaneo.

**Criterio de salida**
- Tasa de escaneo exitoso > 98% en pruebas de campo.

---

## Sprint 6 — Notificaciones push + deep links
**Objetivo:** engagement y comunicación en tiempo real.

**Entregables**
- Push notifications (FCM + APNs).
- Registro de device tokens en backend.
- Deep links/universal links a pantallas internas.

**Backlog (prioridad alta)**
1. API de registro/desregistro de dispositivo.
2. Segmentación por rol/evento.
3. Apertura contextual desde notificación.

**Criterio de salida**
- Push end-to-end funcional en staging iOS/Android.

---

## Sprint 7 — Hardening de performance y seguridad
**Objetivo:** llevar la app a nivel producción.

**Entregables**
- Optimización de arranque, scroll y memoria.
- Seguridad avanzada (pinning opcional, biometría opcional).
- Pruebas de resiliencia en red inestable.

**Backlog (prioridad alta)**
1. Perfilado de rendimiento por dispositivos gama media.
2. Mejora de latencia percibida (prefetch + caché).
3. Auditoría OWASP MASVS baseline.

**Criterio de salida**
- KPIs de rendimiento y crash rate en meta.

---

## Sprint 8 — Release management & Stores
**Objetivo:** publicar con calidad y control de riesgo.

**Entregables**
- Build signing final Android/iOS.
- TestFlight y Play Internal/Closed testing.
- Checklist de publicación y rollback.

**Backlog (prioridad alta)**
1. QA final de regresión completa.
2. Assets de store y compliance.
3. Feature flags para rollout gradual.

**Criterio de salida**
- Release candidate aprobado y publicación escalonada.

---

## 3) Backlog priorizado por impacto (global)

### P0 (obligatorio para MVP móvil)
- Auth móvil segura (refresh token nativo).
- QR scanner nativo + fallback manual.
- Estudiantes/Clases/Asistencia.
- Almacenamiento local y sync incremental.

### P1 (alto valor inmediato)
- Push notifications + deep links.
- Upload avatar optimizado.
- Observabilidad (crash + performance dashboards).

### P2 (escalamiento y excelencia)
- Biometría y pinning.
- Sincronización avanzada con resolución de conflictos asistida.
- Módulos avanzados de analytics en móvil.

---

## 4) Arquitectura propuesta (carpetas)

## Android (Kotlin + Compose)
- `android-app/`
  - `app/`
    - `src/main/java/.../core/` (network, auth, storage, telemetry)
    - `src/main/java/.../data/` (api, db, repositories)
    - `src/main/java/.../domain/` (use cases, entities)
    - `src/main/java/.../features/`
      - `auth/`
      - `students/`
      - `classes/`
      - `attendance/qr/`
      - `notifications/`
      - `settings/`
    - `src/main/java/.../navigation/`
    - `src/main/java/.../ui/` (theme, components)
  - `build.gradle.kts`

## iOS (Swift + SwiftUI)
- `ios-app/`
  - `App/`
    - `Core/` (Networking, SecureStore, Logger, Metrics)
    - `Data/` (API, LocalStore, Repositories)
    - `Domain/` (Models, UseCases)
    - `Features/`
      - `Auth/`
      - `Students/`
      - `Classes/`
      - `AttendanceQR/`
      - `Notifications/`
      - `Settings/`
    - `Navigation/`
    - `DesignSystem/`
  - `Project.xcodeproj`

## Shared (opcional con KMP)
- `mobile-shared/`
  - `shared/src/commonMain/` (models, usecases, sync engine)
  - `shared/src/androidMain/`
  - `shared/src/iosMain/`

---

## 5) Contrato API móvil mínimo (v1)

> Nota: aprovechar endpoints actuales, pero con ajustes para robustez móvil.

### Auth
- `POST /api/auth/login`
- `POST /api/auth/refresh` (modo mobile token/secure storage)
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Datos core
- `GET /api/students`
- `GET /api/students/{id}`
- `POST /api/students`
- `PUT /api/students`

- `GET /api/classes`
- `GET /api/classes/{id}`
- `POST /api/classes`
- `PUT /api/classes`

- `GET /api/attendance`
- `POST /api/attendance`
- `POST /api/attendance/scan`
- `GET /api/attendance/qr`
- `POST /api/attendance/qr`
- `DELETE /api/attendance/qr?id={id}`

### Perfil y media
- `POST /api/students/avatar` (multipart/form-data)
- `GET /api/avatars?key=...`

### Notificaciones
- `GET /api/notifications`
- `PUT /api/notifications?id=...`
- `DELETE /api/notifications?id=...`
- **Nuevo recomendado:** `POST /api/mobile/devices` (registro push token/device)

### Reglas recomendadas de contrato
- Versionado: `/api/v1` o header de versión.
- Idempotency-Key para operaciones sensibles offline.
- `updated_at`/`deleted_at` consistente para sync incremental.
- Errores tipados (`code`, `message`, `details`).

---

## 6) Estimación de esfuerzo por rol (8 sprints)

## Escenario equipo recomendado
- 1 Lead Mobile Android
- 1 Lead Mobile iOS
- 1 Backend Engineer
- 1 QA Automation/Manual
- 0.5 DevOps/SRE
- 0.5 Product Designer (UX móvil)

## Estimación macro (persona-semana)
- Mobile Android: **16–20**
- Mobile iOS: **16–20**
- Backend/API: **8–12**
- QA: **8–10**
- DevOps/SRE: **4–6**
- Diseño UX móvil: **4–6**

**Total estimado:** **56–74 persona-semana**.

---

## 7) KPIs de éxito de lanzamiento

- Crash-free sessions: **> 99.5%**
- Cold start (gama media): **< 2.0 s**
- P95 API móvil: **< 500 ms** (red normal)
- Éxito check-in QR: **> 98%**
- Tasa de reintento offline exitoso: **> 95%**

---

## 8) Riesgos y mitigación

1. **Auth híbrida web/cookie vs móvil/token**
   - Mitigación: contrato auth mobile explícito + pruebas E2E.

2. **Conflictos offline**
   - Mitigación: reglas de merge claras + idempotencia.

3. **Fragmentación de dispositivos**
   - Mitigación: matriz mínima de QA en gama baja/media/alta.

4. **Scope creep en MVP**
   - Mitigación: congelar alcance P0/P1 hasta beta cerrada.

---

## 9) Definition of Done por sprint

- Build reproducible en CI.
- Pruebas unitarias mínimas por feature core.
- Pruebas de regresión críticas (auth + qr + sync).
- Métricas de crash/performance visibles en dashboard.
- Demo funcional validada por negocio.

---

## 10) Próxima acción inmediata (semana 1)

1. Aprobar esta arquitectura y backlog P0/P1.  
2. Crear repos móviles (`android-app`, `ios-app`) y pipeline CI inicial.  
3. Definir contrato auth móvil (refresh/token lifecycle).  
4. Levantar Sprint 1 con hitos y responsables.
