// Rebuild the production environment atlas from the selected review and the new NE view.
import {createCanvas, loadImage} from '@napi-rs/canvas';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const selected = 'art/sprites/scene-reviews/camp-circle-se';
const release = 'art/sprites/camp-clearing-release';
const open = file => loadImage(readFileSync(join(root,file)));
const [nw, ne, ground] = await Promise.all([
  open(selected+'/game/bench.png'), open(release+'/bench-ne-source.png'), open(selected+'/originals/ground.png')
]);
const width = 352, height = 312;
const atlases = ['camp-clearing-art','camp-clearing-art-dark','normal-camp-clearing-art']
  .map(id=>({id,canvas:createCanvas(width,height)}));
const clamp = (value,lo,hi) => Math.max(lo,Math.min(hi,value));
function raster(image, crop, w, h) {
  const canvas = createCanvas(w,h), c = canvas.getContext('2d');
  c.imageSmoothingQuality = 'high';
  c.drawImage(image,...crop,0,0,w,h);
  return c.getImageData(0,0,w,h);
}
function storeFrame(input, left, top, transform, terrain=false) {
  const {width:w,height:h,data} = input;
  const frames = atlases.map(({canvas})=>canvas.getContext('2d').createImageData(w,h));
  const light = (x,y) => {
    const i = (clamp(x,0,w-1)+clamp(y,0,h-1)*w)*4;
    return data[i]*.3+data[i+1]*.58+data[i+2]*.12;
  };
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const i = (y*w+x)*4, [r,g,b,a] = transform(data[i],data[i+1],data[i+2],data[i+3],x,y);
    if (!a) continue;
    const tone = Math.round((r*.31+g*.57+b*.12)/3)*3;
    const quant = value => clamp(Math.round(value/5)*5,0,255);
    frames[0].data.set([quant(r),quant(g),quant(b),a],i);
    frames[1].data.set([tone,tone,tone,a],i);
    // Subtle relief on grain, stronger bevel on the boundary of the timber.
    const bump = terrain?.42:.83, slope = value => Math.round(clamp(value,-55,55)/5)*5;
    frames[2].data.set([128+slope((light(x-1,y)-light(x+1,y))*bump),
      (terrain?177:153)+slope((light(x,y+1)-light(x,y-1))*bump),terrain?244:248,a],i);
  }
  atlases.forEach(({canvas}, i)=>canvas.getContext('2d').putImageData(frames[i],left,top));
}
for (const [col,input] of [raster(nw,[0,0,110,68],110,68),raster(ne,[293,40,1233,816],110,68)].entries()) {
  for (const weathered of [0,1]) storeFrame(input,col*110,weathered*68,(r,g,b,a)=>{
    const lum = r*.31+g*.57+b*.12;
    return weathered ? [r*.68+lum*.32+6,g*.70+lum*.30+7,b*.70+lum*.30+8,a>112?255:0] : [r,g,b,a>112?255:0];
  });
}
const diamond = raster(ground,[64,16,1644,854],176,88);
const tile = createCanvas(176,88).getContext('2d').createImageData(176,88);
// Wrap the diamond into a continuous patch before adding the irregular clearing boundary.
for (let y=0;y<88;y++) for (let x=0;x<176;x++) {
  let u=(x+.5-88)/88, v=(y+.5-44)/44;
  if (Math.abs(u)+Math.abs(v)>1) {u-=Math.sign(u); v-=Math.sign(v);}
  const from=(Math.floor(44+v*40)*176+Math.floor(88+u*81))*4;
  tile.data.set(diamond.data.subarray(from,from+4),(y*176+x)*4);
}
const tones = {moss:[161,160,94], soil:[213,166,111], ash:[154,139,120]};
for (const [index, [kind, color]] of Object.entries(tones).entries()) {
  storeFrame(tile,(index%2)*176,136+Math.floor(index/2)*88,(r,g,b,a,x,y)=>{
    const u=(x+.5-88)/88, v=(y+.5-44)/44;
    const angle=Math.atan2(v,u), rim=1+.075*Math.sin(3*angle+.7)+.04*Math.sin(5*angle-.9);
    const edge=1-Math.hypot(u,v)/rim;
    const wobble=.045*Math.sin(y*.25+x*.045)+.018*Math.cos(x*.11-y*.13);
    let coverage=clamp((edge+wobble-.045)/.76,0,1);
    coverage*=coverage*(3-2*coverage);
    const lum = r*.3+g*.58+b*.12, contrast=(lum-111)*(kind==='ash'?1.12:1.30);
    // Keep the olive leaves and ochre stones distinct in the moss version.
    const chroma=kind==='moss'?.38:.09;
    return [color[0]+contrast+(r-lum)*chroma, color[1]+contrast+(g-lum)*chroma,
      color[2]+contrast+(b-lum)*chroma, Math.round(a*coverage/12)*12];
  },true);
}
// Native-scale highlights keep the tufts and stones from disappearing under the night grade.
const details = [
  {name:'grass', colors:['#605d3d','#82894e','#b4b576','#d1c581'], rows:[
    '..............','........2.....','..3....22...2.','..23...22..21.','...23.231.21..','...12321121...',
    '....12212113..','.....111211...','...000011100..','.......00.....']},
  {name:'stones', colors:['#61554b','#8d8072','#bcad92','#e0d0ad'], rows:[
    '..............','.....233......','....23332.....','...3222221....','...2221111..2.',
    '....11000..321','...0000....110','............0.','..............','..............']},
  {name:'ash', colors:['#665b55','#8d7767','#ad9881','#c1ab94'], rows:[
    '..............','..............','..22.......2..','.221......11..','..10..32......',
    '......21......','.........1....','..............','..............','..............']}
];
for (const [index,{colors,rows}] of details.entries()) {
  const canvas = createCanvas(14,10), c = canvas.getContext('2d');
  rows.forEach((row,y)=>[...row].forEach((char,x)=>{
    if (char!=='.') {c.fillStyle=colors[Number(char)];c.fillRect(x,y,1,1);}
  }));
  storeFrame(c.getImageData(0,0,14,10),224+index*14,0,(r,g,b,a)=>[r,g,b,a],true);
}
const files={};
for (const {id,canvas} of atlases) {
  // Quantize the exchange PNG once offline, keeping the client transfer below the scene budget.
  const data=await sharp(canvas.toBuffer('image/png')).png({palette:true,colours:256,dither:0,effort:7}).toBuffer();
  const sha256=createHash('sha256').update(data).digest('hex'), file=id+'.'+sha256.slice(0,12)+'.png';
  writeFileSync(join(root,'web/public/sprites',file),data);
  files[id]={url:'/sprites/'+file,width,height,bytes:data.length,sha256,sampling:'nearest'};
}
writeFileSync(join(root,'web/lib/camp-clearing-files.mjs'),
  '// Generated by web/scripts/build-camp-clearing-art.mjs.\nexport const CAMP_CLEARING_FILES = '+JSON.stringify(files,null,2)+';\n');
console.log(Object.values(files).map(f=>f.url+' ('+f.bytes+' B)').join('\n'));
