"use client";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
        username,
        password
      });
      
      const { token, role } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", username);
      
      if (role === "admin") {
        router.push("/dashboard/admin");
      } else if (role === "guide") {
        router.push("/dashboard/guide");
      } else {
        router.push("/dashboard/student");
      }
    } catch (err) {
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Column - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-12 lg:px-24 relative bg-gray-50 overflow-hidden">
        
        {/* Dark Green Bubble Shades */}
        <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] bg-[#3c5a3d] rounded-full filter blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[600px] h-[600px] bg-[#1b2b1c] rounded-full filter blur-[120px] opacity-30 animate-pulse"></div>
        
        <div className="relative z-10 w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.12)] border border-white/60">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Sign In</h1>
            <p className="text-gray-500 mt-2 text-sm">Welcome back to ThesisGuard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm text-center border border-red-100 font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Username</label>
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#3c5a3d]/10 focus:border-[#3c5a3d] outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="Enter your username" 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#3c5a3d]/10 focus:border-[#3c5a3d] outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="Enter your password" 
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full bg-[#2c402d] hover:bg-[#1b2b1c] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_14px_0_rgb(60,90,61,0.39)] hover:shadow-[0_6px_20px_rgba(60,90,61,0.23)] hover:-translate-y-0.5"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column - Image */}
      <div className="hidden md:block w-1/2 relative bg-gray-50 border-l border-gray-100">
        <img 
          src="/monstera.jpg"
          alt="Plant leaves"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
