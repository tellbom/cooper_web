import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Eye, Search, X } from 'lucide-react';
import * as api from '../api';
import { Breadcrumb, Pager, Skeleton, fmtDate, useAsync } from '../components/ui';

const LIMIT = 8;
const flatten = (l: api.ChannelChildrenDto[] = []): api.ChannelChildrenDto[] => l.flatMap((c) => [c, ...flatten(c.children)]);

/** 新闻资讯：频道（news-center）+ 频道新闻列表（get-context：ChannelID / Page / Limit / search → arr / count） */
export default function NewsList() {
  const [sp, setSp] = useSearchParams();
  const channels = useAsync(api.getnewscenterapi);
  const flat = useMemo(() => flatten(channels.data ?? []), [channels.data]);
  const channelId = Number(sp.get('channel')) || flat[0]?.DxE_id;
  const page = Number(sp.get('page')) || 1;
  const q = sp.get('q') ?? '';
  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);
  const list = useAsync(
    () => (channelId ? api.getNewsDetail({ ChannelID: channelId, Page: page, Limit: LIMIT, search: q || undefined }) : Promise.resolve(null)),
    [channelId, page, q],
  );
  const cur = flat.find((c) => c.DxE_id === channelId);
  const set = (patch: Record<string, string | number | undefined>) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, String(v)) : n.delete(k)));
    setSp(n);
  };
  const arr = list.data?.arr ?? [];
  const lead = page === 1 && !q && arr[0]?.isImage ? arr[0] : null;
  const rest = lead ? arr.slice(1) : arr;

  return (
    <div className="mx-auto max-w-[1280px] px-8 pb-20 pt-6">
      <Breadcrumb items={[['首页', '/'], ['新闻资讯']]} />
      <header className="mt-7 flex items-end justify-between gap-10 border-b border-hair pb-8">
        <div>
          <p className="text-xs font-medium tracking-[0.25em] text-brand">NEWS CENTER</p>
          <h1 className="mt-2 font-serif text-[40px] font-medium leading-tight tracking-[-0.02em] text-ink">新闻资讯</h1>
          <p className="mt-2 text-[15px] text-muted">公司要闻、基层动态与科技前沿，一处阅览 · <Link to="/search" className="text-brand hover:text-brand-deep">按时间轴检索新闻与公告 →</Link></p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); set({ q: input.trim() || undefined, page: undefined }); }} className="flex w-[380px] items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`在「${cur?.Title ?? '频道'}」中搜索`}
              className="h-11 w-full rounded-lg border border-hair bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-blue-50" />
          </div>
          <button className="h-11 rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-deep">搜索</button>
        </form>
      </header>

      <div className="mt-8 grid grid-cols-[200px_minmax(0,1fr)_280px] gap-10">
        <aside className="sticky top-6 self-start">
          <p className="mb-3 px-3 text-xs font-medium tracking-[0.15em] text-faint">频道</p>
          {!channels.data ? <Skeleton rows={5} /> : <ChannelTree list={channels.data} active={channelId} onPick={(id) => set({ channel: id, page: undefined, q: undefined })} />}
        </aside>

        <main className="min-w-0">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif text-[26px] font-medium tracking-[-0.01em] text-ink">{cur?.Title ?? '新闻'}</h2>
              {cur?.Describe && <span className="text-sm text-muted">{cur.Describe}</span>}
            </div>
            {list.data && <span className="text-[13px] tabular-nums text-muted">共 {list.data.count} 篇</span>}
          </div>
          {q && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-soft/60 px-4 py-2.5 text-sm text-body">
              搜索「<span className="font-medium text-brand">{q}</span>」共找到 {list.data?.count ?? '…'} 篇
              <button onClick={() => set({ q: undefined, page: undefined })} className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-ink"><X size={13} />清除</button>
            </div>
          )}

          {!list.data ? <div className="mt-6"><Skeleton rows={8} /></div> : arr.length === 0 ? (
            <p className="py-24 text-center text-sm text-muted">{q ? '没有找到相关新闻，换个关键词试试' : '该频道暂无新闻'}</p>
          ) : (
            <>
              {lead && (
                <Link to={`/news/${lead.Id}`} className="group mt-6 grid grid-cols-[1.25fr_1fr] overflow-hidden rounded-xl border border-hair bg-white">
                  <div className="aspect-[16/10] overflow-hidden bg-hair-soft"><img src={lead.Cover} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div>
                  <div className="flex flex-col p-7">
                    <span className="text-xs font-medium tracking-[0.2em] text-brand">头条</span>
                    <h3 className="mt-3 font-serif text-[24px] font-semibold leading-snug tracking-[-0.01em] text-ink group-hover:text-brand">{lead.Title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-body">{lead.Abstract}</p>
                    <Meta n={lead} className="mt-auto pt-5" />
                  </div>
                </Link>
              )}
              <ul className="mt-2">
                {rest.map((n) => (
                  <li key={n.Id}>
                    <Link to={`/news/${n.Id}`} className={`group grid gap-6 border-b border-hair py-6 ${n.isImage ? 'grid-cols-[minmax(0,1fr)_196px]' : ''}`}>
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-serif text-[19px] font-semibold leading-snug text-ink group-hover:text-brand">
                          {n.IsTop === 1 && <span className="mr-2 rounded bg-brand px-1.5 py-0.5 align-middle font-sans text-[11px] font-medium text-white">置顶</span>}
                          {n.Title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{n.Abstract}</p>
                        <Meta n={n} className="mt-3" />
                      </div>
                      {n.isImage && <div className="aspect-[3/2] overflow-hidden rounded-lg bg-hair-soft"><img src={n.Cover.replace('w=1200', 'w=500')} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8"><Pager page={page} total={list.data.count} size={LIMIT} onChange={(p) => set({ page: p > 1 ? p : undefined })} /></div>
            </>
          )}
        </main>

        <aside className="sticky top-6 space-y-10 self-start"><KuaiBaoRail /><PhotoRail /></aside>
      </div>
    </div>
  );
}

function Meta({ n, className = '' }: { n: api.NewsContextDto; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-xs text-faint ${className}`}>
      <span>{n.Author}</span><span className="tabular-nums">{fmtDate(n.CreateTime)}</span>
      <span className="flex items-center gap-1 tabular-nums"><Eye size={12} />{n.Hits}</span>
    </p>
  );
}

function ChannelTree({ list, active, onPick, depth = 0 }: { list: api.ChannelChildrenDto[]; active?: number; onPick: (id: number) => void; depth?: number }) {
  return (
    <ul className={depth ? 'ml-3 border-l border-hair pl-2' : 'space-y-0.5'}>
      {list.map((c) => (
        <li key={c.Id}>
          <button onClick={() => onPick(c.DxE_id)} title={c.Describe}
            className={`relative w-full rounded-lg px-3 py-2 text-left text-[14px] transition-colors ${active === c.DxE_id ? 'bg-brand-soft font-semibold text-brand' : 'text-body hover:bg-white hover:text-ink'}`}>
            {c.Title}
          </button>
          {c.children?.length > 0 && <ChannelTree list={c.children} active={active} onPick={onPick} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

/** 右栏：文字快报（get-news-kuai-bao，num） */
export function KuaiBaoRail({ exclude }: { exclude?: string }) {
  const { data } = useAsync(() => api.getNewsKuaiBao(8));
  return (
    <section>
      <h4 className="border-b border-ink pb-2.5 font-serif text-[17px] font-semibold text-ink">文字快报</h4>
      {!data ? <div className="pt-4"><Skeleton /></div> : (
        <ol className="divide-y divide-hair">
          {data.filter((n) => n.Id !== exclude).slice(0, 6).map((n, i) => (
            <li key={n.Id}>
              <Link to={`/news/${n.Id}`} className="group flex gap-3 py-3">
                <span className="w-5 shrink-0 font-serif text-[15px] leading-6 text-[#c3cad8]">{i + 1}</span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm leading-6 text-ink group-hover:text-brand">{n.Title}</span>
                  <span className="mt-0.5 block text-xs text-faint">{n.Author} · {fmtDate(n.CreateTime)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** 右栏：图片新闻（/api/app/news，Type='0'） */
function PhotoRail() {
  const { data } = useAsync(() => api.getnewsimgApi({ Type: '0', Pageindex: 1, Pagesize: 4 }));
  return (
    <section>
      <h4 className="border-b border-ink pb-2.5 font-serif text-[17px] font-semibold text-ink">图片新闻</h4>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(data ?? []).slice(0, 4).map((n) => (
          <Link key={n.Id} to={`/news/${n.Id}`} className="group">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-hair-soft"><img src={n.Cover.replace('w=1200', 'w=360')} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-body group-hover:text-brand">{n.Title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
