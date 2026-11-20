import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCanvas} from '@napi-rs/canvas';
import {hash} from '../../tools/lib/sprite-spec.mjs';
import {expectedCases,verifySnapshot,compareSnapshots,sceneInventory,verifyObservations} from './current-art-evidence.mjs';

test('both releases share camera, backend, actors and time; an old baseline remains valid',()=>{
  const release={manifest:'candidate'},cases=expectedCases(true).map(row=>({...row,png:'pixels',
    time:5000,camera:{mode:'follow',x:12,y:22,scale:1},players:[{x:0},{x:1}]}));
  const before={phase:'before',digest:'original',release:{manifest:'older'},browser:true,protocol:'fixed',cases};
  const after={...structuredClone(before),phase:'after',release,baseline:before.digest};
  const compare=()=>compareSnapshots(before,after,release,'fixed');
  assert.equal(compare().length,54);
  assert.throws(()=>compareSnapshots(before,after,{manifest:'later'},'fixed'),/Stale/);
  after.baseline='other';assert.throws(compare,/different baseline/);after.baseline=before.digest;
  after.cases[0].camera.x++;assert.throws(compare,/Camera or scene/);after.cases[0].camera.x--;
  after.cases[0].backend='webgl';assert.throws(compare,/Camera or scene/);
});

test('the stored capture set rejects missing cases, replaced PNGs and edited receipts',t=>{
  const dir=mkdtempSync(join(tmpdir(),'camp-release-evidence-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const cases=expectedCases(false).map(row=>{
    const png=createCanvas(row.width,row.height).toBuffer('image/png');
    writeFileSync(join(dir,row.id+'.png'),png);
    return {...row,png:hash(png),camera:{x:10,y:20,scale:1,mode:'follow'},players:[{},{}],
      dpr:1,zoom:1,time:5000,theme:'color'};
  });
  const payload={version:1,browser:false,cases};
  const seal=()=>({...payload,digest:hash(payload)});
  assert.doesNotThrow(()=>verifySnapshot(dir,seal()));
  assert.throws(()=>verifySnapshot(dir,{...seal(),version:2}),/receipt/);
  const last=cases.pop();assert.throws(()=>verifySnapshot(dir,seal()),/Incomplete/);cases.push(last);
  const c=createCanvas(last.width,last.height);c.getContext('2d').fillRect(1,2,3,4);
  writeFileSync(join(dir,last.id+'.png'),c.toBuffer('image/png'));
  assert.throws(()=>verifySnapshot(dir,seal()),/Changed screenshot/);
});

test('observations cover real placement types and name evidence from the same map',()=>{
  const inventory=sceneInventory(),before={digest:'baseline'},after={digest:'candidate',inventory,cases:expectedCases(false)};
  const maps=Object.fromEntries(Object.entries(inventory).map(([id,{placements,surfaces,moving}])=>[id,{
    affected:[],unchanged:[...new Set([...placements.map(p=>p.type),...surfaces,...moving])],
    evidence:[id+'-mobile'],observations:['Synthetic test observation'],unresolved:[],
  }]));
  const notes={before:before.digest,after:after.digest,aesthetics:'pending_user',maps};
  const verify=()=>verifyObservations(notes,before,after);
  assert.doesNotThrow(verify);
  maps.camp.evidence=['showroom-mobile'];assert.throws(verify,/scene observation/);
  maps.camp.evidence=['camp-mobile'];maps.camp.unchanged.pop();assert.throws(verify,/inventory/);
  notes.aesthetics='approved';assert.throws(verify,/user/);
});
