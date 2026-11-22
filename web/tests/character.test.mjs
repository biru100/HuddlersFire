import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spriteManifest } from '../lib/camp-sprite-assets.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { drawCharacter } from '../lib/camp-character.mjs';
import { pickPlayer, playerInfo } from '../lib/camp-player-info.mjs';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { spawnPlayer } from '../lib/camp-world.mjs';
import { camperStrideRise } from '../lib/camp-camper-parts.mjs';
import { inspectCamperMotion, isMotionBaseline, motionBaseline, verifyMotionBaseline,
  assertCamperMotion } from '../scripts/camper-motion-audit.mjs';

function render(p = {}, avatar = null, options = {}) {
  const canvas = createCanvas(128, 128), c = canvas.getContext('2d');
  c.translate(64, 104); const pose=drawCharacter(c, { color: '#e5a76d', ...p }, { avatar, ...options });
  return { canvas, c,pose };
}
const pixel = (c, x, y) => [...c.getImageData(x, y, 1, 1).data];

test('the selected field sprites report v50 gaps or meet the full motion specification', {skip:!!process.env.CAMP_TEST_MANIFEST}, async () => {
  const report=await inspectCamperMotion();
  if(!isMotionBaseline(report)){
    assertCamperMotion(report);
    return;
  }
  verifyMotionBaseline(report,motionBaseline);
  const has=(id,kind)=>report.issues.some(issue=>issue.id===id&&issue.kind===kind);
  assert.ok(has('jump.rise/front-right/0/0','color-shared-phase'));
  assert.ok(has('walk.step-2/front-right/0/0','normal-shared-phase'));
  assert.ok(has('walk.step-1/front-right/1/0','normal-shared-outfit'));
  assert.ok(has('emote.wave/back-right/0/0','color-shared-direction'));
  // The structured assertion above checks jump.rise; the CLI summary is bounded
  // and may omit that phase after earlier alphabetically sorted findings.
  assert.throws(()=>assertCamperMotion(report,['jump']),/Incomplete camper motion:/);
  assert.throws(()=>verifyMotionBaseline({...report,issues:report.issues.slice(1)},motionBaseline),/differs from the recorded baseline/);
});

test('account portraits never change the pixels of a dressed field character', () => {
  const photo = createCanvas(80, 40);
  const ink = photo.getContext('2d');
  ink.fillStyle = '#ff00b4'; ink.fillRect(0, 0, 80, 40);
  for (const theme of ['color', 'dark']) {
    for (const state of [{}, {sitting:true}, {crouching:true}, {moving:true,facing:-1}, {facing:1}]) {
      const player = {...state,hairStyle:1,topStyle:2};
      const unlinked = render(player, null, {theme});
      const linked = render({...player,avatar:'https://cdn.discordapp.com/avatars/1/abc.png'}, photo, {theme});
      assert.deepEqual(linked.canvas.toBuffer('image/png'), unlinked.canvas.toBuffer('image/png'));
      const {headX, headY, mirror} = linked.pose;
      assert.ok(pixel(linked.c, Math.round(64 + headX*mirror), Math.round(104 + headY))[3] > 0);
    }
  }
});

test('reduced motion freezes breathing, walking and every expressive gesture', () => {
  for (const emote of [null, 'wave', 'clap', 'heart', 'dance', 'laugh', 'surprise']) {
    const first = render({ moving: true }, null, { emote, time: 0, reduced: true });
    const later = render({ moving: true }, null, { emote, time: 1.31, reduced: true });
    assert.deepEqual(first.canvas.toBuffer('image/png'), later.canvas.toBuffer('image/png'), emote || 'walk');
  }
  assert.deepEqual(render({}, null, { time: 0 }).canvas.toBuffer('image/png'), render({}, null, { time: 10 }).canvas.toBuffer('image/png'));
});

test('expressive animations change the silhouette while preserving caller canvas transforms', () => {
  for (const emote of ['wave', 'clap', 'heart', 'dance', 'laugh', 'surprise']) {
    const a = render({}, null, { emote, time: .1, reduced: false }), b = render({}, null, { emote, time: .23, reduced: false });
    assert.notDeepEqual(a.canvas.toBuffer('image/png'), b.canvas.toBuffer('image/png'), emote);
    assert.equal(a.c.getTransform().a, 1); assert.equal(a.c.getTransform().e, 64); assert.equal(a.c.getTransform().f, 104);
  }
});

test('player selection uses painter order, nameplates and nearest touch padding', () => {
  const a = { id: 'back', head: { x: 50, y: 50, radius: 10 }, body: { x: 42, y: 60, width: 16, height: 12 }, label: { x: 30, y: 80, width: 40, height: 20 } };
  const b = { ...a, id: 'front' };
  assert.equal(pickPlayer([a, b], 50, 50), 'front');
  assert.equal(pickPlayer([a], 35, 90), 'back');
  assert.equal(pickPlayer([a], 69, 50), null); assert.equal(pickPlayer([a], 69, 50, true), 'back');
  assert.equal(pickPlayer([a], 100, 100, true), null); assert.equal(pickPlayer([a], NaN, 50), null);
  const nearby = { id: 'near', head: { x: 83, y: 50, radius: 3 } };
  assert.equal(pickPlayer([a, nearby], 69, 50, true), 'near');
  const upper={id:'upper',head:{x:50,y:10,radius:10},body:{x:40,y:20,width:20,height:40}};
  assert.equal(pickPlayer([a,upper],50,50),'back','A visible portrait wins over a carried neighbour body box');
  const frontBody={id:'body',head:{x:200,y:200,radius:10},body:{x:30,y:80,width:40,height:20}};
  assert.equal(pickPlayer([a,frontBody],50,90),'back','A visible nameplate is above a foreground body');
});

test('rendered player selection follows CSS scale, page offsets, posture, altitude and resize at DPR 2', () => {
  const names = ['window', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const old = Object.fromEntries(names.map(key => [key, globalThis[key]]));
  Object.assign(globalThis, { window: { devicePixelRatio: 2, matchMedia: () => ({ matches: true }) }, ResizeObserver: class { observe() {} disconnect() {} }, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {} });
  let renderer;
  try {
    let width = 900, height = 700;
    const canvas = createCanvas(width, height); canvas.getBoundingClientRect = () => ({ left: 150, top: 90, width, height });
    const players = [{ ...spawnPlayer(), id: 'air', name: '공중', x: -2, y: 2, z: 1.2, motion: 'airborne' }, { ...spawnPlayer(), id: 'sit', name: '앉기', x: 3, y: -1, sitting: true }];
    renderer = new CampRenderer(canvas, () => ({ players, now: 500 }));
    for (const size of [[900, 700], [390, 520]]) {
      [width, height] = size; renderer.resize(); renderer.draw(500);
      const {scale,x:originX,y:originY}=renderer.camera;
      for (const p of players) {
        const x = 150 + originX + (p.x - p.y) * 40 * scale;
        const y = 90 + originY + ((p.x + p.y) * 20 - p.z * 40 + (p.sitting ? -32 : -40)) * scale;
        assert.equal(renderer.pickPlayer(x, y), p.id);
      }
    }
    players[0].motion = 'respawning'; renderer.draw(500);
    assert.equal(renderer.hitAreas.some(a => a.id === 'air'), false);
  } finally {
    renderer?.destroy();
    for (const key of names) if (old[key] === undefined) delete globalThis[key]; else globalThis[key] = old[key];
  }
});

test('player information reports current activity without returning internal session fields', () => {
  const p = { ...spawnPlayer(), id: 'a', name: '친구', running: true, moving: true, connected: true, token: 'private', discord_id: 'private' };
  let info = playerInfo(p, 'a', 'a', 500);
  assert.equal(info.activity, '달리는 중'); assert.equal(info.isSelf, true); assert.equal(info.isHost, true); assert.ok(!JSON.stringify(info).includes('private'));
  info = playerInfo({ ...p, motion: 'airborne', vz: -1 }, 'b', 'b', 500); assert.equal(info.activity, '내려오는 중');
  assert.equal(playerInfo({ ...p, sitting: true }, 'b', 'b', 500).activity, '앉아서 불멍 중');
  assert.equal(playerInfo({ ...p, connected: false }, 'b', 'b', 500).connected, false);
});

test('production camper retains four distinct facings and independent outfit parts', {skip:!spriteManifest.files['field-camper-v2']}, () => {
  const draw = (args,opts={}) => createHash('sha256').update(render({id:'',color:'#606060',...args},null,opts).canvas.toBuffer('image/png')).digest('hex');
  const looks = new Set(), facings = ['front-right','back-right','back-left','front-left'];
  for(const visualDirection of facings){
    for(const hairStyle of [0,1]) for(const topStyle of [0,1]){
      looks.add(draw({visualDirection,hairStyle,topStyle}));
    }
    assert.notEqual(draw({visualDirection}),draw({visualDirection,sitting:true}));
  }
  assert.equal(looks.size,16);
  const firstStep=draw({visualDirection:'front-right',moving:true},{time:.16,reduced:false});
  assert.notEqual(firstStep,draw({visualDirection:'front-right',moving:true},{time:.66,reduced:false}));
  assert.notEqual(draw({visualDirection:'front-right'},{time:0,reduced:false}),draw({visualDirection:'front-right'},{time:1.1,reduced:false}));
});

test('both outfits walk in eight different poses on a stable foot origin in all four directions', () => {
  for(const visualDirection of ['front-right','back-right','back-left','front-left']){
    for(const topStyle of [0,1]){
      const frames=new Set(), anchors=new Set(), neckHeights=[];
      for(let step=0;step<8;step++){
        const {canvas,pose}=render({visualDirection,topStyle,moving:true,walkCycle:step/8},null,{reduced:false});
        frames.add(createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'));
        anchors.add(pose.origin.y);
        neckHeights.push(pose.headY);
      }
      assert.equal(frames.size,8);
      assert.equal(anchors.size,1);
      const expected=neckHeights[0];
      if(spriteManifest.camperMotion){
        neckHeights.forEach((height,step)=>assert.ok(Math.abs(height-expected-camperStrideRise[step])<1e-9));
      }else assert.ok(Math.max(...neckHeights)-Math.min(...neckHeights)<=1);
    }
  }
});

test('every walking step uses the detailed garment and the shared standing head at game size', () => {
  const canvas=createCanvas(240,300),ctx=canvas.getContext('2d');
  const draw=ctx.drawImage.bind(ctx),layers=[];
  ctx.drawImage=(image,...args)=>{
    layers.push([image.width,image.height,...args.slice(-2)]);
    return draw(image,...args);
  };
  ctx.scale(3,3);
  ctx.translate(40,75);
  for(const visualDirection of ['front-right','back-right','back-left','front-left']){
    for(let step=0;step<8;step++){
      layers.length=0;
      drawCharacter(ctx,{moving:true,walkCycle:step/8,visualDirection,hairStyle:1,topStyle:0},{reduced:false});
      const detailed=[192,240,64,80], native=[64,80,64,80];
      const walking=spriteManifest.files['field-camper-walk'];
      assert.deepEqual(layers,walking.headLayers||walking.bodyOnly?
        [detailed,native,native]:[detailed,detailed]);
      if(spriteManifest.camperMotion){
        layers.length=0;
        const running=drawCharacter(ctx,{moving:true,running:true,walkCycle:step/8,visualDirection,hairStyle:1,topStyle:0},{reduced:false});
        assert.deepEqual(layers,[native,native,native]);
        assert.match(running.artFrame,/^run\.step-/);
      }
    }
  }
  layers.length=0;
  drawCharacter(ctx,{moving:true},{reduced:true});
  assert.ok(layers.length>0&&layers.every(([w,h])=>w===64&&h===80));
});

test('changing the garment preserves the head and changing the hairstyle preserves the body and footing', () => {
  for(const visualDirection of ['front-right','back-right','back-left','front-left']){
    for(const state of [{},{sitting:true},{sitting:true,renderSeat:true},
      ...Array.from({length:8},(_,i)=>({moving:true,walkCycle:i/8,running:i%2===1}))]){
      const choices=[];
      for(const hairStyle of [0,1])for(const topStyle of [0,1]){
        const {c,pose}=render({visualDirection,hairStyle,topStyle,...state},null,{time:1.1,reduced:false});
        const origin=104-pose.origin.y;
        const face=c.getImageData(32,origin+6,64,24).data;
        const body=c.getImageData(32,origin+49,64,27).data;
        assert.ok(face.some((v,i)=>i%4===3&&v));
        assert.ok(body.some((v,i)=>i%4===3&&v));
        choices.push({face,body,origin:pose.origin,feet:pose.feet,headY:pose.headY});
      }
      for(const a of choices){
        assert.deepEqual(a.origin,choices[0].origin);
        assert.deepEqual(a.feet,choices[0].feet);
        assert.equal(a.headY,choices[0].headY);
      }
      for(const [a,b] of [[0,1],[2,3]])assert.deepEqual(choices[a].face,choices[b].face);
      for(const [a,b] of [[0,2],[1,3]])assert.deepEqual(choices[a].body,choices[b].body);
    }
  }
});
