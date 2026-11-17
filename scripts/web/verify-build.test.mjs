import assert from 'node:assert/strict';
import { test } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyBrandBuild } from './verify-build.mjs';
import { pinnedEnvironment } from './build-web.mjs';
import { assertManzurSharedBindings, assertRequiredSecrets, readManzurProject, deployBrand } from './deploy-web.mjs';

async function fixture(brand) {
  const dir = await mkdtemp(join(tmpdir(), 'academy-build-'));
  const name = brand.toUpperCase();
  const files = {
    'index.html': '<html><head><title>' + name + '</title></head><body>App</body></html>',
    'manifest.webmanifest': JSON.stringify({ name, icons: [{ src: '/logo.svg' }] }),
    'sw.js': 'const CACHE_NAME = "' + brand + '-pwa";',
    'offline.html': '<!doctype html><title>Offline</title>',
    '_brand.json': JSON.stringify({ academyId: brand }),
    'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  };
  for (const [name, body] of Object.entries(files)) {
    await mkdir(join(dir, '..'), { recursive: true });
    await writeFile(join(dir, name), body);
  }
  return dir;
}

test('brand identity cannot be overridden by caller environment', () => {
  assert.equal(pinnedEnvironment('manzur', { VITE_ORGANIZATION_ID: 'hamarr' }).VITE_ORGANIZATION_ID, 'manzur');
  assert.equal(pinnedEnvironment('hamarr', { VITE_ORGANIZATION_ID: 'manzur' }).VITE_ORGANIZATION_ID, 'hamarr');
  assert.throws(() => pinnedEnvironment('other'), /Unsupported web academy/);
});

test('both isolated output brands verify independently', async () => {
  for (const brand of ['hamarr', 'manzur']) {
    const dir = await fixture(brand);
    try { assert.equal((await verifyBrandBuild(brand, dir)).academyId, brand); }
    finally { await rm(dir, { recursive: true, force: true }); }
  }
});

test('Manzur rejects Hamarr PWA text, old assetlinks, APKs and inline mobile URLs', async () => {
  for (const [filename, body] of [
    ['index.html', '<title>HAMARR</title>'],
    ['sw.js', "const CACHE_NAME = 'hamarr-pwa';"],
    ['.well-known/assetlinks.json', '{}'],
    ['downloads/hamarr-app-latest.apk', 'not-an-apk'],
    ['assets/app.js', '"https://hamarr.cl/downloads/hamarr-app-latest.apk"'],
    ['hammar_logo.jpeg', 'not-a-photo'],
  ]) {
    const dir = await fixture('manzur');
    try {
      await mkdir(join(dir, filename.split('/').slice(0, -1).join('/')), { recursive: true });
      await writeFile(join(dir, filename), body);
      await assert.rejects(() => verifyBrandBuild('manzur', dir), /Hamarr|APK|hamarr/i, filename);
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
}, 30_000);

test('Manzur refuses wrong output marker and icon that is not included', async () => {
  const dir = await fixture('manzur');
  try {
    await writeFile(join(dir, '_brand.json'), '{"academyId":"hamarr"}');
    await assert.rejects(() => verifyBrandBuild('manzur', dir), /marker/);
    await writeFile(join(dir, '_brand.json'), '{"academyId":"manzur"}');
    await writeFile(join(dir, 'manifest.webmanifest'), '{"name":"MANZUR","icons":[{"src":"/missing.svg"}]}');
    await assert.rejects(() => verifyBrandBuild('manzur', dir), /icon missing/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('integrated Manzur build cannot contain visual preview markers, worker or notice', async () => {
  const dir = await fixture('manzur');
  try {
    const html = '<html><head><title>MANZUR</title><link rel="manifest" href="/manifest.webmanifest"></head><body>App</body></html>';
    await writeFile(join(dir, 'index.html'), html);
    assert.equal((await verifyBrandBuild('manzur', dir, { production: true })).academyId, 'manzur');
    await writeFile(join(dir, '_brand.json'), '{"academyId":"manzur","preview":"visual-only"}');
    await assert.rejects(() => verifyBrandBuild('manzur', dir, { production: true }), /Preview marker/);
    await writeFile(join(dir, '_brand.json'), '{"academyId":"manzur"}');
    await writeFile(join(dir, '_worker.js'), 'export default {};');
    await assert.rejects(() => verifyBrandBuild('manzur', dir, { production: true }), /worker forbidden/);
    await rm(join(dir, '_worker.js'));
    await writeFile(join(dir, 'index.html'), html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>'));
    await assert.rejects(() => verifyBrandBuild('manzur', dir, { production: true }), /noindex/);
    await writeFile(join(dir, 'index.html'), html);
    await writeFile(join(dir, 'preview.js'), 'const notice = "Vista previa visual";');
    await assert.rejects(() => verifyBrandBuild('manzur', dir, { production: true }), /Preview-only presentation/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

const productionConfig = '[[d1_databases]]\ndatabase_id = "bbbbbbbb-1111-2222-3333-444444444444"\n[[env.production.r2_buckets]]\nbucket_name = "martial-arts-manager-bucket"';
const manzurConfig = `name = "manzurbros"
pages_build_output_dir = "./dist/manzur"
[[d1_databases]]
binding = "DB"
database_id = "bbbbbbbb-1111-2222-3333-444444444444"
[[r2_buckets]]
binding = "AVATARS"
bucket_name = "martial-arts-manager-bucket"
[vars]
SITE_ORGANIZATION_ID = "manzur"
`;
const project = {
  name: 'manzurbros',
  production_branch: 'main',
  domains: ['manzurbros.pages.dev'],
  deployment_configs: {
    production: {
      d1_databases: { DB: { id: 'bbbbbbbb-1111-2222-3333-444444444444' } },
      r2_buckets: { AVATARS: { name: 'martial-arts-manager-bucket' } },
      env_vars: { SITE_ORGANIZATION_ID: { type: 'plain_text', value: 'manzur' } },
    },
  },
};

test('both deployment commands fail closed without explicit owner activation', async () => {
  await assert.rejects(() => deployBrand('manzur', {}), /explicit owner authorization/);
  await assert.rejects(() => deployBrand('hamarr', {}), /explicit approval/);
});

test('Manzur deployment uses same D1/R2, separate Pages project and pinned tenant', () => {
  assert.deepEqual(assertManzurSharedBindings(project, productionConfig, manzurConfig), {
    projectName: 'manzurbros',
    domain: 'manzurbros.pages.dev',
    databaseId: 'bbbbbbbb-1111-2222-3333-444444444444',
    bucketName: 'martial-arts-manager-bucket',
  });
});

test('Manzur shared binding preflight denies duplicated resources and cross-project settings', () => {
  assert.throws(() => assertManzurSharedBindings(project, productionConfig,
    manzurConfig.replace('bbbbbbbb-1111-2222-3333-444444444444',
      'aaaaaaaa-1111-2222-3333-444444444444')), /existing shared Hamarr D1/);
  assert.throws(() => assertManzurSharedBindings(project, productionConfig,
    manzurConfig.replace('martial-arts-manager-bucket', 'manzur-separate-bucket')), /existing shared Hamarr R2/);
  assert.throws(() => assertManzurSharedBindings({ ...project, name: 'martial-arts-manager' },
    productionConfig, manzurConfig), /unexpected Pages project/);
  assert.throws(() => assertManzurSharedBindings({ ...project, domains: ['hamarr.cl'] },
    productionConfig, manzurConfig), /hostname/);
  assert.throws(() => assertManzurSharedBindings(project, productionConfig,
    manzurConfig.replace('SITE_ORGANIZATION_ID = "manzur"', 'SITE_ORGANIZATION_ID = "hamarr"')),
    /organization binding/);
  assert.throws(() => assertManzurSharedBindings({
    ...project, deployment_configs: { production: {
      ...project.deployment_configs.production,
      d1_databases: { DB: { id: 'different-d1' } },
    } },
  }, productionConfig, manzurConfig), /remote D1 binding mismatch/);
});

test('production preflight requires real remote project metadata and encrypted secrets', async () => {
  await assert.rejects(() => readManzurProject({}), /Pages API authorization/);
  const remote = { ...project, deployment_configs: { production: { env_vars: {
    JWT_SECRET: { type: 'secret_text' }, TURNSTILE_SECRET: { type: 'secret_text' },
  } } } };
  const result = await readManzurProject(
    { CLOUDFLARE_ACCOUNT_ID: 'test-account', CLOUDFLARE_API_TOKEN: 'test-only' },
    async (url) => {
      assert.equal(url, 'https://api.cloudflare.com/client/v4/accounts/test-account/pages/projects/manzurbros');
      return Response.json({ success: true, result: remote });
    },
  );
  assert.deepEqual(result, remote);
  assert.doesNotThrow(() => assertRequiredSecrets(result));
  assert.throws(() => assertRequiredSecrets(project), /encrypted Pages secret/);
  assert.throws(() => assertManzurSharedBindings({ ...project, production_branch: 'other' },
    productionConfig, manzurConfig), /production branch/);
});
