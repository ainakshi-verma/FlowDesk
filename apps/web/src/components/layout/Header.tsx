import React from 'react';
import { Search, Sparkles, Command } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Header: React.FC = () => {
  const { activeTab } = useStore();

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Overview', subtitle: 'Live synthesis of daily focus, progress velocity, and adaptive insights' },
    tasks: { title: 'Workspace Tasks & Kanban', subtitle: 'Priority-driven execution board connected with skill gap remediation' },
    jobs: { title: 'Job Applications & Gap Matcher', subtitle: 'Career Agent match breakdown vs target job descriptions' },
    interview: { title: 'Autonomous Mock Interview Studio', subtitle: 'Dynamic multi-turn technical assessments with rubric scoring' },
    calendar: { title: 'AI Study Calendar & Planner', subtitle: 'Algorithmic time-block distribution and automated rescheduling' },
    rag: { title: 'Workspace Knowledge Base & RAG', subtitle: 'Vector semantic retrieval strictly grounded in your saved notes and resumes' },
  };

  const current = tabTitles[activeTab] || tabTitles.dashboard;

  return (
    <header className="h-16 border-b border-[#222326] bg-[#0c0d0f]/80 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">{current.title}</h1>
        <p className="text-xs text-zinc-500 font-normal">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#16171b] border border-[#26282e] text-zinc-400 text-xs w-64 focus-within:border-zinc-500 focus-within:text-zinc-200 transition">
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tasks, JDs, notes..."
            className="bg-transparent border-none outline-none text-xs text-zinc-200 w-full placeholder:text-zinc-600"
          />
          <kbd className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1 py-0.2 rounded flex items-center gap-0.5">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>Agents Active</span>
        </div>
      </div>
    </header>
  );
};
