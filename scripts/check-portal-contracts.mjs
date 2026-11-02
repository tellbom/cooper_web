import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
let checks=0;
const ok=(condition,label)=>{assert.ok(condition,label);checks++};
try{
 const {mockRequest:r}=await server.ssrLoadModule('/src/features/cooper/mockTransport.ts');
 globalThis.window={location:{search:'?mockDelay=100'}};
 const start=Date.now();
 const [images,briefs,channels,context,notices,popups,duty,meetings,faults,hot,honors]=await Promise.all([
 r('Cooper','/api/app/news',{query:{Type:'0',Pageindex:1,Pagesize:5}}),r('Cooper','/api/app/news-kuai-bao/get-news-kuai-bao',{query:{num:4}}),r('Cooper','/api/app/news-center'),r('Cooper','/api/app/news-center/get-context',{query:{ChannelID:11,Page:1,Limit:3}}),r('Cooper','/api/app/notice',{query:{Pageindex:1,Pagesize:2}}),r('Cooper','/api/app/notice/popup-notice',{method:'POST'}),r('Cooper','/api/app/on-duty/get-list'),r('newOA','/api/app/apply-meeting/passed-room'),r('Cooper','/api/app/fault/get-fault-table-message'),r('Cooper','/api/app/hot-work',{query:{pageNo:1,pageSize:2}}),r('Cooper','/api/app/honor',{query:{Limit:4}})]);
 ok(Date.now()-start>=100,'Mock latency');ok(Array.isArray(images)&&images.length===5,'image DTO direct array');ok(images.every(n=>typeof n.ChannelID==='number'&&typeof n.Type==='number'&&n.Cover.startsWith('/mock-images/')),'image DTO spellings and offline assets');ok(Array.isArray(briefs)&&briefs.length===4,'brief direct array');ok(channels.code===1&&Array.isArray(channels.data),'channel envelope data');ok(context.code===1&&context.arr.length===3&&context.count>3,'context arr/count');ok(notices.data.length===2&&notices.count>2,'notice pagination');ok(popups.every(n=>'Context'in n&&'From'in n&&'PublicityPeriod'in n),'popup fields');ok(Array.isArray(duty.data.list)&&Array.isArray(duty.data.columns),'dynamic duty schema');ok(Array.isArray(meetings.data),'newOA envelope');ok(Array.isArray(faults.list)&&faults.list.every(n=>'SMBC'in n&&'SS_GZNR'in n),'fault list DTO and corrected fields');ok(hot.data.list.length===2&&hot.data.total>2,'hot work BaTableDto');ok(honors.data.length===4,'honor Limit');
 const detail=await r('Cooper','/api/app/news/detail',{query:{id:images[0].Id}});ok(detail.Id===images[0].Id&&typeof detail.ChannelID==='string','detail channel string');
 const body={title:'contract-calendar-event',description:null,location:null,startAt:'2026-10-27T18:00:00+08:00',endAt:'2026-10-27T19:00:00+08:00',reminderMinutes:15};
 const event=await r('Cooper','/api/calendar/events',{method:'POST',body});ok(event.id&&event.source==='USER','create calendar direct DTO');
 const updated=await r('Cooper','/api/calendar/events/'+event.id,{method:'PATCH',body:{...body,title:'updated'}});ok(updated.title==='updated','PATCH calendar');ok(await r('Cooper','/api/calendar/events/'+event.id,{method:'DELETE'})===undefined,'DELETE 204 empty body');
 await assert.rejects(()=>r('Cooper','/api/calendar/events/'+event.id));checks++;
 const search=await r('aura','/api/search/day-grouped',{method:'POST',body:{query:'',sourceTypes:['Announcement'],page:1,pageSize:2}});ok(search.days.length===2&&search.days.every(d=>d.items.every(i=>i.sourceType==='Announcement')),'AURA days/source types');
 const appIds=['sys-1'];const systems=await r('Cooper','/api/app/personal/common-system-show-list',{query:{UserID:'contract-user'}});await r('Cooper','/api/app/personal/update-common-system',{method:'POST',query:{UserID:'contract-user'},body:systems.slice(0,2).map(s=>s.Id)});const saved=await r('Cooper','/api/app/personal/common-system-show-list',{query:{UserID:'contract-user'}});ok(saved.length===2,'common-system string[] body');
 await assert.rejects(()=>r('newOA','/api/app/news'));checks++;
 window.location.search='?mockDelay=100&mockError=all';await assert.rejects(()=>r('Cooper','/api/app/news'));checks++;
 console.log(`Portal contract checks passed: ${checks}`);
}finally{delete globalThis.window;await server.close()}
