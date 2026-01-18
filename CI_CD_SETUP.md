# Configuración CI/CD - GitHub + Cloudflare Pages

Este proyecto está configurado para despliegue automático mediante CI/CD.

## 🔄 Opciones de CI/CD

### Opción 1: GitHub Actions (Recomendado) ✅

Ya está configurado en `.github/workflows/deploy.yml`

**Ventajas:**
- ✅ Control total del pipeline
- ✅ Validaciones antes de deploy (TypeCheck + ESLint)
- ✅ Historial de builds en GitHub
- ✅ Fácil debugging

**Pasos de configuración:**

#### 1. Obtener Cloudflare API Token

1. Ve a https://dash.cloudflare.com/profile/api-tokens
2. Click en **"Create Token"**
3. Usa la plantilla **"Edit Cloudflare Workers"**
4. O crea uno personalizado con estos permisos:
   - Account > Cloudflare Pages > Edit
   - Account > Account Settings > Read
5. **Guarda el token** - solo se muestra una vez

#### 2. Obtener Account ID

1. Ve a https://dash.cloudflare.com
2. Selecciona tu cuenta
3. En la barra lateral derecha, copia el **Account ID**

#### 3. Configurar Secrets en GitHub

1. Ve a tu repositorio: https://github.com/electrocicla/martial-arts-manager
2. Settings > Secrets and variables > Actions
3. Click **"New repository secret"**
4. Agrega estos secrets:

```
CLOUDFLARE_API_TOKEN: [tu token de Cloudflare]
CLOUDFLARE_ACCOUNT_ID: [tu account ID]
```

#### 4. Hacer Commit y Push

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for Cloudflare Pages"
git push origin main
```

El deploy se ejecutará automáticamente en cada push a `main`.

---

### Opción 2: Cloudflare Pages Git Integration

Conecta directamente Cloudflare con GitHub (más simple pero menos control).

**Pasos:**

#### 1. Desconectar deploy manual actual

```bash
# No es necesario hacer nada - GitHub Actions lo reemplazará
```

#### 2. En Cloudflare Dashboard

1. Ve a https://dash.cloudflare.com
2. Workers & Pages > **martial-arts-manager**
3. Settings > Builds & deployments
4. Click **"Connect to Git"**
5. Selecciona **GitHub**
6. Autoriza Cloudflare en GitHub
7. Selecciona el repositorio: `electrocicla/martial-arts-manager`
8. Configura:
   - **Production branch**: `main`
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
9. Click **"Save and Deploy"**

**Configuración avanzada (opcional):**

En "Environment variables":
```
NODE_VERSION=20
```

En "Build settings" > "Build commands":
```bash
pnpm install && pnpm typecheck && pnpm lint && pnpm build
```

---

## 🚀 ¿Qué hace el CI/CD?

Cada vez que haces push a `main`:

1. ✅ **Checkout** - Descarga el código
2. ✅ **Setup** - Instala Node.js y pnpm
3. ✅ **Install** - Instala dependencias
4. ✅ **TypeCheck** - Valida tipos TypeScript
5. ✅ **Lint** - Verifica calidad de código con ESLint
6. ✅ **Build** - Compila el proyecto
7. ✅ **Deploy** - Despliega a Cloudflare Pages

Si algún paso falla, el deploy se cancela.

---

## 📊 Monitoreo

### GitHub Actions
- Ve a tu repositorio > **Actions**
- Verás el historial de todos los workflows
- Click en un workflow para ver los logs detallados

### Cloudflare Pages
- https://dash.cloudflare.com
- Workers & Pages > martial-arts-manager
- Verás todos los deployments

---

## 🔍 Troubleshooting

### El workflow no se ejecuta

1. Verifica que `.github/workflows/deploy.yml` existe
2. Verifica que los secrets están configurados
3. Revisa la pestaña **Actions** en GitHub

### Build falla en GitHub Actions

```bash
# Ver logs en GitHub Actions
# Actions > [tu workflow] > Ver detalles
```

### Deploy manual sigue siendo necesario

Si usas GitHub Actions, ya no necesitas `pnpm run deploy`.
Solo haz:
```bash
git add .
git commit -m "tu mensaje"
git push origin main
```

Y GitHub Actions desplegará automáticamente.

---

## 🎯 Recomendación

**Usa GitHub Actions (Opción 1)** porque:
- ✅ Validaciones integradas (TypeCheck + ESLint)
- ✅ Mejor control del pipeline
- ✅ Fácil debugging
- ✅ Historial completo
- ✅ Puedes agregar tests en el futuro

**Usa Cloudflare Git Integration (Opción 2)** si:
- Quieres algo más simple
- No necesitas validaciones pre-deploy
- Prefieres todo en Cloudflare Dashboard

---

## 📝 URLs después de CI/CD

- **Producción**: https://hamarr.cl
- **Cloudflare**: https://martial-arts-manager.pages.dev
- **Preview por commit**: Automático en PRs

---

## ⚙️ Configuración Actual

- **Repositorio**: https://github.com/electrocicla/martial-arts-manager
- **Rama principal**: main
- **Proyecto Cloudflare**: martial-arts-manager
- **Dominio personalizado**: hamarr.cl
