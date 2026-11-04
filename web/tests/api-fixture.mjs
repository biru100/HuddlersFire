import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleCampRequest } from '../lib/camp-api.mjs';

export function fixture(extra = {}) {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec('PRAGMA foreign_keys=ON');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
  let prepares = 0;
  const DB = {
    prepare(sql) {
      prepares++;
      let params = [];
      return {
        bind(...values) { params = values; return this; },
        first() { return sqlite.prepare(sql).get(...params) ?? null; },
        all() { return { results: sqlite.prepare(sql).all(...params) }; },
        run() { return sqlite.prepare(sql).run(...params); },
      };
    },
    batch(statements) {
      sqlite.exec('BEGIN');
      try { const results = statements.map(s => s.run()); sqlite.exec('COMMIT'); return results; }
      catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
  };
  let now = Date.now();
  const env = { DB, ...extra };
  const client = () => {
    let cookie = '';
    return async (path, data, overrides = {}) => {
      const request = new Request('https://camp.test/api/camp/' + path, { method: data === undefined ? 'GET' : 'POST', headers: { Origin: 'https://camp.test', Cookie: cookie, 'Content-Type': 'application/json', ...overrides.headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
      const response = await handleCampRequest(request, env, { now, ...overrides.options });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      const value = response.headers.get('content-type')?.includes('json') ? await response.json() : null;
      return { response, value, status: response.status };
    };
  };
  const enrolled = async name => { const c = client(); assert.equal((await c('session', { name })).status, 200); return c; };
  return { queries: () => prepares, resetQueries: () => { prepares = 0; }, DB, sqlite, client, enrolled, advance: ms => { now += ms; } };
}
export const roomQuery = info => 'room?' + new URLSearchParams({ code: info.code, player: info.player });
