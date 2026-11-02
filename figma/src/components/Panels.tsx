import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowUp, Award, Bell, BookOpen, Building2, CalendarCheck, CalendarClock, Check, ChevronLeft, ChevronRight, Clock, Copy, Factory, FileText,
  Flag, FolderKanban, GitBranch, Globe, Layers, LayoutGrid, Mail, MapPin, Phone, Plus, Search, Settings2, ShieldCheck, ShoppingCart, TriangleAlert,
  UserCheck, UserRound, Wallet, Wrench, X, type LucideIcon,
} from 'lucide-react';
import * as api from '../api';
import { Btn, Card, Modal, More, PillTabs, ScrollTable, Segmented, Skeleton, Tag, dotOf, fmtMD, ic, inputCls, useAsync } from './ui';

const USER_ID = 'zhangsan';

/* ================= 常用系统 ================= */
const SYS_ICON: Record<string, LucideIcon> = {
  OA办公: FileText, 集团邮箱: Mail, 公司门户: Globe, 智慧党群: Flag, 生产制造: Factory, 工艺集成: Layers, 流程中心: GitBranch, 质量管理: ShieldCheck,
  人事系统: UserRound, 财务系统: Wallet, 采购管理: ShoppingCart, 项目管理: FolderKanban, 设备管理: Wrench, 档案管理: Building2, 知识中心: BookOpen, 会议管理: CalendarCheck,
};
const HOME_SLOTS = 8;
/** 线性图标 + 中性底色：去掉渐变色块，保持克制 */
function SysIcon({ s, small }: { s: api.CommonSystemOutDto; small?: boolean }) {
  const I = SYS_ICON[s.Name] ?? LayoutGrid;
  const box = small ? 'size-8 rounded-lg' : 'size-11 rounded-xl';
  if (s.Icon) return <img src={s.Icon} alt="" className={box} />;
  return <span className={`grid ${box} shrink-0 place-items-center border border-hair bg-soft text-[#2f56c4] transition-colors group-hover:border-blue-200 group-hover:bg-brand-soft`}><I size={small ? 16 : 20} strokeWidth={1.6} /></span>;
}

export function CommonSystems() {
  const mine = useAsync(() => api.getmypersonalapi(USER_ID));
  const [open, setOpen] = useState(false);
  return (
    <Card title="常用系统" icon={<LayoutGrid {...ic} />} extra={<More label="全部应用" brand onClick={() => setOpen(true)} />} className="shrink-0">
      {!mine.data ? <Skeleton rows={3} /> : (
        <div className="grid grid-cols-4 gap-y-3.5 pb-1">
          {mine.data.slice(0, HOME_SLOTS).map((s) => (
            <a key={s.Id} href={s.JumpLink} title={s.Details} className="group flex flex-col items-center gap-1.5 text-xs text-body hover:text-ink">
              <SysIcon s={s} /><span className="truncate">{s.Name}</span>
            </a>
          ))}
          {/* 常用不足 8 个时用“更多应用”补位 */}
          {mine.data.length < HOME_SLOTS && (
            <button onClick={() => setOpen(true)} className="group flex flex-col items-center gap-1.5 text-xs text-body hover:text-ink">
              <span className="grid size-11 place-items-center rounded-xl border border-dashed border-[#c9d3e6] text-muted transition-colors group-hover:border-brand group-hover:text-brand"><Plus size={20} strokeWidth={1.6} /></span>更多应用
            </button>
          )}
        </div>
      )}
      {open && <SystemsModal onClose={() => setOpen(false)} mineIds={mine.data?.map((s) => s.Id) ?? []} onSaved={mine.reload} />}
    </Card>
  );
}

function SystemsModal({ onClose, mineIds, onSaved }: { onClose: () => void; mineIds: string[]; onSaved: () => void }) {
  const all = useAsync(api.getcustomizationapi);
  const [sel, setSel] = useState<string[]>(mineIds);
  const [q, setQ] = useState('');
  const byId = useMemo(() => Object.fromEntries((all.data ?? []).map((s) => [s.Id, s])), [all.data]);
  const list = (all.data ?? []).filter((s) => !q || s.Name.includes(q) || s.Details.includes(q));
  const toggle = (id: string) => setSel((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const move = (i: number, d: number) => setSel((v) => { const n = [...v]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  return (
    <Modal open onClose={onClose} title="应用中心" subtitle={`选择常用应用并调整顺序，首页按顺序展示前 ${HOME_SLOTS} 个`} width="max-w-5xl" height="h-[78vh]" flush
      footer={<><Btn onClick={onClose}>取消</Btn><Btn primary onClick={() => api.postmypersonalapi(USER_ID, sel).then(() => { onSaved(); onClose(); })}>保存设置</Btn></>}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-4 px-8 pb-4 pt-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索应用名称或用途" className={`${inputCls} pl-9`} />
          </div>
          <span className="text-[13px] text-muted">共 {all.data?.length ?? 0} 个应用</span>
        </div>
        <div className="scrollbar-thin grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-3 overflow-y-auto px-8 pb-6">
          {!all.data ? <Skeleton rows={6} /> : list.map((s) => {
            const on = sel.includes(s.Id);
            return (
              <div key={s.Id} className={`group flex gap-3.5 rounded-xl border p-4 transition-colors ${on ? 'border-blue-200 bg-brand-soft/40' : 'border-hair hover:border-[#cfd8e8]'}`}>
                <SysIcon s={s} />
                <div className="min-w-0 flex-1">
                  <a href={s.JumpLink} className="block text-[15px] font-medium text-ink hover:text-brand">{s.Name}</a>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted">{s.Details}</p>
                </div>
                <button onClick={() => toggle(s.Id)} aria-pressed={on}
                  className={`flex h-7 shrink-0 items-center gap-1 self-start rounded-md px-2 text-xs font-medium transition-colors ${on ? 'text-brand hover:bg-white' : 'text-muted hover:bg-soft hover:text-ink'}`}>
                  {on ? <><Check size={13} />已添加</> : <><Plus size={13} />添加</>}
                </button>
              </div>
            );
          })}
          {all.data && list.length === 0 && <p className="col-span-3 py-16 text-center text-sm text-muted">没有找到「{q}」相关应用</p>}
        </div>
      </div>
      <aside className="flex w-[300px] shrink-0 flex-col border-l border-hair bg-soft">
        <div className="shrink-0 px-6 pb-3 pt-5">
          <h4 className="font-serif text-[17px] font-semibold text-ink">我的常用 <span className="font-sans text-sm font-normal tabular-nums text-muted">{sel.length}</span></h4>
          <p className="mt-1 text-xs text-muted">使用箭头调整顺序</p>
        </div>
        <ol className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {sel.map((id, i) => byId[id] && (
            <li key={id}>
              {i === HOME_SLOTS && <p className="mx-3 my-2 border-t border-dashed border-[#cfd8e8] pt-2 text-[11px] text-faint">以下应用不在首页展示</p>}
              <div className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white">
                <span className="w-4 font-serif text-sm tabular-nums text-faint">{i + 1}</span>
                <SysIcon s={byId[id]} small />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{byId[id].Name}</span>
                <span className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <button disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-muted hover:text-brand disabled:opacity-30" aria-label="上移"><ArrowUp size={14} /></button>
                  <button disabled={i === sel.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-muted hover:text-brand disabled:opacity-30" aria-label="下移"><ArrowDown size={14} /></button>
                  <button onClick={() => toggle(id)} className="rounded p-1 text-muted hover:text-red-600" aria-label="移除"><X size={14} /></button>
                </span>
              </div>
            </li>
          ))}
          {sel.length === 0 && <li className="px-3 py-10 text-center text-xs text-faint">尚未添加常用应用</li>}
        </ol>
      </aside>
    </Modal>
  );
}

/* ================= 会议动态 / 值班信息（自动滚动） ================= */
const NOW = '2026-10-27 10:00'; // 原型固定“当前时间”
const TODAY_MD = NOW.slice(5, 10);
const meetingState = (m: api.MeetingInfo) => (NOW < m.startTime ? '未开始' : NOW > m.endTime ? '已结束' : '进行中');
function MeetState({ s }: { s: string }) {
  if (s === '进行中')
    return <span className="flex items-center gap-1.5 text-xs font-medium text-brand"><span className="relative flex size-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-brand/60" /><span className="relative size-1.5 rounded-full bg-brand" /></span>进行中</span>;
  return <span className={`flex items-center gap-1.5 text-xs ${s === '未开始' ? 'text-muted' : 'text-faint'}`}><span className={`size-1.5 rounded-full ${s === '未开始' ? 'border border-[#9aa1b2]' : 'bg-[#cfd5df]'}`} />{s}</span>;
}
const Summary = ({ items }: { items: [string, number][] }) => (
  <span className="mr-3 flex items-center gap-3 text-xs text-muted">
    {items.map(([k, v]) => <span key={k}>{k} <b className="font-serif text-[15px] font-semibold tabular-nums text-ink">{v}</b></span>)}
  </span>
);
export function Meetings() {
  const { data } = useAsync(api.getmeetingInfos);
  const states = (data ?? []).map(meetingState);
  return (
    <Card title="会议动态" icon={<CalendarClock {...ic} />} className="flex-1"
      extra={<>{data && <Summary items={[['今日', data.filter((m) => m.startTime.slice(5, 10) === TODAY_MD).length], ['进行中', states.filter((x) => x === '进行中').length]]} />}<More /></>}>
      {!data ? <Skeleton /> : (
        <ScrollTable cols={['时间', '会议名称', '会议地点', '状态']} template="92px minmax(0,1.25fr) minmax(0,1fr) 64px" highlight={(i) => states[i] === '进行中'}
          rows={data.map((m, i) => [
            <span className="tabular-nums"><span className="text-faint">{m.startTime.slice(5, 10)}</span> <span className="font-medium text-ink">{m.startTime.slice(11, 16)}</span></span>,
            <span className={`truncate ${states[i] === '已结束' ? 'text-muted' : 'font-medium text-ink'}`}>{m.meetingTitle}</span>,
            <><MapPin size={12} className="shrink-0 text-faint" /><span className="truncate">{m.roomName}</span></>,
            <MeetState s={states[i]} />,
          ])} />
      )}
    </Card>
  );
}
const Initial = ({ name }: { name: string }) => (
  <span className="grid size-5 shrink-0 place-items-center rounded-full border border-hair bg-soft text-[10px] font-medium text-body">{name.slice(0, 1)}</span>
);
/** 值班列按字段名做克制的展示增强；未知字段原样输出 */
const USER_NAME = '张三'; // 当前登录用户（顶栏）
function dutyCell(col: string, v: string, today: boolean) {
  if (col === '日期') return <><span className={`tabular-nums ${today ? 'font-semibold text-brand' : 'text-ink'}`}>{v}</span>{today && <span className="rounded bg-brand px-1 text-[10px] leading-4 text-white">今日</span>}</>;
  if (col === '星期') return <span className={/[六日]/.test(v) ? 'text-amber-600' : 'text-muted'}>{v}</span>;
  if (col.includes('值班'))
    return <><Initial name={v} /><span className={`truncate ${v === USER_NAME ? 'font-semibold text-brand' : 'text-ink'}`}>{v}</span>{v === USER_NAME && <span className="rounded border border-blue-200 px-1 text-[10px] leading-4 text-brand">我</span>}</>;
  if (col.includes('电话')) return <><Phone size={11} className="shrink-0 text-faint" /><span className="tabular-nums">{v}</span></>;
  return v;
}
type Row = Record<string, string>;
const dateOf = (r: Row) => r['日期'] ?? Object.values(r)[0] ?? '';
const daysFromToday = (md: string) => Math.round((new Date(2026, +md.slice(0, 2) - 1, +md.slice(3, 5)).getTime() - new Date(2026, 9, 27).getTime()) / 864e5);
const dutyTemplate = (cols: string[]) => cols.map((c) => (c.includes('电话') ? 'minmax(0,1.5fr)' : c === '星期' ? 'minmax(0,.7fr)' : 'minmax(0,1fr)')).join(' ');

export function OnDuty() {
  const { data } = useAsync(() => api.getOnDutyList(null));
  const [open, setOpen] = useState(false);
  const cols = data?.list[0] ? Object.keys(data.list[0]) : []; // columns 定义文档未展开，按行字段渲染
  const isToday = (r: Row) => dateOf(r) === TODAY_MD;
  const today = data?.list.find(isToday);
  return (
    <Card title="值班信息" icon={<UserCheck {...ic} />} className="flex-1"
      extra={<>{today && <span className="mr-3 flex items-center gap-1.5 text-xs text-muted">今日带班 <span className="font-medium text-ink">{today['值班领导']}</span></span>}<More label="值班安排" onClick={() => setOpen(true)} /></>}>
      {!data ? <Skeleton /> : (
        <ScrollTable cols={cols} template={dutyTemplate(cols)} highlight={(i) => isToday(data.list[i])}
          rows={data.list.map((r) => cols.map((c) => dutyCell(c, r[c], isToday(r))))} />
      )}
      {open && <DutyModal onClose={() => setOpen(false)} />}
    </Card>
  );
}

/* ---------- 值班二级弹窗：我的值班（isMySelf）/ 全部值班（context + 分页） ---------- */
const LIMIT = 12;
function DutyModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'我的值班' | '全部值班'>('我的值班');
  const [q, setQ] = useState('');
  const [kw, setKw] = useState('');
  const [page, setPage] = useState(1);
  const mine = useAsync(() => api.getOnDutyList({ isMySelf: true, page: 1, limit: 100 }));
  const all = useAsync(() => api.getOnDutyList({ isMySelf: false, context: kw || undefined, page, limit: LIMIT }), [kw, page]);
  useEffect(() => {
    const t = setTimeout(() => { setKw(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Modal open onClose={onClose} title="值班安排" subtitle="查看我的值班计划与全部值班排班" width="max-w-5xl" height="h-[80vh]" flush>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-4 px-8 pb-4 pt-5">
          <Segmented items={['我的值班', '全部值班'] as const} value={tab} onChange={setTab} counts={{ 我的值班: mine.data?.total, 全部值班: kw ? undefined : all.data?.total }} />
          {tab === '全部值班' && (
            <div className="relative ml-auto w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索姓名、日期或电话" className={`${inputCls} pl-9`} />
            </div>
          )}
        </div>
        {tab === '我的值班'
          ? (mine.data ? <MyDuty rows={mine.data.list} /> : <div className="px-8"><Skeleton rows={6} /></div>)
          : <AllDuty data={all.data} page={page} setPage={setPage} kw={kw} />}
      </div>
    </Modal>
  );
}

function MyDuty({ rows }: { rows: Row[] }) {
  const roleOf = (r: Row) => Object.keys(r).find((k) => r[k] === USER_NAME) ?? '值班';
  const others = (r: Row) => Object.entries(r).filter(([k, v]) => !['日期', '星期'].includes(k) && v !== USER_NAME);
  const sorted = [...rows].sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
  const upcoming = sorted.filter((r) => daysFromToday(dateOf(r)) >= 0);
  const past = sorted.filter((r) => daysFromToday(dateOf(r)) < 0).reverse();
  const next = upcoming[0];
  const nd = next ? daysFromToday(dateOf(next)) : 0;
  return (
    <div className="flex min-h-0 flex-1 border-t border-hair">
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-hair bg-soft px-7 py-7">
        <p className="text-xs font-medium tracking-[0.15em] text-muted">下一次值班</p>
        {next ? (
          <>
            <p className="mt-3 font-serif text-[40px] font-medium leading-none tracking-[-0.02em] text-ink">
              {+dateOf(next).slice(0, 2)}月{+dateOf(next).slice(3, 5)}日
            </p>
            <p className="mt-2.5 text-sm text-muted">{next['星期']} · <span className={nd === 0 ? 'font-medium text-brand' : ''}>{nd === 0 ? '就是今天' : `还有 ${nd} 天`}</span></p>
            <span className="mt-4 inline-flex self-start rounded-md bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">{roleOf(next)}</span>
            <dl className="mt-6 space-y-3 border-t border-hair pt-5 text-sm">
              {others(next).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="flex items-center gap-1.5 font-medium tabular-nums text-ink">{k.includes('电话') ? <Phone size={12} className="text-faint" /> : <Initial name={v} />}{v}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : <p className="mt-3 text-sm text-muted">暂无后续值班安排</p>}
        <div className="mt-auto grid grid-cols-3 gap-2 pt-8">
          {[['即将', upcoming.length], ['已完成', past.length], ['合计', rows.length]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white px-3 py-2.5">
              <p className="font-serif text-[22px] leading-none tabular-nums text-ink">{v}</p><p className="mt-1.5 text-xs text-muted">{k}</p>
            </div>
          ))}
        </div>
      </aside>
      <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto px-8 py-6">
        <DutyTimeline title="即将值班" rows={upcoming} roleOf={roleOf} others={others} />
        {past.length > 0 && <div className="mt-8"><DutyTimeline title="已完成" rows={past} roleOf={roleOf} others={others} muted /></div>}
      </div>
    </div>
  );
}
function DutyTimeline({ title, rows, roleOf, others, muted }: { title: string; rows: Row[]; roleOf: (r: Row) => string; others: (r: Row) => [string, string][]; muted?: boolean }) {
  return (
    <section>
      <h4 className="mb-3 flex items-baseline gap-2 font-serif text-[17px] font-semibold text-ink">{title}<span className="font-sans text-xs font-normal tabular-nums text-muted">{rows.length} 次</span></h4>
      {rows.length === 0 ? <p className="py-6 text-sm text-faint">暂无记录</p> : (
        <ol className="divide-y divide-hair-soft border-y border-hair-soft">
          {rows.map((r) => {
            const d = daysFromToday(dateOf(r));
            return (
              <li key={dateOf(r)} className={`flex items-center gap-5 py-3.5 ${muted ? 'opacity-60' : ''}`}>
                <div className="w-14 shrink-0 text-center">
                  <p className={`font-serif text-xl leading-none tabular-nums ${d === 0 ? 'text-brand' : 'text-ink'}`}>{dateOf(r)}</p>
                  <p className="mt-1 text-[11px] text-muted">{r['星期']}</p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${muted ? 'bg-hair-soft text-muted' : 'bg-brand-soft text-brand'}`}>{roleOf(r)}</span>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-body">
                  {others(r).map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1.5"><span className="text-faint">{k}</span><span className="tabular-nums text-ink">{v}</span></span>
                  ))}
                </div>
                <span className={`shrink-0 text-xs tabular-nums ${d === 0 ? 'font-medium text-brand' : 'text-faint'}`}>{d === 0 ? '今日' : d > 0 ? `${d} 天后` : `${-d} 天前`}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function AllDuty({ data, page, setPage, kw }: { data: api.OnDutyTableResult | null; page: number; setPage: (n: number) => void; kw: string }) {
  if (!data) return <div className="px-8"><Skeleton rows={8} /></div>;
  const cols = data.list[0] ? Object.keys(data.list[0]) : [];
  const tpl = dutyTemplate(cols);
  const pages = Math.max(1, Math.ceil(data.total / LIMIT));
  const isMine = (r: Row) => Object.values(r).includes(USER_NAME);
  let lastMonth = '';
  return (
    <div className="flex min-h-0 flex-1 flex-col px-8 pb-5">
      <div className="grid shrink-0 gap-3 border-y border-hair px-3 py-2.5 text-xs font-medium tracking-wide text-faint" style={{ gridTemplateColumns: tpl }}>{cols.map((c) => <span key={c}>{c}</span>)}</div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {data.list.length === 0 && <p className="py-16 text-center text-sm text-muted">没有找到「{kw}」相关的值班记录</p>}
        {data.list.map((r) => {
          const m = dateOf(r).slice(0, 2), head = m !== lastMonth;
          lastMonth = m;
          const today = dateOf(r) === TODAY_MD, mine = isMine(r), past = daysFromToday(dateOf(r)) < 0;
          return (
            <div key={dateOf(r)}>
              {head && <p className="px-3 pb-1.5 pt-4 font-serif text-sm font-semibold text-ink">{+m}月</p>}
              <div className={`relative grid items-center gap-3 border-b border-hair-soft px-3 py-2.5 text-[13px] text-body ${today || mine ? 'bg-gradient-to-r from-brand-soft to-transparent' : ''} ${past && !today ? 'opacity-55' : ''}`} style={{ gridTemplateColumns: tpl }}>
                {(today || mine) && <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-brand" />}
                {cols.map((c) => <span key={c} className="flex min-w-0 items-center gap-1.5 truncate">{dutyCell(c, r[c], today)}</span>)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex shrink-0 items-center gap-3 pt-4 text-[13px] text-muted">
        <span>共 <span className="tabular-nums text-ink">{data.total}</span> 条</span>
        <span className="flex items-center gap-1.5 text-xs"><span className="h-3 w-[2px] rounded-full bg-brand" />含我或今日</span>
        <div className="ml-auto flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="grid size-8 place-items-center rounded-md border border-hair text-body hover:bg-soft disabled:opacity-40" aria-label="上一页"><ChevronLeft size={15} /></button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} className={`size-8 rounded-md text-[13px] tabular-nums transition-colors ${n === page ? 'bg-brand text-white' : 'text-body hover:bg-soft'}`}>{n}</button>
          ))}
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="grid size-8 place-items-center rounded-md border border-hair text-body hover:bg-soft disabled:opacity-40" aria-label="下一页"><ChevronRight size={15} /></button>
        </div>
      </div>
    </div>
  );
}

/* ================= 荣誉墙：四联卡片横向轮播（参照附件） ================= */
const PER = 4;
export function HonorWall() {
  const { data } = useAsync(() => api.getHonorapi(24));
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const steps = Math.max(1, (data?.length ?? 0) - PER + 1);
  useEffect(() => {
    if (hover || steps < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % steps), 4500);
    return () => clearInterval(t);
  }, [hover, steps]);
  const go = (d: number) => setIdx((i) => (i + d + steps) % steps);
  return (
    <Card title="荣誉墙" icon={<Award {...ic} />} tabs={<PillTabs items={['全部'] as const} value="全部" onChange={() => {}} />} extra={<More />} className="col-span-2">
      {!data ? <Skeleton rows={6} /> : (
        <>
          <div className="relative min-h-0 flex-1" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="h-full overflow-hidden">
              <ul className="flex h-full gap-3 transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)]" style={{ transform: `translateX(calc(${-idx} * (100% + 12px) / ${PER}))` }}>
                {data.map((h) => (
                  <li key={h.Id} className="group flex h-full min-w-0 shrink-0 cursor-pointer flex-col" style={{ flexBasis: `calc((100% - ${(PER - 1) * 12}px) / ${PER})` }}>
                    <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-hair-soft">
                      <img src={h.Avatar.replace('w=1200', 'w=640')} alt={h.Title} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    </div>
                    <p className="mt-2.5 truncate text-[15px] font-semibold text-ink transition-colors group-hover:text-brand">{h.Title}</p>
                    <p className="mt-1 flex items-center gap-2 truncate text-[13px] text-faint"><span className="tabular-nums">{h.CreateTime.slice(0, 10)}</span><span className="text-hair">|</span><span className="truncate">{h.Awardee}</span></p>
                  </li>
                ))}
              </ul>
            </div>
            {[-1, 1].map((d) => (
              <button key={d} onClick={() => go(d)} aria-label={d < 0 ? '上一张' : '下一张'}
                className={`absolute top-[calc(50%-24px)] grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white text-brand shadow-[0_2px_8px_rgba(20,26,43,.16)] transition-transform hover:scale-105 ${d < 0 ? '-left-2' : '-right-2'}`}>
                {d < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            ))}
          </div>
          <div className="mt-3 flex shrink-0 justify-center gap-1.5">
            {Array.from({ length: steps }, (_, i) => <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-brand' : 'w-1.5 bg-[#d3dae6]'}`} aria-label={`第 ${i + 1} 组`} />)}
          </div>
        </>
      )}
    </Card>
  );
}

/* ================= 卡片列表行 ================= */
function RowItem({ title, desc, state, date, onClick }: { title: string; desc: string; state: string; date: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex w-full items-start gap-2.5 border-b border-hair-soft py-2.5 text-left last:border-0">
      <span className={`mt-[7px] size-1.5 shrink-0 rounded-full ${dotOf(state)}`} />
      <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-ink group-hover:text-brand">{title}</span><span className="mt-0.5 block truncate text-xs text-muted">{desc}</span></span>
      <span className="flex shrink-0 flex-col items-end gap-1"><Tag>{state}</Tag><span className="text-[11px] tabular-nums text-faint">{date}</span></span>
    </button>
  );
}
const ViewAll = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="mt-2 flex h-9 w-full shrink-0 items-center justify-center gap-0.5 rounded-lg bg-soft text-[13px] font-medium text-brand transition-colors hover:bg-brand-soft">{label}<ChevronRight size={14} /></button>
);

/* ================= 技改协调（文档 3.4 热点工作接口 HotWorkDto；字段：标题/内容/开始/结束/责任人/手机号，无状态） ================= */
const dt = (s: string) => s.replace('T', ' ').slice(5, 16);
const dtFull = (s: string) => s.replace('T', ' ').slice(0, 16);
function span(a: string, b: string) {
  const h = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 36e5);
  return h >= 24 ? `${Math.floor(h / 24)} 天${h % 24 ? ` ${h % 24} 小时` : ''}` : `${h} 小时`;
}
export function TechCoordination() {
  const { data } = useAsync(() => api.getHotwork({ pageNo: 1, pageSize: 20 }));
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card title="技改协调" icon={<Settings2 {...ic} />} extra={<More onClick={() => data?.[0] && setOpen(data[0].Id)} />}>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {!data ? <Skeleton /> : data.map((w) => (
          <button key={w.Id} onClick={() => setOpen(w.Id)} className="group block w-full border-b border-hair-soft py-2.5 text-left last:border-0">
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink group-hover:text-brand">{w.workType}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-body"><Initial name={w.userName} />{w.userName}</span>
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted">{w.hazardousWorkArea}</span>
            <span className="mt-1 flex items-center gap-1 text-[11px] tabular-nums text-faint"><Clock size={11} />{dt(w.screateTime)} – {dt(w.ecreateTime)}</span>
          </button>
        ))}
      </div>
      <ViewAll label="查看全部项目" onClick={() => data?.[0] && setOpen(data[0].Id)} />
      {open && data && <TechModal list={data} initial={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}
function TechModal({ list, initial, onClose }: { list: api.HotWorkDto[]; initial: string; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [curId, setCurId] = useState(initial);
  const [copied, setCopied] = useState(false);
  const shown = list.filter((w) => !q || w.workType.includes(q) || w.hazardousWorkArea.includes(q) || w.userName.includes(q));
  const cur = list.find((w) => w.Id === curId) ?? list[0];
  const copy = () => navigator.clipboard?.writeText(cur.phone).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  return (
    <Modal open onClose={onClose} title="技改协调" subtitle={`共 ${list.length} 个技改项目`} width="max-w-5xl" height="h-[72vh]" flush>
      <div className="flex w-[380px] shrink-0 flex-col border-r border-hair">
        <div className="relative mx-6 mb-3 mt-5 shrink-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索标题、内容或责任人" className={`${inputCls} pl-9`} />
        </div>
        <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          {shown.map((w) => (
            <li key={w.Id}>
              <button onClick={() => setCurId(w.Id)} className={`relative w-full border-b border-hair-soft px-6 py-4 text-left transition-colors ${cur.Id === w.Id ? 'bg-soft' : 'hover:bg-soft/60'}`}>
                {cur.Id === w.Id && <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-brand" />}
                <span className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{w.workType}</span><span className="shrink-0 text-xs text-muted">{w.userName}</span></span>
                <span className="mt-1 block truncate text-xs text-muted">{w.hazardousWorkArea}</span>
                <span className="mt-2 block text-[11px] tabular-nums text-faint">{dt(w.screateTime)} – {dt(w.ecreateTime)}</span>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="py-16 text-center text-sm text-muted">没有找到「{q}」相关项目</li>}
        </ul>
      </div>
      <article className="scrollbar-thin min-w-0 flex-1 overflow-y-auto px-10 py-8">
        <p className="text-xs font-medium tracking-[0.15em] text-muted">技改项目</p>
        <h4 className="mt-2 font-serif text-[26px] font-medium leading-snug tracking-[-0.02em] text-ink">{cur.workType}</h4>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-body">{cur.hazardousWorkArea}</p>

        <h5 className="mt-9 text-[13px] font-medium text-body">实施时间</h5>
        <div className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-hair">
          {[['开始时间', dtFull(cur.screateTime)], ['结束时间', dtFull(cur.ecreateTime)]].map(([k, v], i) => (
            <div key={k} className={`flex-1 px-5 py-4 ${i ? 'border-l border-hair' : ''}`}>
              <p className="text-xs text-muted">{k}</p><p className="mt-1 font-serif text-lg tabular-nums text-ink">{v}</p>
            </div>
          ))}
          <div className="flex w-36 flex-col justify-center border-l border-hair bg-soft px-5">
            <p className="text-xs text-muted">历时</p><p className="mt-1 text-[15px] font-medium text-ink">{span(cur.screateTime, cur.ecreateTime)}</p>
          </div>
        </div>

        <h5 className="mt-8 text-[13px] font-medium text-body">责任人</h5>
        <div className="mt-3 flex items-center gap-4 rounded-xl bg-soft px-5 py-4">
          <span className="grid size-11 place-items-center rounded-full border border-hair bg-white font-serif text-lg text-ink">{cur.userName.slice(0, 1)}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-ink">{cur.userName}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm tabular-nums text-muted"><Phone size={13} />{cur.phone}</p>
          </div>
          <Btn onClick={copy} className="flex items-center gap-1.5">{copied ? <><Check size={14} />已复制</> : <><Copy size={14} />复制号码</>}</Btn>
        </div>
      </article>
    </Modal>
  );
}

/* ================= 故障与制造问题（文档 3.6） ================= */
const FAULT_STATES = ['未响应', '处理中', '已处理', '未确认', '已归零']; // 文档 FaultDto.State 枚举
export function FaultPanel() {
  const faults = useAsync(api.getFaultTableMessageapi);
  const [open, setOpen] = useState(false);
  return (
    <Card title="故障与制造问题" icon={<TriangleAlert {...ic} />} extra={<More onClick={() => setOpen(true)} />}>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {!faults.data ? <Skeleton /> : faults.data.map((f, i) => <RowItem key={i} title={f.SBMC} desc={f.GS_GZNR} state={f.State} date={f.GZFS_SJ ? fmtMD(f.GZFS_SJ) : '—'} onClick={() => setOpen(true)} />)}
      </div>
      <ViewAll label="查看全部问题" onClick={() => setOpen(true)} />
      {open && <FaultModal faults={faults.data ?? []} onClose={() => setOpen(false)} />}
    </Card>
  );
}
function FaultModal({ faults, onClose }: { faults: api.FaultDto[]; onClose: () => void }) {
  const zz = useAsync(api.getZZPWTMessageapi);
  const [tab, setTab] = useState<'设备故障' | '制造问题'>('设备故障');
  const [state, setState] = useState('全部');
  const [q, setQ] = useState('');
  useEffect(() => { setState('全部'); setQ(''); }, [tab]);
  const isF = tab === '设备故障';
  const states = isF ? FAULT_STATES : [...new Set((zz.data ?? []).map((z) => z.DQZT))];
  const stateOf = (r: api.FaultDto | api.ZZPWTDto) => ('State' in r ? r.State : r.DQZT);
  const rows: (api.FaultDto | api.ZZPWTDto)[] = isF ? faults : zz.data ?? [];
  const shown = rows.filter((r) => (state === '全部' || stateOf(r) === state) && (!q || JSON.stringify(r).includes(q)));
  const head = isF ? ['设备名称', '故障内容', '发生时间', '状态'] : ['机型', '累计台数', '当前状态', '责任人', '提出时间'];
  const tpl = isF ? 'minmax(0,1fr) minmax(0,1.8fr) 150px 80px' : 'minmax(0,1fr) 100px 100px minmax(0,1fr) 120px';
  return (
    <Modal open onClose={onClose} title="故障与制造问题" subtitle="设备故障台账与制造问题（ZZPWT）跟踪" width="max-w-5xl" height="h-[78vh]" flush>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-4 px-8 pt-5">
          <Segmented items={['设备故障', '制造问题'] as const} value={tab} onChange={setTab} counts={{ 设备故障: faults.length, 制造问题: zz.data?.length }} />
          <div className="relative ml-auto w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isF ? '搜索设备或故障内容' : '搜索机型或责任人'} className={`${inputCls} pl-9`} />
          </div>
        </div>
        <div className="grid shrink-0 gap-3 px-8 pb-5 pt-5" style={{ gridTemplateColumns: `repeat(${states.length + 1}, minmax(0,1fr))` }}>
          {['全部', ...states].map((s) => {
            const n = s === '全部' ? rows.length : rows.filter((r) => stateOf(r) === s).length;
            return (
              <button key={s} onClick={() => setState(s)} className={`rounded-xl border px-4 py-3 text-left transition-colors ${state === s ? 'border-brand bg-brand-soft/40' : 'border-hair hover:border-[#cfd8e8]'}`}>
                <span className="flex items-center gap-1.5 text-xs text-muted">{s !== '全部' && <span className={`size-1.5 rounded-full ${dotOf(s)}`} />}{s}</span>
                <span className="mt-1 block font-serif text-[26px] leading-none tabular-nums text-ink">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-8 pb-6">
          <div className="grid shrink-0 gap-4 border-y border-hair py-2.5 text-xs font-medium text-muted" style={{ gridTemplateColumns: tpl }}>{head.map((h) => <span key={h}>{h}</span>)}</div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            {!isF && !zz.data ? <div className="pt-4"><Skeleton /></div> : shown.length === 0 ? <p className="py-16 text-center text-sm text-muted">没有符合条件的记录</p> : shown.map((r, i) => (
              <div key={i} className="grid items-center gap-4 border-b border-hair-soft py-3.5 text-sm text-body" style={{ gridTemplateColumns: tpl }}>
                {'State' in r ? (
                  <><span className="truncate font-medium text-ink">{r.SBMC}</span><span className="truncate">{r.GS_GZNR}</span><span className="tabular-nums text-muted">{r.GZFS_SJ ?? '—'}</span><span><Tag>{r.State}</Tag></span></>
                ) : (
                  <><span className="font-medium text-ink">{r.JX}</span><span className="tabular-nums">{r.LJTH}</span><span><Tag>{r.DQZT}</Tag></span><span>{r.ZRXM}</span><span className="tabular-nums text-muted">{r.TCSJ}</span></>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ================= 顶栏铃铛（附件4：今日待办 / 消息中心） ================= */
export function BellMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'今日待办' | '消息中心'>('今日待办');
  const todos = useAsync(() => api.mytodo(USER_ID));
  const msgs = useAsync(api.myMessages);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const total = (todos.data?.length ?? 0) + (msgs.data?.length ?? 0);
  const dot = ['bg-red-500', 'bg-orange-400', 'bg-blue-500', 'bg-slate-400', 'bg-emerald-500'];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className={`relative grid size-9 place-items-center rounded-full transition-colors ${open ? 'bg-brand-soft text-brand' : 'text-body hover:bg-soft'}`} aria-label="通知" aria-expanded={open}>
        <Bell size={19} strokeWidth={1.75} />{total > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-[380px] rounded-xl border border-hair bg-white px-4 pb-2 pt-3 shadow-[0_16px_40px_-12px_rgba(20,26,43,.22)]">
          <div className="flex items-center border-b border-hair">
            <div className="flex gap-6">
              {(['今日待办', '消息中心'] as const).map((t) => {
                const n = t === '今日待办' ? todos.data?.length : msgs.data?.length;
                return (
                  <button key={t} onClick={() => setTab(t)} className={`relative flex items-center gap-1.5 pb-2.5 pt-1 text-sm ${tab === t ? 'font-semibold text-brand' : 'text-body'}`}>
                    {t}{!!n && <span className={`rounded-full px-1.5 text-[11px] leading-4 ${tab === t ? 'bg-red-500 text-white' : 'bg-soft text-muted'}`}>{n}</span>}
                    {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />}
                  </button>
                );
              })}
            </div>
            <span className="ml-auto pb-1.5"><More /></span>
          </div>
          <ul className="scrollbar-thin max-h-80 overflow-y-auto">
            {tab === '今日待办'
              ? (todos.data ?? []).map((t, i) => (
                  <li key={t.taskId} className="flex items-center gap-2.5 border-b border-hair-soft py-2.5 last:border-0">
                    <span className={`size-1.5 shrink-0 rounded-full ${dot[i % dot.length]}`} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm text-ink">{t.businessTitle}</span><span className="text-xs text-muted">{t.businessType} · {t.taskName}</span></span>
                    <span className="text-xs tabular-nums text-faint">{t.createTime.slice(5)}</span>
                    <button className="rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-brand hover:bg-blue-100">去处理</button>
                  </li>
                ))
              : (msgs.data ?? []).length === 0 ? <li className="py-10 text-center text-sm text-muted">暂无未读消息</li>
              : (msgs.data ?? []).map((m) => (
                  <li key={m.messageId} className="border-b border-hair-soft py-2.5 last:border-0">
                    <div className="flex items-center gap-2 text-xs text-muted"><span className="rounded bg-soft px-1.5 text-body">{m.sourceSystem}</span><span className="tabular-nums">{m.createdAt.slice(5)}</span>
                      <button onClick={() => api.readMessage(m.messageId).then(msgs.reload)} className="ml-auto text-brand hover:underline">标为已读</button></div>
                    <a href={m.url} className="mt-1 line-clamp-2 block text-sm text-ink hover:text-brand">{m.content}</a>
                  </li>
                ))}
          </ul>
        </div>
      )}
    </div>
  );
}
