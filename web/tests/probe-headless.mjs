import {headlessBrowser} from './browser-cdp.mjs';
console.log('Starting isolated headless probe');
try{const browser=await headlessBrowser();try{console.log(JSON.stringify(await browser.evaluate('({width:innerWidth,webgl:!!document.createElement("canvas").getContext("webgl2")})')));}finally{await browser.close();}}catch(error){console.error(error.message);process.exitCode=1;}
