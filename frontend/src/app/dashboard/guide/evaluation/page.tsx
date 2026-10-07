"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { CheckSquare, Save, FileText, Eye } from "lucide-react";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";

interface TaskSubmission {
  id: number; task: number; task_title: string;
  student: number; student_name: string; student_email: string;
  submitted_at: string; status: string;
  score: number | null; grade: string; feedback: string;
  evaluated_at: string | null;
  plagiarism_score: number | null;
  plagiarism_matches: any[];
  file: string;
}

export default function GuideEvaluation() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ [id: number]: { score: string; feedback: string } }>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [selectedMatches, setSelectedMatches] = useState<any[] | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchPreview = async (s: TaskSubmission) => {
    setPreviewDoc(null);
    setPreviewError(null);
    setPreviewOriginalUrl(s.file);
    setPreviewLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/task-submissions/${s.id}/preview/`, {
        headers: { Authorization: `Token ${localStorage.getItem("token")}` }
      });
      if (!response.ok) throw new Error("Failed to load document");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewDoc(url);
    } catch (err) {
      setPreviewError("Document preview unavailable. Download the document to view it.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewDoc && previewDoc.startsWith('blob:')) {
      URL.revokeObjectURL(previewDoc);
    }
    setPreviewDoc(null);
    setPreviewError(null);
    setPreviewLoading(false);
    setPreviewOriginalUrl(null);
  };

  useEffect(() => { setMounted(true); }, []);

  const getHeaders = () => ({
    headers: { Authorization: `Token ${localStorage.getItem("token")}` }
  });

  const fetchData = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/task-submissions/`, getHeaders())
      .then(r => setSubmissions(r.data))
      .catch(() => setMsg({ type: "error", text: "Failed to load submissions." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleEditInit = (sub: TaskSubmission) => {
    setEditing(prev => ({
      ...prev,
      [sub.id]: { score: sub.score?.toString() || "", feedback: sub.feedback || "" }
    }));
  };

  const generateFeedbackSuggestion = (plagScore: number | null) => {
    if (plagScore === null) return "Evaluation complete. Good effort.";
    if (plagScore === 0) return "Excellent original work. No plagiarism detected.";
    if (plagScore < 15) return "Good work. Minor similarities detected, but well within acceptable limits.";
    if (plagScore < 40) return "Moderate similarities detected. Please ensure proper citations and paraphrasing in the future.";
    if (plagScore < 70) return "High level of plagiarism detected. Significant revision is required.";
    return "Unacceptable level of plagiarism. The submission appears to be heavily copied.";
  };

  const suggestFeedback = (sub: TaskSubmission) => {
    const suggestion = generateFeedbackSuggestion(sub.plagiarism_score);
    setEditing(prev => ({
      ...prev,
      [sub.id]: { ...prev[sub.id], feedback: suggestion }
    }));
  };

  const handleSave = async (id: number) => {
    const e = editing[id];
    if (!e) return;
    setSaving(id);
    setMsg({ type: "", text: "" });
    try {
      await axios.patch(`${API_BASE_URL}/api/task-submissions/${id}/`, {
        action: 'evaluate', score: e.score, feedback: e.feedback
      }, getHeaders());
      setMsg({ type: "success", text: "Evaluation saved successfully." });
      setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
      fetchData();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to save evaluation." });
    } finally { setSaving(null); }
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B') return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    if (grade === 'F') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-600';
  };

  const unevaluated = submissions.filter(s => s.status !== 'evaluated');
  const evaluated = submissions.filter(s => s.status === 'evaluated');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Evaluation / Scores</h1>

      {msg.text && (
        <div className={`p-4 rounded-lg text-sm border ${msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Pending evaluation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <CheckSquare className="w-5 h-5 mr-2 text-orange-600" />
          Pending Evaluation ({unevaluated.length})
        </h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : unevaluated.length === 0 ? (
          <p className="text-gray-400 italic">All submissions have been evaluated.</p>
        ) : (
          <div className="space-y-4">
            {unevaluated.map(s => {
              const e = editing[s.id];
              return (
                <div key={s.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{s.student_name || s.student_email}</p>
                      <p className="text-sm text-gray-500">{s.task_title} · Submitted {new Date(s.submitted_at).toLocaleDateString()}</p>
                      {s.plagiarism_score !== null && (
                        <p 
                          className="text-sm mt-1 font-semibold cursor-pointer text-red-600 hover:underline inline-block"
                          onClick={() => setSelectedMatches(s.plagiarism_matches || [])}
                        >
                          Plagiarism: {s.plagiarism_score}%
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => fetchPreview(s)}
                        className="flex items-center text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium transition-colors">
                        <Eye className="w-4 h-4 mr-1" /> Preview
                      </button>
                      {!e && (
                        <button onClick={() => handleEditInit(s)}
                          className="text-sm bg-green-900 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                          Evaluate
                        </button>
                      )}
                    </div>
                  </div>
                  {e && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Score (0–100)</label>
                        <input type="number" min="0" max="100" value={e.score}
                          onChange={ev => setEditing(prev => ({ ...prev, [s.id]: { ...prev[s.id], score: ev.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-gray-900 bg-gray-50 focus:ring-2 focus:ring-green-700" />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-medium text-gray-600">Feedback</label>
                          <button 
                            onClick={() => suggestFeedback(s)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-0.5 rounded transition-colors"
                          >
                            Suggest Feedback
                          </button>
                        </div>
                        <textarea value={e.feedback}
                          onChange={ev => setEditing(prev => ({ ...prev, [s.id]: { ...prev[s.id], feedback: ev.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-gray-900 bg-gray-50 focus:ring-2 focus:ring-green-700 h-20" />
                      </div>
                      <div className="md:col-span-3 flex justify-end gap-3">
                        <button onClick={() => setEditing(prev => { const n = { ...prev }; delete n[s.id]; return n; })}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm">Cancel</button>
                        <button onClick={() => handleSave(s.id)} disabled={saving === s.id}
                          className="flex items-center px-4 py-2 bg-green-900 hover:bg-green-800 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-60">
                          <Save className="w-4 h-4 mr-2" /> {saving === s.id ? "Saving..." : "Save Evaluation"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluated */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <CheckSquare className="w-5 h-5 mr-2 text-green-600" />
          Evaluated ({evaluated.length})
        </h2>
        {evaluated.length === 0 ? (
          <p className="text-gray-400 italic">No evaluations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Task</th>
                  <th className="pb-3 font-medium text-center">Score</th>
                  <th className="pb-3 font-medium text-center">Plagiarism</th>
                  <th className="pb-3 font-medium text-center">Grade</th>
                  <th className="pb-3 font-medium">Feedback</th>
                  <th className="pb-3 font-medium">Evaluated</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {evaluated.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <p className="font-semibold text-gray-900">{s.student_name || 'Student'}</p>
                      <p className="text-xs text-gray-400">{s.student_email}</p>
                    </td>
                    <td className="py-4 text-gray-600">{s.task_title}</td>
                    <td className="py-4 text-center font-bold text-gray-800">{s.score}/100</td>
                    <td className="py-4 text-center">
                      {s.plagiarism_score !== null ? (
                        <span 
                          className="cursor-pointer font-bold text-red-600 hover:underline" 
                          onClick={() => setSelectedMatches(s.plagiarism_matches || [])}
                        >
                          {s.plagiarism_score}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2 py-1 rounded font-bold text-sm ${getGradeColor(s.grade)}`}>{s.grade}</span>
                    </td>
                    <td className="py-4 text-gray-600 max-w-xs text-xs italic">{s.feedback || '—'}</td>
                    <td className="py-4 text-gray-500">{s.evaluated_at ? new Date(s.evaluated_at).toLocaleDateString() : '—'}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => fetchPreview(s)} className="text-blue-600 hover:text-blue-800 p-2" title="Preview Document">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plagiarism Insights Modal */}
      {mounted && selectedMatches !== null && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden" style={{ maxHeight: '85vh' }}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-red-600" />
                Plagiarism Insights
              </h3>
              <button onClick={() => setSelectedMatches(null)} className="text-gray-500 hover:text-gray-700 font-bold text-xl">✕</button>
            </div>
            
            {/* AI Insight Summary Banner */}
            {selectedMatches && selectedMatches.length > 0 && (
              <div className="bg-indigo-50 border-b border-indigo-100 p-4">
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-1.5 rounded-lg mr-3 mt-0.5 text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 mb-1">AI Plagiarism Analysis</h4>
                    <p className="text-sm text-indigo-800 leading-relaxed">
                      {selectedMatches.length > 3 
                        ? "Multiple matching sources detected. The student appears to have copied passages from several different sources. We recommend a thorough review of the flagged sections, as this suggests systematic copying rather than accidental missing citations."
                        : "A few matching sources were detected. Review the highlighted passages below to determine if they are properly cited quotes or instances of academic misconduct. Consider returning the submission with feedback to paraphrase and cite appropriately."}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 overflow-y-auto flex-1">
              {selectedMatches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <p className="text-gray-600 font-medium text-lg">No matches found.</p>
                  <p className="text-gray-400 text-sm mt-1">This document appears to be entirely original.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedMatches.map((m, idx) => (
                    <div key={idx} className="border border-red-100 bg-red-50 p-4 rounded-xl shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-red-700 text-sm uppercase tracking-wider">Match #{idx + 1}</span>
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">{m.similarity_score}% Similar</span>
                      </div>
                      <div className="text-sm text-gray-700 space-y-3">
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Student's Text:</p>
                          <p className="bg-white p-3 border border-red-100 rounded-lg text-gray-700 italic">"{m.original_chunk}"</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Matched Source Document:</p>
                          <p className="bg-white p-3 border border-red-100 rounded-lg text-gray-700 italic">"{m.matched_source}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Document Preview Modal */}
      {mounted && (previewDoc !== null || previewLoading || previewError !== null) && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden" style={{ height: '85vh' }}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                Document Preview
              </h3>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-700 font-bold text-xl">✕</button>
            </div>
            <div className="flex-1 bg-gray-100 relative flex flex-col items-center justify-center" style={{ minHeight: '50vh' }}>
              {previewLoading && (
                <div className="flex flex-col items-center text-gray-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                  <p>Loading document securely...</p>
                </div>
              )}
              {previewError && (
                <div className="flex flex-col items-center text-red-500 text-center p-6 bg-white rounded-lg shadow-sm">
                  <FileText className="w-16 h-16 mb-4 text-red-400" />
                  <p className="font-medium mb-4">{previewError}</p>
                  {previewOriginalUrl && (
                    <a 
                      href={getMediaUrl(previewOriginalUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Download Document
                    </a>
                  )}
                </div>
              )}
              {previewDoc && (
                <iframe 
                  src={previewDoc} 
                  className="absolute inset-0 w-full h-full border-0"
                  style={{ width: '100%', height: '100%' }}
                  title="Document Preview"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
