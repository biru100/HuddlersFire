import {verifyReview} from './lib/sprite-spec.mjs';
const args=process.argv.slice(2),get=key=>args[args.indexOf(key)+1];
if(!args.includes('--job')||!args.includes('--review'))throw Error('Expected --job and --review');
console.log(JSON.stringify(verifyReview(get('--job'),get('--review')),null,2));
