import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AlertTriangle, ArrowUpRight, Megaphone, Newspaper, RotateCw, Search as SearchIcon, X } from 'lucide-react';
import * as api from '../api';
import { Breadcrumb, Modal, Segmented, Skeleton } from '../components/ui';

/** 资讯搜索（AURA 第九章）：按时间轴浏览 / 检索新闻与公告 */
const TODAY = new Date(2026, 9, 27); // 原型固定“今天”
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const back = (n: number) => ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - n));
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const TYPES = { 全部: ['News', 'Announcement'], 新闻: ['News'], 公告: ['Announcement'] } as const;
type TypeKey = keyof typeof TYPES;
const RANGES = { 全部时间: null, 近7天: 7, 近30天: 30, 近90天: 90, 自定义: -1 } as const;
type RangeKey = keyof typeof RANGES;
const DAYS_PER_PAGE = 5; // day-grouped 每页天数
const RESULTS_PER_PAGE = 10; // search 每页条数

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const q = sp.get('q') ?? '';
  const type = (sp.get('type') as TypeKey) in TYPES ? (sp.get('type') as TypeKey) : '全部';
  const range = (sp.get('range') as RangeKey) in RANGES ? (sp.get('range') as RangeKey) : '全部时间';
  const from = range === '自定义' ? sp.get('from') ?? '' : RANGES[range] ? back(RANGES[range] as number) : '';
  const to = range === '自定义' ? sp.get('to') ?? '' : RANGES[range] ? ymd(TODAY) : '';
  const set = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setSp(n, { replace: true });
  };
  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);

  // 分页累加：条件变化即重置为第 1 页
  const key = JSON.stringify([q, type, from, to]);
  const [pg, setPg] = useState({ key, n: 1 });
  const n = pg.key === key ? pg.n : 1;
  const [chunks, setChunks] = useState<{ key: string; list: api.SearchView[] }>({ key: '', list: [] });
  const [state, setState] = useState<{ loading: boolean; error: api.AuraSearchError | null }>({ loading: true, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null });
    api.searchNews({
      query: q, sourceTypes: [...TYPES[type]], publishTimeFrom: from || undefined, publishTimeTo: to || undefined,
      page: n, pageSize: q.trim() ? RESULTS_PER_PAGE : DAYS_PER_PAGE,
    }).then((v) => {
      if (!alive) return;
      setChunks((c) => ({ key, list: n === 1 || c.key !== key ? [v] : [...c.list, v] }));
      setState({ loading: false, error: null });
    }).catch((e) => alive && setState({ loading: false, error: e instanceof api.AuraSearchError ? e : new api.AuraSearchError(0, String(e)) }));
    return () => { alive = false; };
  }, [key, n, retry]);

  const list = chunks.key === key ? chunks.list : [];
  const groups = useMemo(() => {
    const m = new Map<string, api.SearchItem[]>();
    list.forEach((v) => {
      const items = v.displayMode === 'days' ? v.data.days.flatMap((d) => d.items.map((i) => [d.date, i] as const)) : v.data.results.map((i) => [i.publishTime.slice(0, 10), i] as const);
      items.forEach(([d, i]) => m.set(d, [...(m.get(d) ?? []), i]));
    });
    return [...m].map(([date, items]) => ({ date, items }));
  }, [list]);
  const first = list[0], last = list[list.length - 1];
  const hasMore = !!last && (last.displayMode === 'days' ? last.data.page < last.data.totalPages : last.data.results.length === last.data.pageSize);
  const degraded = list.find((v) => v.data.degraded);
  const maxDepth = list.some((v) => v.data.maxDepthReached);
  const [reading, setReading] = useState<api.SearchItem | null>(null);
  const open = (i: api.SearchItem) => (i.sourceType === 'News' ? navigate(`/news/${i.newsId}`) : setReading(i));

  return (
    <div className="mx-auto max-w-[1280px] px-8 pb-24 pt-6">
      <Breadcrumb items={[['首页', '/'], ['新闻资讯', '/news'], ['资讯搜索']]} />
      <header className="mt-7 border-b border-hair pb-7">
        <p className="text-xs font-medium tracking-[0.25em] text-brand">TIMELINE SEARCH</p>
        <h1 className="mt-2 font-serif text-[40px] font-medium leading-tight tracking-[-0.02em] text-ink">资讯搜索</h1>
        <p className="mt-2 text-[15px] text-muted">沿时间轴浏览与检索公司新闻和公告；不输入关键词即按日浏览</p>
        <form onSubmit={(e) => { e.preventDefault(); set({ q: input.trim() || undefined }); }} className="mt-6 flex max-w-3xl items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入关键词，如：安全生产、质量、数字化"
              className="h-12 w-full rounded-xl border border-hair bg-white pl-12 pr-10 text-[15px] outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-blue-50" />
            {input && <button type="button" onClick={() => { setInput(''); set({ q: undefined }); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink" aria-label="清除"><X size={16} /></button>}
          </div>
          <button className="h-12 rounded-xl bg-brand px-7 text-[15px] font-medium text-white hover:bg-brand-deep">搜索</button>
        </form>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Segmented items={Object.keys(TYPES) as TypeKey[]} value={type} onChange={(v) => set({ type: v === '全部' ? undefined : v })} />
          <Segmented items={Object.keys(RANGES) as RangeKey[]} value={range} onChange={(v) => set({ range: v === '全部时间' ? undefined : v, from: undefined, to: undefined })} />
          {range === '自定义' && (
            <span className="flex items-center gap-2 text-sm text-muted">
              <input type="date" value={from} max={to || undefined} onChange={(e) => set({ from: e.target.value || undefined })} className="h-9 rounded-lg border border-hair bg-white px-2.5 text-sm text-ink outline-none focus:border-brand" />
              至
              <input type="date" value={to} min={from || undefined} onChange={(e) => set({ to: e.target.value || undefined })} className="h-9 rounded-lg border border-hair bg-white px-2.5 text-sm text-ink outline-none focus:border-brand" />
            </span>
          )}
        </div>
      </header>

      <div className="mt-8">
        <main className="min-w-0">
          {(degraded || maxDepth) && (
            <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <div>
                {degraded && <p>当前为降级检索{degraded.data.degradationMode ? `（${degraded.data.degradationMode}）` : ''}，结果可能不完整。</p>}
                {maxDepth && <p>已达到最大检索深度，部分较早的结果未返回，可缩小时间范围后重试。</p>}
              </div>
            </div>
          )}
          {state.error && list.length === 0 ? (
            <div className="rounded-xl border border-hair bg-white px-8 py-16 text-center">
              <p className="font-serif text-[22px] text-ink">{state.error.status === 503 ? '搜索服务暂时不可用' : '搜索失败'}</p>
              <p className="mt-2 text-sm text-muted">{state.error.status === 503 ? '请稍后再试' : `错误代码 ${state.error.message}`}</p>
              <button onClick={() => setRetry((r) => r + 1)} className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-hair px-4 py-2 text-sm text-ink hover:bg-soft"><RotateCw size={14} />重试</button>
            </div>
          ) : list.length === 0 ? <Skeleton rows={10} /> : groups.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-[22px] text-ink">没有找到相关资讯</p>
              <p className="mt-2 text-sm text-muted">试试更换关键词，或放宽时间范围与类型</p>
            </div>
          ) : (
            <>
              {groups.map((g) => <DayGroup key={g.date} date={g.date} items={g.items} onOpen={open} />)}
              <div className="flex justify-center pt-2">
                {hasMore ? (
                  <button disabled={state.loading} onClick={() => setPg({ key, n: n + 1 })} className="h-10 rounded-lg border border-hair bg-white px-6 text-sm font-medium text-ink hover:bg-soft disabled:opacity-50">
                    {state.loading ? '加载中…' : q ? '加载更多结果' : '加载更早的日期'}
                  </button>
                ) : <p className="text-xs text-faint">— 已经到底了 —</p>}
              </div>
              {first && <p className="mt-6 text-center text-[11px] text-faint">检索模式 {first.data.searchMode} · 编号 {first.data.searchTraceId}</p>}
            </>
          )}
        </main>

      </div>

      <Modal open={!!reading} onClose={() => setReading(null)} title={reading?.title ?? ''} subtitle={reading && `${reading.publisher} · ${reading.publishTime.replace('T', ' ').slice(0, 16)}`} width="max-w-3xl">
        {reading?.contentHtml
          ? <div className="prose-news text-[15.5px] text-body" dangerouslySetInnerHTML={{ __html: api.sanitizeHtml(reading.contentHtml) }} />
          : <p className="text-sm text-muted">{reading?.summary ?? '暂无正文'}</p>}
      </Modal>
    </div>
  );
}

function DayGroup({ date, items, onOpen }: { date: string; items: api.SearchItem[]; onOpen: (i: api.SearchItem) => void }) {
  const d = new Date(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  const diff = Math.round((TODAY.getTime() - d.getTime()) / 864e5);
  const rel = diff === 0 ? '今天' : diff === 1 ? '昨天' : diff > 0 && diff < 7 ? `${diff} 天前` : '';
  return (
    <section id={`day-${date}`} className="grid scroll-mt-4 grid-cols-[112px_minmax(0,1fr)] gap-7">
      <div className="sticky top-4 self-start pt-1 text-right">
        <p className={`font-serif text-[34px] font-medium leading-none tabular-nums ${diff === 0 ? 'text-brand' : 'text-ink'}`}>{pad(d.getDate())}</p>
        <p className="mt-1.5 text-[13px] text-body">{d.getFullYear()}年{d.getMonth() + 1}月</p>
        <p className="mt-0.5 text-xs text-faint">{WEEK[d.getDay()]}{rel && ` · ${rel}`}</p>
      </div>
      <ol className="relative space-y-3 border-l border-hair pb-10 pl-7">
        <span className={`absolute -left-[5px] top-3 size-[9px] rounded-full ring-4 ring-canvas ${diff === 0 ? 'bg-brand' : 'bg-ink'}`} />
        {items.map((i) => <ResultCard key={`${i.sourceType}-${i.newsId}`} i={i} onOpen={onOpen} />)}
      </ol>
    </section>
  );
}

function ResultCard({ i, onOpen }: { i: api.SearchItem; onOpen: (i: api.SearchItem) => void }) {
  const news = i.sourceType === 'News';
  const snippet = i.highlight ? api.sanitizeHtml(i.highlight) : null;
  return (
    <li className="relative">
      <span className={`absolute -left-[31px] top-6 size-[7px] rounded-full ${news ? 'bg-brand' : 'bg-amber-500'}`} />
      <button onClick={() => onOpen(i)} className="group flex w-full gap-5 rounded-xl border border-hair bg-white p-5 text-left transition-colors hover:border-blue-200">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2.5 text-xs text-muted">
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${news ? 'bg-brand-soft text-brand' : 'bg-amber-50 text-amber-700'}`}>
              {news ? <Newspaper size={12} /> : <Megaphone size={12} />}{news ? '新闻' : '公告'}
            </span>
            <span className="tabular-nums">{i.publishTime.slice(11, 16)}</span>
            <span className="text-hair">|</span><span className="truncate">{i.publisher}{i.author && i.author !== i.publisher ? ` · ${i.author}` : ''}</span>
          </p>
          <h3 className="mt-2 flex items-start gap-1 font-serif text-[18px] font-semibold leading-snug text-ink group-hover:text-brand">
            <span className="line-clamp-2">{i.title}</span>
            <ArrowUpRight size={16} className="mt-1 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
          </h3>
          {snippet ? <p className="hl mt-2 line-clamp-2 text-sm leading-7 text-body" dangerouslySetInnerHTML={{ __html: snippet }} />
            : i.summary && <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{i.summary}</p>}
        </div>
        {i.cover && <div className="aspect-[3/2] w-36 shrink-0 self-center overflow-hidden rounded-lg bg-hair-soft"><img src={i.cover.replace('w=1200', 'w=400')} alt="" className="size-full object-cover" /></div>}
      </button>
    </li>
  );
}
