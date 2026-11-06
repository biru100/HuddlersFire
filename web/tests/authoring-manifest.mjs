// Test-only injection lets the existing regression suite exercise a complete staged
// release before the visual review gate installs its production manifest.
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
const input=process.env.CAMP_TEST_MANIFEST;
if(input){const root=fileURLToPath(new URL('../..',import.meta.url)),file=resolve(input),path=relative(root,file);if(path.startsWith('..')||isAbsolute(path))throw Error('Authoring test manifest must stay inside project');const data=JSON.parse(readFileSync(file,'utf8'));registerHooks({load(url,context,next){if(url.split('?')[0].endsWith('/lib/camp-sprite-manifest.mjs'))return {format:'module',shortCircuit:true,source:'export const SPRITE_MANIFEST = '+JSON.stringify(data)+';'};return next(url,context);}});}
