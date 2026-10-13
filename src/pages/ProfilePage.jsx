import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { getProfilePhotoUrl } from '../utils/profilePhoto';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Phone,
  GraduationCap,
  Building,
  LogOut,
  Clock,
  Activity,
  Fingerprint,
  BookOpen,
  Camera,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const photoInputRef = useRef(null);
  const [photoUpload, setPhotoUpload] = useState({ loading: false, type: '', text: '' });

  // Change Password State
  const [pwdData, setPwdData] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  // Security Stats State
  const [secStats, setSecStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Password Strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score: 2, label: 'Good', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(pwdData.newPwd);

  const fetchSecurityStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axiosInstance.get('/auth/security-stats');
      setSecStats(res.data.data);
    } catch {
      // not critical
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'security' && (user?.role === 'admin' || user?.role === 'teacher')) {
      fetchSecurityStats();
    }
  }, [activeSection, user?.role]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    if (pwdData.newPwd !== pwdData.confirm) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwdData.newPwd.length < 8) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    setPwdLoading(true);
    try {
      const res = await axiosInstance.post('/auth/change-password', {
        currentPassword: pwdData.current,
        newPassword: pwdData.newPwd,
      });
      setPwdMsg({ type: 'success', text: res.data?.message || 'Password updated successfully! Please log in again.' });
      setPwdData({ current: '', newPwd: '', confirm: '' });
      // Auto logout after password change
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2500);
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      teacher: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      student: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
      parent: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    };
    return colors[role] || colors.student;
  };

  const roleColor = getRoleColor(user?.role);
  const profilePhotoUrl = getProfilePhotoUrl(user?.profilePhoto);

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoUpload({ loading: false, type: 'error', text: 'Choose a JPG, PNG, or WebP image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoUpload({ loading: false, type: 'error', text: 'Photo must be 5 MB or smaller.' });
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    setPhotoUpload({ loading: true, type: '', text: '' });
    try {
      const response = await axiosInstance.post('/auth/profile-photo', formData);
      updateUser({ profilePhoto: response.data.data.profilePhoto });
      setPhotoUpload({ loading: false, type: 'success', text: 'Profile photo updated.' });
    } catch (error) {
      setPhotoUpload({
        loading: false,
        type: 'error',
        text: error.response?.data?.message || error.message || 'Unable to update profile photo.',
      });
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'password', label: 'Change Password', icon: Key },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-indigo-600" />
            My Profile & Security
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your personal information and account security settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-4 text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={`${user?.name || 'User'} profile`} className="h-20 w-20 rounded-full object-cover shadow-lg" />
                ) : (
                  <div className="h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-black text-white">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUpload.loading}
                  title="Change profile photo"
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                >
                  {photoUpload.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleProfilePhotoChange}
                />
              </div>
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUpload.loading} className="mb-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-60">
                {photoUpload.loading ? 'Uploading photo...' : profilePhotoUrl ? 'Change photo' : 'Add profile photo'}
              </button>
              {photoUpload.text && <p role="status" className={`mb-2 text-xs ${photoUpload.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{photoUpload.text}</p>}
              <h2 className="font-bold text-slate-900 text-base">{user?.name || 'User'}</h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
              <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${roleColor.bg} ${roleColor.text} border ${roleColor.border}`}>
                {user?.role} Portal
              </span>
            </div>

            {/* Section Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition text-left border-b border-slate-100 last:border-0 ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-l-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${activeSection === section.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Panel */}
          <div className="lg:col-span-3">

            {/* PROFILE INFO SECTION */}
            {activeSection === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField icon={User} label="Full Name" value={user?.name || '—'} />
                  <InfoField icon={Mail} label="Email Address" value={user?.email || '—'} />
                  <InfoField icon={GraduationCap} label="Role" value={user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` : '—'} />
                  {user?.classId && <InfoField icon={Building} label="Class / Section" value={user.classId} />}
                  {user?.rollNumber && <InfoField icon={Fingerprint} label="Roll Number" value={user.rollNumber} />}
                  {user?.phone && <InfoField icon={Phone} label="Phone Number" value={user.phone} />}
                  {user?.subject && <InfoField icon={BookOpen} label="Subject" value={user.subject} />}
                  {user?.parentEmail && <InfoField icon={Mail} label="Parent Email" value={user.parentEmail} />}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Account is{' '}
                    <span className={`font-semibold ${user?.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {user?.isEmailVerified ? 'Email Verified ✓' : 'Pending Verification'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* SECURITY SECTION */}
            {activeSection === 'security' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Security Overview
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SecurityBadge
                      icon={Mail}
                      title="Email Verification"
                      status={user?.isEmailVerified ? 'Verified' : 'Unverified'}
                      ok={user?.isEmailVerified}
                    />
                    <SecurityBadge
                      icon={Lock}
                      title="Account Status"
                      status={user?.isActive !== false ? 'Active' : 'Suspended'}
                      ok={user?.isActive !== false}
                    />
                    <SecurityBadge
                      icon={Key}
                      title="Password"
                      status="Protected with bcrypt"
                      ok={true}
                    />
                    <SecurityBadge
                      icon={Activity}
                      title="Session"
                      status="JWT Token (30d expiry)"
                      ok={true}
                    />
                  </div>
                </div>

                {/* Admin/Teacher Security Stats */}
                {(user?.role === 'admin' || user?.role === 'teacher') && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        System Security Telemetry
                      </h3>
                      <button
                        onClick={fetchSecurityStats}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Refresh
                      </button>
                    </div>
                    {statsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading stats...
                      </div>
                    ) : secStats ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard label="Total Users" value={secStats.totalUsers || '—'} color="indigo" />
                        <StatCard label="Verified" value={secStats.verifiedUsers || '—'} color="emerald" />
                        <StatCard label="Unverified" value={secStats.unverifiedUsers || '—'} color="amber" />
                        <StatCard label="Admins" value={secStats.adminCount || '—'} color="red" />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Click refresh to load security telemetry.</p>
                    )}
                  </div>
                )}

                {/* Session Management */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Session Management
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Your current session token is securely stored in local storage. 
                    Logging out will immediately invalidate your session.
                  </p>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition shadow-sm shadow-red-600/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out & Clear Session
                  </button>
                </div>
              </div>
            )}

            {/* CHANGE PASSWORD SECTION */}
            {activeSection === 'password' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-500" />
                  Change Account Password
                </h3>

                {pwdMsg.text && (
                  <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${
                    pwdMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {pwdMsg.type === 'success'
                      ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPwd.current ? 'text' : 'password'}
                        value={pwdData.current}
                        onChange={(e) => setPwdData({ ...pwdData, current: e.target.value })}
                        required
                        placeholder="Enter current password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                        {showPwd.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPwd.new ? 'text' : 'password'}
                        value={pwdData.newPwd}
                        onChange={(e) => setPwdData({ ...pwdData, newPwd: e.target.value })}
                        required
                        minLength={8}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                        {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pwdData.newPwd && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${(strength.score / 3) * 100}%`,
                              backgroundColor: strength.color,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: strength.color }}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPwd.confirm ? 'text' : 'password'}
                        value={pwdData.confirm}
                        onChange={(e) => setPwdData({ ...pwdData, confirm: e.target.value })}
                        required
                        placeholder="Re-enter new password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                      <button type="button" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                        {showPwd.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pwdData.confirm && pwdData.newPwd !== pwdData.confirm && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">Passwords do not match.</p>
                    )}
                  </div>

                  <div className="pt-1">
                    <ul className="text-[11px] text-slate-500 space-y-0.5 mb-4">
                      <li className={pwdData.newPwd.length >= 8 ? 'text-emerald-600' : ''}>• At least 8 characters</li>
                      <li className={/[A-Z]/.test(pwdData.newPwd) ? 'text-emerald-600' : ''}>• At least one uppercase letter</li>
                      <li className={/[0-9]/.test(pwdData.newPwd) ? 'text-emerald-600' : ''}>• At least one number</li>
                      <li className={/[^A-Za-z0-9]/.test(pwdData.newPwd) ? 'text-emerald-600' : ''}>• At least one special character</li>
                    </ul>
                    <button
                      type="submit"
                      disabled={pwdLoading || pwdData.newPwd !== pwdData.confirm}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-60 shadow-sm shadow-indigo-600/20"
                    >
                      {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {pwdLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    After a password change, you will be automatically signed out for security.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components ---
const InfoField = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
    <Icon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
  </div>
);

const SecurityBadge = ({ icon: Icon, title, status, ok }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border ${ok ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
    <div className={`p-1.5 rounded-lg ${ok ? 'bg-emerald-100' : 'bg-amber-100'}`}>
      <Icon className={`w-4 h-4 ${ok ? 'text-emerald-600' : 'text-amber-600'}`} />
    </div>
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <p className={`text-xs font-bold mt-0.5 ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>{status}</p>
    </div>
  </div>
);

const StatCard = ({ label, value, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`p-3 rounded-xl text-center ${colors[color]}`}>
      <p className="text-xl font-black">{value}</p>
      <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
};


export default ProfilePage;
