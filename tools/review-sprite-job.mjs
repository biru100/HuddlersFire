import {verifyReview} from './lib/sprite-spec.mjs';
import {readFileSync} from 'node:fs';
const args=process.argv.slice(2),get=key=>args[args.indexOf(key)+1];
if(!args.includes('--job')||!args.includes('--review'))throw Error('Expected --job and --review');
const pixel=JSON.parse(readFileSync(get('--job'),'utf8')).kind==='pixel-quarterview';
console.log(JSON.stringify(pixel?(await import('./lib/pixel-assets.mjs')).verifyPixelReview(get('--job'),get('--review')):verifyReview(get('--job'),get('--review')),null,2));
