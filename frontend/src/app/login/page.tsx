"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight } from "lucide-react";
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
      // Connect to the Django backend authentication API
      const response = await axios.post("http://localhost:8000/api/auth/login/", {
        username,
        password
      });
      
      const { token, role } = response.data;
      
      // Save the authentication token for future API requests
      localStorage.setItem("token", token);
      
      // Route intelligently based on the role stored in the Neon database
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-green-900 mb-2">ThesisGuard</h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center border border-red-200 font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all outline-none text-gray-900" 
                placeholder="Enter username" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all outline-none text-gray-900" 
                placeholder="Enter password" 
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-green-900 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-green-900/20">
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
}
