"use client";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";
import { useState, useEffect } from "react";
import axios from "axios";
import { User, Key } from "lucide-react";

export default function GuideSettings() {
  const [profile, setProfile] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });

  const getHeaders = () => ({
    headers: { Authorization: `Token ${localStorage.getItem("token")}` }
  });

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE_URL}/api/auth/users/me/`, getHeaders()),
      axios.get(`${API_BASE_URL}/api/guide/teams/`, getHeaders()),
    ]).then(([p, t]) => {
      setProfile(p.data);
      setTeams(t.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", text: "New passwords do not match." }); return; }
    if (newPwd === oldPwd) { setPwdMsg({ type: "error", text: "New password must differ from current." }); return; }
    try {
      await axios.put(`${API_BASE_URL}/api/auth/users/me/`,
        { old_password: oldPwd, new_password: newPwd }, getHeaders());
      setPwdMsg({ type: "success", text: "Password changed successfully." });
      setOldPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err: any) {
      setPwdMsg({ type: "error", text: err.response?.data?.error || "Failed to change password." });
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <User className="w-5 h-5 mr-2 text-green-700" /> My Profile
          </h2>
          <div className="space-y-4">
            {[
              { label: "Full Name", value: profile?.first_name || 'N/A' },
              { label: "Email", value: profile?.email || 'N/A' },
              { label: "Username", value: profile?.username || 'N/A' },
              { label: "Role", value: profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Guide' },
            ].map(f => (
              <div key={f.label} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-500">{f.label}</p>
                <p className="font-semibold text-gray-900 mt-1">{f.value}</p>
              </div>
            ))}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-2">Assigned Teams</p>
              {teams.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No teams assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teams.map(t => (
                    <span key={t.id} className="bg-green-100 text-green-900 text-xs px-3 py-1 rounded-full font-medium">{t.name}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
              <span className="font-semibold">Note:</span> Profile details can only be modified by a System Administrator.
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Key className="w-5 h-5 mr-2 text-green-700" /> Change Password
          </h2>
          <form onSubmit={handleChangePwd} className="space-y-4">
            {pwdMsg.text && (
              <div className={`p-3 rounded-lg text-sm border ${pwdMsg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                {pwdMsg.text}
              </div>
            )}
            {[
              { label: "Current Password", val: oldPwd, set: setOldPwd },
              { label: "New Password", val: newPwd, set: setNewPwd },
              { label: "Confirm New Password", val: confirmPwd, set: setConfirmPwd },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type="password" required value={f.val} onChange={e => f.set(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-900 focus:ring-2 focus:ring-green-700" />
              </div>
            ))}
            <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors shadow-md">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
