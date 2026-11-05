// Loopback-only authoring surface, imported only by Vite serve.
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {ROOT,inside,readJSON,hash} from '../../tools/lib/sprite-spec.mjs';
export function materialPreviewPlugin(file){
  const manifestFile=inside(resolve(ROOT,'art/sprites/runs'),resolve(file)),dir=dirname(manifestFile),manifest=readJSON(manifestFile),build=readJSON(inside(dir,'materials-build.json'));
  for(const [id,f]of Object.entries(build.files)){manifest.files[id].url='/__material-preview/files/'+f.url.split('/').at(-1);}
  return {name:'camp-material-preview',enforce:'pre',
    transform(code,id){if(id.split('?')[0].replaceAll('\\','/').endsWith('/lib/camp-sprite-manifest.mjs'))return {code:'export const SPRITE_MANIFEST = '+JSON.stringify(manifest)+';',map:null};},
    configureServer(server){server.middlewares.use((req,res,next)=>{
      if(!req.url?.startsWith('/__material-preview'))return next();
      if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.statusCode=403;res.end();return;}
      const url=req.url.split('?')[0];
      if(url==='/__material-preview'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta charset="utf-8"><title>Camp material review</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}.world{position:relative;width:100%;height:100%}.world canvas{position:absolute;inset:0;width:100%;height:100%}</style></head><body><div class="world"><canvas data-camp-input tabindex="0"></canvas></div><script type="module" src="/tests/lighting-preview.mjs"></script></body></html>');return;}
      if(url==='/__material-preview/manifest'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(manifest));return;}
      if(url==='/__material-preview/identity'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({...build,previewManifestHash:hash(manifest)}));return;}
      const name=url.slice('/__material-preview/files/'.length),entry=Object.values(build.files).find(f=>f.url.split('/').at(-1)===name);
      if(!entry){res.statusCode=404;res.end();return;}res.setHeader('Content-Type','image/png');res.end(readFileSync(inside(dir,name)));
    });},
  };
}
