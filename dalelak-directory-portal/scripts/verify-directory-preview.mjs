import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

// Validate the isolation boundary before rendering components in Node (no browser/API).
function files(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]); }
for(const file of files('src/directory-experience').filter(p=>/\.(tsx?|css)$/.test(p)&&!p.includes('tests'))){
  const source=readFileSync(file,'utf8');
  assert.ok(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bcreateClient\s*\(|navigator\.(geolocation|sendBeacon)|https:\/\/wa\.me/.test(source),`Live side effect in ${file}`);
  assert.ok(!/from ['"][^'"]*(?:services\/storage|components\/PublicShowcase|\/App)['"]/.test(source),`Production dependency in ${file}`);
}
const result=await build({entryPoints:['src/directory-experience/tests/screens.test.tsx'],bundle:true,platform:'node',format:'cjs',write:false,loader:{'.jpg':'dataurl','.svg':'dataurl','.css':'empty'},logLevel:'warning'});
const run=spawnSync(process.execPath,['--input-type=commonjs','-'],{input:result.outputFiles[0].text,encoding:'utf8',maxBuffer:10*1024*1024});
process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');process.exitCode=run.status??1;


