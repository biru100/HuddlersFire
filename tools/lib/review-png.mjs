import {readFileSync} from 'node:fs';
import {hash} from './sprite-spec.mjs';

export function reviewPng(file,width,height){
  const bytes=readFileSync(file);
  if(bytes.length<33||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||
    bytes.toString('ascii',12,16)!=='IHDR'||bytes.readUInt32BE(16)!==width||bytes.readUInt32BE(20)!==height){
    throw Error('Invalid PNG or capture dimensions: '+file);
  }
  return hash(bytes);
}
