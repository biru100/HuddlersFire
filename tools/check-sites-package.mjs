// Check that a build belongs to the previously provisioned GPT Sites project.
// Read-only; never saves a Sites version, deploys, migrates, or changes the site.
import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {join,dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";

export const SITE_ID="appgprj_6ae8e9ae42708191b253341387aa287f";
export const ROOT=fileURLToPath(new URL("../",import.meta.url));
const sha=buf=>createHash("sha256").update(buf).digest("hex");
const json=p=>JSON.parse(readFileSync(p,"utf8"));
function checksums(base){
  if(!existsSync(base))return [];
  const list=[];
  function visit(dir,prefix=""){
    for(const item of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
      assert.ok(!item.isSymbolicLink(),"Sites migration bundle symlinks forbidden");
      const full=join(dir,item.name),name=prefix+item.name;
      if(item.isDirectory())visit(full,name+"/");
      else if(item.isFile())list.push({name,sha256:sha(readFileSync(full))});
      else throw Error("Unsupported migration file type");
    }
  }
  visit(base);return list;
}
export function verifyExistingSitesPackage(root=ROOT,{requireBuild=true}={}){
  const confPath=join(root,"web/.openai/hosting.json");
  assert.ok(existsSync(confPath),"Missing original Sites hosting configuration");
  const conf=json(confPath);
  assert.deepEqual(Object.keys(conf).sort(),["d1","project_id","r2"],"Unexpected Sites metadata");
  assert.equal(conf.project_id,SITE_ID,"Refusing to create/link a different Sites project");
  assert.equal(conf.d1,"DB","Existing Sites D1 binding has changed");
  assert.equal(conf.r2,null,"Existing Sites R2 binding has changed");
  const report={target:"existing-chatgpt-sites",project_id:conf.project_id,d1:conf.d1,r2:conf.r2,buildVerified:false,versionSaved:false,published:false,needsExistingSitesWork:true};
  if(!requireBuild)return report;
  const dest=join(root,"web/dist");
  const packaged=join(dest,".openai/hosting.json");
  assert.ok(existsSync(packaged),"Sites closeBundle metadata not found");
  assert.deepEqual(json(packaged),conf,"Sites bundle points to a different project");
  const source=checksums(join(root,"web/drizzle")),target=checksums(join(dest,".openai/drizzle"));
  assert.ok(source.length>0,"Missing source SQL migrations");
  assert.deepEqual(target,source,"Packaged migration bytes differ from the source");
  assert.ok(existsSync(join(dest,"server/wrangler.json")),"Missing app server package");
  return {...report,buildVerified:true,migrationFilesVerified:source.length,hostingSha256:sha(readFileSync(packaged))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=verifyExistingSitesPackage();
  const output=join(ROOT,"outputs/sites-package-preflight.json");
  mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,JSON.stringify(result,null,2)+"\n");
  console.log(JSON.stringify(result,null,2));
  if(process.env.GITHUB_STEP_SUMMARY){
    const {appendFileSync}=await import("node:fs");
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,"### Existing GPT Sites package\n\nThe original project metadata and "+result.migrationFilesVerified+" SQL files were packaged. **No Sites version was saved or deployed by CI.**\n");
  }
}
