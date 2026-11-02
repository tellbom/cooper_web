import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { ChevronDown, ClipboardCheck, Cpu, Database, Home, Search, Timer, TrendingDown } from 'lucide-react';
import { BellMenu } from './Panels';

const NAV = [['首页', Home], ['数据管控', Database], ['工时统计', Timer], ['运营损失', TrendingDown], ['质量日报', ClipboardCheck], ['DNC数据', Cpu]] as const;

function Logo() {
  return (
    <svg viewBox="0 0 36 36" className="size-9 shrink-0" aria-hidden>
      <rect width="36" height="36" rx="10" fill="#2563eb" />
      <rect x="8" y="8" width="13" height="13" rx="3.5" fill="none" stroke="#fff" strokeWidth="2.2" />
      <rect x="15" y="15" width="13" height="13" rx="3.5" fill="#fff" fillOpacity=".92" />
    </svg>
  );
}

/** 根布局：顶栏 + 可滚动内容区（首页单屏铺满，新闻页在此容器内滚动） */
export function Shell() {
  const [nav, setNav] = useState('首页');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); if (pathname === '/') setNav('首页'); }, [pathname]);
  const active = (n: string) => (n === '首页' ? pathname === '/' && nav === '首页' : nav === n && pathname === '/');
  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-canvas">
      <header className="relative shrink-0 border-b border-hair bg-white">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-deep via-brand to-sky-400" />
        <div className="flex h-[60px] items-center gap-8 px-[30px] pt-[3px]">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <div className="leading-none">
              <p className="bg-gradient-to-r from-brand-deep to-[#3b82f6] bg-clip-text font-serif text-[21px] font-bold tracking-[0.04em] text-transparent">协同工作平台</p>
              <p className="mt-1 text-[9.5px] font-medium tracking-[0.22em] text-faint">COLLABORATIVE WORKSPACE</p>
            </div>
          </Link>
          <nav className="flex gap-0.5">
            {NAV.map(([n, I]) => (
              <button key={n} onClick={() => (n === '首页' ? navigate('/') : setNav(n))}
                className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[14px] font-medium transition-colors ${active(n) ? 'bg-brand-soft text-brand' : 'text-body hover:bg-soft hover:text-ink'}`}>
                <I size={16} strokeWidth={1.75} />{n}
              </button>
            ))}
          </nav>
          <div className="relative ml-auto w-60 2xl:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input placeholder="搜索新闻、公告…" aria-label="资讯搜索"
              onKeyDown={(e) => { if (e.key === 'Enter') { const v = e.currentTarget.value.trim(); navigate(v ? `/search?q=${encodeURIComponent(v)}` : '/search'); } }}
              className="h-9 w-full rounded-full border border-hair bg-soft pl-10 pr-4 text-sm outline-none transition placeholder:text-faint focus:border-brand focus:bg-white" />
          </div>
          <div className="flex items-center gap-4">
            <BellMenu />
            <span className="h-5 border-l border-hair" />
            <button className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">张</span>
              <span className="text-sm font-medium text-ink">张三</span><ChevronDown size={15} className="text-muted" />
            </button>
          </div>
        </div>
      </header>
      <div ref={scroller} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
