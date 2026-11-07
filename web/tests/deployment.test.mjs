import test from 'node:test';
import assert from 'node:assert/strict';
import { deploymentPlan } from '../scripts/deploy-cloudflare.mjs';

const env = { CAMP_WORKER_NAME: 'huddlers-fire', CAMP_D1_DATABASE_ID: '11111111-2222-4333-8444-555555555555', CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'synthetic-test-token' };
const config = { name: env.CAMP_WORKER_NAME, main: 'index.js', assets: { directory: '../client' }, d1_databases: [{ binding: 'DB', database_id: env.CAMP_D1_DATABASE_ID, migrations_dir: '/app/drizzle' }], services: [] };

test('deployment rejects local D1, stale build targets, missing credentials and preview services before any command', () => {
  assert.throws(() => deploymentPlan(config, { ...env, CAMP_D1_DATABASE_ID: '00000000-0000-4000-8000-000000000000' }), /placeholder/);
  assert.throws(() => deploymentPlan({ ...config, name: 'wrong-worker' }, env), /changed after build/);
  assert.throws(() => deploymentPlan({ ...config, d1_databases: [] }, env), /changed after build/);
  assert.throws(() => deploymentPlan(config, { ...env, CLOUDFLARE_API_TOKEN: '' }), /CLOUDFLARE_API_TOKEN/);
  assert.throws(() => deploymentPlan({ ...config, services: [{ binding: 'CONNECTORS' }] }, env), /Preview connector/);
});

test('dry run never mutates D1 and migrations require explicit selection', () => {
  const dryRun = deploymentPlan(config, { ...env, CLOUDFLARE_API_TOKEN: '' }, { dryRun: true });
  assert.equal(dryRun.length, 1);
  assert.ok(dryRun[0].includes('--dry-run'));
  assert.throws(() => deploymentPlan(config, env, { dryRun: true, migrate: true }), /must not apply/);
  assert.equal(deploymentPlan(config, env).length, 1);
  const migrate = deploymentPlan(config, env, { migrate: true });
  assert.deepEqual(migrate[0].slice(0, 5), ['d1', 'migrations', 'apply', 'DB', '--remote']);
  assert.ok(migrate[1].includes('--keep-vars'));
});
