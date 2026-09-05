import React, { useEffect, useState } from 'react';
import { Plus, Clock, Tag, ArrowRight, ArrowLeft, Check, Sparkles, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { Task, TaskStatus } from '../../types';

export const TasksKanbanView: React.FC = () => {
  const { activeWorkspaceId } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('ALL');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newEstimatedMin, setNewEstimatedMin] = useState(45);
  const [newTag, setNewTag] = useState('');

  const fetchTasks = async () => {
    if (!activeWorkspaceId) return;
    try {
      setLoading(true);
      const res = await api.getTasks(activeWorkspaceId);
      setTasks(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeWorkspaceId]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (e) {
      console.error('Failed to update task status', e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !activeWorkspaceId) return;

    try {
      const created = await api.createTask(activeWorkspaceId, {
        title: newTitle.trim(),
        priority: newPriority,
        estimatedMin: Number(newEstimatedMin),
        tags: newTag ? [newTag.trim()] : ['General'],
        sourceType: 'MANUAL',
        status: 'TODO'
      });
      setTasks(prev => [created, ...prev]);
      setNewTitle('');
      setNewTag('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Array<{ id: TaskStatus; label: string }> = [
    { id: 'TODO', label: 'To Do' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'REVIEW', label: 'Review / Verifying' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  const filteredTasks = tasks.filter(t => {
    if (filterSource === 'ALL') return true;
    if (filterSource === 'MOCK') return t.sourceType === 'MOCK_INTERVIEW';
    if (filterSource === 'GAP') return t.sourceType === 'SKILL_GAP';
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">URGENT</span>;
      case 'HIGH':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">MEDIUM</span>;
      default:
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">LOW</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-mono text-zinc-500 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter Source:
          </span>
          <div className="flex gap-1 bg-[#131418] border border-[#24262c] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setFilterSource('ALL')}
              className={`px-2.5 py-1 rounded text-xs transition ${filterSource === 'ALL' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterSource('MOCK')}
              className={`px-2.5 py-1 rounded text-xs transition ${filterSource === 'MOCK' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Mock Remediation ({tasks.filter(t => t.sourceType === 'MOCK_INTERVIEW').length})
            </button>
            <button
              onClick={() => setFilterSource('GAP')}
              className={`px-2.5 py-1 rounded text-xs transition ${filterSource === 'GAP' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Job Skill Gaps ({tasks.filter(t => t.sourceType === 'SKILL_GAP').length})
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-[#282a32] rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#222327]">
              <h3 className="text-sm font-semibold text-zinc-100">Create New Workspace Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-mono"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement LRU Cache in TypeScript"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Estimated Minutes</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={newEstimatedMin}
                    onChange={e => setNewEstimatedMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Topic / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. React, DSA, SystemDesign"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className="bg-[#0f1013] border border-[#1f2025] rounded-xl p-3.5 space-y-3 flex flex-col min-h-[600px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#1c1d22]">
                <span className="text-xs font-medium text-zinc-300 tracking-tight">{col.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-[#14151a] border border-[#23252d] hover:border-zinc-700 transition space-y-2.5 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-zinc-200 leading-snug">
                        {task.title}
                      </p>
                      {getPriorityBadge(task.priority)}
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-normal">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {task.estimatedMin}m
                      </span>

                      {task.sourceType === 'MOCK_INTERVIEW' && (
                        <span className="text-rose-400/90 font-mono text-[9px] bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
                          AI Mock Weak Area
                        </span>
                      )}
                      {task.sourceType === 'SKILL_GAP' && (
                        <span className="text-amber-400/90 font-mono text-[9px] bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                          Job Skill Gap
                        </span>
                      )}
                    </div>

                    {/* Stage Transition Buttons */}
                    <div className="pt-2 border-t border-[#1f2025] flex items-center justify-between opacity-50 group-hover:opacity-100 transition">
                      {col.id !== 'TODO' ? (
                        <button
                          onClick={() => {
                            const prevStatus: Record<TaskStatus, TaskStatus> = {
                              IN_PROGRESS: 'TODO',
                              REVIEW: 'IN_PROGRESS',
                              COMPLETED: 'REVIEW',
                              TODO: 'TODO'
                            };
                            handleStatusChange(task.id, prevStatus[col.id]);
                          }}
                          className="text-[10px] text-zinc-500 hover:text-zinc-200 flex items-center gap-0.5"
                        >
                          <ArrowLeft className="h-2.5 w-2.5" /> Prev
                        </button>
                      ) : <div />}

                      {col.id !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            const nextStatus: Record<TaskStatus, TaskStatus> = {
                              TODO: 'IN_PROGRESS',
                              IN_PROGRESS: 'REVIEW',
                              REVIEW: 'COMPLETED',
                              COMPLETED: 'COMPLETED'
                            };
                            handleStatusChange(task.id, nextStatus[col.id]);
                          }}
                          className="text-[10px] text-zinc-400 hover:text-sky-400 flex items-center gap-0.5 font-medium ml-auto"
                        >
                          Next <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="h-24 border border-dashed border-zinc-800/60 rounded-lg flex items-center justify-center text-[11px] text-zinc-600">
                    Empty Stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
