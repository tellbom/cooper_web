import { useEffect, useMemo, useRef, useState } from 'react';
import { AlignLeft, Bell, Bot, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2, UserRound } from 'lucide-react';
import * as api from '../api';
import { Btn, Card, LineTabs, Modal, More, Segmented, Skeleton, fmtHM, inputCls, useAsync } from './ui';

export const TODAY = new Date(2026, 9, 27);
const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const iso = (d: Date) => `${ymd(d)}T00:00:00+08:00`; // 带本地时区偏移（文档 8.1）
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const wd = (d: Date) => WEEK[(d.getDay() + 6) % 7];
const md = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
const mins = (s: string) => +s.slice(11, 13) * 60 + +s.slice(14, 16);
const LEADER_TONE = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-violet-500', 'bg-slate-400'];
const evTone = (e: api.CalendarEventDto) =>
  e.source === 'AGENT' ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-brand bg-brand-soft text-[#1e3a8a]';

function groupByDay(list: api.CalendarEventDto[] | null) {
  const m: Record<string, api.CalendarEventDto[]> = {};
  (list ?? []).forEach((e) => (m[e.startAt.slice(0, 10)] ??= []).push(e));
  Object.values(m).forEach((l) => l.sort((a, b) => a.startAt.localeCompare(b.startAt)));
  return m;
}

export function ScheduleCard() {
  const [tab, setTab] = useState<'领导日程' | '我的日程'>('领导日程');
  return (
    <Card className="flex-1" tabs={<LineTabs size="lg" items={['领导日程', '我的日程'] as const} value={tab} onChange={setTab} />} extra={<More />}>
      {tab === '领导日程' ? <LeaderAgenda /> : <MySchedule />}
    </Card>
  );
}

function NavBar({ label, onPrev, onNext, right }: { label: string; onPrev: () => void; onNext: () => void; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex shrink-0 items-center gap-2">
      <div className="flex h-8 flex-1 items-center justify-between rounded-lg border border-hair px-1">
        <button onClick={onPrev} className="rounded p-1 text-muted hover:bg-soft hover:text-brand" aria-label="上一页"><ChevronLeft size={16} /></button>
        <span className="text-[13px] font-medium tabular-nums text-ink">{label}</span>
        <button onClick={onNext} className="rounded p-1 text-muted hover:bg-soft hover:text-brand" aria-label="下一页"><ChevronRight size={16} /></button>
      </div>
      {right}
    </div>
  );
}

/* ---------------- 领导日程 ---------------- */
function LeaderAgenda() {
  const { data } = useAsync(api.getLeadershipAgenda);
  const [day, setDay] = useState(TODAY);
  const items = (data ?? []).filter((s) => s.startTime.startsWith(ymd(day))).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const leaders = [...new Set((data ?? []).map((s) => s.leaderID))];
  return (
    <>
      <NavBar label={`${day.getFullYear()}年${md(day)}  周${wd(day)}`} onPrev={() => setDay(addDays(day, -1))} onNext={() => setDay(addDays(day, 1))} />
      {!data ? <Skeleton /> : items.length === 0 ? (
        <p className="grid flex-1 place-items-center text-sm text-muted">当日暂无领导日程</p>
      ) : (
        <ol className="scrollbar-thin relative min-h-0 flex-1 space-y-3 overflow-y-auto pl-1">
          {items.map((s, i) => {
            const m = s.activity.match(/^(.*?)（(.*)）$/);
            return (
              <li key={i} className="relative flex gap-3 pl-4">
                {i < items.length - 1 && <span className="absolute left-[3.5px] top-3 h-[calc(100%+4px)] border-l border-dashed border-hair" />}
                <span className={`absolute left-0 top-[7px] size-2 rounded-full ${LEADER_TONE[leaders.indexOf(s.leaderID) % LEADER_TONE.length]}`} />
                <span className="w-10 shrink-0 text-[13px] tabular-nums leading-5 text-body">{fmtHM(s.startTime)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium leading-5 text-ink">{m ? m[1] : s.activity}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <span className="text-brand">{s.leaderName}</span>
                    {m && <span className="flex min-w-0 items-center gap-0.5 truncate"><MapPin size={11} className="shrink-0" />{m[2]}</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

/* ---------------- 我的日程：卡片内 7 日视图 ---------------- */
type View = '7日' | '月' | '年';
function MySchedule() {
  const [sel, setSel] = useState(TODAY);
  const [version, setVersion] = useState(0);
  const [modal, setModal] = useState<View | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<api.CalendarEventDto | null>(null);
  const ws = weekStart(sel);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const { data } = useAsync(() => api.listCalendarEvents(iso(ws), iso(addDays(ws, 7))), [ymd(ws), version]);
  const byDay = useMemo(() => groupByDay(data), [data]);
  const list = byDay[ymd(sel)] ?? [];
  const changed = () => setVersion((v) => v + 1);
  return (
    <>
      <NavBar label={`${md(ws)} – ${md(addDays(ws, 6))}`} onPrev={() => setSel(addDays(sel, -7))} onNext={() => setSel(addDays(sel, 7))}
        right={<Segmented items={['7日', '月', '年'] as const} value="7日" onChange={(v) => v !== '7日' && setModal(v)} />} />
      <div className="grid shrink-0 grid-cols-7 gap-1">
        {days.map((d) => {
          const k = ymd(d), n = byDay[k]?.length ?? 0, on = k === ymd(sel), today = k === ymd(TODAY);
          return (
            <button key={k} onClick={() => setSel(d)} className={`flex flex-col items-center gap-1 rounded-lg py-1.5 transition-colors ${on ? 'bg-brand text-white' : 'hover:bg-soft'}`}>
              <span className={`text-[11px] ${on ? 'text-white/80' : 'text-faint'}`}>{wd(d)}</span>
              <span className={`text-[15px] font-semibold tabular-nums ${on ? '' : today ? 'text-brand' : 'text-ink'}`}>{d.getDate()}</span>
              <span className="flex h-1 gap-0.5">{Array.from({ length: Math.min(n, 3) }, (_, i) => <span key={i} className={`size-1 rounded-full ${on ? 'bg-white' : 'bg-blue-300'}`} />)}</span>
            </button>
          );
        })}
      </div>
      <div className="mb-2 mt-3 flex shrink-0 items-center justify-between">
        <span className="text-[13px] text-muted"><span className="font-medium text-ink">{md(sel)} 周{wd(sel)}</span> · {list.length} 项</span>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-deep"><Plus size={14} />新建日程</button>
      </div>
      <ul className="scrollbar-thin min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {!data ? <Skeleton rows={2} /> : list.length === 0 ? <li className="grid h-full min-h-12 place-items-center text-xs text-faint">当日暂无日程</li> : list.map((e) => (
          <li key={e.id}>
            <button onClick={() => setDetail(e)} className={`w-full rounded-md border-l-[3px] px-3 py-1.5 text-left transition-opacity hover:opacity-85 ${evTone(e)}`}>
              <span className="flex items-center gap-1.5 truncate text-[13px] font-medium">{e.title}{e.source === 'AGENT' && <Bot size={12} className="shrink-0" />}</span>
              <span className="mt-0.5 flex gap-2 text-[11px] opacity-75"><span>{fmtHM(e.startAt)}–{fmtHM(e.endAt)}</span>{e.location && <span className="truncate">{e.location}</span>}</span>
            </button>
          </li>
        ))}
      </ul>
      {modal && <CalendarModal initialView={modal} anchor={sel} version={version} onChanged={changed} onClose={() => setModal(null)} />}
      <CreateEvent open={creating} day={sel} onClose={() => setCreating(false)} onDone={() => { setCreating(false); changed(); }} />
      <EventDetail ev={detail} onClose={() => setDetail(null)} onDeleted={() => { setDetail(null); changed(); }} />
    </>
  );
}

/* ---------------- 二次弹窗：7日 / 月 / 年 ---------------- */
function CalendarModal({ initialView, anchor: a0, version, onChanged, onClose }: {
  initialView: View; anchor: Date; version: number; onChanged: () => void; onClose: () => void;
}) {
  const [view, setView] = useState<View>(initialView);
  const [anchor, setAnchor] = useState(a0);
  const [creating, setCreating] = useState<Date | null>(null);
  const [detail, setDetail] = useState<api.CalendarEventDto | null>(null);
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const [rs, re] =
    view === '7日' ? [weekStart(anchor), addDays(weekStart(anchor), 7)]
    : view === '月' ? [weekStart(first), addDays(weekStart(first), 42)]
    : [new Date(anchor.getFullYear(), 0, 1), new Date(anchor.getFullYear() + 1, 0, 1)];
  const { data } = useAsync(() => api.listCalendarEvents(iso(rs), iso(re)), [view, ymd(rs), version]);
  const byDay = useMemo(() => groupByDay(data), [data]);
  const shift = (n: number) =>
    setAnchor(view === '7日' ? addDays(anchor, 7 * n) : view === '月' ? new Date(anchor.getFullYear(), anchor.getMonth() + n, 1) : new Date(anchor.getFullYear() + n, 0, 1));
  const label =
    view === '7日' ? `${anchor.getFullYear()}年${md(rs)} – ${md(addDays(re, -1))}`
    : view === '月' ? `${anchor.getFullYear()}年${anchor.getMonth() + 1}月` : `${anchor.getFullYear()}年`;
  const inRange = view === '月' ? (data ?? []).filter((e) => +e.startAt.slice(5, 7) === anchor.getMonth() + 1).length : data?.length ?? 0;
  const goto = (d: Date, v: View) => { setAnchor(d); setView(v); };
  return (
    <Modal open onClose={onClose} title={label} subtitle={`我的日程 · 共 ${inRange} 项${view === '年' ? ' · 点击月份查看详情' : ''}`} width="max-w-6xl" height="h-[84vh]" flush
      actions={
        <div className="flex items-center gap-2 self-center">
          <Btn onClick={() => setAnchor(TODAY)}>今天</Btn>
          <div className="flex h-9 items-center rounded-lg border border-hair">
            <button onClick={() => shift(-1)} className="h-full px-2 text-muted hover:text-brand" aria-label="上一页"><ChevronLeft size={16} /></button>
            <span className="h-4 border-l border-hair" />
            <button onClick={() => shift(1)} className="h-full px-2 text-muted hover:text-brand" aria-label="下一页"><ChevronRight size={16} /></button>
          </div>
          <Segmented items={['7日', '月', '年'] as const} value={view} onChange={setView} />
          <Btn primary onClick={() => setCreating(anchor)} className="flex items-center gap-1"><Plus size={15} />新建日程</Btn>
          <span className="mx-1 h-5 border-l border-hair" />
        </div>
      }>
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {view === '7日' && <WeekView start={rs} byDay={byDay} onOpen={setDetail} onCreate={setCreating} />}
        {view === '月' && <MonthView first={first} byDay={byDay} onOpen={setDetail} onDay={(d) => goto(d, '7日')} onCreate={setCreating} />}
        {view === '年' && <YearView year={anchor.getFullYear()} byDay={byDay} onMonth={(m) => goto(new Date(anchor.getFullYear(), m, 1), '月')} />}
      </div>
      <CreateEvent open={!!creating} day={creating ?? anchor} onClose={() => setCreating(null)} onDone={() => { setCreating(null); onChanged(); }} />
      <EventDetail ev={detail} onClose={() => setDetail(null)} onDeleted={() => { setDetail(null); onChanged(); }} />
    </Modal>
  );
}

const H0 = 7, H1 = 21, ROW = 52;
function WeekView({ start, byDay, onOpen, onCreate }: { start: Date; byDay: Record<string, api.CalendarEventDto[]>; onOpen: (e: api.CalendarEventDto) => void; onCreate: (d: Date) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: ROW * 1.5 }); }, []);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const cols = 'grid-cols-[64px_repeat(7,minmax(0,1fr))]';
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`grid ${cols} shrink-0 border-b border-hair pr-[6px]`}>
        <span />
        {days.map((d) => {
          const today = ymd(d) === ymd(TODAY);
          return (
            <div key={ymd(d)} className="flex items-baseline gap-2 border-l border-hair-soft px-3 py-3">
              <span className="text-xs text-muted">周{wd(d)}</span>
              <span className={`font-serif text-[22px] tabular-nums leading-none ${today ? 'text-brand' : 'text-ink'}`}>{d.getDate()}</span>
              {today && <span className="rounded-full bg-brand-soft px-1.5 text-[11px] text-brand">今天</span>}
            </div>
          );
        })}
      </div>
      <div ref={scroller} className="scrollbar-thin min-h-0 flex-1 overflow-y-scroll">
        <div className={`relative grid ${cols}`} style={{ height: (H1 - H0) * ROW }}>
          <div className="relative">
            {Array.from({ length: H1 - H0 }, (_, i) => (
              <span key={i} className="absolute right-3 -translate-y-1/2 text-[11px] tabular-nums text-faint" style={{ top: i * ROW }}>{i ? `${pad(H0 + i)}:00` : ''}</span>
            ))}
          </div>
          {days.map((d) => {
            const list = byDay[ymd(d)] ?? [];
            const lanes: string[] = [];
            const placed = list.map((e) => {
              let l = lanes.findIndex((end) => end <= e.startAt);
              if (l < 0) { l = lanes.length; lanes.push(''); }
              lanes[l] = e.endAt;
              return { e, l };
            });
            return (
              <div key={ymd(d)} className={`relative border-l border-hair-soft ${ymd(d) === ymd(TODAY) ? 'bg-brand-soft/30' : ''}`}
                onDoubleClick={() => onCreate(d)} title="双击新建日程">
                {Array.from({ length: H1 - H0 }, (_, i) => <span key={i} className="absolute inset-x-0 border-t border-hair-soft" style={{ top: i * ROW }} />)}
                {placed.map(({ e, l }) => {
                  const top = ((mins(e.startAt) - H0 * 60) / 60) * ROW, h = Math.max(26, ((mins(e.endAt) - mins(e.startAt)) / 60) * ROW - 3);
                  const w = 100 / lanes.length;
                  return (
                    <button key={e.id} onClick={() => onOpen(e)} onDoubleClick={(x) => x.stopPropagation()}
                      className={`absolute overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left transition-shadow hover:shadow-[0_2px_8px_rgba(20,26,43,.12)] ${evTone(e)}`}
                      style={{ top, height: h, left: `calc(${l * w}% + 3px)`, width: `calc(${w}% - 6px)` }}>
                      <span className="block truncate text-xs font-semibold">{e.title}</span>
                      {h > 34 && <span className="block truncate text-[11px] opacity-75">{fmtHM(e.startAt)}–{fmtHM(e.endAt)}</span>}
                      {h > 54 && e.location && <span className="block truncate text-[11px] opacity-75">{e.location}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthView({ first, byDay, onOpen, onDay, onCreate }: {
  first: Date; byDay: Record<string, api.CalendarEventDto[]>; onOpen: (e: api.CalendarEventDto) => void; onDay: (d: Date) => void; onCreate: (d: Date) => void;
}) {
  const s = weekStart(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(s, i));
  return (
    <div className="flex min-h-0 flex-1 flex-col px-8 pb-6 pt-4">
      <div className="grid shrink-0 grid-cols-7 pb-2 text-xs text-muted">{WEEK.map((w) => <span key={w} className="px-2">周{w}</span>)}</div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-hidden rounded-xl border border-hair">
        {days.map((d, i) => {
          const k = ymd(d), list = byDay[k] ?? [], out = d.getMonth() !== first.getMonth(), today = k === ymd(TODAY);
          return (
            <div key={k} onDoubleClick={() => onCreate(d)} className={`flex min-h-0 flex-col gap-0.5 border-hair-soft p-1.5 ${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} ${out ? 'bg-soft/70' : ''}`}>
              <button onClick={() => onDay(d)} className={`grid size-6 shrink-0 place-items-center self-start rounded-full text-xs tabular-nums transition-colors ${today ? 'bg-brand font-semibold text-white' : out ? 'text-faint hover:bg-hair-soft' : 'text-ink hover:bg-brand-soft'}`}>{d.getDate()}</button>
              {list.slice(0, 2).map((e) => (
                <button key={e.id} onClick={() => onOpen(e)} className="flex min-w-0 items-center gap-1.5 rounded px-1 py-px text-left text-[12px] hover:bg-soft">
                  <span className={`size-1.5 shrink-0 rounded-full ${e.source === 'AGENT' ? 'bg-teal-500' : 'bg-brand'}`} />
                  <span className="shrink-0 tabular-nums text-muted">{fmtHM(e.startAt)}</span>
                  <span className={`truncate ${out ? 'text-faint' : 'text-ink'}`}>{e.title}</span>
                </button>
              ))}
              {list.length > 2 && <button onClick={() => onDay(d)} className="px-1 text-left text-[11px] text-brand hover:underline">另有 {list.length - 2} 项</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ year, byDay, onMonth }: { year: number; byDay: Record<string, api.CalendarEventDto[]>; onMonth: (m: number) => void }) {
  const heat = (n: number) => (n === 0 ? '' : n === 1 ? 'bg-blue-100 text-[#1e3a8a]' : n === 2 ? 'bg-blue-300 text-white' : 'bg-brand text-white');
  return (
    <div className="scrollbar-thin grid min-h-0 flex-1 grid-cols-4 gap-x-8 gap-y-6 overflow-y-auto px-8 py-6">
      {Array.from({ length: 12 }, (_, m) => {
        const f = new Date(year, m, 1), s = weekStart(f);
        const days = Array.from({ length: 42 }, (_, i) => addDays(s, i));
        const total = days.filter((d) => d.getMonth() === m).reduce((a, d) => a + (byDay[ymd(d)]?.length ?? 0), 0);
        const cur = year === TODAY.getFullYear() && m === TODAY.getMonth();
        return (
          <button key={m} onClick={() => onMonth(m)} className={`rounded-xl p-3 text-left transition-colors hover:bg-soft ${cur ? 'bg-brand-soft/40 ring-1 ring-blue-100' : ''}`}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <span className={`font-serif text-lg ${cur ? 'text-brand' : 'text-ink'}`}>{m + 1}月</span>
              <span className="text-xs tabular-nums text-muted">{total ? `${total} 项` : '—'}</span>
            </div>
            <div className="grid grid-cols-7 gap-y-0.5 text-center text-[10px] text-faint">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
            <div className="mt-0.5 grid grid-cols-7 gap-y-0.5 text-center">
              {days.map((d) => {
                const k = ymd(d), n = byDay[k]?.length ?? 0;
                if (d.getMonth() !== m) return <span key={k} />;
                return <span key={k} className={`mx-auto grid size-[22px] place-items-center rounded-full text-[11px] tabular-nums ${k === ymd(TODAY) ? 'ring-1 ring-brand' : ''} ${heat(n) || 'text-body'}`}>{d.getDate()}</span>;
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- 日程详情 / 新建 ---------------- */
const REMIND = [[0, '不提醒'], [5, '提前 5 分钟'], [10, '提前 10 分钟'], [15, '提前 15 分钟'], [30, '提前 30 分钟'], [60, '提前 1 小时'], [1440, '提前 1 天']] as const;
function EventDetail({ ev, onClose, onDeleted }: { ev: api.CalendarEventDto | null; onClose: () => void; onDeleted: () => void }) {
  if (!ev) return null;
  const d = new Date(+ev.startAt.slice(0, 4), +ev.startAt.slice(5, 7) - 1, +ev.startAt.slice(8, 10));
  const rows: [typeof Clock, string][] = [
    [Clock, `${d.getFullYear()}年${md(d)} 周${wd(d)}  ${fmtHM(ev.startAt)} – ${fmtHM(ev.endAt)}`],
    ...(ev.location ? [[MapPin, ev.location] as [typeof Clock, string]] : []),
    [Bell, REMIND.find(([v]) => v === ev.reminderMinutes)?.[1] ?? `提前 ${ev.reminderMinutes} 分钟`],
    [ev.source === 'AGENT' ? Bot : UserRound, ev.source === 'AGENT' ? '由智能助手创建' : '本人创建'],
    ...(ev.description ? [[AlignLeft, ev.description] as [typeof Clock, string]] : []),
  ];
  return (
    <Modal open onClose={onClose} title={ev.title} width="max-w-md"
      footer={<>
        <button onClick={() => api.deleteCalendarEvent(ev.id).then(onDeleted)} className="mr-auto flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"><Trash2 size={15} />删除日程</button>
        <Btn onClick={onClose}>关闭</Btn>
      </>}>
      <ul className="space-y-3.5">
        {rows.map(([I, t], i) => <li key={i} className="flex gap-3 text-sm leading-6 text-body"><I size={16} strokeWidth={1.75} className="mt-1 shrink-0 text-muted" />{t}</li>)}
      </ul>
    </Modal>
  );
}

function L({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[13px] font-medium text-body">{t}</span>{children}</label>;
}
function CreateEvent({ open, day, onClose, onDone }: { open: boolean; day: Date; onClose: () => void; onDone: () => void }) {
  const blank = { title: '', location: '', description: '', date: '', start: '09:00', end: '10:00', reminderMinutes: 15 };
  const [f, setF] = useState(blank);
  const date = f.date || ymd(day);
  const valid = !!f.title.trim() && f.end > f.start;
  const submit = () =>
    api.createCalendarEvent({
      title: f.title.trim(), location: f.location || null, description: f.description || null,
      startAt: `${date}T${f.start}:00+08:00`, endAt: `${date}T${f.end}:00+08:00`, reminderMinutes: f.reminderMinutes,
    }).then(() => { setF(blank); onDone(); });
  return (
    <Modal open={open} onClose={onClose} title="新建日程" subtitle="保存后将同步到 Portal 日历" width="max-w-lg"
      footer={<><Btn onClick={onClose}>取消</Btn><Btn primary disabled={!valid} onClick={submit}>保存日程</Btn></>}>
      <div className="space-y-5">
        <L t="标题"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="例如：项目进度同步会" autoFocus /></L>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3">
          <L t="日期"><input type="date" className={inputCls} value={date} onChange={(e) => setF({ ...f, date: e.target.value })} /></L>
          <L t="开始"><input type="time" className={inputCls} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></L>
          <L t="结束"><input type="time" className={inputCls} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></L>
        </div>
        {f.end <= f.start && <p className="-mt-3 text-xs text-red-600">结束时间需晚于开始时间</p>}
        <div className="grid grid-cols-[1.4fr_2fr] gap-3">
          <L t="提醒"><select className={inputCls} value={f.reminderMinutes} onChange={(e) => setF({ ...f, reminderMinutes: +e.target.value })}>{REMIND.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></L>
          <L t="地点"><input className={inputCls} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="可选" /></L>
        </div>
        <L t="描述"><textarea rows={3} className={`${inputCls} resize-none`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="可选" /></L>
      </div>
    </Modal>
  );
}
