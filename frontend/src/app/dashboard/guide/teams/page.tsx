"use client";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";
import { useState, useEffect } from "react";
import axios from "axios";
import { Users, ChevronRight, ChevronDown } from "lucide-react";

interface Student { id: number; name: string; email: string; }
interface Team {
  id: number; name: string; description: string;
  student_count: number; task_count: number;
  pending_submissions: number; avg_score: number | null;
  students: Student[];
}

export default function GuideTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const getHeaders = () => ({
    headers: { Authorization: `Token ${localStorage.getItem("token")}` }
  });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/guide/teams/`, getHeaders())
      .then(r => setTeams(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading teams...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">My Teams</h1>
        <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">{teams.length} team{teams.length !== 1 ? 's' : ''} assigned</div>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No teams assigned yet.</p>
          <p className="text-sm mt-2">Contact the Admin to be assigned to teams.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setExpanded(expanded === team.id ? null : team.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-center hidden md:block">
                    <p className="text-xl font-bold text-gray-800">{team.student_count}</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-xl font-bold text-gray-800">{team.task_count}</p>
                    <p className="text-xs text-gray-500">Tasks</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-xl font-bold text-gray-800">{team.pending_submissions}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-xl font-bold text-gray-800">{team.avg_score ?? '—'}</p>
                    <p className="text-xs text-gray-500">Avg Score</p>
                  </div>
                  {expanded === team.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
              </button>

              {expanded === team.id && (
                <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Team Members</h4>
                  {team.students.length === 0 ? (
                    <p className="text-gray-400 italic text-sm">No students in this team.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-500 text-xs">
                            <th className="pb-2 font-medium">Name</th>
                            <th className="pb-2 font-medium">Email</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
                          {team.students.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="py-3 font-semibold text-gray-900">{s.name || 'No Name'}</td>
                              <td className="py-3 text-gray-500">{s.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
