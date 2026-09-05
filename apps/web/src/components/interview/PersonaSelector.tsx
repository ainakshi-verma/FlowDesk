import React, { useState } from 'react';
import { User, Shield, Zap, Sparkles, Check, ArrowRight, Briefcase } from 'lucide-react';
import { JobApplication } from '../../types';

interface PersonaSelectorProps {
  jobs: JobApplication[];
  onStartInterview: (params: { roleType: string; persona: string; jobId?: string }) => void;
  isLoading: boolean;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  jobs,
  onStartInterview,
  isLoading
}) => {
  const [selectedPersona, setSelectedPersona] = useState<'ALEX' | 'MAYA' | 'DANIEL'>('ALEX');
  const [selectedRole, setSelectedRole] = useState('FULLSTACK');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  const personas = [
    {
      id: 'ALEX',
      name: 'Alex',
      tagline: 'Calm • Technical • Encouraging',
      avatarBg: 'from-sky-500/20 to-blue-600/30 border-sky-500/40 text-sky-300',
      description: 'Focuses on deep conceptual understanding. Offers supportive prompts when answers are incomplete and encourages architectural reasoning.',
      traits: ['Supportive Tone', 'Architecture Focus', 'Constructive Feedback'],
      difficulty: 'Standard Bar'
    },
    {
      id: 'MAYA',
      name: 'Maya',
      tagline: 'Professional • Fast-Paced • Challenging',
      avatarBg: 'from-amber-500/20 to-orange-600/30 border-amber-500/40 text-amber-300',
      description: 'Values conciseness, structured communication, and high-scale production systems. Probes for operational reliability and real-world trade-offs.',
      traits: ['Concise & Brisk', 'High Concurrency', 'Production Scale'],
      difficulty: 'High Bar'
    },
    {
      id: 'DANIEL',
      name: 'Daniel',
      tagline: 'Strict • Follow-Up Heavy • FAANG-Style',
      avatarBg: 'from-rose-500/20 to-red-600/30 border-rose-500/40 text-rose-300',
      description: 'Bar Raiser mindset. Relentlessly challenges vague hand-waving, demands exact time/space complexities, and probes edge-case failure modes.',
      traits: ['Relentless Probing', 'Algorithmic Complexity', 'No Vague Answers'],
      difficulty: 'Bar Raiser'
    },
  ] as const;

  const handleLaunch = () => {
    onStartInterview({
      roleType: selectedRole,
      persona: selectedPersona,
      jobId: selectedJobId || undefined
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
          Choose Your Interviewer & Target Track
        </h2>
        <p className="text-xs text-zinc-400 max-w-lg mx-auto">
          The interviewer persona determines the interview strategy, questioning style, follow-up aggression, and vocal delivery.
        </p>
      </div>

      {/* Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personas.map((p) => {
          const isSelected = selectedPersona === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedPersona(p.id)}
              className={`p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-4 relative ${
                isSelected
                  ? 'bg-[#15171e] border-sky-500/60 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/30'
                  : 'bg-[#101115] border-[#22242a] hover:border-zinc-700 hover:bg-[#13141a]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}

              <div className="space-y-3">
                <div className={`h-12 w-12 rounded-xl border bg-gradient-to-br flex items-center justify-center font-bold text-base ${p.avatarBg}`}>
                  {p.name.charAt(0)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">{p.name}</h3>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{p.tagline}</p>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1e2026] space-y-2">
                <div className="flex flex-wrap gap-1">
                  {p.traits.map(trait => (
                    <span key={trait} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                      {trait}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                  <span>Standard:</span>
                  <span className="text-zinc-300 font-medium">{p.difficulty}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Role & Opportunity Config */}
      <div className="p-5 rounded-xl bg-[#111216] border border-[#22242a] grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-400 block mb-1.5">Interview Target Role</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-[#16171d] border border-[#272932] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
          >
            <option value="FULLSTACK">Full Stack Software Engineer</option>
            <option value="FRONTEND">Frontend Engineer (React, Web Perf, CSS/DOM)</option>
            <option value="BACKEND">Backend Engineer (Node, SQL, High Concurrency)</option>
            <option value="SYSTEM_DESIGN">System Design & Distributed Architecture</option>
            <option value="HR">Behavioral & Culture Fit (STAR Format)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1.5 flex items-center justify-between">
            <span>Ground with Target Opportunity (Optional)</span>
            <span className="text-[10px] font-mono text-zinc-500">Resume-aware</span>
          </label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-[#16171d] border border-[#272932] text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
          >
            <option value="">General Track (Workspace Resume)</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.company} — {j.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-center pt-2">
        <button
          onClick={handleLaunch}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
        >
          <span>{isLoading ? 'Bootstrapping Virtual Chamber...' : 'Enter AI Virtual Interview Chamber'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
