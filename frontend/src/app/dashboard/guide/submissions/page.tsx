"use client";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FileText, Download, ShieldCheck, AlertTriangle, Loader } from "lucide-react";

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
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const getHeaders = () => ({
    headers: { Authorization: `Token ${localStorage.getItem("token")}` }
  });

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await axios.get(`${API_BASE_URL}/api/task-submissions/`, getHeaders());
      setSubmissions(r.data);
    } catch {
      if (!silent) setMsg({ type: "error", text: "Failed to load submissions." });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Automatically poll every 2 seconds whenever any submission is processing
  useEffect(() => {
    const hasProcessing = submissions.some(s => s.plagiarism_status === "processing") || runningPlagiarism !== null;

    if (hasProcessing) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchData(true);
        }, 2000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [submissions, runningPlagiarism]);

  const runPlagiarism = async (id: number) => {
    setRunningPlagiarism(id);
    setMsg({ type: "", text: "" });

    // Instantly update UI to "Processing..." without needing a refresh
    setSubmissions(prev =>
      prev.map(s => (s.id === id ? { ...s, plagiarism_status: "processing" } : s))
    );

    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/task-submissions/${id}/`,
        { action: "plagiarism" },
        getHeaders()
      );

      const returnedScore = res.data.plagiarism_score;
      const returnedStatus = res.data.plagiarism_status || "completed";
      const isPlagiarized = (returnedScore ?? 0) > 25;

      // Automatically update the row immediately with the new status and score
      setSubmissions(prev =>
        prev.map(s =>
          s.id === id
            ? {
                ...s,
                plagiarism_status: returnedStatus,
                plagiarism_score: returnedScore,
                plagiarism_matches: res.data.plagiarism_matches || []
              }
            : s
        )
      );

      setMsg({
        type: isPlagiarized ? "error" : "success",
        text: `Analysis complete: ${
          isPlagiarized ? "Plagiarized" : "Non-Plagiarized"
        } (${(returnedScore ?? 0).toFixed(1)}% similarity)`
      });
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.response?.data?.error || "Plagiarism analysis failed."
      });
      setSubmissions(prev =>
        prev.map(s => (s.id === id ? { ...s, plagiarism_status: "failed" } : s))
      );
    } finally {
      setRunningPlagiarism(null);
      // Fetch fresh data from backend
      fetchData(true);
    }
  };

  const getPlagiarismBadge = (sub: TaskSubmission) => {
    if (sub.plagiarism_status === "not_checked") {
      return (
        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium inline-flex items-center">
          Not Checked
        </span>
      );
    }

    if (sub.plagiarism_status === "processing") {
      return (
        <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full inline-flex items-center font-medium animate-pulse shadow-sm">
          <Loader className="w-3 h-3 mr-1.5 animate-spin text-amber-700" />
          Processing...
        </span>
      );
    }

    if (sub.plagiarism_status === "failed") {
      return (
        <span className="text-xs bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 rounded-full font-medium inline-flex items-center">
          Failed
        </span>
      );
    }

    const score = sub.plagiarism_score ?? 0;
    const isPlagiarized = score > 25;

    if (isPlagiarized) {
      return (
        <span
          className="text-xs bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-full inline-flex items-center font-semibold shadow-sm"
          title={`High similarity detected: ${score.toFixed(1)}%`}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600 flex-shrink-0" />
          Plagiarized ({score.toFixed(1)}%)
        </span>
      );
    }

    return (
      <span
        className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center font-semibold shadow-sm"
        title={`Original content: ${score.toFixed(1)}% similarity`}
      >
        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600 flex-shrink-0" />
        Non-Plagiarized ({score.toFixed(1)}%)
      </span>
    );
  };

  const getGradeColor = (grade: string) => {
    if (grade === "A") return "bg-green-100 text-green-800";
    if (grade === "B") return "bg-blue-100 text-blue-800";
    if (grade === "C") return "bg-yellow-100 text-yellow-800";
    if (grade === "D") return "bg-orange-100 text-orange-800";
    if (grade === "F") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Submissions</h1>

      {msg.text && (
        <div
          className={`p-4 rounded-lg text-sm border flex items-center justify-between transition-all ${
            msg.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          <span>{msg.text}</span>
          <button
            onClick={() => setMsg({ type: "", text: "" })}
            className="text-xs text-gray-500 hover:text-gray-700 ml-4 font-bold"
          >
            ✕
          </button>
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
                <th className="pb-3 font-medium">Plagiarism Status</th>
                <th className="pb-3 font-medium text-center">Score</th>
                <th className="pb-3 font-medium text-center">Grade</th>
                <th className="pb-3 font-medium">Feedback</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading submissions...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No submissions available.
                  </td>
                </tr>
              ) : (
                submissions.map(s => {
                  const isProcessing =
                    s.plagiarism_status === "processing" || runningPlagiarism === s.id;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <p className="font-semibold text-gray-900">
                          {s.student_name || "Student"}
                        </p>
                        <p className="text-xs text-gray-400">{s.student_email}</p>
                      </td>
                      <td className="py-4 text-gray-600">{s.task_title}</td>
                      <td className="py-4 text-gray-500">
                        {new Date(s.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">{getPlagiarismBadge(s)}</td>
                      <td className="py-4 text-center font-bold text-gray-800">
                        {s.score !== null ? (
                          `${s.score}/100`
                        ) : (
                          <span className="text-gray-400 font-normal">Pending</span>
                        )}
                      </td>
                      <td className="py-4 text-center">
                        {s.grade ? (
                          <span
                            className={`px-2 py-1 rounded font-bold text-xs ${getGradeColor(
                              s.grade
                            )}`}
                          >
                            {s.grade}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 text-gray-600 max-w-xs text-xs italic">
                        {s.feedback || "—"}
                      </td>
                      <td className="py-4 text-right space-x-1">
                        <a
                          href={getMediaUrl(s.file)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                          title="View/Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => runPlagiarism(s.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center text-purple-600 hover:bg-purple-50 p-2 rounded-lg disabled:opacity-40 transition-colors"
                          title="Run Plagiarism Check"
                        >
                          {isProcessing ? (
                            <Loader className="w-4 h-4 animate-spin text-purple-600" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
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
