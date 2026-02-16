# 🚀 Mobile Sprint 1 Backlog (2 semanas)

**Sprint:** 1  
**Objetivo:** establecer base técnica y operativa para Android/iOS nativo con backend listo para evolución móvil.

---

## 1) Historias y tareas por rol

## Android (Kotlin + Compose)

### A1. Inicializar app shell Android
- Crear proyecto base con arquitectura modular.
- Configurar `build variants` para `dev/stage/prod`.
- Integrar DI base (Hilt o Koin).

**Aceptación**
- Compila en CI y en dispositivo físico.
- Pantalla inicial + navegación base funcional.

### A2. Capa core inicial
- Cliente HTTP base (timeouts, logs por ambiente, interceptor auth placeholder).
- Secure storage base para tokens (Keystore wrapper).
- Error mapping estándar.

**Aceptación**
- Petición de prueba a endpoint health/auth con manejo de errores consistente.

---

## iOS (Swift + SwiftUI)

### I1. Inicializar app shell iOS
- Crear proyecto base SwiftUI con estructura por capas.
- Configurar `Debug/Release` y esquemas `dev/stage/prod`.
- Navegación base + `AppState`.

**Aceptación**
- Build local y CI exitoso.
- Pantalla inicial + navegación base.

### I2. Capa core inicial
- Networking client base (URLSession + middleware de logs por ambiente).
- Secure storage (Keychain wrapper).
- Normalización de errores API.

**Aceptación**
- Request de prueba y manejo uniforme de errores.

---

## Backend/API (Cloudflare)

### B1. Definir contrato auth móvil v1
- Especificar flujo `login/refresh/logout/me` para móviles.
- Definir payload de errores (`code`, `message`, `details`).
- Documentar headers requeridos.

**Aceptación**
- Documento aprobado por mobile + backend.

### B2. Endpoint de metadata de app (nuevo)
- `GET /api/mobile/config` con flags mínimas y versión mínima soportada.

**Aceptación**
- Endpoint en staging con respuesta tipada y cache control adecuado.

### B3. Diseño endpoint dispositivos push (nuevo, diseño inicial)
- Especificación de `POST /api/mobile/devices` (sin implementación completa aún).

**Aceptación**
- Contrato definido y validado para Sprint 2/3.

---

## QA

### Q1. Estrategia de pruebas móvil Sprint 1
- Definir smoke checklist Android/iOS.
- Definir casos de red mala/sin red (base).
- Definir convención de reporte de bugs.

**Aceptación**
- Matriz de pruebas y plantilla de evidencia.

### Q2. Base de automatización
- Preparar harness para pruebas unitarias en ambas plataformas.

**Aceptación**
- Pipeline ejecuta tests básicos automáticamente.

---

## DevOps/SRE

### D1. CI pipelines móviles
- Pipeline Android: lint + test + build debug artifact.
- Pipeline iOS: test + build simulator artifact.

**Aceptación**
- Estado verde en PR de prueba.

### D2. Secret management por entorno
- Variables seguras para API base URL y llaves necesarias.

**Aceptación**
- Secrets no expuestos en repositorio, inyectados por CI.

---

## UX/Product

### P1. Guía UX móvil base
- Definir navegación por rol (admin/instructor/student).
- Definir estructura de home por rol.
- Definir criterios de accesibilidad (tipografía/tamaño toque).

**Aceptación**
- Wireframes low-fi aprobados de Auth + Home base.

---

## 2) Dependencias críticas

1. Contrato auth móvil aprobado (bloquea Sprint 2).
2. CI operativo (bloquea calidad y velocidad).
3. Decisión de storage local inicial por plataforma.

---

## 3) Riesgos de Sprint 1

- Retraso por definición incompleta de contrato backend.
- Complejidad de entorno iOS signing en CI.
- Scope creep de UI en sprint de fundación.

**Mitigación**
- Congelar alcance de Sprint 1 a base técnica y governance.

---

## 4) Meta de salida de Sprint 1

- App shell Android + iOS funcional.
- Networking + secure store base implementados.
- CI pipelines verdes.
- Contrato auth móvil v1 aprobado.
- Checklist QA inicial aprobado.
