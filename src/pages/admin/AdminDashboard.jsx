import React, { lazy, Suspense, useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import ChatRoom from '../../components/ChatRoom';
import AIAssistantHub from '../../components/AIAssistantHub';
import VisitorGatePass from '../../components/VisitorGatePass';
import BehaviorBadges from '../../components/BehaviorBadges';
import ResourceBooking from '../../components/ResourceBooking';
import CommandPalette from '../../components/CommandPalette';
import { formatFeeAmount } from '../../utils/currency';
const AdminAnalyticsInsights = lazy(() => import('../../components/AdminAnalyticsInsights'));
import {
  Users,
  GraduationCap,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Download,
  PlusCircle,
  Settings,
  Mail,
  Calendar,
  Building,
  Loader2,
  Trash2,
  Bell,
  RefreshCw,
  Send,
  UserCheck,
  Award,
  Cpu,
  Search,
  X,
  Command,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user: _user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('analytics');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userTableDensity, setUserTableDensity] = useState('comfortable');
  const [loading, setLoading] = useState(false);

  // --- ANALYTICS STATE ---
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalExams: 0,
    totalHomeworks: 0,
    financials: { totalBilled: 0, totalCollected: 0, totalPending: 0, collectionRate: '0%' },
    attendanceRate: '0%',
  });

  // --- USER MANAGEMENT STATE ---
 /* const [userRoleFilter, setUserRoleFilter] = useState('student');
  const [userList, setUserList] = useState([]);
  const [updatingPermissionId, setUpdatingPermissionId] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student',
    classId: 'Grade-10A',
    rollNumber: '',
    subject: '',
    phone: '',
    parentEmail: '',
    customPassword: '',
  });
  const updateNewUser = (field, value) => {
    setNewUser((current) => ({ ...current, [field]: value }));
  }; */


  // --- USER MANAGEMENT STATE ---
const [userRoleFilter, setUserRoleFilter] = useState('student');
const [userList, setUserList] = useState([]);
const [updatingPermissionId, setUpdatingPermissionId] = useState(null);

const initialUserFormState = {
  name: '',
  email: '',
  role: 'student',
  classId: 'Grade-10A',
  rollNumber: '',
  subject: '',
  phone: '',
  parentEmail: '',
  password: '', // Fixed key name
};

const [newUser, setNewUser] = useState(initialUserFormState);

const updateNewUser = (field, value) => {
  setNewUser((current) => ({ ...current, [field]: value }));
};

  // --- SCHOOL REGISTRATION & OTP STATE ---
  const [otpStep, setOtpStep] = useState('initial'); // 'initial', 'otp_sent', 'verified'
  const [schoolReg, setSchoolReg] = useState({
    schoolName: 'EduPro International Academy',
    email: 'principal@school.edu',
    phone: '+1 (555) 234-5678',
    registrationNumber: 'SCH-2026-904',
    otp: '',
  });

  // --- FEE MANAGEMENT & CONCESSIONS STATE ---
  const [allFees, setAllFees] = useState([]);
  const [feeStudents, setFeeStudents] = useState([]);
  const [reviewingFeeId, setReviewingFeeId] = useState(null);
  const [newFeeInvoice, setNewFeeInvoice] = useState({
    studentId: '',
    title: 'Term 2 Comprehensive Tuition',
    amount: 1200,
    dueDate: '',
    concessionAmount: 0,
    discountReason: '',
    classId: 'Grade-10A',
  });
  const [feeStructures, setFeeStructures] = useState([]);
  const [newStructure, setNewStructure] = useState({
    classId: 'Grade-10A',
    term: 'Term 1 (Fall)',
    tuitionFee: 1200,
    examFee: 150,
    labFee: 100,
    libraryFee: 50,
  });

  // --- SCHOOL SETTINGS STATE ---
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: 'EduPro International Academy',
    registrationNumber: 'EDU-REG-2026-784',
    email: 'info@edupro-school.edu',
    phone: '+1 (555) 321-9876',
    address: '100 Innovation Boulevard, Tech District',
    academicYear: '2025-2026',
    currency: 'USD',
    principalName: 'Dr. Katherine Vance',
    upiVpa: '',
    upiPayeeName: '',
  });

  // --- NOTICE STATE ---
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    targetAudience: 'all',
    priority: 'Normal',
    category: 'General',
  });

  // --- LEAVE MANAGEMENT STATE ---
  const [allLeaves, setAllLeaves] = useState([]);
  const [adminLeaveFilter, setAdminLeaveFilter] = useState('all');
  const [adminLeaveSearch, setAdminLeaveSearch] = useState('');
  const [reviewingAdminLeaveId, setReviewingAdminLeaveId] = useState(null);
  const [adminReviewNote, setAdminReviewNote] = useState('');
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/reports/dashboard');
      if (res.data.data) setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/auth/users?role=${userRoleFilter}`);
      setUserList(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [userRoleFilter]);

  const fetchFeeStudents = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/auth/users?role=student');
      setFeeStudents(response.data.data || []);
    } catch (err) {
      console.error('Failed to load students for fee invoices:', err);
    }
  }, []);

  const fetchFees = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/fees/all');
      setAllFees(res.data.data || []);
      const structRes = await axiosInstance.get('/fees/structures');
      setFeeStructures(structRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/settings');
      if (res.data.data) setSchoolSettings(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAdminLeaves = useCallback(async () => {
    setLoadingLeaves(true);
    try {
      const res = await axiosInstance.get('/leave/all');
      setAllLeaves(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoadingLeaves(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchUsers();
    fetchFeeStudents();
    fetchFees();
    fetchSettings();
    fetchAdminLeaves();
  }, [fetchDashboardMetrics, fetchUsers, fetchFeeStudents, fetchFees, fetchSettings, fetchAdminLeaves]);

  const handleAdminReviewLeave = async (leaveId, status) => {
    try {
      await axiosInstance.put(`/leave/${leaveId}/review`, { status, reviewNote: adminReviewNote });
      setReviewingAdminLeaveId(null);
      setAdminReviewNote('');
      fetchAdminLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review leave request.');
    }
  };

  // --- HANDLER: CREATE USER WITH AUTOMATED CREDENTIALS EMAIL ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/create-user', newUser);
      alert(res.data.data.emailSent
        ? `User created and credentials emailed to ${newUser.email}.`
        : `User created, but credential email delivery failed. Temporary password: ${res.data.data.generatedPassword}`);
      setNewUser({
        name: '',
        email: '',
        role: userRoleFilter,
        classId: 'Grade-10A',
        rollNumber: '',
        subject: '',
        phone: '',
        parentEmail: '',
        customPassword: '',
      });
      fetchUsers();
      fetchDashboardMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudentCreation = async (teacher, canCreateStudents) => {
    setUpdatingPermissionId(teacher._id);
    try {
      await axiosInstance.put(`/auth/users/${teacher._id}`, { canCreateStudents });
      setUserList((current) => current.map((entry) =>
        entry._id === teacher._id ? { ...entry, canCreateStudents } : entry
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to update this teacher permission.');
    } finally {
      setUpdatingPermissionId(null);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await axiosInstance.delete(`/auth/users/${id}`);
      fetchUsers();
      fetchDashboardMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // --- HANDLER: SCHOOL REGISTRATION & OTP VERIFICATION ---
  const handleSendRegistrationOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/auth/send-otp', {
        email: schoolReg.email,
        purpose: 'school_registration',
        schoolName: schoolReg.schoolName,
      });
      alert(`Verification OTP sent to ${schoolReg.email}!`);
      setOtpStep('otp_sent');
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/auth/verify-otp', {
        email: schoolReg.email,
        otp: schoolReg.otp,
        purpose: 'school_registration',
      });
      const updatedSettings = {
        ...schoolSettings,
        schoolName: schoolReg.schoolName,
        registrationNumber: schoolReg.registrationNumber,
        email: schoolReg.email,
        phone: schoolReg.phone,
      };
      await axiosInstance.put('/settings', updatedSettings);
      setSchoolSettings(updatedSettings);
      alert('School successfully registered & verified via OTP!');
      setOtpStep('verified');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: CREATE FEE INVOICE ---
  const handleCreateFeeInvoice = async (e) => {
    e.preventDefault();
    if (!newFeeInvoice.studentId) {
      alert('Select a student before publishing this invoice.');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/fees/create', {
        ...newFeeInvoice,
      });
      alert('Fee invoice generated & published!');
      setNewFeeInvoice((current) => ({
        ...current,
        studentId: '',
        title: 'Term 2 Comprehensive Tuition',
        amount: 1200,
        dueDate: '',
        concessionAmount: 0,
        discountReason: '',
      }));
      fetchFees();
      fetchDashboardMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeeStructure = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/fees/structures', newStructure);
      const response = await axiosInstance.get('/fees/structures');
      setFeeStructures(response.data.data || []);
      alert('Fee structure saved successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save fee structure');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewUpiPayment = async (feeId, status) => {
    setReviewingFeeId(feeId);
    try {
      await axiosInstance.post('/fees/payment/upi/review', { feeId, status });
      await fetchFees();
      fetchDashboardMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to review UPI payment.');
    } finally {
      setReviewingFeeId(null);
    }
  };

  // --- HANDLER: PUBLISH NOTICE ---
  const handlePublishNotice = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/notices/create', newNotice);
      alert('Official notice published & broadcasted to all dashboards via Socket.io!');
      setNewNotice({ title: '', content: '', targetAudience: 'all', priority: 'Normal', category: 'General' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish notice');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: UPDATE SETTINGS ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.put('/settings', schoolSettings);
      alert('School profile and system settings updated!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // --- CSV EXPORT TRIGGERS ---
  const handleExport = async (type) => {
    const fileNames = {
      attendance: 'attendance_report.csv',
      fees: 'fee_report.csv',
      students: 'students_roster.csv',
    };
    const fileName = fileNames[type];
    if (!fileName) return;

    try {
      const response = await axiosInstance.get(`/reports/export/${type}`, { responseType: 'blob' });
      const downloadUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      alert(error.message || 'Failed to export CSV. Please try again.');
    }
  };

  const filteredUserList = userList.filter((userEntry) => {
    const searchableText = [userEntry.name, userEntry.email, userEntry.classId, userEntry.rollNumber, userEntry.subject]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchableText.includes(userSearch.trim().toLowerCase());
  });
  const userRowPadding = userTableDensity === 'compact' ? 'px-3 py-2' : 'p-3';
  const adminCommands = [
    { label: 'Dashboard analytics', description: 'View school KPIs and fee distribution', keywords: 'overview metrics chart collection', icon: ShieldCheck, run: () => setActiveTab('analytics') },
    { label: 'Manage users', description: 'Search students, teachers, and parents', keywords: 'directory accounts students', icon: Users, run: () => setActiveTab('users') },
    { label: 'Create account', description: 'Open user provisioning form', keywords: 'new student teacher parent add', icon: PlusCircle, run: () => setActiveTab('users') },
    { label: 'Fee management', description: 'Invoices, concessions, and structures', keywords: 'payments billing', icon: DollarSign, run: () => setActiveTab('fees') },
    { label: 'School notices', description: 'Compose and publish an announcement', keywords: 'broadcast notification', icon: Bell, run: () => setActiveTab('notices') },
    { label: 'School settings', description: 'Edit school profile and settings', keywords: 'configuration', icon: Settings, run: () => setActiveTab('settings') },
    { label: 'Leave management', description: 'Review and approve student leave requests school-wide', keywords: 'leaves absence excuse request pending', icon: Calendar, run: () => setActiveTab('leave') },
    { label: 'Export attendance CSV', description: 'Download attendance report', keywords: 'download report', icon: Download, run: () => handleExport('attendance') },
    { label: 'Export fees CSV', description: 'Download fee report', keywords: 'download report', icon: Download, run: () => handleExport('fees') },
    { label: 'Export students CSV', description: 'Download student roster', keywords: 'download report', icon: Download, run: () => handleExport('students') },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <CommandPalette isOpen={commandPaletteOpen} onClose={setCommandPaletteOpen} commands={adminCommands} />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Admin Command Center</h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  System Online
                </span>
              </div>
              <p className="text-xs text-slate-500">
                School Registration with OTP, User Provisioning with Credential Dispatch, Fees, and Full Analytics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Open command palette"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100"
            >
              <Command className="h-3.5 w-3.5" />
              <span>Quick jump</span>
              <kbd className="rounded border border-indigo-200 bg-white px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
            </button>
            <button
              onClick={() => handleExport('attendance')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Attendance CSV</span>
            </button>
            <button
              onClick={() => handleExport('fees')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Fees CSV</span>
            </button>
            <button
              onClick={() => handleExport('students')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Students CSV</span>
            </button>
          </div>
        </div>

        {/* Global AI Intelligence Suite */}
        <AIAssistantHub />

        {/* Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
          {[
            { id: 'analytics', label: 'Dashboard Analytics', icon: ShieldCheck },
            { id: 'users', label: 'User Management (Email Auth)', icon: Users },
            { id: 'leave', label: 'Leave Requests', icon: Calendar, badge: allLeaves.filter((l) => l.status === 'Pending').length },
            { id: 'school_reg', label: 'School Registration & OTP', icon: Building },
            { id: 'fees', label: 'Fee Management & Concessions', icon: DollarSign },
            { id: 'notices', label: 'School Notices & Broadcast', icon: Bell },
            { id: 'settings', label: 'School Settings', icon: Settings },
            { id: 'chat', label: 'Broadcast Channels', icon: Send },
            { id: 'visitors', label: 'Visitor Gate Pass', icon: UserCheck },
            { id: 'behavior', label: 'Merit & Demerit Badges', icon: Award },
            { id: 'resources', label: 'Resource Booking', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-white text-indigo-700' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ANALYTICS & METRICS */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Enrolled Students</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalStudents}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">{stats.attendanceRate} avg attendance</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Active Teachers</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalTeachers}</p>
                  <p className="text-[11px] text-indigo-600 font-semibold">{stats.totalParents} registered parents</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Collected Fees</p>
                  <p className="text-2xl font-bold text-slate-800">${stats.financials.totalCollected}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    {stats.financials.collectionRate} Recovery Rate
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Pending Receivables</p>
                  <p className="text-2xl font-bold text-slate-800">${stats.financials.totalPending}</p>
                  <p className="text-[11px] text-amber-600 font-semibold">Billed: ${stats.financials.totalBilled}</p>
                </div>
              </div>
            </div>

            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100" aria-label="Loading analytics" />}>
              <AdminAnalyticsInsights
                financials={stats.financials}
                totalExams={stats.totalExams}
                totalHomeworks={stats.totalHomeworks}
                totalParents={stats.totalParents}
                attendanceRate={stats.attendanceRate}
              />
            </Suspense>

            {/* Quick Action Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => setActiveTab('users')}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-500 cursor-pointer transition"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-slate-800 text-sm">Issue User Credentials</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provision new teacher, student, or parent accounts with automated login email delivery.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('fees')}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-500 cursor-pointer transition"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-800 text-sm">Fee Structures & Concessions</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Create class fee schedules, apply scholarships, and track overdue receivables.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('notices')}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-500 cursor-pointer transition"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-slate-800 text-sm">Publish Circular Notice</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Broadcast administrative updates, holiday alerts, and schedule changes to all users.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: USER MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add User Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  <span>Create Account & Send Email</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {newUser.role === 'student'
                    ? 'Set the student login password. Credentials will be sent by email.'
                    : 'Credentials will be generated and automatically delivered via SMTP email.'}
                </p>

                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Account Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => updateNewUser('role', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => updateNewUser('name', e.target.value)}
                      placeholder="e.g. John Doe"
                      maxLength={100}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => updateNewUser('email', e.target.value)}
                      placeholder="e.g. user@school.com"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>

                  {newUser.role === 'student' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Password</label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={newUser.customPassword}
                        onChange={(e) => updateNewUser('customPassword', e.target.value)}
                        minLength={8}
                        maxLength={72}
                        placeholder="At least 8 characters"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                        required
                      />
                      <p className="mt-1 text-[11px] text-slate-500">The student signs in with this email address and password.</p>
                    </div>
                  )}

                  {newUser.role === 'student' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                          <input
                            type="text"
                            value={newUser.classId}
                            onChange={(e) => updateNewUser('classId', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Roll No</label>
                          <input
                            type="text"
                            value={newUser.rollNumber}
                            onChange={(e) => updateNewUser('rollNumber', e.target.value)}
                            placeholder="104"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Parent Email (Notification)</label>
                        <input
                          type="email"
                          value={newUser.parentEmail}
                          onChange={(e) => updateNewUser('parentEmail', e.target.value)}
                          placeholder="parent@school.com"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                        />
                      </div>
                    </>
                  )}

                  {newUser.role === 'teacher' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Subject</label>
                      <input
                        type="text"
                        value={newUser.subject}
                        onChange={(e) => updateNewUser('subject', e.target.value)}
                        placeholder="e.g. Mathematics"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    {loading ? 'Creating & Dispatching...' : 'Provision User & Dispatch Email'}
                  </button>
                </form>
              </div>

              {/* User Directory */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-slate-800">User Directory</h3>
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {['student', 'teacher', 'parent'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setUserRoleFilter(r)}
                        className={`text-xs capitalize font-semibold px-3 py-1 rounded-lg transition ${
                          userRoleFilter === r ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        {r}s ({userList.filter(u => u.role === r).length})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <label className="relative flex min-w-[220px] flex-1 items-center">
                    <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="search"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search name, email, class, or roll..."
                      aria-label="Search user directory"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                    {userSearch && (
                      <button type="button" onClick={() => setUserSearch('')} aria-label="Clear user search" className="absolute right-2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </label>
                  <div role="group" aria-label="Table row density" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    {[
                      { id: 'compact', label: 'Compact' },
                      { id: 'comfortable', label: 'Comfortable' },
                    ].map((density) => (
                      <button
                        key={density.id}
                        type="button"
                        aria-pressed={userTableDensity === density.id}
                        onClick={() => setUserTableDensity(density.id)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${userTableDensity === density.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {density.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Details</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUserList.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50">
                          <td className={`${userRowPadding} font-semibold text-slate-800`}>{u.name}</td>
                          <td className={`${userRowPadding} text-slate-600`}>{u.email}</td>
                          <td className={`${userRowPadding} text-slate-500`}>
                            {u.role === 'student' && `${u.classId || '10A'} • Roll: ${u.rollNumber || 'N/A'}`}
                            {u.role === 'teacher' && (
                              <div className="space-y-2">
                                <p>{u.subject || 'Faculty'}</p>
                                <label className="inline-flex items-center gap-2 text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={u.canCreateStudents === true}
                                    disabled={updatingPermissionId === u._id}
                                    onChange={(event) => handleToggleStudentCreation(u, event.target.checked)}
                                    aria-label={`Allow ${u.name} to create student accounts`}
                                    className="h-4 w-4 accent-indigo-600"
                                  />
                                  <span>Can create student accounts</span>
                                </label>
                              </div>
                            )}
                            {u.role === 'parent' && `Guardian`}
                          </td>
                          <td className={`${userRowPadding} text-right`}>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredUserList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-xs text-slate-500">
                            {userSearch ? 'No users match this search.' : 'No users in this role yet.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SCHOOL REGISTRATION & OTP VERIFICATION */}
        {/* ========================================================= */}
        {activeTab === 'school_reg' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
                <Building className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">School Registration with OTP Verification</h3>
              <p className="text-xs text-slate-500">
                Official institution onboarding requiring automated 6-digit email verification.
              </p>
            </div>

            {otpStep === 'initial' && (
              <form onSubmit={handleSendRegistrationOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">School Name</label>
                  <input
                    type="text"
                    value={schoolReg.schoolName}
                    onChange={(e) => setSchoolReg({ ...schoolReg, schoolName: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Official Registration Number</label>
                  <input
                    type="text"
                    value={schoolReg.registrationNumber}
                    onChange={(e) => setSchoolReg({ ...schoolReg, registrationNumber: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Principal / Admin Email</label>
                  <input
                    type="email"
                    value={schoolReg.email}
                    onChange={(e) => setSchoolReg({ ...schoolReg, email: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition"
                >
                  {loading ? 'Sending OTP Code...' : 'Request Email OTP Verification Code'}
                </button>
              </form>
            )}

            {otpStep === 'otp_sent' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                  <p className="text-xs text-indigo-700">
                    A 6-digit verification code has been dispatched to <strong>{schoolReg.email}</strong>.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={schoolReg.otp}
                    onChange={(e) => setSchoolReg({ ...schoolReg, otp: e.target.value })}
                    placeholder="123456"
                    className="w-48 mx-auto block text-center tracking-widest text-2xl font-bold py-2 border border-indigo-400 rounded-xl outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep('initial')}
                    className="flex-1 border border-slate-300 py-2.5 rounded-xl text-xs font-semibold text-slate-600"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-xs transition"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP & Complete Registration'}
                  </button>
                </div>
              </form>
            )}

            {otpStep === 'verified' && (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-lg">School Verified Successfully!</h4>
                <p className="text-xs text-emerald-700">
                  {schoolReg.schoolName} is registered and verified under license #{schoolReg.registrationNumber}.
                </p>
                <button
                  onClick={() => setOtpStep('initial')}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Register Another School / Branch
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FEE MANAGEMENT & CONCESSIONS */}
        {/* ========================================================= */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Fee Invoice with Concession */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Issue Invoice / Concession</span>
                </h3>
                <form onSubmit={handleCreateFeeInvoice} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Student Name</label>
                    <select
                      value={newFeeInvoice.studentId}
                      onChange={(e) => {
                        const student = feeStudents.find((entry) => entry._id === e.target.value);
                        setNewFeeInvoice({
                          ...newFeeInvoice,
                          studentId: e.target.value,
                          classId: student?.classId || newFeeInvoice.classId,
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      required
                    >
                      <option value="">Select a student</option>
                      {feeStudents.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name} - {student.email}{student.classId ? ` (${student.classId})` : ''}
                        </option>
                      ))}
                    </select>
                    {feeStudents.length === 0 && (
                      <p className="mt-1 text-xs text-amber-700">No student accounts found. Create a student account first.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fee Title</label>
                    <input
                      type="text"
                      value={newFeeInvoice.title}
                      onChange={(e) => setNewFeeInvoice({ ...newFeeInvoice, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                    <input
                      type="text"
                      value={newFeeInvoice.classId}
                      onChange={(e) => setNewFeeInvoice({ ...newFeeInvoice, classId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Base Amount ($)</label>
                      <input
                        type="number"
                        value={newFeeInvoice.amount}
                        onChange={(e) => setNewFeeInvoice({ ...newFeeInvoice, amount: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Concession ($)</label>
                      <input
                        type="number"
                        value={newFeeInvoice.concessionAmount}
                        onChange={(e) => setNewFeeInvoice({ ...newFeeInvoice, concessionAmount: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Concession Reason</label>
                    <input
                      type="text"
                      value={newFeeInvoice.discountReason}
                      onChange={(e) => setNewFeeInvoice({ ...newFeeInvoice, discountReason: e.target.value })}
                      placeholder="e.g. Merit Scholarship / Financial Aid"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newFeeInvoice.dueDate}
                      onChange={(e) => setNewFeeInvoice({ ...newFeeInvoice, dueDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    Publish Fee Invoice
                  </button>
                </form>
              </div>

              {/* All Invoices Overview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <span>Issued School Fee Statements</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{allFees.length} total</span>
                </h3>

                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3">Fee Title</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">UPI Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {allFees.map((f) => (
                        <tr key={f._id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">{f.student?.name || 'Class Student'}</td>
                          <td className="p-3 text-slate-600">{f.title}</td>
                          <td className="p-3 font-bold">{formatFeeAmount(f.amount)} {f.concessionAmount > 0 && <span className="text-emerald-600 font-normal">(-{formatFeeAmount(f.concessionAmount)})</span>}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${f.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {f.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{new Date(f.dueDate).toLocaleDateString()}</td>
                          <td className="p-3">
                            {f.upiPaymentStatus === 'Under Review' ? (
                              <div className="flex flex-col items-start gap-1.5">
                                <span className="font-mono text-slate-700">UTR: {f.upiReference}</span>
                                <div className="flex gap-1.5">
                                  <button type="button" onClick={() => handleReviewUpiPayment(f._id, 'Confirmed')} disabled={reviewingFeeId === f._id} className="rounded bg-emerald-700 px-2 py-1 font-semibold text-white disabled:opacity-50">Confirm</button>
                                  <button type="button" onClick={() => handleReviewUpiPayment(f._id, 'Rejected')} disabled={reviewingFeeId === f._id} className="rounded bg-rose-700 px-2 py-1 font-semibold text-white disabled:opacity-50">Reject</button>
                                </div>
                              </div>
                            ) : f.upiPaymentStatus === 'Rejected' ? (
                              <span className="text-rose-700">UPI reference rejected</span>
                            ) : f.upiPaymentStatus === 'Confirmed' ? (
                              <span className="text-emerald-700">UPI confirmed</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleSaveFeeStructure} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-800 mb-4">Class Fee Structure</h3>
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-600">Class
                    <input value={newStructure.classId} onChange={(e) => setNewStructure({ ...newStructure, classId: e.target.value })} required className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">Term
                    <input value={newStructure.term} onChange={(e) => setNewStructure({ ...newStructure, term: e.target.value })} required className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
                  </label>
                  {[
                    ['tuitionFee', 'Tuition'],
                    ['examFee', 'Examination'],
                    ['labFee', 'Laboratory'],
                    ['libraryFee', 'Library'],
                  ].map(([field, label]) => (
                    <label key={field} className="block text-xs font-semibold text-slate-600">{label} amount
                      <input type="number" min="0" step="0.01" value={newStructure[field]} onChange={(e) => setNewStructure({ ...newStructure, [field]: e.target.value })} required className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
                    </label>
                  ))}
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm">
                    {loading ? 'Saving...' : 'Save Fee Structure'}
                  </button>
                </div>
              </form>
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-800 mb-4">Saved Class Fee Structures</h3>
                {feeStructures.length === 0 ? (
                  <p className="text-sm text-slate-500">No class fee structures have been saved.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Class</th><th className="p-3">Term</th><th className="p-3">Tuition</th><th className="p-3">Exam</th><th className="p-3">Lab</th><th className="p-3">Library</th><th className="p-3">Total</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {feeStructures.map((structure) => (
                          <tr key={structure._id}>
                            <td className="p-3">{structure.classId}</td><td className="p-3">{structure.term}</td>
                            <td className="p-3">{structure.tuitionFee}</td><td className="p-3">{structure.examFee}</td>
                            <td className="p-3">{structure.labFee}</td><td className="p-3">{structure.libraryFee}</td>
                            <td className="p-3 font-semibold">{structure.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: NOTICES & BROADCAST */}
        {/* ========================================================= */}
        {activeTab === 'notices' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto">
            <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <span>Broadcast Official School Notice</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Pushes real-time notification alerts to all active Teacher, Student, and Parent dashboards.
            </p>

            <form onSubmit={handlePublishNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="e.g. Winter Holiday Schedule & Examination Calendar"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
                  <select
                    value={newNotice.targetAudience}
                    onChange={(e) => setNewNotice({ ...newNotice, targetAudience: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="all">All Portals (Teachers, Students, Parents)</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="students">Students Only</option>
                    <option value="parents">Parents Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={newNotice.priority}
                    onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent Alert</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notice Content</label>
                <textarea
                  rows={4}
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  placeholder="Detailed circular text, instructions, and deadlines..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition"
              >
                {loading ? 'Broadcasting...' : 'Publish & Broadcast Notice'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: SCHOOL SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              <span>School Information & System Settings</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">School Name</label>
                <input
                  type="text"
                  value={schoolSettings.schoolName}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolName: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Official Registration Number</label>
                  <input
                    type="text"
                    value={schoolSettings.registrationNumber}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, registrationNumber: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={schoolSettings.academicYear}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, academicYear: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <label className="block text-xs font-semibold text-slate-600">
                Fee currency
                <select
                  value={schoolSettings.currency || 'USD'}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, currency: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                >
                  {!['USD', 'INR', 'GBP', 'EUR', 'CAD', 'AUD'].includes(String(schoolSettings.currency || '').toUpperCase()) && (
                    <option value={schoolSettings.currency}>{schoolSettings.currency}</option>
                  )}
                  <option value="USD">USD - US Dollar</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={schoolSettings.email}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, email: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={schoolSettings.phone}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, phone: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Principal / Head of Institution</label>
                <input
                  type="text"
                  value={schoolSettings.principalName}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, principalName: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Physical Campus Address</label>
                <input
                  type="text"
                  value={schoolSettings.address}
                  onChange={(e) => setSchoolSettings({ ...schoolSettings, address: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-bold text-slate-800">UPI payment details</h4>
                <p className="mt-1 text-xs text-slate-500">These details appear in fee QR codes. UPI payments require fee currency to be INR.</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    UPI ID
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="schoolname@bank"
                      value={schoolSettings.upiVpa || ''}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, upiVpa: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Payment account name
                    <input
                      type="text"
                      autoComplete="organization"
                      maxLength={100}
                      placeholder="School name"
                      value={schoolSettings.upiPayeeName || ''}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, upiPayeeName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-normal"
                    />
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: CHAT CHANNELS */}
        {/* ========================================================= */}
        {activeTab === 'chat' && (
          <div>
            <h3 className="font-bold text-slate-800 mb-4">Real-Time Administrative Broadcasting Channels</h3>
            <ChatRoom defaultRoomId="school-wide-broadcast" />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: CAMPUS VISITOR GATE PASS (NEW) */}
        {/* ========================================================= */}
        {activeTab === 'visitors' && (
          <div>
            <div className="mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Campus Visitor & Gate Pass System</h3>
              <p className="text-xs text-slate-500 mt-0.5">Issue QR-coded gate passes, monitor visitor check-in/out, and maintain campus security logs.</p>
            </div>
            <VisitorGatePass />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: MERIT & DEMERIT BADGES (NEW) */}
        {/* ========================================================= */}
        {activeTab === 'behavior' && (
          <div>
            <div className="mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Student Merit & Demerit Behavior System</h3>
              <p className="text-xs text-slate-500 mt-0.5">Award merit badges, record demerits, track behavior points, and generate gamified achievement badges.</p>
            </div>
            <BehaviorBadges role="admin" />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 10: CAMPUS RESOURCE BOOKING (NEW) */}
        {/* ========================================================= */}
        {activeTab === 'resources' && (
          <div>
            <div className="mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Campus Resource & Lab Booking</h3>
              <p className="text-xs text-slate-500 mt-0.5">Book labs, auditorium, gym, and media rooms. Live conflict detection prevents double bookings.</p>
            </div>
            <ResourceBooking />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 11: LEAVE REQUEST MANAGEMENT (NEW) */}
        {/* ========================================================= */}
        {activeTab === 'leave' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  Campus Leave Management Center
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  School-wide student leave approvals, excuses, and medical absence verification.
                </p>
              </div>
              <button
                onClick={fetchAdminLeaves}
                disabled={loadingLeaves}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaves ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-xs font-semibold text-slate-500">Total Applications</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{allLeaves.length}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
                <p className="text-xs font-semibold text-amber-700">Pending Review</p>
                <p className="text-2xl font-black text-amber-900 mt-1">
                  {allLeaves.filter((l) => l.status === 'Pending').length}
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
                <p className="text-xs font-semibold text-emerald-700">Approved</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">
                  {allLeaves.filter((l) => l.status === 'Approved').length}
                </p>
              </div>
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
                <p className="text-xs font-semibold text-rose-700">Rejected</p>
                <p className="text-2xl font-black text-rose-900 mt-1">
                  {allLeaves.filter((l) => l.status === 'Rejected').length}
                </p>
              </div>
            </div>

            {/* Controls Bar: Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Requests' },
                  { id: 'Pending', label: 'Pending' },
                  { id: 'Approved', label: 'Approved' },
                  { id: 'Rejected', label: 'Rejected' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAdminLeaveFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      adminLeaveFilter === f.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                    {f.id !== 'all' && (
                      <span className="ml-1.5 opacity-80">
                        ({allLeaves.filter((l) => l.status === f.id).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, class, reason..."
                  value={adminLeaveSearch}
                  onChange={(e) => setAdminLeaveSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Leaves List */}
            {loadingLeaves ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">Loading leave applications...</p>
              </div>
            ) : allLeaves.filter((leave) => {
                const matchesStatus = adminLeaveFilter === 'all' || leave.status === adminLeaveFilter;
                const matchesSearch =
                  !adminLeaveSearch ||
                  (leave.studentName && leave.studentName.toLowerCase().includes(adminLeaveSearch.toLowerCase())) ||
                  (leave.classId && leave.classId.toLowerCase().includes(adminLeaveSearch.toLowerCase())) ||
                  (leave.reason && leave.reason.toLowerCase().includes(adminLeaveSearch.toLowerCase()));
                return matchesStatus && matchesSearch;
              }).length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">No leave requests found</p>
                <p className="text-xs text-slate-400 mt-1">No leave applications match the selected filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allLeaves
                  .filter((leave) => {
                    const matchesStatus = adminLeaveFilter === 'all' || leave.status === adminLeaveFilter;
                    const matchesSearch =
                      !adminLeaveSearch ||
                      (leave.studentName && leave.studentName.toLowerCase().includes(adminLeaveSearch.toLowerCase())) ||
                      (leave.classId && leave.classId.toLowerCase().includes(adminLeaveSearch.toLowerCase())) ||
                      (leave.reason && leave.reason.toLowerCase().includes(adminLeaveSearch.toLowerCase()));
                    return matchesStatus && matchesSearch;
                  })
                  .map((leave) => {
                    const fromStr = new Date(leave.fromDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const toStr = new Date(leave.toDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const daysCount = Math.max(
                      1,
                      Math.round((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1
                    );

                    const statusStyles = {
                      Pending: 'bg-amber-100 text-amber-800 border-amber-200',
                      Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
                    };

                    const typeStyles = {
                      Sick: 'bg-red-50 text-red-700 border-red-200',
                      Personal: 'bg-blue-50 text-blue-700 border-blue-200',
                      Family: 'bg-purple-50 text-purple-700 border-purple-200',
                      Academic: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                      Other: 'bg-slate-50 text-slate-700 border-slate-200',
                    };

                    return (
                      <div
                        key={leave._id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-[240px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 text-base">{leave.studentName}</span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                                {leave.classId}
                              </span>
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                  typeStyles[leave.leaveType] || typeStyles.Other
                                }`}
                              >
                                {leave.leaveType} Leave
                              </span>
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                                  statusStyles[leave.status] || statusStyles.Pending
                                }`}
                              >
                                {leave.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {fromStr} — {toStr} ({daysCount} {daysCount === 1 ? 'day' : 'days'})
                              </span>
                            </p>

                            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-xs font-semibold text-slate-500 mb-0.5">Reason:</p>
                              <p className="text-sm text-slate-800 leading-relaxed">{leave.reason}</p>
                            </div>

                            {leave.reviewedBy && (
                              <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-2">
                                <span>
                                  Reviewed by <strong className="text-slate-700">{leave.reviewedBy.name}</strong> (
                                  {leave.reviewedBy.role}) on{' '}
                                  {leave.reviewedAt ? new Date(leave.reviewedAt).toLocaleDateString() : 'N/A'}
                                </span>
                                {leave.reviewNote && (
                                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md italic">
                                    "{leave.reviewNote}"
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            {leave.status === 'Pending' ? (
                              <>
                                <button
                                  onClick={() =>
                                    setReviewingAdminLeaveId(reviewingAdminLeaveId === leave._id ? null : leave._id)
                                  }
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                  {reviewingAdminLeaveId === leave._id ? 'Cancel' : 'Add Note'}
                                </button>
                                <button
                                  onClick={() => handleAdminReviewLeave(leave._id, 'Approved')}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleAdminReviewLeave(leave._id, 'Rejected')}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  setReviewingAdminLeaveId(reviewingAdminLeaveId === leave._id ? null : leave._id)
                                }
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                              >
                                {reviewingAdminLeaveId === leave._id ? 'Cancel' : 'Change Decision'}
                              </button>
                            )}
                          </div>
                        </div>

                        {reviewingAdminLeaveId === leave._id && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Admin Review Note / Reason for decision:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={adminReviewNote}
                                onChange={(e) => setAdminReviewNote(e.target.value)}
                                placeholder="e.g. Approved with condition of submitting medical slip..."
                                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => handleAdminReviewLeave(leave._id, 'Approved')}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAdminReviewLeave(leave._id, 'Rejected')}
                                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;