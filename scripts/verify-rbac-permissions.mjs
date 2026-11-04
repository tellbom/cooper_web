import { chromium } from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
if (!process.env.COOPER_TEST_USER || !process.env.COOPER_TEST_PASSWORD) throw new Error('Set COOPER_TEST_USER and COOPER_TEST_PASSWORD for real SSO');
fs.mkdirSync('.tmp/portal-qa',{recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context = await browser.newContext({viewport:{width:1366,height:900}}), page = await context.newPage();
let mode='full', writes=0, headersValid=true; const checks=[], errors=[];
const ok=(value,label)=>{assert.ok(value,label);checks.push(label);console.log('PASS '+label)};
const menu=(path,title,component='',children=[])=>({id:path,pid:'0',name:path,path,title,icon:'fa fa-star',type:'menu',menu_type:'tab',url:'',component,extend:'',children});
const home=menu('home','颁发首页','/src/features/cooper/pages/Home.vue');
const news={...menu('news','后台新闻','/src/features/cooper/pages/NewsList.vue'),extend:'add_rules_only'};
const action=(parent,action)=>({...menu(parent+'/'+action,action),type:'button'});
const admin=menu('auth/admin','颁发管理员','/src/views/backend/auth/admin/index.vue',['add','edit','del'].map(a=>action('auth/admin',a)));
const apiMap=menu('auth/apiMap','颁发映射','/src/views/backend/auth/apiMap/index.vue');
const nested={...menu('level1','一级目录','',[{...menu('level2','二级目录','',[apiMap]),type:'menu_dir'}]),type:'menu_dir'};
function fixture(){return {adminInfo:{id:'isolated',userid:'isolated',username:'回归测试',super:false,project:'cooper'},routePath:'home',menus:mode==='home'?[home]:[home,news,admin,nested]}}
await context.route('**/rbacServer/**',async route=>{
 const req=route.request(),p=new URL(req.url()).pathname;
 if(p==='/rbacServer/api/auth/login' && mode==='login503')return route.fulfill({status:503,json:{code:50000,msg:'controlled unavailable'}});
 if(p==='/rbacServer/api/auth/login' && mode==='login403Business')return route.fulfill({json:{code:40300,msg:'controlled business denial'}});
 if(p==='/rbacServer/api/auth/login')return route.fulfill({json:{code:0,data:{...fixture(),token:''}}});
 if(req.method()!=='GET'){writes++;return route.abort()}
 if(p==='/rbacServer/api/admin/index'){
  headersValid&&=req.headers()['x-project']==='cooper'&&/^Bearer /.test(req.headers().authorization||'');
  return route.fulfill(mode==='denied'?{status:403,json:{code:40300,msg:'controlled denial',reason:'audit-only'}}:{json:{code:0,data:fixture()}});
 }
 if(p==='/rbacServer/api/admin/list')return route.fulfill({json:{code:0,data:{list:[],total:0}}});
 if(p==='/rbacServer/api/api-map/records')return route.fulfill({json:{code:0,data:{list:[{id:'test-only',project:'cooper',httpMethod:'GET',routePattern:'/test-only',permissionCode:'menu:test',status:'Active'}],total:1}}});
 return route.fulfill({json:{code:0,data:[]}});
});
page.on('pageerror',e=>errors.push(e.message));
const go=path=>page.evaluate(p=>document.querySelector('#app').__vue_app__.config.globalProperties.$router.push(p),path);
const init=()=>page.evaluate(async()=>{let i=document.querySelector('.cooper-portal,.portal-state').__vueParentComponent;while(i&&!String(i.type.__file||'').replaceAll('\\','/').endsWith('/layouts/backend/index.vue'))i=i.parent;await i.setupState.init()});
try{
 await page.goto((process.env.COOPER_PORTAL_URL || 'http://localhost:1919') + '/cooper/home');await page.locator('.portal-home,#username').first().waitFor({timeout:40000});
 if(page.url().includes('/protocol/openid-connect/auth')){await page.locator('#username').fill(process.env.COOPER_TEST_USER);await page.locator('#password').fill(process.env.COOPER_TEST_PASSWORD);await page.locator('#kc-login').click()}
 await page.locator('.portal-home').waitFor({timeout:45000});await page.locator('.news-thumbnails button').first().waitFor();
 ok(await page.locator('.portal-nav .menu-title').filter({hasText:'颁发首页'}).count()===1,'renamed RBAC menu stays in primary navigation');
 ok(await page.locator('.portal-nav .fa-star').count()>0,'RBAC icon is rendered without title mapping');
 ok(await page.locator('.portal-nav .menu-title').filter({hasText:'后台新闻'}).count()===0,'backend hidden route does not appear in menu');
 await go('/cooper/news');await page.locator('.news-list-page').waitFor();ok(true,'backend hidden route retains its issued permission');
 await go('/cooper/auth/admin');await page.locator('.rbac-admin-page').waitFor();
 ok(await page.getByRole('button',{name:'新增管理员',exact:true}).isVisible(),'ordinary user with issued add action can create');
 await go('/cooper/auth/apiMap');await page.locator('.rbac-apimap-page .el-table__body-wrapper tbody tr').first().waitFor();
 ok(await page.getByRole('button',{name:'新增映射',exact:true}).count()===0,'unissued API-map create action hidden');
 ok(await page.locator('.rbac-apimap-page').getByRole('button',{name:'编辑',exact:true}).count()===0,'unissued API-map edit action hidden');
 ok(await page.locator('.rbac-apimap-page').getByRole('button',{name:'删除',exact:true}).count()===0,'unissued API-map delete action hidden');
 await go('/cooper/home');mode='home';await init();
 const revoked=await page.evaluate(async()=>{const {useNavTabs}=await import('/src/stores/navTabs.ts');const router=document.querySelector('#app').__vue_app__.config.globalProperties.$router;return{registered:router.getRoutes().some(r=>r.path==='/cooper/news'),authNodes:useNavTabs().state.authNode.size}});
 ok(!revoked.registered&&revoked.authNodes===0,'refresh removes old routes and old button grants');
 await go('/cooper/news');await page.waitForURL('**/401');ok(await page.locator('.news-list-page').count()===0,'direct SPA navigation cannot reuse withdrawn route');
 await go('/cooper/home');await page.locator('.portal-home').waitFor();
 mode='denied';await init();await page.locator('.portal-state').filter({hasText:'未能取得项目菜单'}).waitFor();ok(await page.locator('.cooper-portal').count()===0,'failed RBAC refresh closes previously authorized shell');
 mode='home';await page.getByRole('button',{name:'重新加载',exact:true}).click();await page.locator('.portal-home').waitFor();ok(true,'authorized retry recovers after service rejection');
 await go('/preview/news?id=img-0');await page.waitForURL('**/401');ok(true,'unissued static preview remains blocked');
 mode='login503';const unavailable=await page.evaluate(async()=>{const b=await import('/src/api/backend/rbac/bridge.ts');return b.initRbacBridge()});ok(unavailable.reason.includes('暂时不可用'),'service failure is not misreported as a permission denial');
 mode='login403Business';const denied=await page.evaluate(async()=>{const b=await import('/src/api/backend/rbac/bridge.ts');return b.initRbacBridge()});ok(denied.reason.includes('没有进入此项目的权限'),'business code 40300 remains a permission denial');
 ok(headersValid,'RBAC requests carry actual SSO Bearer and cooper project');ok(writes===0,'negative regression submits no RBAC management writes');ok(errors.length===0,'no browser runtime errors');
 fs.writeFileSync('.tmp/portal-qa/rbac-regression.json',JSON.stringify({checks,errors,writes,scope:'Real Keycloak SSO; isolated controlled RBAC menu responses. No server grants changed by test.'},null,2));
} catch(e){await page.screenshot({path:'.tmp/portal-qa/rbac-regression-failure.png'}).catch(()=>{});throw e}finally{await browser.close()}
