"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Download, ShieldCheck, AlertTriangle, Loader, Eye } from "lucide-react";

interface TaskSubmission {
  id: number;
  task: number;
  task_title: string;
  student: number;
  student_name: string;
  student_email: string;
  file: string;
  submitted_at: string;
  status: string;
  plagiarism_score: number | null;
  plagiarism_status: string;
  score: number | null;
  grade: string;
  feedback: string;
}

export default function GuideSubmissions() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningPlagiarism, setRunningPlagiarism] = useState<number | null>(null);
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

  const runPlagiarism = async (id: number) => {
    setRunningPlagiarism(id);
    setMsg({ type: "", text: "" });
    try {
      const res = await axios.patch(`http://localhost:8000/api/task-submissions/${id}/`,
        { action: 'plagiarism' }, getHeaders());
      setMsg({ type: "success", text: `Analysis complete. Similarity: ${res.data.plagiarism_score?.toFixed(1)}%` });
      fetchData();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.error || "Plagiarism analysis failed. Ensure PyPDF2/python-docx are installed." });
    } finally { setRunningPlagiarism(null); }
  };

  const getPlagiarismBadge = (sub: TaskSubmission) => {
    if (sub.plagiarism_status === 'not_checked') return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Not Checked</span>;
    if (sub.plagiarism_status === 'processing') return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center"><Loader className="w-3 h-3 mr-1 animate-spin" />Processing</span>;
    if (sub.plagiarism_status === 'failed') return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Failed</span>;
    const score = sub.plagiarism_score || 0;
    if (score > 30) return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />{score.toFixed(1)}%</span>;
    return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center"><ShieldCheck className="w-3 h-3 mr-1" />{score.toFixed(1)}%</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Submissions</h1>

      {msg.text && (
        <div className={`p-4 rounded-lg text-sm border ${msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Task</th>
                <th className="pb-3 font-medium">Submitted</th>
                <th className="pb-3 font-medium">Plagiarism</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading submissions...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No submissions available.</td></tr>
              ) : (
                submissions.map(s => {
                  const filename = s.file?.split('/').pop() || 'Document';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <p className="font-semibold text-gray-900">{s.student_name || 'Student'}</p>
                        <p className="text-xs text-gray-400">{s.student_email}</p>
                      </td>
                      <td className="py-4 text-gray-600">{s.task_title}</td>
                      <td className="py-4 text-gray-500">{new Date(s.submitted_at).toLocaleDateString()}</td>
                      <td className="py-4">{getPlagiarismBadge(s)}</td>
                      <td className="py-4 font-bold text-gray-800">
                        {s.score !== null ? `${s.score}/100` : <span className="text-gray-400 font-normal">Pending</span>}
                      </td>
                      <td className="py-4 text-right space-x-1">
                        <a href={`http://localhost:8000${s.file}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="View/Download">
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => runPlagiarism(s.id)}
                          disabled={runningPlagiarism === s.id || s.plagiarism_status === 'processing'}
                          className="inline-flex items-center text-purple-600 hover:bg-purple-50 p-2 rounded-lg disabled:opacity-40" title="Run Plagiarism Check">
                          {runningPlagiarism === s.id ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
