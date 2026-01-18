# 🚀 Guía Rápida de Despliegue

## Comandos Esenciales

```bash
# Deploy a producción con todas las validaciones
pnpm run deploy

# Deploy rápido (sin validaciones)
pnpm run deploy:quick
```

## ✅ Flujo Automático de Deploy

Cuando ejecutas `pnpm run deploy`, se ejecutan automáticamente:

1. ✅ **TypeScript Check** - Valida todos los tipos
2. ✅ **ESLint** - Verifica calidad del código
3. 🏗️ **Build** - Compila el proyecto
4. 🚀 **Deploy** - Despliega a Cloudflare Pages
5. 📋 **Muestra URLs** - Te indica las URLs de tu deploy

**Si cualquier validación falla, el deploy se cancela.**

## 🌐 URLs que Obtendrás

### Automáticas (sin configuración)
- **Producción**: `https://martial-arts-manager.pages.dev`
- **Preview**: `https://<branch>.martial-arts-manager.pages.dev`

### Personalizada (requiere configuración)
- **Tu dominio**: `https://www.tudominio.cl`

## 🎯 Configurar Dominio Personalizado

### ¿Cuál opción elegir en NIC.cl?

**Opción 1: Servidor DNS de Cloudflare** ⭐ **RECOMENDADO**

✅ Ventajas:
- Control total desde Cloudflare
- Mejor rendimiento global
- Protección DDoS incluida
- SSL automático
- Certificados gratis
- Analytics avanzados

❌ Requiere:
- Cambiar nameservers en NIC.cl
- Esperar 24-48 hrs propagación DNS

**Opción 2: Redireccionamiento Web**

✅ Ventajas:
- Configuración inmediata
- No tocas nameservers

❌ Desventajas:
- Sin protección DDoS
- Sin optimizaciones de Cloudflare
- Configuración limitada
- Puede ser más lento

## 📖 Pasos para Servidor DNS (Recomendado)

### 1. En Cloudflare Dashboard

1. Ve a https://dash.cloudflare.com
2. Click en "Add a site"
3. Ingresa tu dominio: `tudominio.cl`
4. Elige plan Free
5. Cloudflare te dará 2 nameservers, ejemplo:
   ```
   ada.ns.cloudflare.com
   sid.ns.cloudflare.com
   ```

### 2. En NIC.cl

1. Ingresa a https://www.nic.cl
2. Selecciona tu dominio
3. Ve a "Servidores DNS"
4. Selecciona "Servidores DNS Personalizados"
5. Reemplaza los nameservers actuales con los de Cloudflare
6. Guarda cambios

### 3. De vuelta en Cloudflare

1. En tu dominio, ve a "DNS" > "Records"
2. Agrega estos registros:

```
Tipo: CNAME
Nombre: www
Contenido: martial-arts-manager.pages.dev
Proxy: ✅ Activado (nube naranja)

Tipo: CNAME
Nombre: @
Contenido: martial-arts-manager.pages.dev
Proxy: ✅ Activado (nube naranja)
```

3. Ve a "Pages" > "martial-arts-manager" > "Custom domains"
4. Click "Set up a custom domain"
5. Ingresa `www.tudominio.cl`
6. Cloudflare lo configurará automáticamente

### 4. Espera

- La propagación DNS toma 24-48 horas
- Verifica en: https://dnschecker.org
- El SSL se activa automáticamente

## 📖 Pasos para Redireccionamiento (Alternativa)

### En NIC.cl

1. Ingresa a https://www.nic.cl
2. Selecciona tu dominio
3. Ve a "Redireccionamiento Web"
4. Configura:
   - **Desde**: `tudominio.cl`
   - **Hacia**: `https://martial-arts-manager.pages.dev`
   - **Tipo**: Permanente (301)
5. Guarda cambios
6. ¡Listo! Funciona inmediatamente

## 🔍 Verificar Deploy

Después de cada deploy:

```bash
# 1. Verifica que el build pasó
pnpm build

# 2. Verifica que no hay errores de lint
pnpm lint

# 3. Verifica que no hay errores de tipos
pnpm typecheck

# 4. Deploy
pnpm run deploy
```

## 🆘 Solución de Problemas

### Deploy falla en ESLint
```bash
# Ver errores
pnpm lint

# Intentar auto-fix
pnpm lint --fix
```

### Deploy falla en TypeScript
```bash
# Ver errores
pnpm typecheck
```

### DNS no propaga
- Espera 48 horas completas
- Verifica en https://dnschecker.org
- Limpia cache DNS:
  ```powershell
  ipconfig /flushdns
  ```

## 📚 Documentación Completa

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para:
- Explicación detallada de cada opción
- Comparación completa DNS vs Redireccionamiento
- Configuración de variables de entorno
- Troubleshooting avanzado
- Configuración de SSL
- Y mucho más...

## 💡 Recomendación Final

Para un proyecto de producción serio: **Usa Servidor DNS de Cloudflare**

Obtendrás:
- 🚀 Máximo rendimiento
- 🔒 Máxima seguridad
- 🎯 Control total
- 📊 Analytics incluidos
- 🆓 Todo gratis

La espera de 24-48 hrs vale totalmente la pena.
