"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { CheckSquare, Save } from "lucide-react";

interface TaskSubmission {
  id: number; task: number; task_title: string;
  student: number; student_name: string; student_email: string;
  submitted_at: string; status: string;
  score: number | null; grade: string; feedback: string;
  evaluated_at: string | null;
}

export default function GuideEvaluation() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ [id: number]: { score: string; feedback: string } }>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const getHeaders = () => ({
    headers: { Authorization: `Token ${localStorage.getItem("token")}` }
  });

  const fetchData = () => {
    setLoading(true);
    axios.get("http://localhost:8000/api/task-submissions/", getHeaders())
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

  const handleSave = async (id: number) => {
    const e = editing[id];
    if (!e) return;
    setSaving(id);
    setMsg({ type: "", text: "" });
    try {
      await axios.patch(`http://localhost:8000/api/task-submissions/${id}/`, {
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
                    </div>
                    {!e && (
                      <button onClick={() => handleEditInit(s)}
                        className="text-sm bg-green-900 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        Evaluate
                      </button>
                    )}
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">Feedback</label>
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
                  <th className="pb-3 font-medium text-center">Grade</th>
                  <th className="pb-3 font-medium">Feedback</th>
                  <th className="pb-3 font-medium">Evaluated</th>
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
                      <span className={`px-2 py-1 rounded font-bold text-sm ${getGradeColor(s.grade)}`}>{s.grade}</span>
                    </td>
                    <td className="py-4 text-gray-600 max-w-xs text-xs italic">{s.feedback || '—'}</td>
                    <td className="py-4 text-gray-500">{s.evaluated_at ? new Date(s.evaluated_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
