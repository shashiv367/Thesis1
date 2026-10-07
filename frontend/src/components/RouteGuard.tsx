"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthorized(false);
        router.push("/");
        return;
      }

      let role = localStorage.getItem("role");

      // If role is missing from localStorage, try to fetch it from backend
      if (!role) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/auth/users/me/`, {
            headers: { Authorization: `Token ${token}` },
          });
          if (res.data && res.data.role) {
            role = res.data.role;
            if (role) {
              localStorage.setItem("role", role);
            }
          } else {
            localStorage.clear();
            router.push("/");
            return;
          }
        } catch {
          localStorage.clear();
          router.push("/");
          return;
        }
      }

      const validRoles = ["student", "guide", "admin"];
      if (!role || !validRoles.includes(role)) {
        localStorage.clear();
        router.push("/");
        return;
      }

      // If directly at /dashboard or /dashboard/, redirect to specific dashboard
      if (pathname === "/dashboard" || pathname === "/dashboard/") {
        router.push(`/dashboard/${role}`);
        return;
      }

      // Role-based routing checks
      if (pathname.startsWith("/dashboard/student") && role !== "student") {
        router.push(`/dashboard/${role}`);
        return;
      }
      
      if (pathname.startsWith("/dashboard/guide") && role !== "guide") {
        router.push(`/dashboard/${role}`);
        return;
      }
      
      if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
        router.push(`/dashboard/${role}`);
        return;
      }

      setAuthorized(true);
    };

    checkAuth();
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f3f7f3] text-gray-600 font-medium">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
