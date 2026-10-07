"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, CheckSquare, Settings, UserCircle, GraduationCap, LogOut, Shield, Users, BarChart3, Upload, ListTodo } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  
  // Conditionally render links based on whether user is in student or guide path
  const isGuide = pathname.includes('/dashboard/guide');
  const isAdmin = pathname.includes('/dashboard/admin');
  
  return (
    <aside className="w-64 bg-[#1b2b1c] text-gray-300 flex flex-col h-full border-r border-[#2d442e]">
      <div className="p-6">
        <h2 className="text-2xl font-extrabold text-white">
          ThesisGuard
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {isAdmin ? (
          <>
            <Link href="/dashboard/admin" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname === '/dashboard/admin' ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <Shield size={20} className={pathname === '/dashboard/admin' ? 'text-white' : ''} />
              <span>Admin Portal</span>
            </Link>
            <Link href="/dashboard/admin/manage-accounts" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/manage-accounts') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <Users size={20} className={pathname.includes('/manage-accounts') ? 'text-white' : ''} />
              <span>Manage Accounts</span>
            </Link>
          </>
        ) : isGuide ? (
          <>
            <Link href="/dashboard/guide" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname === '/dashboard/guide' ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <BarChart3 size={20} className={pathname === '/dashboard/guide' ? 'text-white' : ''} />
              <span>Overview</span>
            </Link>
            <Link href="/dashboard/guide/tasks" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/tasks') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <ListTodo size={20} className={pathname.includes('/guide/tasks') ? 'text-white' : ''} />
              <span>Tasks</span>
            </Link>
            <Link href="/dashboard/guide/teams" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/teams') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <Users size={20} className={pathname.includes('/guide/teams') ? 'text-white' : ''} />
              <span>My Teams</span>
            </Link>
            <Link href="/dashboard/guide/submissions" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/submissions') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <FileText size={20} className={pathname.includes('/guide/submissions') ? 'text-white' : ''} />
              <span>Submissions</span>
            </Link>
            <Link href="/dashboard/guide/evaluation" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/evaluation') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <CheckSquare size={20} className={pathname.includes('/guide/evaluation') ? 'text-white' : ''} />
              <span>Evaluation</span>
            </Link>
            <Link href="/dashboard/guide/analysis" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/analysis') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <GraduationCap size={20} className={pathname.includes('/guide/analysis') ? 'text-white' : ''} />
              <span>Team Analysis</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/dashboard/student" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname === '/dashboard/student' ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <BarChart3 size={20} className={pathname === '/dashboard/student' ? 'text-white' : ''} />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/student/upload" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/student/upload') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <Upload size={20} className={pathname.includes('/student/upload') ? 'text-white' : ''} />
              <span>Upload Files</span>
            </Link>
            <Link href="/dashboard/student/tasks" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/student/tasks') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <ListTodo size={20} className={pathname.includes('/student/tasks') ? 'text-white' : ''} />
              <span>Tasks</span>
            </Link>
            <Link href="/dashboard/student/submissions" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/student/submissions') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <FileText size={20} className={pathname.includes('/student/submissions') ? 'text-white' : ''} />
              <span>Submissions</span>
            </Link>
            <Link href="/dashboard/student/grades" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/student/grades') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
              <CheckSquare size={20} className={pathname.includes('/student/grades') ? 'text-white' : ''} />
              <span>Grades</span>
            </Link>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-[#2d442e] space-y-2">
        {!isAdmin && (
          <Link href={isGuide ? "/dashboard/guide/settings" : "/dashboard/student/settings"} className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/settings') ? 'bg-[#2d442e] text-white' : 'hover:bg-[#233724] text-gray-300'}`}>
            <Settings size={20} className={pathname.includes('/settings') ? 'text-white' : ''} />
            <span>Settings</span>
          </Link>
        )}
        <Link href="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-900/30 text-red-400 transition-colors">
          <LogOut size={20} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
