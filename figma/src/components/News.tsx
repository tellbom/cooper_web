import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Newspaper, PenLine } from 'lucide-react';
import * as api from '../api';
import { useNavigate } from 'react-router';
import { Card, LineTabs, More, Skeleton, fmtDate, ic, useAsync } from './ui';

const TABS = ['图片新闻', '文字新闻', '先进科技', '质量快报'] as const;
type Tab = (typeof TABS)[number];

export function NewsCenter() {
  const [tab, setTab] = useState<Tab>('图片新闻');
  const navigate = useNavigate();
  const open = (id: string) => navigate(`/news/${id}`);
  const channels = useAsync(api.getnewscenterapi);
  const channelId = channels.data?.find((c) => c.Title === tab)?.DxE_id;
  return (
    <Card title="新闻中心" icon={<Newspaper {...ic} />} tabs={<LineTabs items={TABS} value={tab} onChange={setTab} />}
      extra={<More onClick={() => navigate(channelId != null ? `/news?channel=${channelId}` : '/news')} />}>
      {tab === '图片新闻' && <PhotoNews onOpen={open} />}
      {tab === '文字新闻' && <TextNews onOpen={open} />}
      {tab === '先进科技' && channelId != null && <TechNews channelId={channelId} onOpen={open} />}
      {tab === '质量快报' && channelId != null && <QualityNews channelId={channelId} onOpen={open} />}
    </Card>
  );
}

function PhotoNews({ onOpen }: { onOpen: (id: string) => void }) {
  const { data } = useAsync(() => api.getnewsimgApi({ Type: '0', Pageindex: 1, Pagesize: 5 }));
  const [i, setI] = useState(0);
  const hero = data?.slice(0, 4) ?? [];
  useEffect(() => {
    if (!hero.length) return;
    const t = setInterval(() => setI((v) => (v + 1) % hero.length), 5000);
    return () => clearInterval(t);
  }, [hero.length]);
  if (!data) return <Skeleton rows={8} />;
  const cur = hero[i];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3.5">
      <div className="group relative min-h-0 flex-1 overflow-hidden rounded-lg bg-hair-soft">
        {hero.map((n, k) => (
          <img key={n.Id} src={n.Cover} alt="" className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${k === i ? 'opacity-100' : 'opacity-0'}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/80 via-[#0b1220]/10 to-transparent" />
        <button onClick={() => onOpen(cur.Id)} className="absolute inset-x-0 bottom-0 px-6 pb-5 text-left">
          <h3 className="font-serif text-[22px] font-semibold tracking-[-0.01em] text-white">{cur.Title}</h3>
          <p className="mt-1.5 line-clamp-1 text-sm text-white/80">{cur.Abstract}</p>
          <div className="mt-2 flex gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1"><CalendarDays size={13} />{fmtDate(cur.CreateTime)}</span>
            <span className="flex items-center gap-1"><Eye size={13} />浏览量 {cur.Hits.toLocaleString()}</span>
          </div>
        </button>
        {[-1, 1].map((d) => (
          <button key={d} onClick={() => setI((v) => (v + d + hero.length) % hero.length)}
            className={`absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink opacity-0 transition group-hover:opacity-100 hover:text-brand ${d < 0 ? 'left-3' : 'right-3'}`}>
            {d < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        ))}
        <div className="absolute bottom-6 right-6 flex gap-1.5">
          {hero.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />)}
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-4 gap-3">
        {data.slice(1, 5).map((n) => (
          <button key={n.Id} onClick={() => onOpen(n.Id)} className="group min-w-0 text-left">
            <div className="h-[clamp(64px,10vh,112px)] overflow-hidden rounded-lg bg-hair-soft">
              <img src={n.Cover.replace('w=1200', 'w=400')} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <p className="mt-2 truncate text-[13px] font-medium text-ink group-hover:text-brand">{n.Title}</p>
            <p className="mt-0.5 text-xs tabular-nums text-faint">{fmtDate(n.CreateTime)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 文字新闻：编辑出版式排版（衬线标题 · 细分隔线 · 克制配色） */
function TextNews({ onOpen }: { onOpen: (id: string) => void }) {
  const { data } = useAsync(() => api.getNewsKuaiBao(10));
  if (!data) return <Skeleton rows={8} />;
  const [lead, ...rest] = data;
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_1fr] gap-6">
      <button onClick={() => onOpen(lead.Id)} className="group flex min-h-0 flex-col overflow-hidden rounded-lg bg-soft p-6 text-left">
        <span className="text-xs font-medium tracking-[0.2em] text-brand">头条快报</span>
        <h3 className="mt-3 font-serif text-[22px] font-semibold leading-snug text-ink group-hover:text-brand">{lead.Title}</h3>
        <p className="mt-4 line-clamp-[8] min-h-0 text-sm leading-7 text-body">{api.htmlText(lead.Content)}</p>
        <div className="mt-auto flex items-center gap-3 border-t border-hair pt-4 text-xs text-muted">
          <PenLine size={13} />{lead.Author}<span className="text-hair">|</span>{fmtDate(lead.CreateTime)}
        </div>
      </button>
      <ol className="scrollbar-thin flex min-h-0 flex-col divide-y divide-hair overflow-y-auto">
        {rest.map((n, k) => (
          <li key={n.Id}>
            <button onClick={() => onOpen(n.Id)} className="group flex w-full gap-4 py-3.5 text-left">
              <span className="font-serif text-lg leading-6 text-[#c3cad8]">{String(k + 2).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 font-serif text-[15px] font-semibold text-ink group-hover:text-brand">{n.Title}</span>
                <span className="mt-1 flex gap-3 text-xs text-muted"><span>{n.Author}</span><span>{fmtDate(n.CreateTime)}</span></span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 先进科技：图文混排（isImage 决定是否展示封面） */
function TechNews({ channelId, onOpen }: { channelId: number; onOpen: (id: string) => void }) {
  const { data } = useAsync(() => api.getNewsDetail({ ChannelID: channelId, Page: 1, Limit: 6 }), [channelId]);
  if (!data) return <Skeleton rows={8} />;
  const imgs = data.arr.filter((n) => n.isImage);
  const texts = data.arr.filter((n) => !n.isImage);
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-5">
      <div className="scrollbar-thin flex min-h-0 flex-col gap-4 overflow-y-auto">
        {imgs.map((n) => (
          <button key={n.Id} onClick={() => onOpen(n.Id)} className="group flex gap-4 text-left">
            <img src={n.Cover.replace('w=1200', 'w=500')} alt="" className="aspect-[4/3] w-40 shrink-0 rounded-lg object-cover" />
            <span className="flex flex-col">
              <span className="line-clamp-2 font-medium text-ink group-hover:text-brand">{n.Title}</span>
              <span className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">{n.Abstract}</span>
              <span className="mt-auto flex gap-3 text-xs text-muted"><span>{fmtDate(n.CreateTime)}</span><span className="flex items-center gap-1"><Eye size={12} />{n.Hits}</span></span>
            </span>
          </button>
        ))}
      </div>
      <div className="scrollbar-thin flex min-h-0 flex-col divide-y divide-hair overflow-y-auto rounded-lg bg-soft px-5">
        {texts.map((n) => (
          <button key={n.Id} onClick={() => onOpen(n.Id)} className="group py-4 text-left">
            <span className="line-clamp-1 font-serif font-semibold text-ink group-hover:text-brand">{n.Title}</span>
            <span className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">{n.Abstract}</span>
            <span className="mt-1.5 block text-xs text-muted">{n.Author} · {fmtDate(n.CreateTime)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 质量快报：纯图片墙 */
function QualityNews({ channelId, onOpen }: { channelId: number; onOpen: (id: string) => void }) {
  const { data } = useAsync(() => api.getNewsDetail({ ChannelID: channelId, Page: 1, Limit: 6 }), [channelId]);
  if (!data) return <Skeleton rows={8} />;
  return (
    <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-3">
      {data.arr.map((n) => (
        <button key={n.Id} onClick={() => onOpen(n.Id)} className="group relative min-h-0 overflow-hidden rounded-lg bg-hair-soft">
          <img src={n.Cover.replace('w=1200', 'w=600')} alt={n.Title} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b1220]/75 to-transparent p-3.5 pt-10 text-left">
            <span className="block text-sm font-medium text-white">{n.Title}</span>
            <span className="text-xs text-white/70">{fmtDate(n.CreateTime)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
