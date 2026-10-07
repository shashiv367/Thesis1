"use client";
import { API_BASE_URL, getMediaUrl } from "@/utils/api";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Header() {
  const [initial, setInitial] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("username");
      if (stored) return stored.charAt(0).toUpperCase();
    }
    return "U";
  });

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setInitial(storedUsername.charAt(0).toUpperCase());
      return;
    }

    // Only fetch user data if not already cached
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await axios.get(`${API_BASE_URL}/api/auth/users/me/`, {
            headers: { Authorization: `Token ${token}` }
          });
          const name = res.data.first_name || res.data.username;
          if (name) {
            setInitial(name.charAt(0).toUpperCase());
            localStorage.setItem("username", name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user details", err);
      }
    };
    fetchUser();
  }, []);

  return (
    <header className="h-16 bg-[#1b2b1c] border-b border-[#2d442e] flex items-center justify-between px-6 shadow-sm">
      <div className="font-semibold text-white">
        Welcome back
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 rounded-full bg-[#3c5a3d] text-white flex items-center justify-center font-bold border border-[#2d442e]">
          {initial}
        </div>
      </div>
    </header>
  );
}
