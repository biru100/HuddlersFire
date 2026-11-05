// App adapter over sprite-gen's composed atlas: anchors, packing and exact palette recipes.
// Generation, alpha extraction and frame selection remain owned by sprite-gen.
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,unlinkSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url))),run=resolve(root,process.argv[2]||'art/sprites/runs');
if(process.argv.includes('--job')){
  const {buildPreview}=await import('../../tools/lib/sprite-preview.mjs');console.log(JSON.stringify(await buildPreview(process.argv[process.argv.indexOf('--job')+1])));
}else{
const out=join(root,'web/public/sprites');mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=read(join(run,'camper/manifest.json'));
const atlas=await loadImage(join(run,'camper',manifest.game_input));
const sheet=createCanvas(atlas.width,atlas.height),ctx=sheet.getContext('2d');ctx.drawImage(atlas,0,0);
const digest=b=>createHash('sha256').update(b).digest('hex').slice(0,12);
const files={};
function save(id,bytes){const name=`${id}.${digest(bytes)}.png`;writeFileSync(join(out,name),bytes);files[id]={url:`/sprites/${name}`,bytes:bytes.length};return id;}
function bounds(data,w,h,predicate){let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(predicate(data,i,x,y)){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}if(x1<0)throw Error('Empty frame');return {x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};}
function lightParts(data,w,h){const seen=new Uint8Array(w*h),parts=[];const light=i=>data[i*4+3]>150&&data[i*4]>165&&data[i*4+1]>130&&data[i*4+2]>85&&data[i*4+1]/data[i*4]>.65&&data[i*4+2]/data[i*4]>.42;
for(let seed=0;seed<w*h;seed++){if(seen[seed]||!light(seed))continue;const q=[seed];seen[seed]=1;let n=0,x0=w,y0=h,x1=0,y1=0;for(let k=0;k<q.length;k++){const p=q[k],x=p%w,y=Math.floor(p/w);n++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy,at=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[at]&&light(at)){seen[at]=1;q.push(at);}}}if(n>5)parts.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,n});}return parts.sort((a,b)=>b.n-a.n);}
const character={states:{},variants:[],darkVariants:[]};
for(const [state,rects]of Object.entries(manifest.frame_layout.rows)){
const animation=manifest.animation.rows[state];
character.states[state]={fps:animation.fps,loop:animation.loop,durations:animation.durations_ms,frames:rects.map((rect,index)=>{
const {data}=ctx.getImageData(rect.x,rect.y,rect.w,rect.h),b=bounds(data,rect.w,rect.h,(d,i)=>d[i+3]>64),parts=lightParts(data,rect.w,rect.h),head=parts[0];
if(!head||head.w<20||head.h<20)throw Error(`Missing head ${state}/${index}`);
const radius=(head.w+head.h)/4+1.5,headX=head.x+head.w/2,headY=head.y+head.h/2;
return {...rect,bounds:b,feet:{x:headX,y:b.y+b.h},head:{x:headX,y:headY,radius},hands:parts.slice(1).filter(p=>p.n>10&&p.n<head.n*.3).map(p=>({x:p.x-2,y:p.y-2,w:p.w+4,h:p.h+4})),waist:headY+radius+(b.y+b.h-headY-radius)*.68};
})};}
const colors=['#dc754d','#399d88','#4e8dcc','#ab7bc2','#d4a53c','#df889f'];
const pixels=ctx.getImageData(0,0,atlas.width,atlas.height).data,unique=new Map();
for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>8){const rgb=[pixels[i],pixels[i+1],pixels[i+2]],key='#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');unique.set(key,rgb);}
const hex=rgb=>'#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const variants=[];
for(let slot=0;slot<6;slot++)for(const dark of [false,true]){const target=colors[slot].slice(1).match(/../g).map(v=>parseInt(v,16)),map={};for(const [key,[r,g,b]]of unique){const body=r>125&&g>55&&r>g*1.28&&g>b*1.2;let rgb=[r,g,b];if(body){const l=(r*.2126+g*.7152+b*.0722)/145;rgb=target.map(v=>v*l);}if(dark){const gray=body?76+slot*25+(r*.2126+g*.7152+b*.0722)*.22:r*.2126+g*.7152+b*.0722;rgb=[gray,gray,gray];}const value=hex(rgb);if(value!==key)map[key]=value;}variants.push({name:`camper-${dark?'dark-':''}${slot}`,map});}
const spec=join(run,'camper/recolor.spec.json');writeFileSync(spec,JSON.stringify({version:1,kind:'sprite-gen-recolor',match:'exact',tolerance:0,variants}));
// sprite-gen's exact recolorer scans the sheet once per source color. A painted
// atlas has tens of thousands of colors; apply the SAME explicit map in one pass.
// This is an app-owned palette adapter, not a claimed sprite-gen pipeline stage.
const paletteReports=[];
for(let slot=0;slot<6;slot++)for(const dark of [false,true]){const id=`camper-${dark?'dark-':''}${slot}`,variant=variants.find(v=>v.name===id),lookup=new Map(Object.entries(variant.map).map(([key,value])=>[parseInt(key.slice(1),16),value.slice(1).match(/../g).map(v=>parseInt(v,16))]));
const tinted=createCanvas(atlas.width,atlas.height),t=tinted.getContext('2d'),image=t.createImageData(atlas.width,atlas.height);image.data.set(pixels);let changed=0;
for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<=8)continue;const value=lookup.get((pixels[i]<<16)|(pixels[i+1]<<8)|pixels[i+2]);if(value){image.data[i]=value[0];image.data[i+1]=value[1];image.data[i+2]=value[2];changed++;}}
t.putImageData(image,0,0);save(id,tinted.toBuffer('image/png'));files[id].width=atlas.width;files[id].height=atlas.height;character[dark?'darkVariants':'variants'].push(id);paletteReports.push({id,changedPixels:changed,alphaPreserved:true,mapEntries:lookup.size});}
writeFileSync(join(run,'camper/app-palette-report.json'),JSON.stringify({method:'app exact RGB lookup; sprite-gen recolor spec semantics',variants:paletteReports},null,2));
const sprites={};
for(const [group,prefix,cell,cols]of [['environment','prop_',256,4],['effects','fx_',192,4]]){
const names=readdirSync(join(run,group)).filter(n=>n.startsWith(prefix)&&n.endsWith('.png')).sort();
const packed=createCanvas(cell*cols,cell*Math.ceil(names.length/cols)),c=packed.getContext('2d');
for(let i=0;i<names.length;i++){const img=await loadImage(join(run,group,names[i]));c.drawImage(img,(i%cols)*cell,Math.floor(i/cols)*cell);const single=createCanvas(cell,cell),s=single.getContext('2d');s.drawImage(img,0,0);const {data}=s.getImageData(0,0,cell,cell),b=bounds(data,cell,cell,(d,j)=>d[j+3]>64);sprites[names[i].slice(prefix.length,-4)]={sheet:group,x:(i%cols)*cell+b.x,y:Math.floor(i/cols)*cell+b.y,w:b.w,h:b.h};}
save(group,packed.toBuffer('image/png'));files[group].width=packed.width;files[group].height=packed.height;
const gray=createCanvas(packed.width,packed.height),g=gray.getContext('2d');g.filter='grayscale(1)';g.drawImage(packed,0,0);save(group+'-dark',gray.toBuffer('image/png'));files[group+'-dark'].width=packed.width;files[group+'-dark'].height=packed.height;
}
for(const name of ['grass','sand','stone']){const img=await loadImage(join(run,'terrain',name+'.png'));const tile=createCanvas(img.width,img.height),c=tile.getContext('2d');c.drawImage(img,0,0);save(name,tile.toBuffer('image/png'));files[name].width=img.width;files[name].height=img.height;c.filter='grayscale(1) brightness(0.38)';c.drawImage(img,0,0);save(name+'-dark',tile.toBuffer('image/png'));files[name+'-dark'].width=img.width;files[name+'-dark'].height=img.height;}
const data={version:1,revision:'illustrated-camp-v1',sourceCommit:read(join(root,'tools/sprite-gen.lock.json')).commit,files,sprites,character};
const sourceDir=join(root,'art/sprites/source');
writeFileSync(join(root,'art/sprites/source-manifest.json'),JSON.stringify({toolCommit:data.sourceCommit,recipe:'tools/rebuild-sprites.mjs',sources:readdirSync(sourceDir).filter(n=>n.endsWith('.png')).sort().map(name=>{const bytes=readFileSync(join(sourceDir,name));return {name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};})},null,2));
writeFileSync(join(out,'manifest.json'),JSON.stringify(data,null,2));
// Remove only superseded files owned by this builder, directly inside its output directory.
const keep=new Set(Object.values(files).map(f=>f.url.split('/').at(-1)));
for(const name of readdirSync(out))if(/^(camper-(dark-)?[0-5]|environment(-dark)?|effects(-dark)?|grass(-dark)?|sand(-dark)?|stone(-dark)?)\.[a-f0-9]{12}\.png$/.test(name)&&!keep.has(name))unlinkSync(join(out,name));
writeFileSync(join(root,'web/lib/camp-sprite-manifest.mjs'),'// Generated by scripts/build-sprite-assets.mjs. Do not edit frame coordinates.\nexport const SPRITE_MANIFEST = '+JSON.stringify(data)+';\n');
copyFileSync(join(root,'tools/sprite-gen/LICENSE'),join(out,'sprite-gen-LICENSE.txt'));
copyFileSync(join(root,'tools/sprite-gen/NOTICE'),join(out,'sprite-gen-NOTICE.txt'));
writeFileSync(join(out,'CREDITS.txt'),'HuddlersFire illustrated assets: generated with built-in image_gen for this project.\nExtraction, composition and terrain quilting: aldegad/sprite-gen, Apache-2.0, pinned in tools/sprite-gen.lock.json.\nApp adapter: frame anchors, atlas packing, exact RGB character palette lookup and environment dark-mode grading.\nDiscord avatars and game exhibition images are external content and are not part of these generated assets.\n');
console.log(JSON.stringify({states:Object.keys(character.states).length,frames:Object.values(character.states).reduce((n,s)=>n+s.frames.length,0),sprites:Object.keys(sprites).length,files:Object.keys(files).length,totalBytes:Object.values(files).reduce((n,f)=>n+f.bytes,0)},null,2));
}
