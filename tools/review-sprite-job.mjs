import {verifyReview} from './lib/sprite-spec.mjs';
import {readFileSync} from 'node:fs';
import {verifyArtReview,verifyPixelArtApproval} from './lib/art-direction.mjs';
const args=process.argv.slice(2),get=key=>{const i=args.indexOf(key);if(i<0||!args[i+1]||args[i+1].startsWith('--'))throw Error(key+' requires a value');return args[i+1];};
const file=get('--job'),reviewFile=get('--review'),job=JSON.parse(readFileSync(file,'utf8'));
let result;
if(job.kind==='art-direction')result=verifyArtReview(file,reviewFile);
else if(job.kind==='pixel-quarterview'){
  // Keep the existing scene/feature evidence gate; require aesthetic lineage in addition.
  result=(await import('./lib/pixel-assets.mjs')).verifyPixelReview(file,reviewFile);
  verifyPixelArtApproval(job,JSON.parse(readFileSync(reviewFile,'utf8')));
}else result=verifyReview(file,reviewFile);
console.log(JSON.stringify(result,null,2));
