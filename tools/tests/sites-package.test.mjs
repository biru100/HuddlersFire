import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {SITE_ID,verifyExistingSitesPackage} from "../check-sites-package.mjs";
function fixture(t,{built=false}={}){
  const root=mkdtempSync(join(tmpdir(),"hf-existing-sites-"));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const conf={d1:"DB",r2:null,project_id:SITE_ID};
  const write=(p,data)=>{const dest=join(root,p);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,data);};
  const sql="CREATE TABLE test (id TEXT PRIMARY KEY);";
  write("web/.openai/hosting.json",JSON.stringify(conf));
  write("web/drizzle/0000_init.sql",sql);
  if(built){write("web/dist/.openai/hosting.json",JSON.stringify(conf));write("web/dist/.openai/drizzle/0000_init.sql",sql);write("web/dist/server/wrangler.json","{}");}
  return {root,conf,write};
}
test("existing project and DB binding are read without claiming publication",t=>{
  const f=fixture(t),report=verifyExistingSitesPackage(f.root,{requireBuild:false});
  assert.equal(report.project_id,SITE_ID);assert.equal(report.d1,"DB");assert.equal(report.published,false);assert.equal(report.versionSaved,false);
});
test("project ID or DB binding swaps are blocked",t=>{
  const f=fixture(t);f.write("web/.openai/hosting.json",JSON.stringify({...f.conf,project_id:"appgprj_new"}));
  assert.throws(()=>verifyExistingSitesPackage(f.root,{requireBuild:false}),/different Sites project/);
  f.write("web/.openai/hosting.json",JSON.stringify({...f.conf,d1:"OTHER"}));
  assert.throws(()=>verifyExistingSitesPackage(f.root,{requireBuild:false}),/D1 binding has changed/);
});
test("missing version packaging is rejected",t=>{
  const f=fixture(t);
  assert.throws(()=>verifyExistingSitesPackage(f.root),/closeBundle metadata not found/);
});
test("complete package retains original project, migrations and server output",t=>{
  const f=fixture(t,{built:true}),report=verifyExistingSitesPackage(f.root);
  assert.equal(report.buildVerified,true);assert.equal(report.migrationFilesVerified,1);assert.equal(report.published,false);
});
test("tampered project ID or migration bytes cannot pass",t=>{
  const f=fixture(t,{built:true});
  f.write("web/dist/.openai/hosting.json",JSON.stringify({...f.conf,project_id:"appgprj_wrong"}));
  assert.throws(()=>verifyExistingSitesPackage(f.root),/different project/);
  f.write("web/dist/.openai/hosting.json",JSON.stringify(f.conf));
  f.write("web/dist/.openai/drizzle/0000_init.sql","DELETE FROM test");
  assert.throws(()=>verifyExistingSitesPackage(f.root),/migration bytes differ/);
});
