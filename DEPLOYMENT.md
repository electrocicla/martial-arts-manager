# Guía de Despliegue y Configuración DNS

## 📦 Scripts de Despliegue

### Comandos Disponibles

```bash
# Desarrollo local con Wrangler
pnpm dev

# Build del proyecto
pnpm build

# Deploy a producción (con validaciones automáticas)
pnpm run deploy

# Deploy rápido sin validaciones
pnpm run deploy:quick
```

### Flujo de Deploy

El script `deploy` ejecuta automáticamente:

1. ✅ **TypeCheck** - Valida tipos de TypeScript
2. ✅ **ESLint** - Verifica calidad del código
3. 🏗️ **Build** - Compila el proyecto
4. 🚀 **Deploy** - Despliega a Cloudflare Pages

Si alguna validación falla, el deploy se detiene automáticamente.

## 🌐 URLs de Despliegue

### URL Predeterminada (Dinámica)
Cada deploy genera una URL automática:
- **Producción**: `https://martial-arts-manager.pages.dev`
- **Preview**: `https://<branch>.martial-arts-manager.pages.dev`
- **Commit específico**: `https://<commit-hash>.martial-arts-manager.pages.dev`

### URL Personalizada (Fija para Producción)

Para tener una URL permanente tipo `https://www.tudominio.cl`:

#### Paso 1: Configurar en Cloudflare Pages

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecciona **Pages** > **martial-arts-manager**
3. Click en la pestaña **Custom domains**
4. Click en **Set up a custom domain**
5. Ingresa tu dominio (ejemplo: `www.tudominio.cl` o `tudominio.cl`)
6. Cloudflare te mostrará los registros DNS necesarios

#### Paso 2: Configurar DNS en NIC.cl

Tienes dos opciones:

---

## 🎯 Opción 1: Servidor DNS (RECOMENDADO ✅)

### ¿Por qué es mejor?

- ✅ **Control total**: Gestiona todos los registros desde Cloudflare
- ✅ **Rendimiento**: DNS de Cloudflare es más rápido
- ✅ **Seguridad**: Protección DDoS automática
- ✅ **SSL automático**: Certificados HTTPS sin configuración extra
- ✅ **Análisis avanzados**: Estadísticas de tráfico incluidas
- ✅ **Facilidad**: Un solo lugar para gestionar todo

### Configuración en NIC.cl

1. Ingresa a tu cuenta en [NIC.cl](https://www.nic.cl)
2. Selecciona tu dominio
3. Ve a **Servidores DNS**
4. Cambia a **Servidores DNS Personalizados**
5. Reemplaza los nameservers por los de Cloudflare:
   ```
   ada.ns.cloudflare.com
   sid.ns.cloudflare.com
   ```
   (Cloudflare te dará los nameservers específicos cuando agregues tu dominio)

### Configuración en Cloudflare

1. En Cloudflare Dashboard, click en **Add a site**
2. Ingresa tu dominio: `tudominio.cl`
3. Selecciona el plan **Free**
4. Cloudflare escaneará tus registros DNS existentes
5. Verifica que los registros importantes estén presentes
6. Cloudflare te mostrará los nameservers a configurar
7. Espera 24-48 horas para que se propague el cambio

### Registros DNS a crear en Cloudflare

Una vez configurados los nameservers, agrega estos registros en Cloudflare:

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

---

## 🔀 Opción 2: Redireccionamiento Web

### ¿Cuándo usar esta opción?

- ⚠️ Si no puedes cambiar los nameservers
- ⚠️ Si ya tienes servicios corriendo en otros servidores DNS
- ⚠️ Como solución temporal

### Desventajas

- ❌ Sin protección DDoS de Cloudflare
- ❌ Sin optimización de velocidad
- ❌ Configuración más limitada
- ❌ Puede ser más lento

### Configuración en NIC.cl

1. Ingresa a [NIC.cl](https://www.nic.cl)
2. Selecciona tu dominio
3. Ve a **Redireccionamiento Web**
4. Configura:
   - **Desde**: `tudominio.cl` y `www.tudominio.cl`
   - **Hacia**: `https://martial-arts-manager.pages.dev`
   - **Tipo**: Permanente (301)
   - **Ocultar URL origen**: NO (para mantener tu dominio en la barra)

**Nota**: Con esta opción, el usuario verá `tudominio.cl` pero técnicamente estará en Cloudflare Pages. No tendrás el control total de SSL y otras configuraciones avanzadas.

---

## 🆚 Comparación Directa

| Característica | DNS en Cloudflare | Redireccionamiento |
|----------------|-------------------|-------------------|
| Velocidad | ⚡ Muy rápida | 🐌 Más lenta |
| Seguridad DDoS | ✅ Incluida | ❌ No incluida |
| SSL/HTTPS | ✅ Automático | ⚠️ Limitado |
| Control total | ✅ Sí | ❌ No |
| Configuración | 🛠️ Media | 🔧 Fácil |
| Propagación | ⏱️ 24-48 hrs | ⏱️ Inmediato |
| Recomendado | ✅✅✅ | ⚠️ |

---

## 📋 Checklist de Despliegue

### Antes de cada deploy:

- [ ] Código testeado localmente
- [ ] Sin errores de ESLint
- [ ] Sin errores de TypeScript
- [ ] Variables de entorno configuradas
- [ ] Migrations de base de datos aplicadas

### Primer deploy a producción:

- [ ] Dominio configurado en Cloudflare Pages
- [ ] DNS configurado en NIC.cl
- [ ] Certificado SSL activo
- [ ] Variables de entorno de producción configuradas
- [ ] Base de datos D1 de producción lista
- [ ] Bucket R2 configurado

### Después de cada deploy:

- [ ] Verificar URL de producción funciona
- [ ] Probar funcionalidades críticas
- [ ] Revisar logs de Cloudflare Pages
- [ ] Verificar que no hay errores en consola

---

## 🔐 Variables de Entorno

Las variables de entorno se configuran en:
1. Cloudflare Dashboard
2. Pages > martial-arts-manager
3. Settings > Environment variables

Variables necesarias:
- `JWT_SECRET` - Para autenticación
- Otras variables según tu configuración

---

## 🚨 Solución de Problemas

### El deploy falla por ESLint
```bash
# Ver errores específicos
pnpm lint

# Corregir automáticamente algunos errores
pnpm lint --fix
```

### El deploy falla por TypeScript
```bash
# Ver errores de tipos
pnpm typecheck
```

### DNS no propaga
- Espera 24-48 horas completas
- Verifica en: https://dnschecker.org
- Limpia cache DNS local:
  ```powershell
  ipconfig /flushdns
  ```

### SSL no activo
- Espera a que DNS propague completamente
- En Cloudflare: SSL/TLS > Overview > Modo "Full"
- Verifica que el proxy esté activo (nube naranja)

---

## 📞 Recursos Adicionales

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [NIC Chile](https://www.nic.cl)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [DNS Checker](https://dnschecker.org)

---

## 🎓 Recomendación Final

**Usa Servidor DNS de Cloudflare** si:
- Es un proyecto de producción serio
- Quieres el mejor rendimiento y seguridad
- Puedes esperar 24-48 horas para la propagación DNS
- No tienes otros servicios críticos en el dominio

**Usa Redireccionamiento** si:
- Es un proyecto temporal o de prueba
- No puedes cambiar los nameservers
- Necesitas algo inmediato (aunque menos óptimo)

Para este proyecto de gestión de artes marciales en producción, **se recomienda fuertemente usar DNS de Cloudflare** para obtener el máximo rendimiento, seguridad y control.
