"use client";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";

import { useState, useEffect, useRef } from "react";
import { Upload, CheckCircle, Clock, FileText, Settings as SettingsIcon, User, Key, BarChart3, ListTodo, GraduationCap, Download, Eye, File, X, Send } from "lucide-react";
import axios from "axios";

interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  email: string;
  role: string;
  created_at?: string;
}

interface Task {
  id: number;
  title: string;
  deadline: string;
}

interface TaskSubmission {
  id: number;
  task: number;
  task_title?: string;
  file: string;
  submitted_at: string;
  plagiarism_score: number | null;
  plagiarism_status?: string;
  feedback: string;
  student: number;
  student_name?: string;
  student_email?: string;
  score: number | null;
  grade: string;
  status: string;
  evaluated_at?: string | null;
  evaluated_by_name?: string;
}

interface StudentPortalProps {
  initialTab?: "overview" | "upload" | "tasks" | "submissions" | "grades" | "settings";
}

export default function StudentPortal({ initialTab = "overview" }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "tasks" | "submissions" | "grades" | "settings">(initialTab);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Settings Form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTask, setUploadTask] = useState<number | "">("");
  const [uploadMsg, setUploadMsg] = useState({ type: "", text: "" });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return { headers: { Authorization: `Token ${token}` } };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, taskRes, subRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/auth/users/me/`, getHeaders()),
        axios.get(`${API_BASE_URL}/api/student/tasks/`, getHeaders()),
        axios.get(`${API_BASE_URL}/api/task-submissions/`, getHeaders())
      ]);
      setProfile(profileRes.data);
      setTasks(taskRes.data);
      setSubmissions(subRes.data);
    } catch (err) {
      console.error("Error fetching student data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword === oldPassword) {
      setPwdMsg({ type: "error", text: "New password must be different from current password." });
      return;
    }
    try {
      await axios.put(`${API_BASE_URL}/api/auth/users/me/`, {
        old_password: oldPassword,
        new_password: newPassword
      }, getHeaders());
      setPwdMsg({ type: "success", text: "Password changed successfully." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdMsg({ type: "error", text: err.response?.data?.error || "Failed to change password." });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadMsg({ type: "", text: "" });
    if (!uploadFile) {
      setUploadMsg({ type: "error", text: "Please select a file." });
      return;
    }
    if (!uploadTask) {
      setUploadMsg({ type: "error", text: "Please select a task to submit against." });
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("task", uploadTask.toString());

    try {
      await axios.post(`${API_BASE_URL}/api/task-submissions/`, formData, {
        headers: {
          ...getHeaders().headers,
          "Content-Type": "multipart/form-data"
        }
      });
      setUploadMsg({ type: "success", text: "File uploaded and task submitted successfully!" });
      setUploadFile(null);
      setUploadTask("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData(); // Refresh submissions
    } catch (err: any) {
      setUploadMsg({ type: "error", text: err.response?.data?.error || "Upload failed." });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaskStatus = (taskId: number) => {
    const isSubmitted = submissions.some(s => s.task === taskId);
    if (isSubmitted) return "Submitted";
    const task = tasks.find(m => m.id === taskId);
    if (task && new Date(task.deadline) < new Date()) return "Late";
    return "Pending";
  };

  const getTaskScore = (taskId: number) => {
    const subs = submissions.filter(s => s.task === taskId);
    if (subs.length === 0) return "—";
    const sub = subs[subs.length - 1]; // latest
    if (sub.score !== null && sub.score !== undefined) {
      return `${sub.score}/100`;
    }
    return sub.status === 'evaluated' ? "Evaluated" : "Pending";
  };
  
  const getTaskGrade = (taskId: number) => {
    const subs = submissions.filter(s => s.task === taskId);
    if (subs.length === 0) return "—";
    const sub = subs[subs.length - 1];
    if (sub.grade) return sub.grade;
    if (sub.score !== null && sub.score !== undefined) {
      const score = sub.score;
      if (score >= 90) return "A";
      if (score >= 80) return "B";
      if (score >= 70) return "C";
      if (score >= 60) return "D";
      return "F";
    }
    return "—";
  };

  const getGradeBadgeClass = (grade: string) => {
    if (grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B') return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    if (grade === 'F') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-500';
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center p-12 text-gray-500">Loading your dashboard...</div>;
  }

  const submittedTasksCount = new Set(submissions.map(s => s.task)).size;
  const evaluatedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
  const avgScore = evaluatedSubmissions.length > 0 
    ? (evaluatedSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / evaluatedSubmissions.length).toFixed(1)
    : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Student Portal</h1>
        <div className="bg-green-100 text-green-900 px-4 py-2 rounded-full font-semibold text-sm flex items-center">
          <GraduationCap className="w-4 h-4 mr-2" />
          {profile?.first_name || profile?.email || 'Student'}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-gray-500 font-medium text-sm">Total Tasks</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{tasks.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-orange-500 font-medium text-sm">Pending Tasks</p>
              <h3 className="text-3xl font-bold text-orange-700 mt-2">{Math.max(0, tasks.length - submittedTasksCount)}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-blue-500 font-medium text-sm">Submitted Tasks</p>
              <h3 className="text-3xl font-bold text-blue-700 mt-2">{submittedTasksCount}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-green-500 font-medium text-sm">Average Score</p>
              <h3 className="text-3xl font-bold text-green-700 mt-2">{avgScore !== "N/A" ? `${avgScore}/100` : "N/A"}</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-400" /> Recent Tasks</h2>
              {tasks.length === 0 ? (
                <p className="text-gray-400 italic">No tasks assigned yet.</p>
              ) : (
                <div className="space-y-4">
                  {tasks.slice(0, 5).map(m => (
                    <div key={m.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-800">{m.title}</p>
                        <p className="text-xs text-gray-500">Due: {formatDate(m.deadline)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTaskStatus(m.id) === 'Submitted' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                        {getTaskStatus(m.id)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-gray-400" /> Recent Submissions</h2>
              {submissions.length === 0 ? (
                <p className="text-gray-400 italic">No submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.slice().reverse().slice(0, 5).map(s => {
                    const m = tasks.find(ms => ms.id === s.task);
                    const isEvaluated = s.status === 'evaluated' || s.score !== null;
                    return (
                      <div key={s.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-semibold text-gray-800">{m?.title || s.task_title || 'Task'}</p>
                          <p className="text-xs text-gray-500">Submitted: {formatDate(s.submitted_at)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isEvaluated && s.score !== null && (
                            <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                              {s.score}/100
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isEvaluated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {isEvaluated ? 'Evaluated' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><Upload className="w-5 h-5 mr-2 text-green-700" /> Upload Submission</h2>
            
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {uploadMsg.text && (
                <div className={`p-4 rounded-lg text-sm font-medium border ${uploadMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {uploadMsg.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Task</label>
                <select 
                  value={uploadTask} 
                  onChange={e => setUploadTask(Number(e.target.value) || "")} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-700 outline-none text-gray-900"
                >
                  <option value="">-- Choose a task --</option>
                  {tasks.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} (Due: {formatDate(m.deadline)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attach Document (PDF, DOC, DOCX)</label>
                <div 
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-green-700 rounded-xl p-8 text-center cursor-pointer bg-gray-50 hover:bg-green-50/20 transition-colors"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                  />
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  {uploadFile ? (
                    <div className="flex items-center justify-center space-x-2 text-green-800 font-medium">
                      <File className="w-5 h-5" />
                      <span>{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-700 font-medium">Click to upload or drag & drop</p>
                      <p className="text-gray-500 text-sm mt-2">Supported formats: PDF, DOC, DOCX</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={isUploading} className="bg-green-900 hover:bg-green-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
                  {isUploading ? "Uploading..." : "Submit File"} <Send className="w-4 h-4 ml-2" />
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-gray-400" /> Recent Uploads</h2>
            {submissions.length === 0 ? (
              <p className="text-gray-400 italic text-sm">No files uploaded yet.</p>
            ) : (
              <div className="space-y-4">
                {submissions.slice().reverse().slice(0, 5).map(s => {
                  const m = tasks.find(ms => ms.id === s.task);
                  const filename = s.file.split('/').pop() || "Document";
                  return (
                    <div key={s.id} className="p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                      <p className="font-semibold text-sm text-gray-900 truncate" title={filename}>{filename}</p>
                      <p className="text-xs text-gray-500 mt-1">Task: {m?.title || s.task_title || 'Unknown'}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-gray-400">{formatDate(s.submitted_at)}</span>
                        <a href={getMediaUrl(s.file)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center">
                          <Download className="w-3 h-3 mr-1" /> Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><ListTodo className="w-5 h-5 mr-2 text-green-700" /> Assigned Tasks</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Task Title</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {tasks.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">No tasks assigned yet.</td></tr>
                ) : (
                  tasks.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-semibold text-gray-900">{m.title}</td>
                      <td className="py-4">{formatDate(m.deadline)}</td>
                      <td className="py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTaskStatus(m.id) === 'Submitted' ? 'bg-blue-100 text-blue-800' : getTaskStatus(m.id) === 'Late' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                          {getTaskStatus(m.id)}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {getTaskStatus(m.id) !== 'Submitted' && (
                          <button onClick={() => { setActiveTab("upload"); setUploadTask(m.id); }} className="text-green-700 hover:text-green-900 font-medium hover:underline text-sm">
                            Submit Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><FileText className="w-5 h-5 mr-2 text-green-700" /> My Submissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Task</th>
                  <th className="pb-3 font-medium">Submitted Date</th>
                  <th className="pb-3 font-medium">File</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-center">Score</th>
                  <th className="pb-3 font-medium text-center">Grade</th>
                  <th className="pb-3 font-medium">Guide Feedback</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {submissions.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400">No submissions yet.</td></tr>
                ) : (
                  submissions.map(s => {
                    const m = tasks.find(ms => ms.id === s.task);
                    const filename = s.file.split('/').pop() || "Document";
                    const isEvaluated = s.status === 'evaluated' || s.score !== null;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">{m?.title || s.task_title || 'Unknown'}</td>
                        <td className="py-4">{formatDate(s.submitted_at)}</td>
                        <td className="py-4">
                          <a href={getMediaUrl(s.file)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center max-w-[200px] truncate" title={filename}>
                            <File className="w-3 h-3 mr-1 flex-shrink-0" /> {filename}
                          </a>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isEvaluated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {isEvaluated ? 'Evaluated' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 text-center font-bold text-gray-800">
                          {s.score !== null && s.score !== undefined ? `${s.score}/100` : <span className="text-gray-400 font-normal">Pending</span>}
                        </td>
                        <td className="py-4 text-center">
                          {s.grade ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeBadgeClass(s.grade)}`}>
                              {s.grade}
                            </span>
                          ) : s.score !== null && s.score !== undefined ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeBadgeClass(getTaskGrade(s.task))}`}>
                              {getTaskGrade(s.task)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-4 text-gray-600 max-w-xs text-xs italic">
                          {s.feedback || (isEvaluated ? <span className="text-gray-400">No feedback provided</span> : <span className="text-gray-400">Evaluation pending</span>)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "grades" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-700" /> Grades & Evaluation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Task</th>
                  <th className="pb-3 font-medium text-center">Score</th>
                  <th className="pb-3 font-medium text-center">Grade</th>
                  <th className="pb-3 font-medium">Guide Feedback</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {tasks.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">No grades available yet.</td></tr>
                ) : (
                  tasks.map(m => {
                    const subs = submissions.filter(s => s.task === m.id);
                    const latestSub = subs.length > 0 ? subs[subs.length - 1] : null;
                    const hasScore = latestSub && latestSub.score !== null && latestSub.score !== undefined;
                    const score = hasScore ? `${latestSub.score}/100` : (latestSub ? (latestSub.status === 'evaluated' ? "Evaluated" : "Pending") : "—");
                    const grade = latestSub?.grade || (hasScore ? getTaskGrade(m.id) : "—");

                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">{m.title}</td>
                        <td className="py-4 text-center font-bold text-gray-800">{score}</td>
                        <td className="py-4 text-center">
                          <span className={`px-3 py-1 rounded text-sm font-bold ${getGradeBadgeClass(grade)}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="py-4 text-gray-600 max-w-xs italic text-sm">
                          {latestSub?.feedback || (latestSub ? (latestSub.status === 'evaluated' || hasScore ? <span className="text-gray-400">No feedback provided</span> : <span className="text-gray-400">Evaluation pending</span>) : <span className="text-gray-400">—</span>)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><User className="w-5 h-5 mr-2 text-green-700" /> My Profile</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="font-semibold text-gray-900 mt-1">{profile?.first_name || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Email / Username</p>
                <p className="font-semibold text-gray-900 mt-1">{profile?.email || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="font-semibold text-gray-900 mt-1 capitalize">{profile?.role || 'Student'}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm flex items-start">
                <span className="font-semibold mr-2">Note:</span> Profile details can only be modified by a System Administrator. Contact support to request changes.
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><Key className="w-5 h-5 mr-2 text-green-700" /> Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {pwdMsg.text && (
                <div className={`p-3 rounded-lg text-sm border ${pwdMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {pwdMsg.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700" />
              </div>
              <button type="submit" className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
