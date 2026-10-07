"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { ListTodo, Plus, Trash2, Clock, Edit } from "lucide-react";

interface Team { id: number; name: string; }
interface TaskAssignment { id: number; team: number; team_name: string; }
interface Task {
  id: number; title: string; description: string; instructions: string;
  deadline: string; assignment_type: string; created_at: string;
  assignments: TaskAssignment[];
}

export default function GuideTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignType, setAssignType] = useState<"specific" | "global">("specific");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [formMsg, setFormMsg] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);

  const getHeaders = () => ({
    headers: { Authorization: `Token ${localStorage.getItem("token")}` }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, teamsRes] = await Promise.all([
        axios.get("http://localhost:8000/api/guide/tasks/", getHeaders()),
        axios.get("http://localhost:8000/api/guide/teams/", getHeaders()),
      ]);
      setTasks(tasksRes.data);
      setTeams(teamsRes.data);
    } catch { setFormMsg({ type: "error", text: "Failed to load data." }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (t: Task) => {
    setEditId(t.id);
    setTitle(t.title);
    setDescription(t.description);
    setInstructions(t.instructions);
    
    // Format datetime string for input type="datetime-local" (YYYY-MM-DDThh:mm)
    const d = new Date(t.deadline);
    const ds = d.toISOString().slice(0, 16);
    setDeadline(ds);
    
    setAssignType(t.assignment_type as any);
    setSelectedTeams(t.assignments.map(a => a.team));
    setShowForm(true);
    setFormMsg({ type: "", text: "" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg({ type: "", text: "" });
    setSubmitting(true);
    try {
      const payload = {
        title, description, instructions, deadline,
        assignment_type: assignType,
        team_ids: assignType === "specific" ? selectedTeams : [],
      };
      
      if (editId) {
        await axios.put(`http://localhost:8000/api/guide/tasks/${editId}/`, payload, getHeaders());
        setFormMsg({ type: "success", text: "Task updated successfully!" });
      } else {
        await axios.post("http://localhost:8000/api/guide/tasks/", payload, getHeaders());
        setFormMsg({ type: "success", text: "Task created successfully!" });
      }
      
      setTitle(""); setDescription(""); setInstructions(""); setDeadline("");
      setSelectedTeams([]);
      setEditId(null);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.response?.data?.error || "Failed to save task." });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/guide/tasks/${id}/`, getHeaders());
      fetchData();
    } catch { alert("Failed to delete task."); }
  };

  const getStatus = (deadline: string) => {
    const d = new Date(deadline);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff < 0) return { label: "Overdue", cls: "bg-red-100 text-red-800" };
    if (diff < 2 * 24 * 60 * 60 * 1000) return { label: "Due Soon", cls: "bg-orange-100 text-orange-800" };
    return { label: "Active", cls: "bg-green-100 text-green-800" };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
        <button onClick={() => { setShowForm(!showForm); setFormMsg({ type: "", text: "" }); setEditId(null); setTitle(""); setDescription(""); setInstructions(""); setDeadline(""); setSelectedTeams([]); }}
          className="flex items-center bg-green-900 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md">
          <Plus className="w-4 h-4 mr-2" /> {showForm ? "Cancel" : "Create Task"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{editId ? "Edit Task" : "Create New Task"}</h2>
          {formMsg.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${formMsg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
              {formMsg.text}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700"
                placeholder="e.g., Literature Review" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700 h-24"
                placeholder="Task description..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700 h-24"
                placeholder="Detailed instructions..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <input required type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
              <select value={assignType} onChange={e => setAssignType(e.target.value as any)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700">
                <option value="specific">Specific Teams</option>
                <option value="global">Global (All My Teams)</option>
              </select>
            </div>
            {assignType === "specific" && (
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Teams</label>
                <select multiple value={selectedTeams.map(String)}
                  onChange={e => setSelectedTeams(Array.from(e.target.selectedOptions, o => Number(o.value)))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 h-28">
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
              </div>
            )}
            <div className="lg:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={submitting}
                className="px-6 py-2 bg-green-900 hover:bg-green-800 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
                {submitting ? "Saving..." : (editId ? "Save Changes" : "Create Task")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <ListTodo className="w-5 h-5 mr-2 text-green-700" /> All Tasks
        </h2>
        {loading ? <p className="text-gray-400">Loading...</p> : tasks.length === 0 ? (
          <p className="text-gray-400 italic">No tasks created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Assigned To</th>
                  <th className="pb-3 font-medium">Deadline</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {tasks.map(t => {
                  const st = getStatus(t.deadline);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="py-4 font-semibold text-gray-900">{t.title}</td>
                      <td className="py-4">
                        {t.assignment_type === 'global'
                          ? <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">All Teams</span>
                          : t.assignments.map(a => <span key={a.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full mr-1">{a.team_name}</span>)
                        }
                      </td>
                      <td className="py-4">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(t.deadline).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => handleEdit(t)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg inline-flex mr-1">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg inline-flex">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
