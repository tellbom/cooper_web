import {chromium} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
if(!process.env.COOPER_TEST_USER||!process.env.COOPER_TEST_PASSWORD)throw new Error('Set COOPER_TEST_USER and COOPER_TEST_PASSWORD locally.');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080}}),page=await context.newPage();
const out=path.resolve('.tmp/portal-qa');fs.mkdirSync(out,{recursive:true});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
const ok=(value,name)=>{assert.ok(value,name);checks.push(name);console.log('PASS',name)};
const visible=(locator)=>locator.waitFor({state:'visible',timeout:20000});
async function home(query=''){await page.goto('http://localhost:1919/cooper/home'+query);await visible(page.locator('.portal-home'));}
async function closeDialog(){const dialog=page.locator('.el-dialog:visible').last();if(await dialog.count()){await dialog.locator('.el-dialog__headerbtn').click();await dialog.waitFor({state:'hidden'});}}
try{
 await page.goto('http://localhost:1919/cooper/home');
 await page.locator('.portal-home,#username').first().waitFor({state:'visible',timeout:35000});
 if(page.url().includes('/protocol/openid-connect/auth')){await page.locator('#username').fill(process.env.COOPER_TEST_USER);await page.locator('#password').fill(process.env.COOPER_TEST_PASSWORD);await page.locator('#kc-login').click();}
 await page.waitForURL('**/cooper/home',{timeout:25000});await visible(page.locator('.portal-home'));
 ok(await page.evaluate(async()=> (await import('/src/features/cooper/http.ts')).USE_MOCK),'real SSO with business Mock only');
 await page.locator('.news-card .el-carousel__item').first().locator('img').waitFor({state:'visible'});
 ok(await page.locator('.portal-home .portal-card').count()===8,'eight prototype panels');
 ok(await page.locator('.portal-nav').getByText('权限中心',{exact:true}).count()===1,'existing permission-center navigation');
 await page.waitForTimeout(1500);
 if(await page.locator('.notice-launch button').isVisible())await page.locator('.notice-launch button').click();
 let popup=context.pages().find(p=>p.url().includes('/notice-popup'));
 if(!popup){await page.waitForTimeout(1000);popup=context.pages().find(p=>p.url().includes('/notice-popup'));}
 ok(!!popup,'notice opens in independent window');
 if(popup){
  await popup.locator('.official-paper h1').first().waitFor();
  ok(await popup.locator('.official-paper').count()===3,'all popup announcements share one scrolling page');
  const p2=await context.newPage();await p2.goto('http://localhost:1919/cooper/home');await p2.locator('.portal-home').waitFor();await p2.waitForTimeout(1600);
  ok(context.pages().filter(p=>p.url().includes('/notice-popup')).length===1,'single notice window across two parent tabs');
  await p2.close();await popup.screenshot({path:path.join(out,'notice-window.png')});
  await popup.getByRole('button',{name:'关闭公告窗口',exact:true}).click();await page.waitForTimeout(500);
  ok(popup.isClosed(),'notice window closes without a read confirmation');
 }

 await page.screenshot({path:path.join(out,'home.png')});
 await page.getByRole('button',{name:'先进科技',exact:true}).click();await page.locator('.tech-news-split .tech-image-column button').first().waitFor();ok(await page.locator('.tech-text-column button').count()>0,'technology image/text two-column layout');
 await page.getByRole('button',{name:'质量快报',exact:true}).click();await page.locator('.quality-grid button').first().waitFor();ok(await page.locator('.quality-grid button').count()===6,'quality image wall');
 await page.getByRole('button',{name:'全部应用',exact:false}).click();await page.locator('.application-cards>div').first().waitFor();ok(await page.locator('.application-cards>div').count()>=15,'application center and ordered sidebar');await page.screenshot({path:path.join(out,'applications.png')});await closeDialog();
 await page.getByRole('button',{name:'查看全部作业',exact:false}).click();await visible(page.locator('.tech-dialog-layout'));await page.locator('.tech-dialog-layout li button').nth(1).click();ok((await page.locator('.tech-dialog-layout article h4').innerText()).includes('有限空间'),'hazardous-work master/detail selection');await page.screenshot({path:path.join(out,'tech.png')});await closeDialog();
 await page.getByRole('button',{name:'查看全部问题',exact:false}).click();await page.locator('.fault-state-cards button').first().waitFor();await page.locator('.fault-state-cards button').filter({hasText:'未响应'}).click();ok(await page.locator('.fault-dialog .el-table__body tbody tr').count()===1,'fault state summary filters table');await page.locator('.fault-dialog .portal-segmented').getByText('制造问题',{exact:true}).click();await page.waitForTimeout(1200);ok((await page.locator('.fault-dialog .prototype-table').innerText()).includes('机型'),'manufacturing API tab');await page.screenshot({path:path.join(out,'fault.png')});await closeDialog();
 await page.getByRole('button',{name:'值班安排',exact:false}).click();await visible(page.locator('.my-duty-layout'));ok((await page.locator('.my-duty-layout').innerText()).includes('下一次值班'),'my duty summary and timeline');await page.screenshot({path:path.join(out,'duty.png')});await page.locator('.duty-dialog .el-radio-button').filter({hasText:'全部值班'}).click();await visible(page.locator('.all-duty-layout'));ok(await page.locator('.all-duty-layout .el-table__body tbody tr').count()>0,'all duty dynamic columns');await closeDialog();
 await page.getByRole('tab',{name:'我的日程',exact:true}).click();await page.locator('.event-chip').first().waitFor();await page.locator('.agenda-toolbar .portal-segmented').getByText('月',{exact:true}).click();await visible(page.locator('.fc-dayGridMonth-view'));await page.locator('.calendar-loading').waitFor({state:'hidden'});ok(await page.locator('.fc-daygrid-day').count()===42,'framework month calendar');await page.screenshot({path:path.join(out,'calendar-month.png')});await page.locator('.schedule-actions').getByText('年',{exact:true}).click();await visible(page.locator('.fc-multimonth'));ok(await page.locator('.fc-multimonth-month').count()===12,'framework year calendar');await page.locator('.schedule-actions').getByText('7日',{exact:true}).click();await visible(page.locator('.fc-timeGridWeek-view'));ok(await page.locator('.fc-timegrid-col[data-date]').count()===7,'framework week timeline');await closeDialog();
 await page.locator('.agenda-card').getByRole('button',{name:'新建日程',exact:true}).click();await page.locator('.event-form-dialog input').first().fill('界面验收日程');await page.locator('.event-form-dialog').getByRole('button',{name:'保存日程',exact:true}).click();await page.locator('.event-form-dialog').waitFor({state:'hidden'});await page.locator('.event-chip').filter({hasText:'界面验收日程'}).waitFor();ok(true,'calendar create and refresh');await page.locator('.event-chip').filter({hasText:'界面验收日程'}).click();await page.getByRole('button',{name:'删除日程',exact:true}).click();await page.locator('.el-message-box').getByRole('button',{name:'确定',exact:true}).click();await page.locator('.event-chip').filter({hasText:'界面验收日程'}).waitFor({state:'hidden'});ok(true,'calendar delete and refresh');
 await page.goto('http://localhost:1919/cooper/search');await visible(page.locator('.search-result').first());await page.locator('.search-filters .portal-segmented').first().getByText('公告',{exact:true}).click();await page.waitForTimeout(1400);await page.locator('.search-result').first().click();await visible(page.locator('.search-reading-dialog .prose-news h3').first());ok((await page.locator('.search-reading-dialog .prose-news').innerText()).includes('工作要求'),'search announcement sanitized rich HTML');await page.screenshot({path:path.join(out,'search-notice.png')});await closeDialog();
 await page.goto('http://localhost:1919/cooper/news/detail?id=img-0');await visible(page.locator('.article-like:not([disabled])'));const old=await page.locator('.article-like').getAttribute('aria-pressed');await page.locator('.article-like').click();await page.waitForTimeout(2400);ok(await page.locator('.article-like').getAttribute('aria-pressed')!==old,'article like and count readback');ok(await page.locator('.article-views svg').count()===1,'eye icon for views');await page.screenshot({path:path.join(out,'news-detail.png')});await page.getByRole('link',{name:'工作资料.docx',exact:true}).click();await page.waitForURL(url=>url.pathname==='/preview/office');await page.locator('.office-loading').waitFor({state:'hidden',timeout:60000});ok(await page.locator('.office-preview iframe').count()===1&&!await page.locator('.office-preview-error').isVisible(),'real OnlyOffice document preview');await page.screenshot({path:path.join(out,'office.png')});
 await home('?mockDelay=2500');await visible(page.locator('.skeleton-news'));const before=await page.locator('.news-card').boundingBox();await page.screenshot({path:path.join(out,'slow-loading.png')});await page.locator('.skeleton-news').waitFor({state:'hidden'});const after=await page.locator('.news-card').boundingBox();ok(Math.abs(before.height-after.height)<2,'slow loading keeps panel geometry');
 await home('?mockError=/api/app/news');await page.locator('.news-card [role=alert]').waitFor();ok((await page.locator('.news-card [role=alert]').innerText()).includes('模拟网络异常'),'module error and retry state');
 await home();await page.locator('.portal-nav').getByText('权限中心',{exact:true}).click();await page.getByRole('menuitem',{name:'菜单规则',exact:true}).click();await page.waitForURL('**/auth/rule');await page.waitForTimeout(1500);ok(!await page.getByText('无权限执行此操作',{exact:true}).count(),'existing RBAC menu management opens');
 ok(errors.length===0,'no browser runtime errors');fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checks,passed:checks.length,errors},null,2));
 console.log(`Browser checks passed: ${checks.length}`);
}catch(error){console.log('FAILED AT',checks.length,'URL',page.url());console.log((await page.locator('body').innerText()).slice(0,1000));await page.screenshot({path:path.join(out,'failure.png')});throw error}finally{await browser.close()}
