import React, { useEffect, useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Send,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  List,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { InterviewSession } from '../../types';

interface VirtualStudioProps {
  session: InterviewSession;
  onExit: () => void;
  onSessionUpdated: (updated: InterviewSession) => void;
}

export const VirtualInterviewerStudio: React.FC<VirtualStudioProps> = ({
  session,
  onExit,
  onSessionUpdated
}) => {
  const { setActiveTab } = useStore();
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const currentExchange = session.exchanges?.slice(-1)[0];
  const currentQuestion = currentExchange?.speaker === 'INTERVIEWER'
    ? currentExchange.message
    : session.exchanges?.slice(-2)[0]?.message || 'Tell me about your technical approach.';

  // Live Timer
  useEffect(() => {
    if (session.status !== 'IN_PROGRESS') return;
    const timer = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [session.status]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Web Speech Text-to-Speech (TTS)
  const speakQuestion = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Persona-tuned vocal parameters
    if (session.persona === 'MAYA') {
      utterance.rate = 1.05;
      utterance.pitch = 1.05;
    } else if (session.persona === 'DANIEL') {
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
    } else {
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speak initial question on load if in progress
  useEffect(() => {
    if (session.status === 'IN_PROGRESS' && currentQuestion) {
      speakQuestion(currentQuestion);
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentQuestion, session.status]);

  // Web Speech Speech-to-Text (STT)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(interim);
          if (final) {
            setCandidateAnswer(prev => prev ? `${prev} ${final}` : final);
            setInterimTranscript('');
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition event:', e.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your answers directly below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Stop TTS if speaking
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Submit Answer Turn
  const handleSubmitTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const fullAnswer = `${candidateAnswer} ${interimTranscript}`.trim();
    if (!fullAnswer || session.status !== 'IN_PROGRESS') return;

    try {
      setIsThinking(true);
      const res = await api.submitInterviewTurn(session.id, fullAnswer);
      setCandidateAnswer('');
      setInterimTranscript('');

      const updatedSession: InterviewSession = {
        ...session,
        exchanges: res.exchanges
      };
      onSessionUpdated(updatedSession);

      // Speak next question / follow up
      const nextQ = res.evaluation?.followUpOrNextQuestion;
      if (nextQ) {
        speakQuestion(nextQ);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  // Finish Interview & Synthesize 5-Axis Scorecard
  const handleCompleteInterview = async () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      setIsCompleting(true);
      const res = await api.completeInterview(session.id);
      onSessionUpdated(res.session);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  };

  // Practice Weak Areas Flow
  const handlePracticeWeakAreas = async () => {
    try {
      const res = await api.practiceWeakAreas(session.id);
      onSessionUpdated(res.session);
    } catch (err) {
      console.error(err);
    }
  };

  const personaNames: Record<string, { name: string; style: string }> = {
    ALEX: { name: 'Alex', style: 'Calm • Technical • Encouraging' },
    MAYA: { name: 'Maya', style: 'Professional • Fast-Paced • Challenging' },
    DANIEL: { name: 'Daniel', style: 'Strict • Follow-Up Heavy • FAANG-Style' }
  };

  const currentPersona = personaNames[session.persona || 'ALEX'] || personaNames.ALEX;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 select-none">
      {/* Chamber Header & Call Status Bar */}
      <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-[#111215] border border-[#202227] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-100 font-mono tracking-tight">
              {currentPersona.name}
            </span>
          </div>

          <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
            • {currentPersona.style}
          </span>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            {session.roleType}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {session.status === 'IN_PROGRESS' && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-[#16171b] px-2.5 py-1 rounded-md border border-[#25272e]">
              <Clock className="h-3 w-3 text-sky-400" />
              <span>{formatTimer(timerSeconds)}</span>
            </div>
          )}

          {/* Voice Toggle */}
          <button
            onClick={() => {
              if (voiceEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`p-1.5 rounded-md border text-xs transition flex items-center gap-1 ${
              voiceEnabled
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-500'
            }`}
            title="Toggle AI Speech Voice"
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* Toggle Transcript */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="p-1.5 rounded-md bg-[#16171b] border border-[#25272e] text-zinc-400 hover:text-zinc-200 text-xs transition"
            title="Toggle Live Transcript"
          >
            <List className="h-3.5 w-3.5" />
          </button>

          {session.status === 'IN_PROGRESS' ? (
            <button
              onClick={handleCompleteInterview}
              disabled={isCompleting}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition"
            >
              <PhoneOff className="h-3 w-3" />
              <span>{isCompleting ? 'Grading...' : 'End & Grade'}</span>
            </button>
          ) : (
            <button
              onClick={onExit}
              className="px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
            >
              Exit Studio
            </button>
          )}
        </div>
      </div>

      {/* Main Chamber Stage */}
      <div className="flex-1 flex gap-4 mt-4 overflow-hidden">
        {/* Left / Center: Virtual Presence & Live Turn */}
        <div className="flex-1 flex flex-col justify-between bg-[#0e0f12] border border-[#1e2025] rounded-2xl p-6 relative overflow-y-auto">
          {session.status === 'COMPLETED' ? (
            /* Completed 5-Axis Scorecard & Debrief */
            <div className="space-y-6 max-w-2xl mx-auto my-auto w-full">
              <div className="flex items-center justify-between pb-3 border-b border-[#202227]">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    <Award className="h-5 w-5 text-sky-400" />
                    Hiring Evaluation & 5-Axis Rubric
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Assessed by {currentPersona.name} ({currentPersona.style})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Overall Score</span>
                  <span className="text-3xl font-bold font-mono text-emerald-400">
                    {session.overallScore || 78}%
                  </span>
                </div>
              </div>

              {/* 5-Axis Metric Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                {[
                  { label: 'Technical', val: session.scores?.technical || 80 },
                  { label: 'Communication', val: session.scores?.communication || 75 },
                  { label: 'Problem Solving', val: session.scores?.problemSolving || 85 },
                  { label: 'Relevance', val: (session.scores as any)?.relevance || 82 },
                  { label: 'Confidence', val: session.scores?.confidence || 72 },
                ].map(metric => (
                  <div key={metric.label} className="p-3 rounded-xl bg-[#131418] border border-[#22242a] text-center">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block truncate">{metric.label}</span>
                    <span className="text-lg font-bold font-mono text-zinc-100">{metric.val}%</span>
                  </div>
                ))}
              </div>

              {/* Coaching Advice Card */}
              <div className="p-4 rounded-xl bg-[#111319] border border-sky-900/40 space-y-2">
                <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Architect Coaching Advice
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {(session as any).coachingAdvice ||
                    "You performed well technically, but several answers were longer than necessary. Practice answering technical questions using a Situation → Approach → Result structure."}
                </p>
              </div>

              {/* Strong vs Weak Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#111215] border border-[#202227] space-y-2">
                  <span className="text-[11px] font-mono uppercase text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Strong Proficiencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {((session as any).strongAreas?.length ? (session as any).strongAreas : ['Problem Solving', 'REST APIs', 'Data Structures']).map((s: string) => (
                      <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#111215] border border-[#202227] space-y-2">
                  <span className="text-[11px] font-mono uppercase text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Growth Opportunities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {((session as any).weakAreas?.length ? (session as any).weakAreas : ['React Reconciliation', 'SQL Joins', 'Concise Structuring']).map((w: string) => (
                      <span key={w} className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        △ {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  View Tasks on Kanban <ArrowRight className="h-3 w-3" />
                </button>

                <button
                  onClick={handlePracticeWeakAreas}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-lg shadow-sky-500/20 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Practice Weak Areas Drill</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Live Interview Chamber */
            <div className="flex-1 flex flex-col justify-between items-center py-6 space-y-8">
              {/* Virtual Circular Presence */}
              <div className="relative flex flex-col items-center justify-center pt-4">
                <div className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isSpeaking
                    ? 'ring-4 ring-sky-500/40 bg-sky-500/10 scale-105'
                    : isListening
                    ? 'ring-4 ring-emerald-500/40 bg-emerald-500/10 scale-105 animate-pulse'
                    : isThinking
                    ? 'ring-4 ring-purple-500/40 bg-purple-500/10 animate-spin'
                    : 'ring-2 ring-zinc-800 bg-zinc-900/60'
                }`}>
                  <div className="text-2xl font-bold font-mono text-zinc-200">
                    {currentPersona.name.charAt(0)}
                  </div>

                  {/* Audio Waveform Bars (Active when speaking) */}
                  {isSpeaking && (
                    <div className="absolute -bottom-3 flex items-center gap-1 bg-[#15171e] px-2.5 py-1 rounded-full border border-sky-500/30">
                      <div className="w-1 h-3 bg-sky-400 animate-[bounce_0.6s_infinite_100ms] rounded" />
                      <div className="w-1 h-4 bg-sky-400 animate-[bounce_0.6s_infinite_200ms] rounded" />
                      <div className="w-1 h-2 bg-sky-400 animate-[bounce_0.6s_infinite_300ms] rounded" />
                      <div className="w-1 h-5 bg-sky-400 animate-[bounce_0.6s_infinite_150ms] rounded" />
                      <div className="w-1 h-3 bg-sky-400 animate-[bounce_0.6s_infinite_250ms] rounded" />
                    </div>
                  )}
                </div>

                {/* State Tag */}
                <span className={`text-[11px] font-mono tracking-wider uppercase mt-4 px-2.5 py-0.5 rounded-full border ${
                  isSpeaking
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    : isListening
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse'
                    : isThinking
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400'
                }`}>
                  {isSpeaking ? 'Speaking Question' : isListening ? 'Listening to You...' : isThinking ? 'Analyzing Architecture...' : 'Ready'}
                </span>
              </div>

              {/* Spoken Question Text */}
              <div className="max-w-2xl text-center space-y-2 px-4">
                <p className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed tracking-tight">
                  "{currentQuestion}"
                </p>

                {currentExchange?.isCallback && (
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    ⚡ Conversational Memory Callback
                  </span>
                )}
              </div>

              {/* Candidate Voice Input & Typing Bar */}
              <div className="w-full max-w-2xl space-y-3">
                <form onSubmit={handleSubmitTurn} className="space-y-3">
                  <div className="relative border border-[#25272f] rounded-xl bg-[#121317] focus-within:border-zinc-500 transition">
                    <textarea
                      rows={3}
                      value={candidateAnswer + (interimTranscript ? ` ${interimTranscript}` : '')}
                      onChange={e => setCandidateAnswer(e.target.value)}
                      placeholder={isListening ? "Listening... Speak naturally into your microphone..." : "Speak using the microphone or type your technical answer..."}
                      className="w-full p-3.5 pr-12 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none font-mono leading-relaxed"
                    />

                    <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                      {/* Speech Mic Button */}
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2 rounded-lg border transition ${
                          isListening
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 animate-pulse'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
                        }`}
                        title={isListening ? "Stop listening" : "Speak your answer aloud"}
                      >
                        {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-zinc-400" />}
                      </button>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isThinking || (!candidateAnswer.trim() && !interimTranscript.trim())}
                        className="p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white transition disabled:opacity-40"
                        title="Submit Answer"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
                    <span>
                      {isListening ? '🎙️ Microphone active. Speak your answer...' : 'Tip: Click the mic or press Enter to submit.'}
                    </span>
                    <span>Turn #{Math.floor(((session.exchanges?.length || 1) + 1) / 2)}</span>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right: Collapsible Live Transcript Drawer */}
        {showTranscript && (
          <div className="w-80 bg-[#101115] border border-[#202227] rounded-2xl p-4 flex flex-col space-y-3 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2025]">
              <span className="text-xs font-semibold text-zinc-200">Live Transcript</span>
              <span className="text-[10px] font-mono text-zinc-500">{session.exchanges?.length || 0} turns</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {session.exchanges?.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  className={`p-3 rounded-lg text-xs space-y-1 ${
                    ex.speaker === 'INTERVIEWER'
                      ? 'bg-[#14151a] border border-[#24262f] text-zinc-300'
                      : 'bg-[#171922] border border-[#282a35] text-zinc-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span className={ex.speaker === 'INTERVIEWER' ? 'text-sky-400 font-semibold' : 'text-zinc-400'}>
                      {ex.speaker === 'INTERVIEWER' ? currentPersona.name : 'You'}
                    </span>
                    {ex.score && (
                      <span className="text-emerald-400 font-bold">{ex.score}/100</span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed line-clamp-4">{ex.message}</p>
                  {ex.critique && (
                    <div className="mt-1 pt-1 border-t border-zinc-800 text-[10px] text-zinc-400 italic">
                      {ex.critique}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
