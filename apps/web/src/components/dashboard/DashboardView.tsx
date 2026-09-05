import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, ArrowRight, Sparkles, AlertCircle, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';

export const DashboardView: React.FC = () => {
  const { user, setActiveTab } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardOverview();
      setData(res);
    } catch (e) {
      console.warn('Could not fetch overview', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await api.updateTask(taskId, { status: nextStatus });
      fetchOverview();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptPlan = () => {
    setAccepted(true);
    setTimeout(() => {
      setActiveTab('calendar');
    }, 700);
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin" />
          Loading workspace intelligence...
        </div>
      </div>
    );
  }

  const greetingName = user?.name?.split(' ')[0] || data?.userName?.split(' ')[0] || 'Aina';

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Editorial Greeting & Stats */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-zinc-100">
            Good evening, {greetingName}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            FlowDesk is monitoring <span className="text-zinc-300 font-medium">{data?.workspaceName || 'Placement Preparation'}</span>. Here is your synthesized agenda for today.
          </p>
        </div>

        {/* Minimal Focus Metric Strip */}
        <div className="border border-[#222326] bg-[#111215] rounded-xl p-6">
          <div className="text-xs uppercase tracking-wider font-mono text-zinc-500 mb-4">
            Your focus today
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#222326]">
            <div className="pr-6">
              <div className="text-2xl font-semibold tracking-tight text-zinc-100">
                {data?.stats?.taskCount ?? 5}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">Active Tasks</div>
            </div>
            <div className="px-6">
              <div className="text-2xl font-semibold tracking-tight text-zinc-100">
                {data?.stats?.focusTime || '2h 40m'}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">Planned Focus</div>
            </div>
            <div className="pl-6">
              <div className="text-2xl font-semibold tracking-tight text-emerald-400">
                {data?.stats?.progressPercent ?? 78}%
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">Sprint Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        {/* Today's Tasks (3 columns) */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#222326]">
            <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-400">
              Today's Key Priorities
            </h3>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs text-zinc-500 hover:text-sky-400 flex items-center gap-1 transition"
            >
              View Kanban <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.todayTasks?.length > 0 ? (
              data.todayTasks.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t.id, t.status)}
                  className="group flex items-center justify-between p-3.5 rounded-lg border border-[#202227] bg-[#121317] hover:border-zinc-700 hover:bg-[#15171d] transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                      t.status === 'COMPLETED'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-zinc-700 group-hover:border-zinc-500'
                    }`}>
                      {t.status === 'COMPLETED' && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${t.status === 'COMPLETED' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {t.estimatedMin} min
                        </span>
                        {t.tags?.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-lg">
                No active tasks for today. Start a mock interview or add a new job goal!
              </div>
            )}
          </div>
        </div>

        {/* AI Insight Card (2 columns) - Restrained, editorial look */}
        <div className="md:col-span-2 space-y-4">
          <div className="pb-2 border-b border-[#222326]">
            <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              AI Insight & Autonomous Recommendation
            </h3>
          </div>

          <div className="p-5 rounded-xl border border-sky-950/60 bg-[#0f141c] text-zinc-300 space-y-4 shadow-sm">
            <p className="text-xs leading-relaxed text-zinc-300">
              {data?.aiInsight?.analysis ||
                "You're spending significantly more time on frontend tasks than backend. I'd recommend using tomorrow's first study session for Spring Boot."}
            </p>

            <div className="pt-2 border-t border-sky-900/30 flex items-center justify-between">
              <span className="text-[11px] font-mono text-sky-400/80">
                Action: {data?.aiInsight?.suggestedAction || 'Rebalance Schedule'}
              </span>

              <button
                onClick={handleAcceptPlan}
                disabled={accepted}
                className="px-3 py-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-medium transition flex items-center gap-1.5"
              >
                {accepted ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Plan Accepted
                  </>
                ) : (
                  <>Accept Plan</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
