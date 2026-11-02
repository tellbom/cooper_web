import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Eye, Heart, Link2, PenLine } from 'lucide-react';
import * as api from '../api';
import { Breadcrumb, Skeleton, fmtDate, useAsync } from '../components/ui';
import { KuaiBaoRail } from './NewsList';

const recorded = new Set<string>(); // 防止 StrictMode 重复记录浏览
const SIZES = [['小', 'text-[15px]'], ['中', 'text-[16.5px]'], ['大', 'text-[18px]']] as const;
type Sib = { Id: string; Title: string; CreateTime: string; Cover?: string };

/** 新闻详情：detail?id → NewsDto；likeFeatureUrl 浏览 / 点赞；同频道列表 get-context 用于相关与上下篇 */
export default function NewsDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const d = useAsync(() => api.getNewsDetailitemapi(id), [id]);
  const n = d.data?.Id === id ? d.data : null;
  const [size, setSize] = useState(1);
  const [copied, setCopied] = useState(false);

  // 浏览：先 record 再 count
  const views = useAsync(async () => {
    if (!n) return null;
    if (!recorded.has(id)) { recorded.add(id); await api.countrecord(id).catch(() => {}); }
    return api.countviews(id);
  }, [n?.Id]);

  // 点赞：status + count；点击乐观更新后 toggle
  const like = useAsync(() => (n ? Promise.all([api.likesstatus(id), api.likescount(id)]) : Promise.resolve(null)), [n?.Id]);
  const [liked, setLiked] = useState<[boolean, number] | null>(null);
  useEffect(() => setLiked(like.data ?? null), [like.data]);
  const busy = useRef(false);
  const toggleLike = async () => {
    if (!liked || busy.current) return;
    busy.current = true;
    setLiked([!liked[0], liked[1] + (liked[0] ? -1 : 1)]);
    try { await api.likestoggle(id); } catch { setLiked(liked); } finally { busy.current = false; }
  };

  // 同频道（无频道的文字快报则取快报列表）
  const sibs = useAsync<Sib[] | null>(async () => {
    if (!n) return null;
    if (n.ChannelID) return (await api.getNewsDetail({ ChannelID: +n.ChannelID, Page: 1, Limit: 50 })).arr;
    return api.getNewsKuaiBao(20);
  }, [n?.Id]);
  const idx = sibs.data?.findIndex((s) => s.Id === id) ?? -1;
  const prev = idx > 0 ? sibs.data![idx - 1] : null;
  const next = idx >= 0 && sibs.data && idx < sibs.data.length - 1 ? sibs.data[idx + 1] : null;
  const related = (sibs.data ?? []).filter((s) => s.Id !== id).slice(0, 5);
  const html = useMemo(() => (n ? api.sanitizeHtml(n.Content) : ''), [n]);
  const listTo = n?.ChannelID ? `/news?channel=${n.ChannelID}` : '/news';

  if (d.error) {
    return (
      <div className="mx-auto grid max-w-[1280px] place-items-center px-8 py-32 text-center">
        <p className="font-serif text-[28px] text-ink">新闻不存在或已下线</p>
        <p className="mt-2 text-sm text-muted">该新闻可能已被删除，或链接有误</p>
        <Link to="/news" className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-deep">浏览新闻资讯</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-8 pb-24 pt-6">
      <Breadcrumb items={[['首页', '/'], ['新闻资讯', '/news'], ...(n ? [[n.ChannelTitle, n.ChannelID ? listTo : undefined] as [string, string?]] : []), ['正文']]} />
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)_300px] gap-16">
        <article className="min-w-0">
          {!n ? <div className="max-w-[760px]"><Skeleton rows={12} /></div> : (
            <div className="max-w-[760px]">
              <Link to={listTo} className="text-xs font-medium tracking-[0.2em] text-brand hover:text-brand-deep">{n.ChannelTitle}</Link>
              <h1 className="mt-3 font-serif text-[36px] font-medium leading-[1.25] tracking-[-0.02em] text-ink">{n.Title}</h1>
              {n.Subheading && <p className="mt-3 font-serif text-lg text-muted">{n.Subheading}</p>}

              <div className="mt-6 flex items-center gap-5 border-b border-hair pb-5 text-[13px] text-muted">
                <span className="flex items-center gap-1.5"><PenLine size={14} />{n.Author}</span>
                <span className="flex items-center gap-1.5 tabular-nums"><CalendarDays size={14} />{n.CreateTime.replace('T', ' ').slice(0, 16)}</span>
                <span className="flex items-center gap-1.5 tabular-nums"><Eye size={14} />{(views.data ?? n.Hits).toLocaleString()} 次浏览</span>
                <button onClick={toggleLike} disabled={!liked} aria-pressed={liked?.[0]} aria-label={liked?.[0] ? '取消点赞' : '点赞'}
                  className={`-ml-1 flex h-7 items-center gap-1.5 rounded-full border px-2.5 tabular-nums transition-colors ${liked?.[0] ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-transparent hover:border-rose-200 hover:text-rose-600'}`}>
                  <Heart size={14} className={liked?.[0] ? 'fill-current' : ''} />{liked?.[1] ?? '—'}
                </button>
                <span className="ml-auto flex items-center gap-3">
                  <span className="flex rounded-lg bg-soft p-0.5" role="group" aria-label="字号">
                    {SIZES.map(([l], i) => (
                      <button key={l} onClick={() => setSize(i)} className={`rounded-md px-2.5 py-1 text-xs ${size === i ? 'bg-white font-medium text-ink shadow-[0_1px_2px_rgba(20,26,43,.08)]' : 'text-muted hover:text-ink'}`}>{l}</button>
                    ))}
                  </span>
                  <button onClick={() => navigator.clipboard?.writeText(location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
                    className="flex items-center gap-1 text-xs text-muted hover:text-brand">{copied ? <><Check size={14} />已复制</> : <><Link2 size={14} />复制链接</>}</button>
                </span>
              </div>

              {n.Abstract && (
                <blockquote className="mt-7 rounded-r-lg border-l-2 border-brand bg-soft px-6 py-5">
                  <p className="text-xs font-medium tracking-[0.2em] text-brand">摘要</p>
                  <p className="mt-2 text-[15px] leading-8 text-body">{n.Abstract}</p>
                </blockquote>
              )}
              {n.Cover && !/<img/i.test(html) && <img src={n.Cover} alt="" className="mt-8 w-full rounded-xl" />}
              <div className={`prose-news mt-8 text-body ${SIZES[size][1]}`} dangerouslySetInnerHTML={{ __html: html }} />

              {n.Creater && <p className="mt-10 border-t border-hair pt-6 text-right text-xs text-faint">责任编辑：{n.Creater}</p>}

              <nav className="mt-10 grid grid-cols-2 gap-4">
                {[[prev, '上一篇', ArrowLeft], [next, '下一篇', ArrowRight]].map(([s, label, I], k) => {
                  const Icon = I as typeof ArrowLeft, sib = s as Sib | null;
                  return sib ? (
                    <Link key={k} to={`/news/${sib.Id}`} className={`group rounded-xl border border-hair bg-white px-5 py-4 transition-colors hover:border-blue-200 ${k ? 'text-right' : ''}`}>
                      <span className={`flex items-center gap-1 text-xs text-muted ${k ? 'justify-end' : ''}`}>{!k && <Icon size={13} />}{label as string}{k ? <Icon size={13} /> : null}</span>
                      <span className="mt-1.5 line-clamp-1 font-serif text-[15px] font-semibold text-ink group-hover:text-brand">{sib.Title}</span>
                    </Link>
                  ) : <div key={k} className={`rounded-xl border border-dashed border-hair px-5 py-4 text-xs text-faint ${k ? 'text-right' : ''}`}>{k ? '已是最后一篇' : '已是第一篇'}</div>;
                })}
              </nav>
              <button onClick={() => navigate(listTo)} className="mt-6 text-sm text-muted hover:text-brand">← 返回{n.ChannelID ? `「${n.ChannelTitle}」` : '新闻资讯'}列表</button>
            </div>
          )}
        </article>

        <aside className="sticky top-6 space-y-10 self-start">
          {n?.ChannelID && (
            <section>
              <h4 className="border-b border-ink pb-2.5 font-serif text-[17px] font-semibold text-ink">同频道新闻</h4>
              {!sibs.data ? <div className="pt-4"><Skeleton /></div> : (
                <ul className="divide-y divide-hair">
                  {related.map((s) => (
                    <li key={s.Id}>
                      <Link to={`/news/${s.Id}`} className="group flex gap-3 py-3.5">
                        {s.Cover && <img src={s.Cover.replace('w=1200', 'w=240')} alt="" className="aspect-[4/3] w-20 shrink-0 rounded-md object-cover" />}
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-sm leading-6 text-ink group-hover:text-brand">{s.Title}</span>
                          <span className="mt-0.5 block text-xs tabular-nums text-faint">{fmtDate(s.CreateTime)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <KuaiBaoRail exclude={id} />
        </aside>
      </div>
    </div>
  );
}
