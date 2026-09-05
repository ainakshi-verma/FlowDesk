import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';

export const DynamicCalendarView: React.FC = () => {
  const { activeWorkspaceId } = useStore();
  const [studyMinutes, setStudyMinutes] = useState(120);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const fetchCalendar = async () => {
    if (!activeWorkspaceId) return;
    try {
      setLoading(true);
      const res = await api.getCalendarEvents(activeWorkspaceId);
      setEvents(res);
      // Run planner preview
      const plan = await api.replanCalendar(activeWorkspaceId, studyMinutes);
      setScheduleData(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [activeWorkspaceId]);

  const handleReplan = async () => {
    if (!activeWorkspaceId) return;
    try {
      setLoading(true);
      const plan = await api.replanCalendar(activeWorkspaceId, studyMinutes);
      setScheduleData(plan);
      const evs = await api.getCalendarEvents(activeWorkspaceId);
      setEvents(evs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Group schedule items by date
  const groupedSchedule: Record<string, any[]> = {};
  scheduleData?.schedule?.forEach((item: any) => {
    if (!groupedSchedule[item.date]) {
      groupedSchedule[item.date] = [];
    }
    groupedSchedule[item.date].push(item);
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header with Autonomous Re-planner Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222328]">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-sky-400" />
            AI Calendar & Adaptive Study Planner
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            The Planner Agent allocates your open tasks and automatically recalibrates when sessions are missed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#141519] border border-[#24262c] rounded-md px-3 py-1.5 text-xs text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>Study Budget:</span>
            <select
              value={studyMinutes}
              onChange={e => setStudyMinutes(Number(e.target.value))}
              className="bg-transparent text-zinc-100 font-mono text-xs focus:outline-none"
            >
              <option value="60" className="bg-[#141519]">1 hour/day</option>
              <option value="90" className="bg-[#141519]">1.5 hours/day</option>
              <option value="120" className="bg-[#141519]">2 hours/day</option>
              <option value="180" className="bg-[#141519]">3 hours/day</option>
            </select>
          </div>

          <button
            onClick={handleReplan}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Replan Schedule</span>
          </button>
        </div>
      </div>

      {/* Dynamic AI Replanner Insight Box */}
      {scheduleData?.aiInsight && (
        <div className="p-4 rounded-xl border border-sky-900/40 bg-[#0e131b] text-zinc-300 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            Planner Agent Synthesis
          </div>
          <p className="text-xs leading-relaxed text-zinc-300">
            {scheduleData.aiInsight}
          </p>
        </div>
      )}

      {/* Daily Focus Schedule Blocks */}
      <div className="space-y-6">
        {Object.keys(groupedSchedule).length > 0 ? (
          Object.entries(groupedSchedule).map(([date, items]) => {
            const dateObj = new Date(date);
            const isToday = date === new Date().toISOString().split('T')[0];

            return (
              <div
                key={date}
                className={`border rounded-xl p-5 space-y-4 ${
                  isToday ? 'border-sky-500/40 bg-[#101319]' : 'border-[#222328] bg-[#111215]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#202227]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100">
                      {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    {items.reduce((acc, cur) => acc + cur.estimatedMin, 0)} mins allocated
                  </span>
                </div>

                <div className="space-y-2.5">
                  {items.map((slot: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#0e0f12] border border-[#1e2026] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-[11px] font-mono text-zinc-500 w-28 shrink-0">
                          {slot.timeSlot}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-200">
                            {slot.taskTitle}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {slot.reason}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                        {slot.estimatedMin}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
            All tasks are currently completed or scheduled.
          </div>
        )}
      </div>
    </div>
  );
};
