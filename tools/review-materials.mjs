import {resolve} from 'node:path';
import {verifyMaterialReview} from './lib/material-review.mjs';
const [dir,file,...args]=process.argv.slice(2);if(!dir||!file)throw Error('Usage: node tools/review-materials.mjs <job-directory> <review.json> [--scope prototype]');
console.log(JSON.stringify(verifyMaterialReview(resolve(dir),resolve(file),{scope:args.includes('--scope')?args[args.indexOf('--scope')+1]:'full'})));
