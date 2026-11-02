import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setError(false);
    fn().then((d) => alive && setData(d)).catch(() => { if (alive) { setData(null); setError(true); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, reload: () => setTick((t) => t + 1) };
}

/** 模块卡片：白底 + 细线框，无重阴影；衬线标题（Claude 编辑式层级） */
export function Card({ title, icon, tabs, extra, children, className = '' }: {
  title?: ReactNode; icon?: ReactNode; tabs?: ReactNode; extra?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-col rounded-xl border border-hair bg-white px-5 pb-4 pt-3.5 ${className}`}>
      <header className="mb-3 flex h-8 shrink-0 items-center gap-2">
        {icon && <span className="text-brand">{icon}</span>}
        {title && <h2 className="shrink-0 font-serif text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
        <div className={`flex min-w-0 flex-1 items-center ${title ? 'ml-5' : ''}`}>{tabs}</div>
        {extra}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}
export const ic = { size: 17, strokeWidth: 1.75 } as const;

export function More({ label = '更多', onClick, brand }: { label?: string; onClick?: () => void; brand?: boolean }) {
  return (
    <button onClick={onClick} className={`flex shrink-0 items-center gap-0.5 text-xs transition-colors ${brand ? 'text-brand hover:text-brand-deep' : 'text-muted hover:text-brand'}`}>
      {label}<ChevronRight size={14} />
    </button>
  );
}

/** 下划线式选项卡（附件1 新闻中心 / 日程） */
export function LineTabs<T extends string>({ items, value, onChange, size = 'md' }: {
  items: readonly T[]; value: T; onChange: (v: T) => void; size?: 'md' | 'lg';
}) {
  return (
    <div className={`flex items-center ${size === 'lg' ? 'gap-7' : 'gap-6'}`} role="tablist">
      {items.map((it) => (
        <button key={it} role="tab" aria-selected={value === it} onClick={() => onChange(it)}
          className={`relative whitespace-nowrap pb-1 pt-1 transition-colors ${size === 'lg' ? 'font-serif text-[17px] tracking-[-0.01em]' : 'text-sm'} ${value === it ? 'font-semibold text-brand' : 'text-body hover:text-ink'}`}>
          {it}
          <span className={`absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-brand transition-transform ${value === it ? 'scale-x-100' : 'scale-x-0'}`} />
        </button>
      ))}
    </div>
  );
}

/** 胶囊式选项卡（附件1 荣誉墙） */
export function PillTabs<T extends string>({ items, value, onChange }: { items: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1.5" role="tablist">
      {items.map((it) => (
        <button key={it} role="tab" aria-selected={value === it} onClick={() => onChange(it)}
          className={`rounded-md px-3.5 py-1 text-sm transition-colors ${value === it ? 'bg-brand-soft font-semibold text-brand' : 'text-body hover:bg-soft'}`}>
          {it}
        </button>
      ))}
    </div>
  );
}

/** 分段控件（弹窗内的视图 / 筛选切换） */
export function Segmented<T extends string>({ items, value, onChange, counts }: {
  items: readonly T[]; value: T; onChange: (v: T) => void; counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className="inline-flex rounded-lg bg-[#eef1f6] p-0.5" role="tablist">
      {items.map((it) => (
        <button key={it} role="tab" aria-selected={value === it} onClick={() => onChange(it)}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-all ${value === it ? 'bg-white text-ink shadow-[0_1px_2px_rgba(20,26,43,.08)]' : 'text-muted hover:text-ink'}`}>
          {it}{counts?.[it] != null && <span className={`tabular-nums ${value === it ? 'text-brand' : 'text-faint'}`}>{counts[it]}</span>}
        </button>
      ))}
    </div>
  );
}

const TONE: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
  orange: 'bg-orange-50 text-orange-600', red: 'bg-red-50 text-red-600', gray: 'bg-slate-100 text-slate-500',
};
export const STATE_TONE: Record<string, keyof typeof TONE> = {
  进行中: 'blue', 处理中: 'orange', 已完成: 'green', 已处理: 'green', 已归零: 'green', 正常: 'green',
  待协调: 'amber', 待处理: 'amber', 未确认: 'amber', 未开始: 'gray', 已结束: 'gray', 未响应: 'red',
};
export const DOT: Record<string, string> = { blue: 'bg-blue-500', green: 'bg-emerald-500', amber: 'bg-amber-400', orange: 'bg-orange-500', red: 'bg-red-500', gray: 'bg-slate-400' };
export const dotOf = (s: string) => DOT[STATE_TONE[s] ?? 'gray'];
export function Tag({ children }: { children: string }) {
  return <span className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-xs font-medium ${TONE[STATE_TONE[children] ?? 'gray']}`}>{children}</span>;
}

/** 弹窗：衬线大标题 + 说明文字 + 细线分区；支持多层叠放（Esc 只关闭最上层） */
const stack: number[] = [];
let seq = 0;
export function Modal({ open, onClose, title, subtitle, actions, children, width = 'max-w-3xl', height, footer, flush }: {
  open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode;
  width?: string; height?: string; footer?: ReactNode; flush?: boolean;
}) {
  const id = useRef(0);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const me = ++seq;
    id.current = me;
    stack.push(me);
    const k = (e: KeyboardEvent) => e.key === 'Escape' && stack[stack.length - 1] === me && close.current();
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('keydown', k); stack.splice(stack.indexOf(me), 1); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/35 p-6" onMouseDown={onClose}>
      <div className={`flex max-h-[88vh] w-full ${width} ${height ?? ''} flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_-16px_rgba(15,23,42,.35)]`}
        onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="flex shrink-0 items-start gap-4 px-8 pb-5 pt-7">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[24px] font-medium leading-tight tracking-[-0.02em] text-ink">{title}</h3>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {actions}
          <button onClick={onClose} className="-mr-2 rounded-full p-2 text-muted transition-colors hover:bg-soft hover:text-ink" aria-label="关闭"><X size={18} /></button>
        </div>
        <div className={`min-h-0 flex-1 border-t border-hair ${flush ? 'flex' : 'scrollbar-thin overflow-y-auto px-8 py-6'}`}>{children}</div>
        {footer && <div className="flex shrink-0 items-center justify-end gap-3 border-t border-hair bg-soft px-8 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-5 animate-pulse rounded bg-soft" />)}</div>;
}
export const Btn = ({ primary, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) => (
  <button {...p} className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${primary ? 'bg-brand text-white hover:bg-brand-deep' : 'border border-hair bg-white text-ink hover:bg-soft'} ${p.className ?? ''}`} />
);
export const inputCls = 'w-full rounded-lg border border-hair bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-blue-50';

/** 内容超出时无缝纵向滚动，悬停暂停 */
export function AutoScroll({ children, speed = 22 }: { children: ReactNode; speed?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [dur, setDur] = useState(0);
  useLayoutEffect(() => {
    const check = () => {
      const o = outer.current, i = inner.current;
      if (o && i) setDur(i.offsetHeight > o.clientHeight + 2 ? i.offsetHeight / speed : 0);
    };
    check();
    const ro = new ResizeObserver(check);
    if (outer.current) ro.observe(outer.current);
    return () => ro.disconnect();
  }, [children, speed]);
  return (
    <div ref={outer} className={`autoscroll relative min-h-0 flex-1 overflow-hidden ${dur ? 'fade-y' : ''}`}>
      <div className={dur ? 'marquee' : ''} style={{ '--d': `${dur}s` } as CSSProperties}>
        <div ref={inner}>{children}</div>
        {dur > 0 && <div aria-hidden>{children}</div>}
      </div>
    </div>
  );
}

/** 表头固定、表体滚动的数据表 */
export function ScrollTable({ cols, template, rows, highlight }: { cols: string[]; template: string; rows: ReactNode[][]; highlight?: (i: number) => boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid shrink-0 gap-3 border-b border-hair px-3 pb-2 pt-1 text-xs font-medium tracking-wide text-faint" style={{ gridTemplateColumns: template }}>
        {cols.map((c) => <span key={c} className="truncate">{c}</span>)}
      </div>
      <AutoScroll>
        {rows.map((r, i) => (
          <div key={i} className={`relative grid items-center gap-3 border-b border-hair-soft px-3 py-[9px] text-[13px] text-body transition-colors hover:bg-soft ${highlight?.(i) ? 'bg-gradient-to-r from-brand-soft to-transparent hover:bg-brand-soft' : ''}`} style={{ gridTemplateColumns: template }}>
            {highlight?.(i) && <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-brand" />}
            {r.map((c, j) => <span key={j} className="flex min-w-0 items-center gap-1.5 truncate">{c}</span>)}
          </div>
        ))}
      </AutoScroll>
    </div>
  );
}

export const fmtDate = (s: string) => s.slice(0, 10);
export const fmtMD = (s: string) => s.slice(5, 10);
export const fmtHM = (s: string) => s.slice(11, 16);

/** 面包屑 */
export function Breadcrumb({ items }: { items: [string, string?][] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-muted" aria-label="面包屑">
      {items.map(([label, to], i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={13} className="text-faint" />}
          {to ? <Link to={to} className="transition-colors hover:text-brand">{label}</Link> : <span className="text-ink">{label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** 分页 */
export function Pager({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <div className="flex items-center justify-center gap-1">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="flex h-9 items-center gap-1 rounded-lg px-3 text-sm text-body hover:bg-white disabled:opacity-40"><ChevronLeft size={15} />上一页</button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-faint">…</span>}
          <button onClick={() => onChange(n)} className={`size-9 rounded-lg text-sm tabular-nums transition-colors ${n === page ? 'bg-brand text-white' : 'text-body hover:bg-white'}`}>{n}</button>
        </span>
      ))}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="flex h-9 items-center gap-1 rounded-lg px-3 text-sm text-body hover:bg-white disabled:opacity-40">下一页<ChevronRight size={15} /></button>
    </div>
  );
}
