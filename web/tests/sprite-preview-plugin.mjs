// Dev-only file substitution; no preview route or job data enters a production build.
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {ROOT,inside,readJSON,loadJob} from '../../tools/lib/sprite-spec.mjs';
export function spritePreviewPlugin(jobFile){
  const file=inside(resolve(ROOT,'art/sprites/runs'),resolve(jobFile)),dir=dirname(file);loadJob(file);
  const built=readJSON(inside(dir,'build/preview.json')),manifest=readJSON(inside(dir,'build/manifest.json'));
  return{name:'camp-authoring-preview',enforce:'pre',
    transform(code,id){if(id.split('?')[0].replaceAll('\\','/').endsWith('/lib/camp-sprite-manifest.mjs'))return {code:'export const SPRITE_MANIFEST = '+JSON.stringify(manifest)+';',map:null};},
    configureServer(server){server.middlewares.use((req,res,next)=>{
      if(!req.url?.startsWith('/__sprite-preview/'))return next();
      if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.statusCode=403;res.end();return;}
      if(req.url==='/__sprite-preview/identity'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({fingerprint:built.fingerprint,manifestHash:built.manifestHash,selected:manifest.preview.selected}));return;}
      const name=req.url.slice('/__sprite-preview/files/'.length).split('?')[0];
      if(!Object.values(manifest.files).some(f=>f.url==='/__sprite-preview/files/'+name)){res.statusCode=404;res.end();return;}
      res.setHeader('Content-Type','image/png');res.end(readFileSync(inside(dir,'build/'+name)));
    });},
  };
}
