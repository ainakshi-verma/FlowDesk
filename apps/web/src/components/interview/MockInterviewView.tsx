import React, { useEffect, useState } from 'react';
import { Mic, Send, Award, AlertCircle, ArrowRight, Play, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { InterviewSession } from '../../types';

export const MockInterviewView: React.FC = () => {
  const { activeWorkspaceId, setActiveTab } = useStore();
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [submittingTurn, setSubmittingTurn] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [roleType, setRoleType] = useState<any>('FRONTEND');

  const fetchInterviews = async () => {
    if (!activeWorkspaceId) return;
    try {
      const list = await api.getInterviews(activeWorkspaceId);
      setInterviews(list);
      if (list.length > 0 && !activeSession) {
        setActiveSession(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [activeWorkspaceId]);

  const handleStartNewSession = async () => {
    if (!activeWorkspaceId) return;
    try {
      const created = await api.startInterview(activeWorkspaceId, {
        roleType,
        title: `${roleType.charAt(0) + roleType.slice(1).toLowerCase()} Technical Mock`
      });
      setActiveSession(created);
      fetchInterviews();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateAnswer.trim() || !activeSession) return;

    try {
      setSubmittingTurn(true);
      const res = await api.submitInterviewTurn(activeSession.id, candidateAnswer.trim());
      setCandidateAnswer('');
      setActiveSession(prev => prev ? {
        ...prev,
        exchanges: res.exchanges
      } : null);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingTurn(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!activeSession) return;
    try {
      setCompleting(true);
      const res = await api.completeInterview(activeSession.id);
      setActiveSession(res.session);
      fetchInterviews();
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Configuration & Session Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222328]">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
            <Mic className="h-5 w-5 text-sky-400" />
            AI Mock Interview Studio
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real dynamic follow-ups probing technical depth. Weak areas automatically become workspace tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleType}
            onChange={e => setRoleType(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-[#16171b] border border-[#272930] text-xs text-zinc-200 focus:outline-none"
          >
            <option value="FRONTEND">Frontend Developer</option>
            <option value="BACKEND">Backend Developer</option>
            <option value="FULLSTACK">Full Stack Developer</option>
            <option value="SYSTEM_DESIGN">System Design</option>
            <option value="HR">HR & Behavioral (STAR)</option>
          </select>

          <button
            onClick={handleStartNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-sm transition"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Start Session</span>
          </button>
        </div>
      </div>

      {activeSession ? (
        <div className="space-y-6">
          {/* Active Session Info Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#111215] border border-[#202227]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 uppercase">
                {activeSession.roleType}
              </span>
              <span className="text-xs font-medium text-zinc-200">
                {activeSession.title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                activeSession.status === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
              }`}>
                {activeSession.status === 'COMPLETED' ? 'COMPLETED' : 'IN PROGRESS'}
              </span>

              {activeSession.status === 'IN_PROGRESS' && (
                <button
                  onClick={handleCompleteInterview}
                  disabled={completing}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
                >
                  {completing ? 'Calculating Score...' : 'Finish & Grade'}
                </button>
              )}
            </div>
          </div>

          {/* Rubric Scorecard (Shown when session is COMPLETED) */}
          {activeSession.status === 'COMPLETED' && activeSession.scores && (
            <div className="border border-[#222328] bg-[#111216] rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#202227]">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Award className="h-4 w-4 text-sky-400" />
                    Interview Rubric & Evaluation Scorecard
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Hiring committee assessment across four core dimensions
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Overall Score</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">{activeSession.overallScore}%</span>
                </div>
              </div>

              {/* 4 Score Bars */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-[#0e0f12] border border-[#1d1e23]">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Technical Depth</span>
                  <span className="text-lg font-bold font-mono text-zinc-100">{activeSession.scores.technical}%</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0e0f12] border border-[#1d1e23]">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Communication</span>
                  <span className="text-lg font-bold font-mono text-zinc-100">{activeSession.scores.communication}%</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0e0f12] border border-[#1d1e23]">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Problem Solving</span>
                  <span className="text-lg font-bold font-mono text-zinc-100">{activeSession.scores.problemSolving}%</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0e0f12] border border-[#1d1e23]">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Confidence</span>
                  <span className="text-lg font-bold font-mono text-zinc-100">{activeSession.scores.confidence}%</span>
                </div>
              </div>

              {/* Qualitative Feedback */}
              {activeSession.feedbackSummary && (
                <div className="p-4 rounded-lg bg-[#0d0e11] border border-[#1c1d22] text-xs text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-zinc-200 block mb-1">Architect Feedback:</span>
                  {activeSession.feedbackSummary}
                </div>
              )}

              {/* Weak Areas Loop */}
              {activeSession.weakAreas?.length > 0 && (
                <div className="pt-2 border-t border-[#202227] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-400 font-mono flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Pinpointed Weak Areas:
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {activeSession.weakAreas.map((w: string) => (
                        <span key={w} className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition"
                  >
                    View Generated Tasks <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Exchanges Stream */}
          <div className="space-y-4">
            {activeSession.exchanges?.map((ex) => (
              <div
                key={ex.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  ex.speaker === 'INTERVIEWER'
                    ? 'bg-[#111317] border-[#22242a] text-zinc-200'
                    : 'bg-[#15171e] border-[#262832] text-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span className={ex.speaker === 'INTERVIEWER' ? 'text-sky-400 font-semibold' : 'text-zinc-400'}>
                    {ex.speaker === 'INTERVIEWER' ? 'AI Principal Interviewer' : 'Candidate Response'}
                  </span>
                  {ex.score !== null && ex.score !== undefined && (
                    <span className="text-emerald-400 font-bold">
                      Turn Score: {ex.score}/100
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed">
                  {ex.message}
                </p>

                {ex.critique && (
                  <div className="mt-2 p-2.5 rounded bg-[#0d0e12] border border-[#1e2026] text-[11px] text-zinc-400">
                    <span className="font-semibold text-zinc-300">Critique: </span>
                    {ex.critique}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Turn Input (Available when session is IN_PROGRESS) */}
          {activeSession.status === 'IN_PROGRESS' && (
            <form onSubmit={handleSubmitTurn} className="space-y-3 pt-2">
              <div className="relative">
                <textarea
                  rows={4}
                  required
                  placeholder="Formulate your technical explanation here (mention trade-offs, internal mechanics, or edge cases)..."
                  value={candidateAnswer}
                  onChange={e => setCandidateAnswer(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#121317] border border-[#25272f] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono leading-relaxed placeholder:text-zinc-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">
                  Press Submit to receive technical critique and next follow-up.
                </span>
                <button
                  type="submit"
                  disabled={submittingTurn || !candidateAnswer.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submittingTurn ? 'Evaluating...' : 'Submit Answer'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl space-y-3">
          <p className="text-xs text-zinc-500">No mock interview active yet.</p>
          <button
            onClick={handleStartNewSession}
            className="px-4 py-2 rounded bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition"
          >
            Start Frontend Technical Mock
          </button>
        </div>
      )}
    </div>
  );
};
