"""One-time, exact-input source migration. No asset drawing or runtime changes."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[2]
expected={'tools/lib/idle-composite.mjs':'473c72629f9f86bee546b6003a9658d581cd034c7f304258dae3c2ea83afcee1','tools/lib/idle-checks.mjs':'379a5238745105710a51ebf5addaa340579c1f60d9df0c09fe1e641d6749abf2','tools/idle-frames.mjs':'cbdc11838a602005c7c69bfe8e76418dad269c6206b633d5cc69aac06c019920','web/package.json':'9e39d2c54175fb6ac513013899dd86113fcf53f456b6771ed664a19832a7c2a5'}
for name,digest in expected.items():
    assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest, 'Source changed before migration: '+name

def replace_once(s,a,b):
    assert s.count(a)==1, 'Expected one patch anchor: '+a[:80]
    return s.replace(a,b,1)

p=root/'tools/lib/idle-composite.mjs';s=p.read_text()
s=replace_once(s,"const {w,h,allowed,regions}=compileIdlePlan(plan);assert.ok(plan.composition,'Explicit composition plan required');","const {w,h,allowed:envelope,regions}=compileIdlePlan(plan);assert.ok(plan.composition,'Explicit composition plan required');\n  const guardSource=plan.composition.guardSource??'generated';\n  assert.ok(['generated','anchor'].includes(guardSource),'Unknown guard source');")
s=replace_once(s,'let core=Uint8Array.from(allowed);','let core=Uint8Array.from(envelope);')
s=replace_once(s,"const guard=Uint8Array.from(allowed,(v,i)=>v&&!core[i]?1:0);\n  return {w,h,allowed,regions,core,guard};","const guard=Uint8Array.from(envelope,(v,i)=>v&&!core[i]?1:0);\n  // Existing plans select the full envelope. New explicit plans select only core.\n  const allowed=guardSource==='anchor'?core:envelope;\n  return {w,h,allowed,envelope,regions,core,guard,guardSource};")
s=replace_once(s,'const {w,h,allowed,regions,core,guard}=compositeMasks(plan);','const {w,h,allowed,envelope,regions,core,guard,guardSource}=compositeMasks(plan);')
s=replace_once(s,'const m=compareIdleRegion(anchor,source,r.indices);return {id:r.id,...m,budgetPassed:',"const m=compareIdleRegion(anchor,guardSource==='anchor'?output:source,r.indices);return {id:r.id,...m,budgetPassed:")
s=replace_once(s,"if(guardCheck.rawChangedPixels)blockers.push('source_guard_band_differs_from_anchor');","if(guardSource==='generated'&&guardCheck.rawChangedPixels)blockers.push('source_guard_band_differs_from_anchor');")
s=replace_once(s,'sourceInsideMask:inside,sourceOutsideMask:',"sourceInsideMask:inside,guardPolicy:guardSource==='anchor'?'anchor-guard-core-only':'source-guard-exact-match',\n    ...(guardSource==='anchor'?{sourceEnvelope:compareIdleRegion(anchor,source,envelope),sourceGuardExcluded:{...guardCheck,disposition:'Preserved raw source differences; excluded by the predeclared anchor-guard contract'},compositeGuard:compareIdleRegion(anchor,output,guard),sourceRegionMeasurements:regions.map(r=>({id:r.id,...compareIdleRegion(anchor,source,r.indices)}))}:{}),\n    sourceOutsideMask:")
s=replace_once(s,'guardBandPx:plan.composition.guardBandPx,guardBandComparison:guardCheck,innerEdgeSamples',"guardBandPx:plan.composition.guardBandPx,guardBandComparison:guardCheck,...(guardSource==='anchor'?{guardPixelSource:'anchor',compositeGuardComparison:compareIdleRegion(anchor,output,guard)}:{}),innerEdgeSamples")
p.write_text(s)
p=root/'tools/lib/idle-checks.mjs';s=p.read_text();s=replace_once(s,"assert.ok(ids.has('hair-whole'),'Masked upper-body plan must lock all hair');","assert.ok(ids.has('hair-whole'),'Masked upper-body plan must lock all hair');\n    assert.ok(c.guardSource===undefined||['generated','anchor'].includes(c.guardSource),'Unknown guard source');");p.write_text(s)
p=root/'tools/idle-frames.mjs';s=p.read_text()
s=replace_once(s,"import {verifyRegistry} from './art-source-registry.mjs';","import {verifyRegistry} from './art-source-registry.mjs';\nimport {coreFrameRequest,coreFrameRequestText,coreRegionNotes} from './lib/idle-core-request.mjs';")
s=replace_once(s,'function requestFor(job,frame){\n',"function requestFor(job,frame){\n  if(job.version===2&&job.regionComposition.guardSource==='anchor')return coreFrameRequest(job,frame);\n")
s=replace_once(s,'function requestText(request){\n',"function requestText(request){\n  if(request.composition?.guardSource==='anchor')return coreFrameRequestText(request);\n")
a="  for(const frame of IDLE_FRAMES.slice(1)){const request=requestFor(job,frame);save(join(dir,'motion-plan/'+frame.id+'-request.json'),request,true);"
s=replace_once(s,a,"  if(composition?.guardSource==='anchor')writeFileSync(join(dir,'motion-plan/REGION_LOCKS.md'),coreRegionNotes(job));\n"+a);p.write_text(s)
p=root/'web/package.json';d=json.loads(p.read_text());d['scripts']['test:idle-core-selection']='node --test tests/idle-core-selection.test.mjs'
for key in ['test','test:sprites:pipeline','test:idle-frames']:
    d['scripts'][key]+=' tests/idle-core-selection.test.mjs'
p.write_text(json.dumps(d,indent=2)+'\n')
for name,marker,link in [('AGENTS.md','## Current animation graphics workflow','docs/briefs/rounded-02/idle-core03-preflight.md'),('.agents/skills/camp-animation-art/SKILL.md','# ChatGPT 애니메이션','../../../docs/briefs/rounded-02/idle-core03-preflight.md'),('docs/briefs/rounded-02/idle-frame-workflow.md','2026-11-08 활성 절차.','idle-core03-preflight.md')]:
    p=root/name;s=p.read_text();assert marker in s
    note='## Active core plan 03 (2026-11-08)\n\n[Current preflight]('+link+') is the new-job workflow. ChatGPT can perform artwork, review, repository changes and deterministic tests here; Codex is optional. Frozen CORE uses generated RGBA; guard/outside use f1. Raw discarded differences remain reported. Legacy plans are preserved. No main merge, game execution, runtime art replacement or deployment in this task.\n\n'
    p.write_text(s.replace(marker,note+marker,1))
print('Applied core03 migration to exact expected source files')
