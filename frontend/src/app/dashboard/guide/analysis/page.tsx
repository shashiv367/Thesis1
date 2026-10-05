"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart3, Users, TrendingUp } from "lucide-react";

interface Team { id: number; name: string; }
interface AnalysisData {
  team: any;
  student_performance: any[];
  task_performance: any[];
}

export default function GuideAnalysis() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | "">("");
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const getHeaders = () => ({
    headers: { Authorization: `Token ${localStorage.getItem("token")}` }
  });

  useEffect(() => {
    axios.get("http://localhost:8000/api/guide/teams/", getHeaders())
      .then(r => setTeams(r.data))
      .finally(() => setTeamsLoading(false));
  }, []);

  const loadAnalysis = async (teamId: number) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await axios.get(`http://localhost:8000/api/guide/teams/${teamId}/analysis/`, getHeaders());
      setAnalysis(res.data);
    } catch { }
    finally { setLoading(false); }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedTeam(id);
    if (id) loadAnalysis(id);
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B') return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Team Analysis</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
        <select value={selectedTeam} onChange={handleTeamChange} disabled={teamsLoading}
          className="w-full md:w-80 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700">
          <option value="">-- Choose a team --</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {!selectedTeam && (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Select a team to view analysis.</p>
        </div>
      )}

      {loading && <div className="text-gray-500 p-8">Loading analysis...</div>}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Team Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Students", value: analysis.team.students },
              { label: "Total Tasks", value: analysis.team.total_tasks },
              { label: "Avg Score", value: analysis.team.avg_score ?? 'N/A' },
              { label: "Highest Score", value: analysis.team.highest_score ?? 'N/A' },
              { label: "Lowest Score", value: analysis.team.lowest_score ?? 'N/A' },
              { label: "Submissions", value: analysis.team.submission_rate },
            ].map(s => (
              <div key={s.label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Student Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-700" /> Student Performance
            </h2>
            {analysis.student_performance.length === 0 ? (
              <p className="text-gray-400 italic">Not enough data for analysis.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium text-center">Tasks</th>
                      <th className="pb-3 font-medium text-center">Submitted</th>
                      <th className="pb-3 font-medium text-center">Pending</th>
                      <th className="pb-3 font-medium text-center">Avg Score</th>
                      <th className="pb-3 font-medium text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {analysis.student_performance.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-4">
                          <p className="font-semibold text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </td>
                        <td className="py-4 text-center">{s.tasks}</td>
                        <td className="py-4 text-center text-blue-700 font-medium">{s.submitted}</td>
                        <td className="py-4 text-center text-orange-700 font-medium">{s.pending}</td>
                        <td className="py-4 text-center font-bold text-gray-800">{s.avg_score ?? '—'}</td>
                        <td className="py-4 text-center">
                          {s.grade ? (
                            <span className={`px-2 py-1 rounded font-bold text-xs ${getGradeColor(s.grade)}`}>{s.grade}</span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Task Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-700" /> Task Performance
            </h2>
            {analysis.task_performance.length === 0 ? (
              <p className="text-gray-400 italic">No tasks assigned to this team yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="pb-3 font-medium">Task</th>
                      <th className="pb-3 font-medium">Deadline</th>
                      <th className="pb-3 font-medium text-center">Submissions</th>
                      <th className="pb-3 font-medium text-center">Avg Score</th>
                      <th className="pb-3 font-medium text-center">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {analysis.task_performance.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-4 font-semibold text-gray-900">{t.title}</td>
                        <td className="py-4 text-gray-500">{new Date(t.deadline).toLocaleDateString()}</td>
                        <td className="py-4 text-center">{t.submissions}</td>
                        <td className="py-4 text-center font-bold text-gray-800">{t.avg_score ?? '—'}</td>
                        <td className="py-4 text-center">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{t.completion}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
