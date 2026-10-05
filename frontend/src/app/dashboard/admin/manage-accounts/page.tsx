"use client";

import { useState, useEffect } from "react";
import { Users as UsersIcon, Edit, Key, Send, Trash2, Mail, Link as LinkIcon, Shield } from "lucide-react";
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

export default function ManageAccounts() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [manageSubTab, setManageSubTab] = useState<"students" | "guides" | "teams">("students");

  // Modal / Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editAction, setEditAction] = useState<"edit" | "password">("edit");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [editTeamGuide, setEditTeamGuide] = useState<number | "">("");
  const [editTeamStudents, setEditTeamStudents] = useState<number[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRes = await axios.get("http://localhost:8000/api/auth/users/");
      setUsers(usersRes.data);
      const teamsRes = await axios.get("http://localhost:8000/api/auth/teams/");
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

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account? This action cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:8000/api/auth/users/${id}/`);
      fetchData();
    } catch (err) {
      alert("Error deleting user.");
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!confirm("Are you sure you want to delete this team? Note: Students and Guides will NOT be deleted.")) return;
    try {
      await axios.delete(`http://localhost:8000/api/auth/teams/${id}/`);
      fetchData();
    } catch (err) {
      alert("Error deleting team.");
    }
  };

  const handleSendInvite = async (id: number) => {
    try {
      const res = await axios.post(`http://localhost:8000/api/auth/users/${id}/invite/`);
      alert(res.data.message);
    } catch (err) {
      alert("Error sending invite.");
    }
  };

  const openEditUser = (user: User, action: "edit" | "password") => {
    setEditingUser(user);
    setEditAction(action);
    setEditName(user.first_name || "");
    setEditEmail(user.email);
    setEditPassword("");
  };

  const handleEditUserSave = async () => {
    if (!editingUser) return;
    try {
      await axios.put(`http://localhost:8000/api/auth/users/${editingUser.id}/`, {
        name: editAction === "edit" ? editName : undefined,
        email: editAction === "edit" ? editEmail : undefined,
        password: editAction === "password" ? editPassword : undefined
      });
      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert("Error updating user.");
    }
  };

  const openEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamDesc(team.description || "");
    setEditTeamGuide(team.guide?.id || "");
    setEditTeamStudents(team.students.map(s => s.id));
  };

  const handleEditTeamSave = async () => {
    if (!editingTeam) return;
    try {
      await axios.put(`http://localhost:8000/api/auth/teams/${editingTeam.id}/`, {
        name: editTeamName,
        description: editTeamDesc,
        guide_id: editTeamGuide || null,
        student_ids: editTeamStudents
      });
      setEditingTeam(null);
      fetchData();
    } catch (err) {
      alert("Error updating team.");
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
        <h1 className="text-3xl font-bold text-gray-800">Manage Accounts</h1>
        <div className="bg-green-100 text-green-900 px-4 py-2 rounded-full font-semibold text-sm flex items-center">
          <UsersIcon className="w-4 h-4 mr-2" />
          Management Mode
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          {(["students", "guides", "teams"] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setManageSubTab(tab)}
              className={`pb-2 px-3 capitalize ${manageSubTab === tab ? "border-b-2 border-green-700 text-green-700 font-bold" : "text-gray-500 font-medium hover:text-gray-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {manageSubTab === "students" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Team</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading...</td></tr>
                ) : studentsList.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">No students found.</td></tr>
                ) : (
                  studentsList.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-semibold text-gray-900">{s.first_name || 'No Name'}</td>
                      <td className="py-4">{s.email}</td>
                      <td className="py-4">{getTeamForStudent(s.id)}</td>
                      <td className="py-4 text-right space-x-1">
                        <button onClick={() => openEditUser(s, 'edit')} title="Edit" className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg inline-flex"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openEditUser(s, 'password')} title="Change Password" className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg inline-flex"><Key className="w-4 h-4" /></button>
                        <button onClick={() => handleSendInvite(s.id)} title="Send Invite" className="text-green-600 hover:bg-green-50 p-2 rounded-lg inline-flex"><Send className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteUser(s.id)} title="Delete" className="text-red-600 hover:bg-red-50 p-2 rounded-lg inline-flex"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {manageSubTab === "guides" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Assigned Teams</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading...</td></tr>
                ) : guidesList.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">No guides found.</td></tr>
                ) : (
                  guidesList.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-semibold text-gray-900">{g.first_name || 'No Name'}</td>
                      <td className="py-4">{g.email}</td>
                      <td className="py-4">{getTeamsForGuide(g.id)}</td>
                      <td className="py-4 text-right space-x-1">
                        <button onClick={() => openEditUser(g, 'edit')} title="Edit" className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg inline-flex"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openEditUser(g, 'password')} title="Change Password" className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg inline-flex"><Key className="w-4 h-4" /></button>
                        <button onClick={() => handleSendInvite(g.id)} title="Send Invite" className="text-green-600 hover:bg-green-50 p-2 rounded-lg inline-flex"><Send className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteUser(g.id)} title="Delete" className="text-red-600 hover:bg-red-50 p-2 rounded-lg inline-flex"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {manageSubTab === "teams" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Team Name</th>
                  <th className="pb-3 font-medium">Guide</th>
                  <th className="pb-3 font-medium">Student Count</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading...</td></tr>
                ) : teams.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">No teams found.</td></tr>
                ) : (
                  teams.map(team => (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-semibold text-gray-900">{team.name}</td>
                      <td className="py-4">{team.guide ? team.guide.first_name || team.guide.email : 'None'}</td>
                      <td className="py-4">{team.students.length} students</td>
                      <td className="py-4 text-right space-x-1">
                        <button onClick={() => openEditTeam(team)} title="Manage Team" className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg inline-flex"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTeam(team.id)} title="Delete" className="text-red-600 hover:bg-red-50 p-2 rounded-lg inline-flex"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editAction === "edit" ? "Edit User" : "Change Password"}
            </h3>
            <div className="space-y-4">
              {editAction === "edit" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900" />
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-6">
                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleEditUserSave} className="px-4 py-2 bg-green-700 text-white hover:bg-green-800 rounded-lg transition-colors">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input type="text" value={editTeamName} onChange={e => setEditTeamName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editTeamDesc} onChange={e => setEditTeamDesc(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Guide</label>
                <select value={editTeamGuide} onChange={e => setEditTeamGuide(Number(e.target.value) || "")} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900">
                  <option value="">No Guide</option>
                  {guidesList.map(g => (
                    <option key={g.id} value={g.id}>{g.first_name || g.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manage Students</label>
                <select multiple value={editTeamStudents.map(String)} onChange={e => {
                  const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                  setEditTeamStudents(options);
                }} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none h-32 text-gray-900">
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name || s.email}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple students.</p>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button onClick={() => setEditingTeam(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleEditTeamSave} className="px-4 py-2 bg-green-700 text-white hover:bg-green-800 rounded-lg transition-colors">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
