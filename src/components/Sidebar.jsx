import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getProfilePhotoUrl } from '../utils/profilePhoto';
import {
  LayoutDashboard,
  CheckSquare,
  CreditCard,
  Sparkles,
  LogOut,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  UserCircle,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const profilePhotoUrl = getProfilePhotoUrl(user?.profilePhoto);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      localStorage.setItem('sidebar-collapsed', String(!current));
      return !current;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItem = (to, Icon, label, iconColor = 'text-indigo-400') => (
    <Link
      key={to}
      to={to}
      title={collapsed ? label : undefined}
      className={`flex items-center space-x-3 p-3 rounded-xl transition text-sm font-medium ${
        isActive(to)
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${isActive(to) ? 'text-white' : iconColor}`} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  const _getProfilePath = () => {
    const roleMap = { admin: '/admin/profile', teacher: '/teacher/profile', student: '/student/profile', parent: '/parent/profile' };
    return roleMap[user?.role] || '/login';
  };

  const _getFuturisticPath = () => {
    const roleMap = { admin: '/admin/futuristic-campus', teacher: '/teacher/futuristic-campus', student: '/student/futuristic-campus', parent: '/parent/futuristic-campus' };
    return roleMap[user?.role] || '/login';
  };

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between p-3 shadow-xl shrink-0 transition-[width] duration-200`}>
      <div>
        {/* Brand Header */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-2 py-4 mb-3 border-b border-slate-800`}>
          <div className="p-2 bg-indigo-600 rounded-xl shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && <div>
            <span className="font-bold text-lg tracking-wide text-white block">EduPro AI</span>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
              School Management
            </span>
          </div>}
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`mb-4 flex w-full items-center ${collapsed ? 'justify-center' : 'justify-between'} rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white`}
        >
          {!collapsed && <span>Workspace</span>}
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">

          {/* ── ADMIN NAVIGATION ── */}
          {user?.role === 'admin' && (
            <>
              {navItem('/admin/dashboard', LayoutDashboard, 'Admin Command Center', 'text-indigo-400')}
              {navItem('/admin/futuristic-campus', Cpu, 'AI Smart Campus Matrix', 'text-purple-400')}
              {navItem('/admin/profile', UserCircle, 'My Profile & Security', 'text-sky-400')}
            </>
          )}

          {/* ── TEACHER NAVIGATION ── */}
          {['admin', 'teacher'].includes(user?.role) && (
            <>
              {!collapsed && user?.role === 'teacher' && (
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 pt-2 pb-1">Teaching Tools</p>
              )}
              {user?.role === 'teacher' && navItem('/teacher/dashboard', LayoutDashboard, 'Teacher Workspace', 'text-emerald-400')}
              {navItem('/teacher/attendance', CheckSquare, 'Attendance Manager', 'text-emerald-400')}
              {navItem('/teacher/ai-quiz', Sparkles, 'AI Quiz Generator', 'text-amber-400')}
              {navItem('/teacher/futuristic-campus', Cpu, 'AI Guidance Matrix', 'text-purple-400')}
              {user?.role === 'teacher' && navItem('/teacher/profile', UserCircle, 'My Profile & Security', 'text-sky-400')}
            </>
          )}

          {/* ── STUDENT NAVIGATION ── */}
          {user?.role === 'student' && (
            <>
              {navItem('/student/dashboard', LayoutDashboard, 'Student Dashboard', 'text-sky-400')}
              {navItem('/student/futuristic-campus', Sparkles, 'AI Learning Copilot', 'text-amber-400')}
              {navItem('/student/profile', UserCircle, 'My Profile & Security', 'text-sky-400')}
            </>
          )}

          {/* ── PARENT NAVIGATION ── */}
          {user?.role === 'parent' && (
            <>
              {navItem('/parent/dashboard', CreditCard, 'Parent Dashboard', 'text-sky-400')}
              {navItem('/parent/futuristic-campus', Sparkles, 'Guardian AI Pulse', 'text-sky-400')}
              {navItem('/parent/profile', UserCircle, 'My Profile & Security', 'text-purple-400')}
            </>
          )}
        </nav>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="border-t border-slate-800 pt-4">
        {!collapsed && <div className="px-2 mb-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-white">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-indigo-400 capitalize font-medium">{user?.role} Portal</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-2"></span>
              </div>
            </div>
          </div>
        </div>}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          aria-label="Sign Out"
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition font-semibold text-sm`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;