#!/usr/bin/env node
// Separate generation/pixel-master/frame-edit gates for HuddlersFire.
// No image model, forced pixelization, resampling, runtime writes, or deployment.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadIdleFrames,decodeIdlePng,receiveIdleFrame,composeIdleFrame,inspectIdleFrames,assembleIdleFrames} from './idle-frames.mjs';
import {ACTIVE_NW_CORE03,sha256,inspectPngHeader,evaluateConceptSource,evaluatePixelMaster,evaluateFrameCandidate,stageOverview,ART_PENDING} from './lib/art-production-stages.mjs';

const ROOT=fileURLToPath(new URL('..',import.meta.url));
function opt(args,key){const i=args.indexOf(key);if(i<0)return null;const v=args[i+1];if(!v||v.startsWith('--'))throw Error(key+' needs a value');return v;}
function requireOpt(args,key){const value=opt(args,key);if(!value)throw Error('Missing '+key);return value;}
function saveReport(result,name){if(!name)return;writeFileSync(resolve(name),JSON.stringify(result,null,2)+'\n',{flag:'wx'});}
function phaseSource(jobFile,args){
  const {job,dir,plan,manifest,confirmed}=loadIdleFrames(jobFile);
  if(job.version!==2||plan.composition?.guardSource!=='anchor'||!job.composition?.maskSha256)throw Error('Current split-stage frame workflow requires an explicit anchor-guard CORE plan');
  const frame=requireOpt(args,'--frame');
  if(!['f2','f3','f4'].includes(frame))throw Error('Only f2/f3/f4 are supported');
  const sourceFile=resolve(requireOpt(args,'--source'));
  const receiptFile=resolve(requireOpt(args,'--receipt'));
  const sourceBytes=readFileSync(sourceFile);
  const anchorFile=join(dir,'base/frame01-anchor.png'),anchorBytes=readFileSync(anchorFile),receipt=JSON.parse(readFileSync(receiptFile,'utf8'));
  // Gate cheap IHDR/digest first. A mismatched generator canvas is never fixed or decoded as a compliant frame.
  const candidateHeader=inspectPngHeader(sourceBytes);
  const anchorHeader=inspectPngHeader(anchorBytes);
  let sourcePixels=null,anchorPixels=null,decodeError=null;
  if(candidateHeader.valid&&anchorHeader.valid&&candidateHeader.canvas.join(',')===job.canvas.join(',')){
    try{sourcePixels=decodeIdlePng(sourceFile).data;anchorPixels=decodeIdlePng(anchorFile).data;}
    catch(err){decodeError=String(err.message||err);}
  }
  const result=evaluateFrameCandidate({job,plan,frame,sourceBytes,anchorBytes,sourcePixels,anchorPixels,receipt});
  if(decodeError){result.blockers.push('png_decoder_rejected_source');result.technicalStatus='blocked';result.decoderError=decodeError;}
  if(!confirmed){result.blockers.push('core03_plan_unconfirmed');result.technicalStatus='blocked';}
  result.planConfirmed=confirmed;
  result.sourcePath=sourceFile;
  result.sourceBytes=sourceBytes.length;
  result.receiptSha256=sha256(readFileSync(receiptFile));
  result.method=receipt.technique??null;
  result.originalBytesPreserved=true;
  result.passedTechGate=result.technicalStatus==='ready_for_explicit_technical_intake';
  return {result,job,dir,frame,sourceFile,receipt,manifest};
}
function main(){
  const [command,...args]=process.argv.slice(2),jobFile=opt(args,'--job')??ACTIVE_NW_CORE03;
  let output=null;
  if(command==='audit-concept'){
    const bytes=readFileSync(resolve(requireOpt(args,'--source')));
    output=evaluateConceptSource({sourceBytes:bytes,sourceReference:requireOpt(args,'--source-reference'),toolOrEditor:requireOpt(args,'--tool')});
  }else if(command==='status'){
    const {job,manifest,confirmed}=loadIdleFrames(jobFile);
    output=stageOverview({job,manifest,confirmed});
  }else if(command==='audit-master'){
    const newMaster=opt(args,'--expected-sha')||opt(args,'--canvas');
    if(newMaster){
      const raw=requireOpt(args,'--canvas'),canvas=raw.split(/[x×,]/).map(Number);
      if(canvas.length!==2||canvas.some(v=>!Number.isInteger(v)||v<1))throw Error('--canvas must be WIDTHxHEIGHT');
      const bytes=readFileSync(resolve(requireOpt(args,'--source')));
      output=evaluatePixelMaster({sourceBytes:bytes,expectedSha256:requireOpt(args,'--expected-sha'),canvas});
      output.designApproval='not_recorded';
    }else{
      const {job,dir}=loadIdleFrames(jobFile),source=opt(args,'--source')??join(dir,'base/frame01-anchor.png');
      const bytes=readFileSync(resolve(source));
      output=evaluatePixelMaster({sourceBytes:bytes,expectedSha256:job.anchorSha256,canvas:job.canvas});
      output.designApproval='existing-approved-lookdev-only';
    }
    output.originalBytesPreserved=true;
  }else if(command==='check-frame'||command==='intake-frame'){
    const assessed=phaseSource(jobFile,args);output=assessed.result;
    if(command==='intake-frame'&&output.passedTechGate){
      if(assessed.manifest.originals.some(e=>e.slot===assessed.frame))throw Error('Frame already registered; use new source set');
      const proof=join(assessed.dir,'review/'+assessed.frame+'-stage-intake.json');
      if(existsSync(proof))throw Error('Stage intake proof already exists; no overwriting');
      const receipt=assessed.receipt;
      const intake=receiveIdleFrame(jobFile,{frame:assessed.frame,source:assessed.sourceFile,sourceReference:receipt.sourceReference,anchorSha256:assessed.job.anchorSha256,stageReceipt:resolve(requireOpt(args,'--receipt'))});
      writeFileSync(proof,JSON.stringify({stage:'frame-edit',technique:receipt.technique,receiptSha256:output.receiptSha256,sourceSha256:intake.sha256,
        anchorSha256:assessed.job.anchorSha256,planSha256:assessed.job.planSha256,maskSha256:assessed.job.composition.maskSha256,
        technicalGate:output,operations:['lossless-intake-only'],...ART_PENDING},null,2)+'\n',{flag:'wx'});
      output={...output,intake,stageProof:proof};
    }
  }else if(command==='compose-frame'){
    output=composeIdleFrame(jobFile,{frame:requireOpt(args,'--frame')});
  }else if(command==='inspect'){
    output=inspectIdleFrames(jobFile);
  }else if(command==='assemble-reference'){
    output=assembleIdleFrames(jobFile);
  }else throw Error('Usage: node tools/art-production.mjs audit-concept|status|audit-master|check-frame|intake-frame|compose-frame|inspect|assemble-reference [--job PATH] [--frame f2] [--source ORIGINAL.png --receipt RECEIPT.json] [--report FILE]');
  saveReport(output,opt(args,'--report'));
  process.stdout.write(JSON.stringify(output,null,2)+'\n');
  if(output.technicalStatus==='blocked')process.exitCode=2;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main();
