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
    <aside className="w-64 bg-white text-gray-800 flex flex-col h-full border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-2xl font-extrabold text-green-900">
          ThesisGuard
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {isAdmin ? (
          <>
            <Link href="/dashboard/admin" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname === '/dashboard/admin' ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <Shield size={20} className={pathname === '/dashboard/admin' ? 'text-green-700' : ''} />
              <span>Admin Portal</span>
            </Link>
            <Link href="/dashboard/admin/manage-accounts" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/manage-accounts') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <Users size={20} className={pathname.includes('/manage-accounts') ? 'text-green-700' : ''} />
              <span>Manage Accounts</span>
            </Link>
          </>
        ) : isGuide ? (
          <>
            <Link href="/dashboard/guide" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname === '/dashboard/guide' ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <BarChart3 size={20} className={pathname === '/dashboard/guide' ? 'text-green-700' : ''} />
              <span>Overview</span>
            </Link>
            <Link href="/dashboard/guide/tasks" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/tasks') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <ListTodo size={20} className={pathname.includes('/guide/tasks') ? 'text-green-700' : ''} />
              <span>Tasks</span>
            </Link>
            <Link href="/dashboard/guide/teams" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/teams') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <Users size={20} className={pathname.includes('/guide/teams') ? 'text-green-700' : ''} />
              <span>My Teams</span>
            </Link>
            <Link href="/dashboard/guide/submissions" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/submissions') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <FileText size={20} className={pathname.includes('/guide/submissions') ? 'text-green-700' : ''} />
              <span>Submissions</span>
            </Link>
            <Link href="/dashboard/guide/evaluation" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/evaluation') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <CheckSquare size={20} className={pathname.includes('/guide/evaluation') ? 'text-green-700' : ''} />
              <span>Evaluation</span>
            </Link>
            <Link href="/dashboard/guide/analysis" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/guide/analysis') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <GraduationCap size={20} className={pathname.includes('/guide/analysis') ? 'text-green-700' : ''} />
              <span>Team Analysis</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/dashboard/student" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname === '/dashboard/student' ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <BarChart3 size={20} className={pathname === '/dashboard/student' ? 'text-green-700' : ''} />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/student/upload" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/student/upload') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <Upload size={20} className={pathname.includes('/student/upload') ? 'text-green-700' : ''} />
              <span>Upload Files</span>
            </Link>
            <Link href="/dashboard/student/tasks" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/student/tasks') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <ListTodo size={20} className={pathname.includes('/student/tasks') ? 'text-green-700' : ''} />
              <span>Tasks</span>
            </Link>
            <Link href="/dashboard/student/submissions" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/student/submissions') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <FileText size={20} className={pathname.includes('/student/submissions') ? 'text-green-700' : ''} />
              <span>Submissions</span>
            </Link>
            <Link href="/dashboard/student/grades" className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/student/grades') ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              <CheckSquare size={20} className={pathname.includes('/student/grades') ? 'text-green-700' : ''} />
              <span>Grades</span>
            </Link>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-gray-200 space-y-2">
        {!isAdmin && (
          <Link href={isGuide ? "/dashboard/guide/settings" : "/dashboard/student/settings"} className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors ${pathname.includes('/settings') ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-600'}`}>
            <Settings size={20} className={pathname.includes('/settings') ? 'text-gray-900' : ''} />
            <span>Settings</span>
          </Link>
        )}
        <Link href="/login" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
          <LogOut size={20} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
