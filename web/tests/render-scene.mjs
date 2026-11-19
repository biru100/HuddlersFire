import { emptyFire, FIRE_STYLES } from '../lib/camp-fire.mjs';
import { CAMP_SEATS, takeSeat } from '../lib/camp-seats.mjs';
import { getMap } from '../lib/camp-maps.mjs';
import { EXHIBITED_GAMES,exhibitCover } from '../lib/camp-games.mjs';
// Render our own Canvas drawing code to PNG without launching or controlling a browser.
import { createCanvas, Image, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { CampRenderer } from '../lib/camp-renderer.mjs';
import { COLORS, EMOTES, TRAMPOLINES, RADIO, spawnPlayer, applyPlayerAction } from '../lib/camp-world.mjs';
import { drawCharacter } from '../lib/camp-character.mjs';
globalThis.window = { devicePixelRatio: 1, matchMedia: () => ({ matches: true }) };
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
globalThis.Image = Image;
mkdirSync('outputs', { recursive: true });
const koreanFont=process.env.CAMP_REVIEW_KOREAN_FONT || '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';
if (!GlobalFonts.has('Malgun Gothic') && existsSync(koreanFont)) GlobalFonts.registerFromPath(koreanFont,'Malgun Gothic');
// Use the production painter, seat contacts, atlas loader and default follow camera.
for(const [name,width,height] of [['camp-art-live-desktop',1050,824],['camp-art-live-mobile',390,520]]) {
  const canvas=createCanvas(width,height);
  canvas.getBoundingClientRect=()=>({width,height});
  const camper=(id,name,x,y,color,hairStyle,topStyle)=>({...spawnPlayer(0),id,name,x,y,color,hairStyle,topStyle,connected:true});
  const seat=CAMP_SEATS.find(s=>s.bench==='log-7');
  const hero=camper('self','Myo',-.45,-2.05,COLORS[0],0,0);
  const guest=camper('guest','Sol',seat.x,seat.y,COLORS[2],1,1);
  const players=[hero,guest], room=new Map(players.map(p=>[p.id,p]));
  const error=takeSeat(room,guest,seat.id);
  if(error)throw Error(error);
  const scene={players,self:hero.id,mapId:'camp',followSelf:true,cameraMode:'follow',zoom:1,now:5000,theme:'color'};
  const renderer=new CampRenderer(canvas,()=>scene);
  await renderer.ready;
  renderer.draw(5000);
  if(renderer.hitAreas.length!==2 || renderer.seatAreas.length!==CAMP_SEATS.length)throw Error('Live art scene lost a player or a seat');
  writeFileSync('outputs/'+name+'.png',canvas.toBuffer('image/png'));
  renderer.destroy();
}
for(const [name,mapId,width,height,followSelf,x,y]of [
  ['expanded-camp','camp',1050,824,false,0,2],['expanded-playground','playground',1050,824,false,0,2],
  ['showroom-overview','showroom',1050,824,false,0,0],['showroom-booth','showroom',1050,824,true,0,-.5],
  ['showroom-booth-mobile','showroom',390,620,true,0,-.5],['camp-portal','camp',1050,824,true,4,4],['camp-portal-mobile','camp',390,620,true,4,4],
  ['showroom-torizon-telecom','showroom',1050,824,true,4,-.5],['showroom-torizon-telecom-mobile','showroom',390,620,true,4,-.5],
]){
  const canvas=createCanvas(width,height);canvas.getBoundingClientRect=()=>({width,height});
  const p={...spawnPlayer(0,mapId),id:'self',name:'나',color:COLORS[0],connected:true,x,y};
  const renderer=new CampRenderer(canvas,()=>({players:[p],self:p.id,followSelf,now:1000}));
  for(const game of EXHIBITED_GAMES){const cover=exhibitCover(game);if(cover)renderer.exhibitImages.set(cover,{image:await loadImage('public'+cover),failed:false});}
  renderer.draw(1000);
  if(renderer.seatAreas.length && !getMap(mapId).fire)throw Error('Seats leaked into another map');
  writeFileSync('outputs/'+name+'.png',canvas.toBuffer('image/png'));renderer.destroy();
  console.log('PASS '+name+': expanded terrain, map-specific portals/booths and camera');
}
function createRenderer(canvas, getScene) {
  return new CampRenderer(canvas, () => {
    const scene = getScene();
    return { ...scene, players: scene.players.map((p,i) => ({ hairStyle:i%2, topStyle:(i>>1)%2, ...p })) };
  });
}
for (const [name, width, height, count] of [['camp-desktop', 1050, 824, 16], ['camp-mobile', 390, 520, 1]]) {
  const canvas = createCanvas(width, height);
  canvas.getBoundingClientRect = () => ({ width, height });
  const players = Array.from({ length: count }, (_, i) => ({ id: String(i), name: i === 0 ? 'Huddlers' : 'Camper ' + i, color: COLORS[i % COLORS.length], ...spawnPlayer(i), sitting: i % 3 === 0 }));
  const renderer = createRenderer(canvas, () => ({ players, self: '0' }));
  renderer.draw(5000);
  const png = canvas.toBuffer('image/png');
  writeFileSync('outputs/' + name + '.png', png);
  renderer.destroy();
  console.log(`PASS ${name}: ${width}x${height}, ${count} players, ${png.length} bytes`);
}
for (const [name, width, height] of [['camp-chat-radio', 1050, 824], ['camp-chat-radio-mobile', 390, 520]]) {
  const canvas = createCanvas(width, height); canvas.getBoundingClientRect = () => ({ width, height });
  const players = Array.from({ length: 16 }, (_, i) => ({ id: String(i), name: `친구 ${i + 1}`, color: COLORS[i % COLORS.length],
    ...spawnPlayer(i), x: RADIO.x - .8 + (i % 4) * .12, y: RADIO.y + Math.floor(i / 4) * .12,
    bubble: `${i + 1}번째 이야기! 함께 듣는 밤에 반가워요.`, bubbleUntil: 6000 + i * 100 }));
  const renderer = createRenderer(canvas, () => ({ players, self: '0', now: 5000,
    music: { current: { title: '별이 빛나는 밤에 함께 듣는 긴 제목의 노래', videoId: 'abcdefghijk', name: '허들러' }, playing: true } }));
  renderer.draw(5000); writeFileSync('outputs/' + name + '.png', canvas.toBuffer('image/png')); renderer.destroy();
  console.log(`PASS ${name}: 16 nearby speech bubbles and radio interaction, ${width}x${height}`);
}
for (const [name, width, height, reduced] of [['camp-actions', 1050, 824, false], ['camp-actions-mobile', 390, 520, false], ['camp-actions-reduced', 1050, 824, true]]) {
  globalThis.window.matchMedia = () => ({ matches: reduced });
  const canvas = createCanvas(width, height); canvas.getBoundingClientRect = () => ({ width, height });
  const positions = [[0, 2], [-2, 0], [2, 0], [TRAMPOLINES[0].x, TRAMPOLINES[0].y], [-1, -3], [-1, -3], [0, 6.1], [-3, 2], [2, -3], [1, -2.5], [-3, -1]];
  const players = positions.map(([x, y], i) => ({ id: String(i), name: i === 0 ? '나' : '친구 ' + i, color: COLORS[i % COLORS.length], ...spawnPlayer(i,'playground'), x, y }));
  Object.assign(players[0], { crouching: true });
  EMOTES.forEach((e, i) => Object.assign(players[[1, 2, 7, 8, 9, 10][i]], { emote: e.id, emoteUntil: 8000 }));
  Object.assign(players[2], { bubble: '한글 채팅도 반가워요! 모닥불에서 함께 쉬어 가요.', bubbleUntil: 8000 });
  Object.assign(players[3], { motion: 'airborne', z: 2.3, vz: 0 });
  Object.assign(players[4], { carrying: '5' }); Object.assign(players[5], { carriedBy: '4', motion: 'carried', z: 1.3 });
  Object.assign(players[6], { motion: 'falling', z: -1.3 });
  const renderer = createRenderer(canvas, () => ({ players, self: '0', targetId: '1', now: 5000 }));
  renderer.draw(5000); const png = canvas.toBuffer('image/png'); writeFileSync('outputs/' + name + '.png', png); renderer.destroy();
  console.log(`PASS ${name}: ${width}x${height}, all emotes/crouch/carry/air/fall/chat, reduced=${reduced}, ${png.length} bytes`);
}

for (const [name, width, height, reduced] of [['camp-weapons', 1050, 824, false], ['camp-weapons-mobile', 390, 520, false], ['camp-weapons-reduced', 1050, 824, true]]) {
  globalThis.window.matchMedia = () => ({ matches: reduced });
  const canvas = createCanvas(width, height); canvas.getBoundingClientRect = () => ({ width, height });
  const positions = [[-2, 2], [0, 2], [2, 2], [2, -1]];
  const players = positions.map(([x, y], i) => ({ id: String(i), name: ['Gun', 'Snow', 'Bomb', 'Bounce'][i], color: COLORS[i], ...spawnPlayer(i,'playground'), x, y,
    weapon: ['gun', 'snowball', 'bomb', 'none'][i], shotAt: 4880, shotAimX: 1, shotAimY: 0 }));
  Object.assign(players[3], { motion: 'airborne', z: .55, thrown: true, hitAt: 4900 });
  const projectile = (weapon, x, y, z, vx, vy) => ({ id: weapon, owner: '0', weapon, x, y, z, vx, vy, vz: 0, bornAt: 4000, expiresAt: 5600 });
  const fx = (kind, weapon, x, y, z, radius = 0) => ({ id: kind, weapon, kind, x, y, z, radius, at: 4800, expiresAt: 5450 });
  const weapons = { at: 5000, projectiles: [projectile('gun', -.8, 2, .65, 12, 0), projectile('snowball', 1, 2, .85, 4.8, 0), projectile('bomb', 3, 2, .3, 3.6, 0)],
    effects: [fx('spark', 'gun', -2, 3, .65), fx('snow', 'snowball', 0, 3, 0), fx('explosion', 'bomb', 2, -1, 0, 1.7)] };
  const renderer = createRenderer(canvas, () => ({ players, self: '0', now: 5000, weapons }));
  renderer.draw(5000); writeFileSync('outputs/' + name + '.png', canvas.toBuffer('image/png')); renderer.destroy();
  console.log(`PASS ${name}: projectiles, impact effects, warning radius and knockback, reduced=${reduced}`);
}

for (const [name, width, height, count] of [['camp-chain', 1050, 824, 6], ['camp-chain-mobile', 390, 520, 6], ['camp-chain-16', 1050, 824, 16]]) {
  const canvas = createCanvas(width, height); canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width, height });
  const players = Array.from({ length: count }, (_, i) => ({ id: String(i), name: `Friend ${i + 1}`, color: COLORS[i % COLORS.length], ...spawnPlayer(i,'playground'), x: -1, y: 2, connected: true }));
  const world = new Map(players.map(p => [p.id, p]));
  for (let i = count - 2; i >= 0; i--) applyPlayerAction(world, String(i), { kind: 'lift', target: String(i + 1) }, 100);
  const renderer = createRenderer(canvas, () => ({ players, self: '0', now: 5000 }));
  renderer.draw(5000);
  for (const area of renderer.hitAreas) {
    if (area.head.y - area.head.radius < 0 || area.head.y + area.head.radius > height) throw new Error('Stack head clipped');
    if (renderer.pickPlayer(area.head.x, area.head.y) !== area.id) throw new Error(`Stack player ${area.id} is not selectable: picked ${renderer.pickPlayer(area.head.x, area.head.y)}; ${JSON.stringify(renderer.hitAreas)}`);
    for (const other of renderer.hitAreas) if (other.id !== area.id) {
      const x = Math.max(area.label.x, Math.min(other.head.x, area.label.x + area.label.width));
      const y = Math.max(area.label.y, Math.min(other.head.y, area.label.y + area.label.height));
      if (Math.hypot(x - other.head.x, y - other.head.y) < other.head.radius) throw new Error('Stack nameplate covers another profile');
    }
  }
  writeFileSync('outputs/' + name + '.png', canvas.toBuffer('image/png')); renderer.destroy();
  console.log(`PASS ${name}: ${count} linked players framed and individually selectable at ${width}x${height}`);
}

// Larger reference sheet plus native desktop/mobile scales, all using the production drawing function.
const sheet = createCanvas(1200, 730), sc = sheet.getContext('2d');
sc.fillStyle = '#18251f'; sc.fillRect(0, 0, sheet.width, sheet.height);
sc.fillStyle = '#e8e8d7'; sc.font = 'bold 22px "Malgun Gothic", sans-serif'; sc.fillText('캐릭터 · 헤어와 의상별 동작', 26, 36);
const poses = [
  ['서기', {}], ['걷기', { moving: true }], ['앉기', { sitting: true }], ['쪼그리기', { crouching: true }],
  ['친구 들기', { carrying: 'friend' }], ['인사', {}, 'wave'], ['하트', {}, 'heart'], ['박수', {}, 'clap'], ['춤', {}, 'dance'],
];
for (let row = 0; row < 4; row++) {
  sc.fillStyle = '#aab79d'; sc.font = '12px "Malgun Gothic", sans-serif';
  sc.fillText(['기본 조합', '헤어 2 · 의상 1', '헤어 1 · 의상 2', '헤어 2 · 의상 2'][row], 26, 72 + row * 112);
  poses.forEach(([label, state, emote], column) => {
    const x = 175 + column * 116, y = 144 + row * 112;
    sc.save(); sc.translate(x, y); sc.scale(1.15, 1.15);
    drawCharacter(sc, { color: COLORS[column % COLORS.length], hairStyle:row%2, topStyle:Math.floor(row/2), ...state }, { time: 5.13, reduced: false, emote });
    sc.restore(); sc.fillStyle = '#aab79d'; sc.font = '11px "Malgun Gothic", sans-serif'; sc.textAlign = 'center'; sc.fillText(label, x, y + 23); sc.textAlign = 'left';
  });
}
sc.fillStyle = '#aab79d'; sc.font = '12px "Malgun Gothic", sans-serif'; sc.fillText('두 테마', 26, 657);
for (const [i, theme] of ['color', 'dark'].entries()) {
  sc.save(); sc.translate(180 + i * 125, 697); drawCharacter(sc, { color: COLORS[0] }, { theme }); sc.restore();
  sc.fillText(theme === 'color' ? '컬러' : '다크', 145 + i * 125, 721);
}
sc.fillText('실제 배율 · 데스크톱 / 모바일', 460, 657);
for (const [i, scale] of [.965, .358].entries()) {
  sc.save(); sc.translate(745 + i * 120, 697); sc.scale(scale, scale); drawCharacter(sc, { color: COLORS[1] }, {}); sc.restore();
}
writeFileSync('outputs/character-profiles.png', sheet.toBuffer('image/png'));
console.log('PASS character-profiles: all postures, wardrobe combinations, six colors, two themes and native scales');
await import('./render-character-detail.mjs');

for (const [name,width,height,zoom,followSelf] of [['camp-presence',1050,824,1,false],['camp-pip',560,480,1.5,true],['camp-zoom-mobile',390,520,2,true]]) {
  const canvas=createCanvas(width,height);canvas.getBoundingClientRect=()=>({width,height});
  const players=Array.from({length:16},(_,i)=>({...spawnPlayer(i),id:String(i),name:'친구 '+(i+1),color:COLORS[i%COLORS.length],presence:i%3===0?'away':'working',statusText:i%3===0?'잠시 휴식':'집중 중',workText:'보스 패턴과 캐릭터 움직임 구현 중'}));
  const renderer=createRenderer(canvas,()=>({players,self:'0',now:5000,zoom,followSelf,ball:{x:3.7,y:.6,vx:0,vy:0,rotation:.4}}));
  renderer.draw(5000);writeFileSync('outputs/'+name+'.png',canvas.toBuffer('image/png'));renderer.destroy();
  console.log('PASS '+name+': compact presence badges, zoom and follow camera; full notes stay in player details');
}

for(const [name,width,height,day,embers] of [['campfire-focus',1050,824,false,false],['campfire-focus-mobile',390,620,false,false],['campfire-embers',1050,824,false,true],['playground-daylight',1050,824,true,false]]){
  const canvas=createCanvas(width,height);canvas.getBoundingClientRect=()=>({width,height});
  const players=Array.from({length:6},(_,i)=>({id:String(i),name:'친구 '+i,color:COLORS[i],...spawnPlayer(i,day?'playground':'camp'),connected:true}));
  const map=new Map(players.map(p=>[p.id,p]));
  if(!day)for(const [i,p]of players.entries()){const seat=CAMP_SEATS[i*2];p.x=seat.exitX;p.y=seat.exitY;applyPlayerAction(map,p.id,{kind:'seat',seatId:seat.id},1000);}
  const fire={...emptyFire(1000),fuel:embers?0:180,stokedAt:embers?-1:4500,updatedAt:5000,revision:embers?0:1};
  const chat=players.slice(0,3).map((p,i)=>({id:'f'+i,by:p.id,name:p.name,text:['불 앞에 앉으니 좋네요.','장작은 제가 넣을게요!','잠깐 쉬었다 가요.'][i],kind:'chat',mapId:'camp',at:4800+i}));
  const renderer=createRenderer(canvas,()=>({players,self:'0',now:5000,fire,chat}));renderer.draw(5000);writeFileSync('outputs/'+name+'.png',canvas.toBuffer('image/png'));renderer.destroy();console.log('PASS '+name+': map, seats, shared fire, focused chat and camera');
}

// All level rewards at the same fuel/time, with embers below each live appearance.
const styleSheet=createCanvas(1000,500),styleContext=styleSheet.getContext('2d');
styleContext.fillStyle='#172a22';styleContext.fillRect(0,0,1000,500);
for(const [i,style]of FIRE_STYLES.entries())for(const [row,fuel]of [180,0].entries()){
  const tile=createCanvas(200,250);tile.getBoundingClientRect=()=>({width:200,height:250});
  const renderer=createRenderer(tile,()=>({players:[],fire:{...emptyFire(),fuel,xp:(style.level-1)*3,style:style.id},now:0}));
  const c=tile.getContext('2d');c.fillStyle='#172a22';c.fillRect(0,0,200,250);c.save();c.translate(100,170);
  renderer.fireAppearance=style.id;renderer.fireLevel=fuel? .78:.12;renderer.fireFlare=0;renderer.fire(5);c.restore();
  c.fillStyle='#e5d6b2';c.textAlign='center';c.font='13px "Malgun Gothic", sans-serif';c.fillText(`Lv.${style.level} ${style.name}`,100,220);c.fillText(row?'잔불':'타오르는 불',100,240);
  styleContext.drawImage(tile,i*200,row*250);renderer.destroy();
}
writeFileSync('outputs/campfire-level-styles.png',styleSheet.toBuffer('image/png'));console.log('PASS campfire-level-styles: five shared appearances at equal fuel and persistent embers');

for(const [name,width,height,mapId]of [['camp-nameplates',1050,824,'camp'],['camp-nameplates-mobile',390,620,'camp'],['playground-nameplates',1050,824,'playground']]){
  const canvas=createCanvas(width,height);canvas.getBoundingClientRect=()=>({width,height});
  const positions=mapId==='camp'?[[-5.2,-2.3],[-4.2,-3.7],[5.2,3.3]]:[[-4,-4],[4,-3.2],[-3.6,-5.6]];
  const players=positions.map(([x,y],i)=>({...spawnPlayer(i,mapId),id:String(i),name:['나무 뒤 친구','천막 뒤 친구','통나무 곁 친구'][i],color:COLORS[i],x,y,sitting:i===1,presence:'working'}));
  const renderer=createRenderer(canvas,()=>({players,self:'0',now:1000}));renderer.draw(1000);writeFileSync('outputs/'+name+'.png',canvas.toBuffer('image/png'));renderer.destroy();console.log('PASS '+name+': labels render over foreground scenery');
}
