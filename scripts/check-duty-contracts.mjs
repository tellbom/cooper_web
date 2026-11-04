import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
let checks=0;const ok=(condition,label)=>{assert.ok(condition,label);checks++};
try{
 const {mockRequest}=await server.ssrLoadModule('/src/features/cooper/mockTransport.ts');
 const {normalizeOnDuty,dutyDayDiff,dutyWeekday,dutyColumnWidth,dutyText}=await server.ssrLoadModule('/src/features/cooper/onDuty.ts');
 globalThis.window={location:{search:'?mockDelay=100'}};
 const mine=await mockRequest('Cooper','/api/app/on-duty/get-list',{query:{isMySelf:true,page:1,limit:12}});
 const all=await mockRequest('Cooper','/api/app/on-duty/get-list',{query:{isMySelf:false,page:1,limit:12}});
 ok(['Count','arr','code','data','msg','time'].every(k=>k in mine)&&!('columns' in mine.data),'production duty envelope and colums spelling');
 ok(JSON.stringify(mine.data.colums)===JSON.stringify(all.data.colums),'my and all duty have same column contract');
 const columns=all.data.colums;
 ok(JSON.stringify(columns.map(c=>c.prop))===JSON.stringify(['OnDutyTime','gongduan','gongyi','shebei','weixiu','xietiaozhongxin','zhuanyechang']),'actual production row props');
 ok(columns.every(c=>['align','label','operatortype','prop','render','width'].every(k=>k in c)),'all column metadata preserved');
 ok(all.data.list.length===12&&all.data.total>12,'all duty respects page limit');
 ok(mine.data.list.every(r=>Object.values(r).includes('张三'))&&mine.data.total<all.data.total,'isMySelf filters mock records');
 const second=await mockRequest('Cooper','/api/app/on-duty/get-list',{query:{isMySelf:false,page:2,limit:12}});
 ok(second.data.list[0].OnDutyTime!==all.data.list[0].OnDutyTime,'pagination returns different records');
 const filtered=await mockRequest('Cooper','/api/app/on-duty/get-list',{query:{isMySelf:false,context:'不存在的值班人员',page:1,limit:12}});
 ok(filtered.data.list.length===0&&filtered.data.total===0,'server query is not replaced by fabricated defaults');
 const reordered={...all.data,colums:[{...columns[2],label:'生产颁发的新名称',align:'right',width:'156px'},columns[0]]};
 ok(normalizeOnDuty(reordered).colums[0].label==='生产颁发的新名称'&&dutyColumnWidth(reordered.colums[0])===156,'metadata name/order/width remain authoritative');
 ok(normalizeOnDuty({...all.data,colums:undefined,columns}).colums===columns,'legacy columns alias supported');
 assert.throws(()=>normalizeOnDuty({...all.data,colums:[]}));checks++;
 ok(dutyDayDiff({OnDutyTime:'2026-12-31T00:00:00'},new Date(2027,0,1))===-1,'date comparison crosses year correctly');
 ok(dutyDayDiff({OnDutyTime:null})===null&&dutyWeekday({OnDutyTime:null})===''&&dutyText(null)==='—','missing values never fabricate date or personnel');
 console.log('Duty contract checks passed: '+checks);
}finally{delete globalThis.window;await server.close()}
