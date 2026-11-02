import fs from 'node:fs';import path from 'node:path';import {parse,compileTemplate} from '@vue/compiler-sfc';
let failed=0,count=0;
function check(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())check(file);else if(file.endsWith('.vue')){count++;const source=fs.readFileSync(file,'utf8');const {descriptor,errors}=parse(source,{filename:file});const result=descriptor.template?compileTemplate({source:descriptor.template.content,filename:file,id:file}):{errors:[]};for(const e of [...errors,...result.errors]){console.error(file,String(e));failed++}}}}
check('src/features/cooper');console.log(`Validated ${count} Vue templates; ${failed} errors`);process.exitCode=failed?1:0;
