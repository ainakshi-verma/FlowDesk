import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Briefcase,
  Mic,
  Calendar,
  FileSearch,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, workspaces, activeWorkspaceId, setActiveWorkspaceId, user } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
    { id: 'tasks', label: 'Tasks & Kanban', icon: Kanban, shortcut: '2' },
    { id: 'jobs', label: 'Job Tracker & Match', icon: Briefcase, shortcut: '3' },
    { id: 'interview', label: 'AI Mock Interview', icon: Mic, shortcut: '4' },
    { id: 'calendar', label: 'Study Calendar', icon: Calendar, shortcut: '5' },
    { id: 'rag', label: 'Knowledge Base & RAG', icon: FileSearch, shortcut: '6' },
  ] as const;

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <aside className="w-64 border-r border-[#222326] bg-[#0e0f12] flex flex-col justify-between select-none h-screen sticky top-0">
      {/* Brand & Workspace Switcher */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-semibold text-xs tracking-wider">
              FD
            </div>
            <span className="font-semibold tracking-tight text-sm text-zinc-100">FlowDesk</span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded">
            v1.0
          </span>
        </div>

        {/* Workspace Card */}
        <div className="bg-[#141519] border border-[#23252a] rounded-lg p-2.5 flex items-center justify-between hover:border-zinc-700 transition cursor-pointer">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {currentWorkspace?.name || 'Placement Preparation'}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">Personal Workspace</p>
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0 ml-1" />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-0.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/80 text-zinc-100 shadow-sm border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-sky-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800/60 px-1.5 py-0.5 rounded">
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#1f2024] bg-[#0c0d0f]">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-medium text-zinc-200 truncate">{user?.name || 'Aina Sharma'}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.targetRole || 'Full Stack Engineer'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
