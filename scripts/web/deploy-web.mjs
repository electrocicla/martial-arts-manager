#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { BRAND_OUTPUTS, verifyBrandBuild } from './verify-build.mjs';
import { buildBrand } from './build-web.mjs';

const MANZUR_PROJECT = 'manzurbros';
const MANZUR_HOST = 'manzurbros.pages.dev';
const CONFIG_FILE = 'wrangler.manzur.toml';

function assert(condition, message) {
  if (!condition) throw new Error('Deployment blocked: ' + message);
}

function run(command, args, env, capture = false) {
  const windows = process.platform === 'win32';
  const result = spawnSync(windows ? command + '.cmd' : command, args, {
    env, shell: windows, encoding: capture ? 'utf8' : undefined,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    maxBuffer: 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert(result.status === 0, command + ' command failed');
  return capture ? result.stdout : '';
}

/** Validate source-level resource identity before any Cloudflare mutation. */
export function assertManzurSharedBindings(project, hamarrConfig, manzurConfig) {
  assert(project?.name === MANZUR_PROJECT, 'unexpected Pages project');
  assert(project?.production_branch === 'main', 'unexpected Pages production branch');
  assert(
    Array.isArray(project.domains) && project.domains.includes(MANZUR_HOST),
    'Manzur Pages hostname is not verified',
  );
  assert(!project.domains.some((domain) => /(^|\.)hamarr\.cl$/i.test(domain)),
    'Manzur project cannot own Hamarr domain');

  const readValues = (config, key) => [...config.matchAll(new RegExp('^\\s*' + key + '\\s*=\\s*"([^"]+)"', 'gm'))]
    .map((match) => match[1]);
  const hamarrD1 = [...new Set(readValues(hamarrConfig, 'database_id'))];
  const hamarrR2 = [...new Set(readValues(hamarrConfig, 'bucket_name'))];
  const manzurD1 = [...new Set(readValues(manzurConfig, 'database_id'))];
  const manzurR2 = [...new Set(readValues(manzurConfig, 'bucket_name'))];

  assert(hamarrD1.length === 1 && hamarrR2.length === 1,
    'Hamarr resource identities must be singular and verified');
  assert(manzurD1.length === 1 && manzurD1[0] === hamarrD1[0],
    'Manzur DB must be the existing shared Hamarr D1');
  assert(manzurR2.length === 1 && manzurR2[0] === hamarrR2[0],
    'Manzur AVATARS must be the existing shared Hamarr R2');
  assert(/^name\s*=\s*"manzurbros"\s*$/m.test(manzurConfig),
    'Manzur Pages project name must be pinned');
  assert(/^pages_build_output_dir\s*=\s*"\.\/dist\/manzur"\s*$/m.test(manzurConfig),
    'Manzur build output directory must be pinned');
  assert(/^SITE_ORGANIZATION_ID\s*=\s*"manzur"\s*$/m.test(manzurConfig),
    'Manzur Pages organization binding must be pinned');
  assert(/\[\[d1_databases\]\][\s\S]*?binding\s*=\s*"DB"/m.test(manzurConfig),
    'DB binding missing in Manzur configuration');
  assert(/\[\[r2_buckets\]\][\s\S]*?binding\s*=\s*"AVATARS"/m.test(manzurConfig),
    'AVATARS binding missing in Manzur configuration');

  // When remote settings exist already, their declared resource identity must not conflict.
  const remote = project.deployment_configs?.production;
  if (remote?.d1_databases?.DB?.id) {
    assert(remote.d1_databases.DB.id === hamarrD1[0], 'remote D1 binding mismatch');
  }
  if (remote?.r2_buckets?.AVATARS?.name) {
    assert(remote.r2_buckets.AVATARS.name === hamarrR2[0], 'remote R2 binding mismatch');
  }
  if (remote?.env_vars?.SITE_ORGANIZATION_ID?.value) {
    assert(remote.env_vars.SITE_ORGANIZATION_ID.value === 'manzur',
      'remote Pages organization binding mismatch');
  }
  return { projectName: MANZUR_PROJECT, domain: MANZUR_HOST, databaseId: hamarrD1[0], bucketName: hamarrR2[0] };
}

export async function readManzurProject(env, fetchImpl = fetch) {
  const account = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  assert(account && token, 'verified Cloudflare account and Pages API authorization are required');
  const response = await fetchImpl(
    'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(account) + '/pages/projects/' + MANZUR_PROJECT,
    { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(15000) },
  );
  assert(response.ok, 'could not verify remote Pages project (HTTP ' + response.status + ')');
  const body = await response.json();
  assert(body?.success === true && body.result?.name === MANZUR_PROJECT, 'invalid remote Pages project response');
  return body.result;
}

export function assertRequiredSecrets(project) {
  const variables = project?.deployment_configs?.production?.env_vars;
  for (const name of ['JWT_SECRET', 'TURNSTILE_SECRET']) {
    assert(variables?.[name]?.type === 'secret_text', 'encrypted Pages secret ' + name + ' is not configured');
  }
}

export async function deployBrand(brand, env = process.env) {
  if (brand === 'hamarr') {
    assert(env.HAMARR_PRODUCTION_DEPLOY_APPROVED === 'approve-hamarr-production',
      'HAMARR production deploy requires explicit approval');
    run('pnpm', ['deploy'], { ...env, VITE_ORGANIZATION_ID: 'hamarr' });
    return;
  }
  assert(brand === 'manzur', 'unknown web academy');
  assert(env.MANZUR_PAGES_DEPLOY_APPROVED === 'approve-manzurbros-pages',
    'Manzur production deploy requires explicit owner authorization');
  assert(env.MANZUR_TENANT_SECURITY_QA_APPROVED === '1',
    'shared D1/R2 security and tenant isolation QA must pass');

  const [hamarrConfig, manzurConfig] = await Promise.all([
    readFile('wrangler.toml', 'utf8'), readFile(CONFIG_FILE, 'utf8'),
  ]);
  const project = await readManzurProject(env);
  assertManzurSharedBindings(project, hamarrConfig, manzurConfig);
  assertRequiredSecrets(project);
  const catalog = JSON.parse(await readFile('src/branding/site.json', 'utf8'));
  const siteKey = catalog.manzur?.turnstileSiteKey;
  assert(typeof siteKey === 'string' && /^0x4[A-Za-z0-9_-]+$/.test(siteKey) &&
    siteKey !== catalog.hamarr?.turnstileSiteKey, 'dedicated Manzur public Turnstile site key is required');
  assert(!env.VITE_TURNSTILE_SITE_KEY?.trim() || env.VITE_TURNSTILE_SITE_KEY.trim() === siteKey,
    'Manzur Turnstile environment override conflicts with the authorized widget');

  await buildBrand('manzur', env);
  await verifyBrandBuild('manzur', BRAND_OUTPUTS.manzur, { production: true });
  run('pnpm', ['exec', 'wrangler', 'pages', 'deploy', BRAND_OUTPUTS.manzur,
    '--config', CONFIG_FILE, '--project-name', MANZUR_PROJECT, '--branch', 'main'], {
    ...env, CI: '1',
  });
}

if (process.argv[1]?.endsWith('deploy-web.mjs')) {
  deployBrand(process.argv[2]).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
