import { NewsCenter } from '../components/News';
import { ScheduleCard } from '../components/Schedule';
import { CommonSystems, FaultPanel, HonorWall, Meetings, OnDuty, TechCoordination } from '../components/Panels';

/** 首页：单屏网格，四条纵向轨道，上下两行共享列线，保证各模块边缘对齐 */
export default function Home() {
  return (
    <main className="grid h-full min-h-[660px] grid-cols-[5.2fr_10fr_4.2fr_4.2fr] grid-rows-[minmax(0,1.72fr)_minmax(0,1fr)] gap-3 px-[10px] py-3">
      <div className="flex min-h-0 flex-col gap-3"><ScheduleCard /><CommonSystems /></div>
      <NewsCenter />
      <div className="col-span-2 flex min-h-0 flex-col gap-3"><Meetings /><OnDuty /></div>
      <HonorWall />
      <TechCoordination />
      <FaultPanel />
    </main>
  );
}
