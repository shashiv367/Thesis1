"use client";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { UserPlus, Shield, Trash2, Mail, Users as UsersIcon, Link as LinkIcon, Briefcase } from "lucide-react";
import axios from "axios";

interface User {
  id: number;
  username: string;
  first_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface Team {
  id: number;
  name: string;
  description: string;
  guide: User | null;
  students: User[];
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"students" | "guides" | "teams">("students");

  // Form State - Student
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentError, setStudentError] = useState("");
  const [studentSuccess, setStudentSuccess] = useState("");

  // Form State - Guide
  const [guideName, setGuideName] = useState("");
  const [guideEmail, setGuideEmail] = useState("");
  const [guidePassword, setGuidePassword] = useState("");
  const [guideError, setGuideError] = useState("");
  const [guideSuccess, setGuideSuccess] = useState("");

  // Form State - Team
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedGuideId, setSelectedGuideId] = useState<number | "">("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [teamError, setTeamError] = useState("");
  const [teamSuccess, setTeamSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRes = await axios.get(`${API_BASE_URL}/api/auth/users/`);
      setUsers(usersRes.data);
      const teamsRes = await axios.get(`${API_BASE_URL}/api/auth/teams/`);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError("");
    setStudentSuccess("");
    if (!validateEmail(studentEmail)) {
      setStudentError("Invalid email format.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/auth/users/`, {
        name: studentName,
        email: studentEmail,
        password: studentPassword,
        role: "student"
      });
      setStudentSuccess("Student created successfully!");
      setStudentName("");
      setStudentEmail("");
      setStudentPassword("");
      fetchData();
    } catch (err: any) {
      setStudentError(err.response?.data?.error || "Error creating student.");
    }
  };

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuideError("");
    setGuideSuccess("");
    if (!validateEmail(guideEmail)) {
      setGuideError("Invalid email format.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/auth/users/`, {
        name: guideName,
        email: guideEmail,
        password: guidePassword,
        role: "guide"
      });
      setGuideSuccess("Guide created successfully!");
      setGuideName("");
      setGuideEmail("");
      setGuidePassword("");
      fetchData();
    } catch (err: any) {
      setGuideError(err.response?.data?.error || "Error creating guide.");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError("");
    setTeamSuccess("");
    try {
      await axios.post(`${API_BASE_URL}/api/auth/teams/`, {
        name: teamName,
        description: teamDescription,
        guide_id: selectedGuideId || null,
        student_ids: selectedStudentIds
      });
      setTeamSuccess("Team created successfully!");
      setTeamName("");
      setTeamDescription("");
      setSelectedGuideId("");
      setSelectedStudentIds([]);
      fetchData();
    } catch (err: any) {
      setTeamError(err.response?.data?.error || "Error creating team.");
    }
  };

  const studentsList = users.filter(u => u.role === "student");
  const guidesList = users.filter(u => u.role === "guide");

  const getTeamForStudent = (studentId: number) => {
    return teams.find(t => t.students.some(s => s.id === studentId))?.name || "None";
  };
  
  const getTeamsForGuide = (guideId: number) => {
    const guideTeams = teams.filter(t => t.guide?.id === guideId);
    return guideTeams.length > 0 ? guideTeams.map(t => t.name).join(", ") : "None";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin Portal</h1>
        <div className="bg-green-100 text-green-900 px-4 py-2 rounded-full font-semibold text-sm flex items-center">
          <Shield className="w-4 h-4 mr-2" />
          System Administrator
        </div>
      </div>

      <div className="flex space-x-4 border-b border-gray-200">
        {(["students", "guides", "teams"] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-3 capitalize ${activeTab === tab ? "border-b-2 border-green-700 text-green-700 font-bold" : "text-gray-500 font-medium hover:text-gray-700"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* STUDENTS TAB */}
      {activeTab === "students" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-green-700" />
              Create Student
            </h2>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              {studentError && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-200">{studentError}</div>}
              {studentSuccess && <div className="text-green-700 bg-green-50 p-3 rounded-lg text-sm border border-green-200">{studentSuccess}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900" placeholder="Student Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" required value={studentEmail} onChange={e => setStudentEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900" placeholder="student@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input type="password" required value={studentPassword} onChange={e => setStudentPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900" placeholder="Enter temporary password" />
              </div>
              <button type="submit" className="w-full mt-4 bg-green-900 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md">
                Create Student
              </button>
            </form>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2 text-green-700" />
              Existing Students
            </h2>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Team</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                  {studentsList.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400">No students created yet.</td></tr>
                  ) : (
                    studentsList.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">{s.first_name || 'No Name'}</td>
                        <td className="py-4 text-gray-500">{s.email}</td>
                        <td className="py-4">{getTeamForStudent(s.id)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GUIDES TAB */}
      {activeTab === "guides" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-green-700" />
              Create Guide
            </h2>
            <form onSubmit={handleCreateGuide} className="space-y-4">
              {guideError && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-200">{guideError}</div>}
              {guideSuccess && <div className="text-green-700 bg-green-50 p-3 rounded-lg text-sm border border-green-200">{guideSuccess}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required value={guideName} onChange={e => setGuideName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900" placeholder="Guide Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" required value={guideEmail} onChange={e => setGuideEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900" placeholder="guide@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input type="password" required value={guidePassword} onChange={e => setGuidePassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900" placeholder="Enter temporary password" />
              </div>
              <button type="submit" className="w-full mt-4 bg-green-900 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md">
                Create Guide
              </button>
            </form>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-green-700" />
              Existing Guides
            </h2>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Assigned Teams</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                  {guidesList.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400">No guides created yet.</td></tr>
                  ) : (
                    guidesList.map(g => (
                      <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">{g.first_name || 'No Name'}</td>
                        <td className="py-4 text-gray-500">{g.email}</td>
                        <td className="py-4">{getTeamsForGuide(g.id)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TEAMS TAB */}
      {activeTab === "teams" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2 text-green-700" />
              Create Team
            </h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              {teamError && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-200">{teamError}</div>}
              {teamSuccess && <div className="text-green-700 bg-green-50 p-3 rounded-lg text-sm border border-green-200">{teamSuccess}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input type="text" required value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900" placeholder="e.g., Team Alpha" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea value={teamDescription} onChange={e => setTeamDescription(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900" placeholder="Project details..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Guide</label>
                <select value={selectedGuideId} onChange={e => setSelectedGuideId(Number(e.target.value) || "")} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900">
                  <option value="">No Guide</option>
                  {guidesList.map(g => (
                    <option key={g.id} value={g.id}>{g.first_name || g.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Students</label>
                <select multiple value={selectedStudentIds.map(String)} onChange={e => {
                  const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                  setSelectedStudentIds(options);
                }} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none h-32 text-gray-900">
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name || s.email}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple students.</p>
              </div>
              <button type="submit" className="w-full mt-4 bg-green-900 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md">
                Create Team
              </button>
            </form>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2 text-green-700" />
              Existing Teams
            </h2>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 font-medium">Team Name</th>
                    <th className="pb-3 font-medium">Guide</th>
                    <th className="pb-3 font-medium">Students</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                  {teams.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400">No teams created yet.</td></tr>
                  ) : (
                    teams.map(team => (
                      <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">{team.name}</td>
                        <td className="py-4">
                          {team.guide ? team.guide.first_name || team.guide.email : <span className="text-gray-400 italic">None</span>}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col space-y-1">
                            {team.students.length > 0 ? (
                              team.students.map(s => (
                                <span key={s.id} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block w-fit">
                                  {s.first_name || s.email}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 italic">No students</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
