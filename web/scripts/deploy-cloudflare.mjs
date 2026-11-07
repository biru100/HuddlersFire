import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { configureToolEnvironment } from './tool-environment.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const localDatabaseId = '00000000-0000-4000-8000-000000000000';

export function deploymentPlan(config, env, { dryRun = false, migrate = false } = {}) {
  const databaseId = env.CAMP_D1_DATABASE_ID;
  assert.match(databaseId || '', /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i, 'Set CAMP_D1_DATABASE_ID to the actual target D1 UUID.');
  assert.notEqual(databaseId, localDatabaseId, 'Local placeholder D1 cannot be deployed.');
  assert.match(env.CAMP_WORKER_NAME || '', /^[a-z0-9][a-z0-9-]{0,62}$/, 'Set CAMP_WORKER_NAME.');
  assert.equal(config.name, env.CAMP_WORKER_NAME, 'Worker target changed after build; rebuild.');
  const db = config.d1_databases?.find(item => item.binding === 'DB');
  assert.equal(db?.database_id, databaseId, 'D1 target changed after build; rebuild.');
  assert.ok(db?.migrations_dir, 'Built config must include D1 migrations_dir.');
  assert.ok(config.main && config.assets?.directory, 'Deploy the complete built Worker and assets.');
  assert.equal(config.services?.length || 0, 0, 'Preview connector bindings must not be deployed.');
  if (!dryRun) {
    assert.ok(env.CLOUDFLARE_API_TOKEN, 'Set GitHub production secret CLOUDFLARE_API_TOKEN.');
    assert.match(env.CLOUDFLARE_ACCOUNT_ID || '', /^[a-f0-9]{32}$/i, 'Set CLOUDFLARE_ACCOUNT_ID.');
  }
  assert.ok(!(dryRun && migrate), 'Dry run must not apply remote migrations.');
  const target = ['--config', 'dist/server/wrangler.json'];
  return [
    ...(migrate ? [['d1', 'migrations', 'apply', 'DB', '--remote', ...target]] : []),
    ['deploy', ...target, '--keep-vars', ...(dryRun ? ['--dry-run'] : [])],
  ];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  configureToolEnvironment(root);
  const args = process.argv.slice(2);
  assert.ok(args.every(arg => ['--dry-run', '--migrate'].includes(arg)), 'Unknown deployment argument.');
  const config = JSON.parse(readFileSync(path.join(root, 'dist/server/wrangler.json'), 'utf8'));
  const plan = deploymentPlan(config, process.env, { dryRun: args.includes('--dry-run'), migrate: args.includes('--migrate') });
  for (const command of plan) {
    const result = spawnSync(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'), ...command], {
      cwd: root, stdio: 'inherit', env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
