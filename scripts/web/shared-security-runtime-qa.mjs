#!/usr/bin/env node
// Synthetic local runtime QA only. No Cloudflare API, production credentials or real users.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { createHmac, pbkdf2Sync } from 'node:crypto';

const require = createRequire(import.meta.url);
const { Miniflare } = createRequire(require.resolve('wrangler/package.json'))('miniflare');
const scriptPath = resolve('dist/shared-security-functions-qa/index.js');
const secrets = { hamarr: 'synthetic-runtime-hamarr-only-48-byte-test-material', manzur: 'synthetic-runtime-manzur-only-48-byte-test-material' };
const publicHost = { hamarr: 'https://hamarr.cl', manzur: 'https://manzurbros.pages.dev' };
const workerSource = await readFile(scriptPath, 'utf8');
const mf = new Miniflare({ workers: ['hamarr', 'manzur'].map((brand) => ({
  config: {
    name: brand, type: 'worker', compatibilityDate: '2024-09-23', compatibilityFlags: ['nodejs_compat'],
    manifest: { mainModule: 'index.js', modulesRoot: resolve('dist/shared-security-functions-qa'), modules: { 'index.js': { type: 'esm', contents: workerSource } } },
    env: {
      JWT_SECRET: { type: 'text', value: secrets[brand] },
      TURNSTILE_SECRET: { type: 'text', value: 'synthetic-local-test-only' },
      SITE_ORGANIZATION_ID: { type: 'text', value: brand },
      DB: { type: 'd1', id: '11111111-1111-4111-8111-111111111111', name: 'shared-security-fixture-db' },
      AVATARS: { type: 'r2', name: 'shared-security-fixture-r2' },
    },
  },
})) });
const password = 'synthetic-local-password';
const salt = Buffer.alloc(16, 7);
const passwordHash = salt.toString('hex') + ':' + pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
const now = Math.floor(Date.now() / 1000);
function token(academy, hostBrand, purpose = 'access') {
  const payload = { sub: 'user-' + academy, email: academy + '@example.test', role: 'student',
    iat: now, exp: now + 3600, organization_id: academy, token_use: purpose };
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return head + '.' + body + '.' + createHmac('sha256', secrets[hostBrand]).update(head + '.' + body).digest('base64url');
}
let checks = 0;
function status(response, expected, title) {
  assert.equal(response.status, expected, title);
  checks++;
  return response;
}
function proxy(brand) { return '/api/avatars?key=' + encodeURIComponent('avatars/' + brand + '/branch-' + brand + '/student-' + brand + '.webp'); }
try {
  const db = await mf.getD1Database('DB', 'hamarr');
  const manzurDb = await mf.getD1Database('DB', 'manzur');
  const r2 = await mf.getR2Bucket('AVATARS', 'hamarr');
  const schema = [
    'CREATE TABLE organizations(id TEXT PRIMARY KEY,is_active INTEGER)',
    'CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT UNIQUE,name TEXT,password_hash TEXT,is_active INTEGER,role TEXT,student_id TEXT,avatar_url TEXT,updated_at TEXT)',
    'CREATE TABLE organization_memberships(organization_id TEXT,user_id TEXT,role TEXT,status TEXT,is_active INTEGER,student_id TEXT,approved_by TEXT,approved_at TEXT,PRIMARY KEY(organization_id,user_id))',
    'CREATE TABLE platform_admins(user_id TEXT PRIMARY KEY)',
    'CREATE TABLE students(id TEXT PRIMARY KEY,organization_id TEXT,branch_id TEXT,avatar_url TEXT,instructor_id TEXT,created_by TEXT,deleted_at TEXT)',
    'CREATE TABLE sessions(id TEXT PRIMARY KEY,user_id TEXT,refresh_token TEXT UNIQUE,expires_at TEXT,created_at TEXT,ip_address TEXT,user_agent TEXT)',
    'CREATE TABLE audit_logs(id TEXT PRIMARY KEY,user_id TEXT,action TEXT,entity_type TEXT,entity_id TEXT,changes TEXT,ip_address TEXT,timestamp TEXT)',
  ];
  for (const sql of schema) await db.prepare(sql).run();
  const migration = await readFile('migrations/add_auth_rate_limits.sql', 'utf8');
  for (const sql of migration.replace(/^\s*--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean)) await db.prepare(sql).run();
  for (const brand of ['hamarr', 'manzur']) {
    await db.batch([
      db.prepare('INSERT INTO organizations VALUES (?,1)').bind(brand),
      db.prepare('INSERT INTO users VALUES (?,?,?,?,1,?,?,?,?)').bind('user-' + brand, brand + '@example.test', 'Fixture', passwordHash, 'student', 'student-' + brand, proxy(brand), new Date().toISOString()),
      db.prepare("INSERT INTO organization_memberships VALUES (?,?,?,'active',1,?,NULL,NULL)").bind(brand, 'user-' + brand, 'student', 'student-' + brand),
      db.prepare('INSERT INTO students VALUES (?,?,?,?,NULL,NULL,NULL)').bind('student-' + brand, brand, 'branch-' + brand, proxy(brand)),
      db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?,NULL,NULL)').bind('session-' + brand, 'user-' + brand, token(brand, brand, 'refresh'), new Date((now + 3600)*1000).toISOString(), new Date().toISOString()),
    ]);
    await r2.put('avatars/' + brand + '/branch-' + brand + '/student-' + brand + '.webp', brand + '-fixture-image', {
      httpMetadata: { contentType: 'image/webp' },
      customMetadata: { organizationId: brand, branchId: 'branch-' + brand, studentId: 'student-' + brand },
    });
  }
  assert.equal((await manzurDb.prepare('SELECT COUNT(*) AS n FROM students').first()).n, 2, 'both workers see the same D1');
  const workers = { hamarr: await mf.getWorker('hamarr'), manzur: await mf.getWorker('manzur') };
  for (const brand of ['hamarr', 'manzur']) {
    const headers = { Authorization: 'Bearer ' + token(brand, brand), 'X-Organization-ID': brand, 'Sec-Fetch-Site': 'same-origin' };
    const response = status(await workers[brand].fetch(publicHost[brand] + '/api/auth/me', { headers }), 200, 'own web account');
    assert.equal((await response.json()).user.organization_id, brand);
    const cookie = { Cookie: 'refreshToken=' + token(brand, brand, 'refresh') };
    const own = status(await workers[brand].fetch(publicHost[brand] + proxy(brand), { headers: cookie }), 200, 'own web image');
    assert.equal(await own.text(), brand + '-fixture-image');
    const other = brand === 'hamarr' ? 'manzur' : 'hamarr';
    status(await workers[brand].fetch(publicHost[brand] + proxy(other), { headers: cookie }), 404, 'cross-tenant web image');
    status(await workers[brand].fetch(publicHost[brand] + '/api/auth/me', { headers: { ...headers, 'X-Organization-ID': other } }), 403, 'web tenant header spoof');
    status(await workers[brand].fetch(publicHost[brand] + proxy(brand)), 401, 'unsigned anonymous image');
    const nativeAuth = { 'X-Client-Platform': 'native', 'X-Organization-ID': brand, 'Content-Type': 'application/json', 'CF-Connecting-IP': brand === 'hamarr' ? '192.0.2.1' : '192.0.2.2' };
    const login = status(await workers.hamarr.fetch(publicHost.hamarr + '/api/auth/login', {
      method: 'POST', headers: nativeAuth, body: JSON.stringify({ email: brand + '@example.test', password }),
    }), 200, 'existing Native login with actual PBKDF2, D1 session and quota');
    const loggedIn = await login.json();
    assert.equal(loggedIn.user.organization_id, brand);
    assert.ok(loggedIn.refreshToken && loggedIn.accessToken);
    assert.match(loggedIn.user.avatar_url, /[?&]imageGrant=/);
    const ownNative = status(await workers.hamarr.fetch(publicHost.hamarr + loggedIn.user.avatar_url), 200, 'existing no-header Native Image');
    assert.equal(await ownNative.text(), brand + '-fixture-image');
    const tampered = new URL(publicHost.hamarr + loggedIn.user.avatar_url);
    tampered.searchParams.set('key','avatars/' + other + '/branch-' + other + '/student-' + other + '.webp');
    status(await workers.hamarr.fetch(tampered.href), 401, 'cross-object signed Native image');
    status(await workers.hamarr.fetch(publicHost.hamarr + '/api/auth/me', { headers: { Authorization: 'Bearer ' + loggedIn.accessToken, 'X-Organization-ID': other, 'X-Client-Platform': 'native' } }), 403, 'Native cross-tenant JWT');
    const nativeMe = status(await workers.hamarr.fetch(publicHost.hamarr + '/api/auth/me', { headers: { Authorization: 'Bearer ' + loggedIn.accessToken, 'X-Organization-ID': brand, 'X-Client-Platform': 'native' } }), 200, 'Native authenticated account');
    assert.equal((await nativeMe.json()).user.organization_id, brand);
    const refreshed = status(await workers.hamarr.fetch(publicHost.hamarr + '/api/auth/refresh', { method: 'POST', headers: { ...nativeAuth, 'X-Refresh-Token': loggedIn.refreshToken } }), 200, 'Native refresh');
    assert.ok((await refreshed.json()).refreshToken);
    status(await workers.hamarr.fetch(publicHost.hamarr + '/api/auth/refresh', { method: 'POST', headers: { ...nativeAuth, 'X-Refresh-Token': loggedIn.refreshToken } }), 401, 'consumed Native refresh token');
  }
  status(await workers.manzur.fetch(publicHost.manzur + '/api/auth/login', { method: 'POST', headers: { 'X-Organization-ID': 'manzur','X-Client-Platform': 'native' }, body: '{}' }), 403, 'dedicated web rejects Native hint');
  status(await workers.manzur.fetch(publicHost.manzur + '/api/auth/login', { method: 'POST', headers: { 'X-Organization-ID': 'manzur', 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '192.0.2.3' }, body: JSON.stringify({email:'manzur@example.test',password}) }), 400, 'web login without a CAPTCHA is not admitted');
  for (let i = 0; i < 11; i++) {
    const response = await workers.hamarr.fetch(publicHost.hamarr + '/api/auth/login', {
      method: 'POST', headers: { 'X-Client-Platform': 'native', 'X-Organization-ID': 'hamarr', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.44', 'X-Forwarded-For': '203.0.113.' + i },
      body: '{}',
    });
    status(response, i < 10 ? 400 : 429, 'persistent Native abuse quota');
  }
  console.log('LOCAL WORKER RUNTIME QA PASS: ' + checks + ' response checks, four logical clients, one synthetic D1 and R2. No remote requests or production records.');
} finally {
  await mf.dispose();
}
