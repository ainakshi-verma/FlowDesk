import React, { useEffect, useState } from 'react';
import { Mic, Award, Plus, Play, ArrowRight, Clock, User, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { InterviewSession, JobApplication } from '../../types';
import { PersonaSelector } from './PersonaSelector';
import { VirtualInterviewerStudio } from './VirtualInterviewerStudio';

export const MockInterviewView: React.FC = () => {
  const { activeWorkspaceId } = useStore();
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInterviewsAndJobs = async () => {
    if (!activeWorkspaceId) return;
    try {
      setLoading(true);
      const [intList, jobList] = await Promise.all([
        api.getInterviews(activeWorkspaceId),
        api.getJobs(activeWorkspaceId)
      ]);
      setInterviews(intList);
      setJobs(jobList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewsAndJobs();
  }, [activeWorkspaceId]);

  const handleStartSession = async (params: { roleType: string; persona: string; jobId?: string }) => {
    if (!activeWorkspaceId) return;
    try {
      setIsStarting(true);
      const created = await api.startInterview(activeWorkspaceId, params);
      setActiveSession(created);
      setShowSelector(false);
      fetchInterviewsAndJobs();
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  };

  // If in active virtual studio
  if (activeSession) {
    return (
      <VirtualInterviewerStudio
        session={activeSession}
        onExit={() => {
          setActiveSession(null);
          fetchInterviewsAndJobs();
        }}
        onSessionUpdated={(updated) => {
          setActiveSession(updated);
          setInterviews(prev => prev.map(i => i.id === updated.id ? updated : i));
        }}
      />
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222328]">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
            <Mic className="h-5 w-5 text-sky-400" />
            AI Virtual Interviewer Studio
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real dynamic follow-up questioning, conversational memory, voice interaction, and 5-axis rubric scorecards.
          </p>
        </div>

        <button
          onClick={() => setShowSelector(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-lg shadow-sky-500/20 transition"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>New Virtual Interview</span>
        </button>
      </div>

      {/* Modal / Selector View */}
      {showSelector ? (
        <div className="p-6 rounded-2xl bg-[#0e0f13] border border-[#202227]">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowSelector(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
            >
              Cancel ✕
            </button>
          </div>
          <PersonaSelector
            jobs={jobs}
            onStartInterview={handleStartSession}
            isLoading={isStarting}
          />
        </div>
      ) : (
        /* History & Debrief Cards */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-400">
              Completed & Active Sessions ({interviews.length})
            </h3>
          </div>

          <div className="space-y-3">
            {interviews.map(item => {
              const personaLabel = item.persona === 'MAYA'
                ? 'Maya • Fast-Paced'
                : item.persona === 'DANIEL'
                ? 'Daniel • FAANG Bar Raiser'
                : 'Alex • Encouraging';

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveSession(item)}
                  className="p-5 rounded-xl border border-[#202227] bg-[#111216] hover:border-zinc-700 hover:bg-[#13141a] transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#16171d] border border-zinc-800 flex items-center justify-center text-zinc-200 font-bold text-sm">
                      {item.persona?.charAt(0) || 'A'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100">{item.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">
                          {personaLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {item.roleType} • {item.exchanges?.length || 0} turns recorded
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    {item.status === 'COMPLETED' ? (
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block">Overall Score</span>
                        <span className="text-lg font-bold font-mono text-emerald-400">{item.overallScore || 75}%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
                        IN PROGRESS
                      </span>
                    )}

                    <div className="text-zinc-600 group-hover:text-zinc-300 transition">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}

            {interviews.length === 0 && (
              <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl space-y-3">
                <Mic className="h-6 w-6 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-500">No mock interview recorded yet in this workspace.</p>
                <button
                  onClick={() => setShowSelector(true)}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition"
                >
                  Start Your First Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
