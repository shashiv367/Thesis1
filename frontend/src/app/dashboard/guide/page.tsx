"use client";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";
import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart3, Users, ListTodo, FileText, CheckSquare, Clock, TrendingUp } from "lucide-react";

interface OverviewData {
  teams: number;
  students: number;
  active_tasks: number;
  pending_submissions: number;
  evaluated_submissions: number;
  avg_score: number | null;
  recent_tasks: any[];
  recent_submissions: any[];
}

export default function GuideOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Token ${token}` } };
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/guide/overview/`, getHeaders())
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load overview data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading overview...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return null;

  const stats = [
    { label: "Assigned Teams", value: data.teams, icon: Users, color: "text-blue-700", bg: "bg-blue-50" },
    { label: "Total Students", value: data.students, icon: BarChart3, color: "text-green-700", bg: "bg-green-50" },
    { label: "Active Tasks", value: data.active_tasks, icon: ListTodo, color: "text-orange-700", bg: "bg-orange-50" },
    { label: "Pending Reviews", value: data.pending_submissions, icon: FileText, color: "text-purple-700", bg: "bg-purple-50" },
    { label: "Evaluated", value: data.evaluated_submissions, icon: CheckSquare, color: "text-teal-700", bg: "bg-teal-50" },
    { label: "Avg Score", value: data.avg_score !== null ? `${data.avg_score}` : "N/A", icon: TrendingUp, color: "text-indigo-700", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Guide Overview</h1>
        <div className="bg-green-100 text-green-900 px-4 py-2 rounded-full text-sm font-semibold">Guide Portal</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className={`${s.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <ListTodo className="w-5 h-5 mr-2 text-gray-400" /> Recent Tasks
          </h2>
          {data.recent_tasks.length === 0 ? (
            <p className="text-gray-400 italic text-sm">No tasks created yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recent_tasks.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">Due: {new Date(t.deadline).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${new Date(t.deadline) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {new Date(t.deadline) < new Date() ? 'Overdue' : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-400" /> Recent Submissions
          </h2>
          {data.recent_submissions.length === 0 ? (
            <p className="text-gray-400 italic text-sm">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recent_submissions.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{s.student_name || s.student_email || 'Student'}</p>
                    <p className="text-xs text-gray-500">{s.task_title} · {new Date(s.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === 'evaluated' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
