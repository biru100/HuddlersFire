// Replaced by Vite in both browser and Worker builds. Node fixtures share the
// development release; production identity is minted once per build process.
export const CAMP_RELEASE = typeof __CAMP_RELEASE__ === 'undefined'
  ? {id:'development',revision:0} : __CAMP_RELEASE__;
export const RELEASE_HEADER = 'X-Camp-Release';
export const REVISION_HEADER = 'X-Camp-Revision';
export const UPDATE_EVENT = 'camp-release-updated';
const activations=new WeakMap();

export async function activateRelease(db, release) {
  // D1 batches are transactions. Only a newer build can clear rooms; an old
  // isolate finishing during a rollout cannot clear or reactivate newer rooms.
  let seen=activations.get(db);if(!seen){seen=new Map();activations.set(db,seen);}
  const key=release.id+':'+release.revision;
  if(!seen.has(key))seen.set(key,Promise.resolve(db.batch([
    db.prepare('DELETE FROM camp_rooms WHERE NOT EXISTS (SELECT 1 FROM camp_runtime WHERE id = 1 AND revision >= ?)').bind(release.revision),
    db.prepare(`INSERT INTO camp_runtime (id, release, revision) VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET release = excluded.release, revision = excluded.revision
      WHERE excluded.revision > camp_runtime.revision`).bind(release.id,release.revision),
  ])).catch(error=>{seen.delete(key);throw error;}));
  await seen.get(key);
  // Read the authoritative fence on every request, including in a cached old
  // isolate. Initialization caching must never cache the active release itself.
  const active = await db.prepare('SELECT release AS id, revision FROM camp_runtime WHERE id = 1').first();
  return active;
}
