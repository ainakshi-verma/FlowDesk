import React, { useEffect, useState } from 'react';
import { Plus, Briefcase, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { JobApplication } from '../../types';

export const JobsMatchView: React.FC = () => {
  const { activeWorkspaceId, setActiveTab } = useStore();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const [generatingTasksJobId, setGeneratingTasksJobId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Job Form State
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newJdText, setNewJdText] = useState('');
  const [newStatus, setNewStatus] = useState<any>('WISHLIST');

  const fetchJobs = async () => {
    if (!activeWorkspaceId) return;
    try {
      setLoading(true);
      const res = await api.getJobs(activeWorkspaceId);
      setJobs(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeWorkspaceId]);

  const handleMatch = async (jobId: string) => {
    try {
      setMatchingJobId(jobId);
      const updated = await api.matchJob(jobId);
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
    } catch (e) {
      console.error(e);
    } finally {
      setMatchingJobId(null);
    }
  };

  const handleGenerateTasks = async (jobId: string) => {
    try {
      setGeneratingTasksJobId(jobId);
      await api.generateJobTasks(jobId);
      alert('Actionable study tasks have been synthesized and added directly to your Tasks Kanban board!');
      setActiveTab('tasks');
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingTasksJobId(null);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newRole || !activeWorkspaceId) return;

    try {
      const created = await api.createJob(activeWorkspaceId, {
        company: newCompany,
        role: newRole,
        jobDescriptionText: newJdText,
        status: newStatus
      });
      setJobs(prev => [created, ...prev]);
      setNewCompany('');
      setNewRole('');
      setNewJdText('');
      setShowAddModal(false);
      // Auto-trigger match
      handleMatch(created.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            Target Job Pipeline & AI Resume Matcher
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            The Career Agent analyzes your profile against company expectations and automatically generates gap remediation plans.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Opportunity</span>
        </button>
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-[#282a32] rounded-xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#222327]">
              <h3 className="text-sm font-semibold text-zinc-100">Add Target Role & Job Description</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs font-mono">
                ESC
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe, Atlassian"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Engineer"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Job Description Requirements (Paste Text)</label>
                <textarea
                  rows={4}
                  placeholder="Paste skills, qualifications, or responsibilities from the job listing..."
                  value={newJdText}
                  onChange={e => setNewJdText(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition"
                >
                  Add & Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List with Rich Match Cards */}
      <div className="space-y-4">
        {jobs.map(job => {
          const analysis = job.analysis;
          const isMatching = matchingJobId === job.id;
          const isGeneratingTasks = generatingTasksJobId === job.id;

          return (
            <div
              key={job.id}
              className="border border-[#222328] bg-[#111216] rounded-xl p-5 space-y-4 hover:border-zinc-700 transition"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#181a20] border border-zinc-800 flex items-center justify-center text-zinc-200 font-semibold text-sm">
                    {job.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{job.role}</h3>
                    <p className="text-xs text-zinc-500 font-mono">{job.company}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
                    {job.status}
                  </span>

                  {job.matchScore > 0 && (
                    <div className="text-right">
                      <span className="text-xs uppercase tracking-wider font-mono text-zinc-500 block text-[10px]">
                        Resume Match
                      </span>
                      <span className="text-base font-bold text-sky-400 font-mono">
                        {job.matchScore}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Career Agent Analysis Panel */}
              {analysis ? (
                <div className="p-4 rounded-lg bg-[#0e0f12] border border-[#1f2025] space-y-3">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {analysis.experienceEvaluation}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1d1e22]">
                    {/* Matching Skills */}
                    <div>
                      <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1 mb-1.5">
                        <CheckCircle2 className="h-3 w-3" /> Matching Proficiencies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.matchingSkills?.map((s: string) => (
                          <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <span className="text-[10px] font-mono uppercase text-rose-400 flex items-center gap-1 mb-1.5">
                        <AlertTriangle className="h-3 w-3" /> Target Gap Areas
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.missingSkills?.map((s: string) => (
                          <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                            △ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Action to Spawn Kanban Tasks */}
                  {analysis.actionPlan?.length > 0 && (
                    <div className="pt-3 border-t border-[#1d1e22] flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">
                        {analysis.actionPlan.length} recommended learning tasks identified for this interview
                      </span>
                      <button
                        onClick={() => handleGenerateTasks(job.id)}
                        disabled={isGeneratingTasks}
                        className="px-3 py-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-medium transition flex items-center gap-1.5"
                      >
                        {isGeneratingTasks ? (
                          <>Generating Tasks...</>
                        ) : (
                          <>Populate Study Tasks to Kanban <ArrowRight className="h-3 w-3" /></>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#0e0f12] border border-dashed border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Run Career Agent to calculate match score and discover missing requirements.
                  </span>
                  <button
                    onClick={() => handleMatch(job.id)}
                    disabled={isMatching}
                    className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isMatching ? 'animate-spin' : ''}`} />
                    {isMatching ? 'Evaluating...' : 'Run Career Match'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
