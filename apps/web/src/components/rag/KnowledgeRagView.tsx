import React, { useEffect, useState } from 'react';
import { Search, FileText, Sparkles, BookOpen, Quote, Plus, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { DocumentItem } from '../../types';

export const KnowledgeRagView: React.FC = () => {
  const { activeWorkspaceId } = useStore();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ragResult, setRagResult] = useState<{ answer: string; citations: Array<{ documentTitle: string; excerpt: string }> } | null>(null);

  // New Document modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDocType, setNewDocType] = useState<any>('NOTE');
  const [newRawText, setNewRawText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async () => {
    if (!activeWorkspaceId) return;
    try {
      const list = await api.getDocuments(activeWorkspaceId);
      setDocuments(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeWorkspaceId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !activeWorkspaceId) return;

    try {
      setIsSearching(true);
      const res = await api.searchDocumentsRAG(activeWorkspaceId, query.trim());
      setRagResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRawText.trim() || !activeWorkspaceId) return;

    try {
      setIsUploading(true);
      await api.createDocument(activeWorkspaceId, {
        title: newTitle.trim(),
        docType: newDocType,
        rawText: newRawText.trim()
      });
      setNewTitle('');
      setNewRawText('');
      setShowAddModal(false);
      fetchDocuments();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222328]">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-sky-400" />
            Semantic Knowledge Base & RAG Retrieval
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Query across resumes, job descriptions, and interview notes. Answers are strictly grounded with document citations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Upload / Ingest Note</span>
        </button>
      </div>

      {/* Upload Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-[#282a32] rounded-xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#222327]">
              <h3 className="text-sm font-semibold text-zinc-100">Ingest Knowledge Document</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs font-mono">
                ESC
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Design Cheat Sheet.md"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Type</label>
                  <select
                    value={newDocType}
                    onChange={e => setNewDocType(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none"
                  >
                    <option value="NOTE">Study Note</option>
                    <option value="RESUME">Resume</option>
                    <option value="JOB_DESCRIPTION">Job Description</option>
                    <option value="INTERVIEW_EXP">Interview Experience</option>
                    <option value="SYLLABUS">Syllabus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Text Content (Vectorized on save)</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste document text here. FlowDesk will chunk and generate vector embeddings automatically..."
                  value={newRawText}
                  onChange={e => setNewRawText(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#18191f] border border-[#2b2d36] text-xs text-zinc-100 focus:outline-none font-mono"
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
                  disabled={isUploading}
                  className="px-4 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition"
                >
                  {isUploading ? 'Chunking & Vectorizing...' : 'Save & Ingest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semantic Search Box */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#131418] border border-[#26282f] focus-within:border-zinc-500 transition">
          <Search className="h-4 w-4 text-zinc-500 ml-2" />
          <input
            type="text"
            required
            placeholder="Ask anything grounded in your workspace docs (e.g. 'What topics were asked in my saved React interviews?')"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs text-zinc-100 placeholder:text-zinc-600 px-2"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition shrink-0"
          >
            {isSearching ? 'Retrieving...' : 'Ask RAG'}
          </button>
        </div>
      </form>

      {/* RAG Answer Display */}
      {ragResult && (
        <div className="border border-[#222328] bg-[#111216] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Grounded Answer Synthesis
          </div>

          <p className="text-xs leading-relaxed text-zinc-200">
            {ragResult.answer}
          </p>

          {/* Citations */}
          {ragResult.citations.length > 0 && (
            <div className="pt-4 border-t border-[#1f2025] space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                Grounded Citations
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {ragResult.citations.map((cite, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#0e0f12] border border-[#1d1e23] space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-300 block truncate">
                      {cite.documentTitle}
                    </span>
                    <p className="text-[10px] text-zinc-500 line-clamp-2 italic font-mono">
                      "{cite.excerpt}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ingested Documents Registry */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#222328]">
          <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-400">
            Workspace Ingested Knowledge ({documents.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-[#202227] bg-[#111215] space-y-2 hover:border-zinc-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-medium text-zinc-200 truncate max-w-[220px]">
                    {doc.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                  {doc.docType}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                <span>{doc.chunkCount} vector chunks</span>
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
