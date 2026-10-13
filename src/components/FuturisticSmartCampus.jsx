import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Brain,
  Cpu,
  Target,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  Lock,
  Users,
  Clock,
  Radio,
} from 'lucide-react';

const FuturisticSmartCampus = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role || 'student';

  // --- COMMON SECURITY CHANGE PASSWORD STATE ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  // --- ADMIN & TEACHER: AI INTERVENTION & RISK MATRIX STATE ---
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionPlan, setInterventionPlan] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState('Alex Taylor');
  const [selectedClassId, setSelectedClassId] = useState('Grade-10A');
  const [studentAttendance, setStudentAttendance] = useState('68%');
  const [studentAvgMarks, setStudentAvgMarks] = useState('52');
  const [riskAssessment, setRiskAssessment] = useState('Attendance Deficit & Low Math Unit Score');
  const [behaviorNote, _setBehaviorNote] = useState('Frequently disengaged during afternoon periods');

  // --- ADMIN: SECURITY TELEMETRY STATS ---
  const [securityStats, setSecurityStats] = useState(null);
  const [_statsLoading, setStatsLoading] = useState(false);

  // --- ADMIN & TEACHER: CAMPUS EMERGENCY BROADCAST ---
  const [campusStatus, setCampusStatus] = useState('NORMAL');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // --- STUDENT: AI DOUBT SOLVER & STUDY TARGET SIMULATOR ---
  const [doubtTopic, setDoubtTopic] = useState('');
  const [doubtSubject, setDoubtSubject] = useState('Science');
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtResult, setDoubtResult] = useState(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [showQuizExplanation, setShowQuizExplanation] = useState(false);

  // Attendance Target Simulator State
  const [currentAttPercent, setCurrentAttPercent] = useState(72);
  const [targetAttPercent, setTargetAttPercent] = useState(85);
  const [totalClassesHeld, _setTotalClassesHeld] = useState(60);

  // --- PARENT: GUARDIAN AI PULSE & SUMMARY ---
  const [parentSummaryLoading, setParentSummaryLoading] = useState(false);
  const [parentSummary, setParentSummary] = useState(null);

  // Fetch security stats for Admin/Teacher — defined before useEffect to avoid TDZ
  const fetchSecurityStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axiosInstance.get('/auth/security-stats');
      if (res.data?.success) {
        setSecurityStats(res.data.data);
      }
    } catch (err) {
      console.warn('Security stats fetch warning:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (['admin', 'teacher'].includes(role)) {
      fetchSecurityStats();
    }
  }, [role]);

  // 1. Password Change Handler (Available for all roles)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPwdMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPwdMessage({ type: 'success', text: res.data.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err) {
      setPwdMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update password. Verify current password.',
      });
    } finally {
      setPwdLoading(false);
    }
  };

  // 2. Teacher/Admin: Generate AI Intervention Plan
  const handleGenerateIntervention = async () => {
    setInterventionLoading(true);
    try {
      const res = await axiosInstance.post('/ai/intervention-plan', {
        studentName: selectedStudentName,
        classId: selectedClassId,
        attendanceRate: studentAttendance,
        averageMarks: studentAvgMarks,
        riskFactor: riskAssessment,
        behaviorNotes: behaviorNote,
      });
      setInterventionPlan(res.data.data || res.data.planText);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate intervention plan.');
    } finally {
      setInterventionLoading(false);
    }
  };

  // 3. Teacher/Admin: Trigger Campus Broadcast
  const handleTriggerBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    try {
      await axiosInstance.post('/notices/create', {
        title: `[${campusStatus}] ${broadcastTitle}`,
        content: broadcastMessage,
        targetAudience: 'all',
        priority: campusStatus === 'NORMAL' ? 'Normal' : 'High',
        category: 'Campus Safety',
      });
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Broadcast dispatch failed.');
    }
  };

  // 4. Student: Solve Doubt with AI
  const handleSolveDoubt = async (e) => {
    e.preventDefault();
    if (!doubtTopic.trim()) return;

    setDoubtLoading(true);
    setDoubtResult(null);
    setSelectedQuizOption(null);
    setShowQuizExplanation(false);

    try {
      const res = await axiosInstance.post('/ai/doubt-solver', {
        topic: doubtTopic,
        subject: doubtSubject,
        gradeLevel: user?.classId || '10',
      });
      setDoubtResult(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'AI Doubt Solver is currently busy.');
    } finally {
      setDoubtLoading(false);
    }
  };

  // 5. Parent: Generate AI Summary
  const handleGenerateParentSummary = async () => {
    setParentSummaryLoading(true);
    try {
      const res = await axiosInstance.post('/ai/parent-summary', {
        studentName: user?.name ? `Child of ${user.name}` : 'Student',
        attendancePercentage: '92%',
        recentExams: [{ subject: 'Math', score: 88 }, { subject: 'Science', score: 94 }],
        homeworkCompletion: '95% on-time submissions',
      });
      setParentSummary(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate summary.');
    } finally {
      setParentSummaryLoading(false);
    }
  };

  // Attendance Target Simulator formula:
  // (currentPresent + x) / (totalHeld + x) = target / 100
  // x = (target*totalHeld - 100*currentPresent) / (100 - target)
  const calculateClassesNeeded = () => {
    const target = Number(targetAttPercent);
    const held = Number(totalClassesHeld);
    const currentPct = Number(currentAttPercent);
    const present = (currentPct / 100) * held;

    if (currentPct >= target) return 0;
    if (target >= 100) return 'Indefinite';

    const needed = Math.ceil((target * held - 100 * present) / (100 - target));
    return needed > 0 ? needed : 0;
  };

  return (
    <div className="space-y-6">
      {/* Top Futuristic Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Smart Campus Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {role === 'admin' && 'Admin Executive Neural Command'}
              {role === 'teacher' && 'Teacher AI Guidance & Intervention Suite'}
              {role === 'student' && 'Student AI Learning Copilot & Target Simulator'}
              {role === 'parent' && 'Parent Guardian Safe Campus Pulse'}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Real-time multi-agent communication, proactive risk detection, and cryptographic account security.
            </p>
          </div>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition backdrop-blur-md"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Security & Change Password</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODULE 1: ADMIN & TEACHER CONTROL PANEL (Maximum Control) */}
      {/* ========================================================================= */}
      {['admin', 'teacher'].includes(role) && (
        <div className="space-y-6">
          {/* Security Telemetry & Verification Radar */}
          {securityStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Security Score</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-bold text-emerald-600">{securityStats.securityHealthScore}</span>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">
                  {securityStats.verifiedUsers} of {securityStats.totalUsers} users verified
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unverified Accounts</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-bold text-amber-600">{securityStats.unverifiedUsers}</span>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">Requires 6-Digit OTP verification</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encryption Standard</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-indigo-700">SHA-256 HMAC</span>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">Constant-time timing protection</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OTP Anti-Brute Limit</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-bold text-slate-800">5 Max</span>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">60s cooldown enforcement</span>
              </div>
            </div>
          )}

          {/* AI Student At-Risk Early Warning Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AI Student At-Risk Early Warning & Intervention Engine</h2>
                  <p className="text-xs text-slate-500">Autonomous multi-factor assessment of attendance, homework, and exam marks</p>
                </div>
              </div>
              <button
                onClick={handleGenerateIntervention}
                disabled={interventionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-60"
              >
                {interventionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate AI Intervention Roadmap</span>
              </button>
            </div>

            {/* Configurable Student Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 text-xs font-medium">
              <div>
                <label className="text-slate-500 mb-1 block">Student Name</label>
                <input
                  type="text"
                  value={selectedStudentName}
                  onChange={(e) => setSelectedStudentName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-slate-500 mb-1 block">Class Assigned</label>
                <input
                  type="text"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-slate-500 mb-1 block">Attendance Rate</label>
                <input
                  type="text"
                  value={studentAttendance}
                  onChange={(e) => setStudentAttendance(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-slate-500 mb-1 block">Average Score %</label>
                <input
                  type="text"
                  value={studentAvgMarks}
                  onChange={(e) => setStudentAvgMarks(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-500 mb-1 block">Primary Risk Observation</label>
                <input
                  type="text"
                  value={riskAssessment}
                  onChange={(e) => setRiskAssessment(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Generated AI Intervention Plan Output */}
            {interventionPlan && (
              <div className="mt-6 p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide">
                      {interventionPlan.riskClassification || 'Active Intervention'}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm">
                      4-Week Tailored Action Plan for {interventionPlan.studentName}
                    </h3>
                  </div>
                  <span className="text-xs text-indigo-600 font-semibold">Generated via Gemini AI</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  <strong>Diagnostic Root Cause:</strong> {interventionPlan.rootCauseAnalysis}
                </p>

                {/* 4-Week Roadmap */}
                {Array.isArray(interventionPlan.fourWeekRoadmap) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {interventionPlan.fourWeekRoadmap.map((step) => (
                      <div key={step.week} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold text-indigo-600 block">WEEK {step.week}</span>
                        <h4 className="font-bold text-slate-800 text-xs mt-0.5">{step.target}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-normal">{step.actions}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Directives & Collaboration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Teacher Action Directives</span>
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                      {interventionPlan.teacherDirectives?.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Parent Collaboration Checkpoints</span>
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                      {interventionPlan.parentCollaboration?.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {interventionPlan.motivationalMessage && (
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-900 text-xs italic border border-purple-200">
                    💬 &ldquo;{interventionPlan.motivationalMessage}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campus Emergency Broadcast Radar (Admin / Teacher Exclusive) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Campus Real-Time Broadcast & Safety Radar</h3>
                  <p className="text-xs text-slate-500">Pushes immediate notifications across all student, parent, and staff devices</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {['NORMAL', 'WEATHER_ALERT', 'LOCKDOWN_DRILL'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setCampusStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      campusStatus === status
                        ? status === 'NORMAL'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleTriggerBroadcast} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Broadcast Headline (e.g., Heavy Rain: Early Dismissal at 2:00 PM)"
                  required
                  className="sm:col-span-1 p-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Detailed instructions for parents and students..."
                  required
                  className="sm:col-span-2 p-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {broadcastSuccess ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Broadcast dispatched simultaneously to all connected channels!</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Broadcast is logged in public notice registers.</span>
                )}

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 2: STUDENT FOCUSED AI COPILOT & TARGET SIMULATOR (Student Control) */}
      {/* ========================================================================= */}
      {role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Doubt Solver & Concept Hook */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">AI Neural Doubt Solver & Concept Explainer</h3>
                <p className="text-xs text-slate-500">Ask any homework question or academic concept for step-by-step guidance</p>
              </div>
            </div>

            <form onSubmit={handleSolveDoubt} className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={doubtSubject}
                  onChange={(e) => setDoubtSubject(e.target.value)}
                  className="col-span-1 p-2.5 text-xs rounded-xl border border-slate-300 outline-none"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science (Physics/Chem/Bio)</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Social Studies">History / Geography</option>
                  <option value="English">English Literature</option>
                </select>

                <input
                  type="text"
                  value={doubtTopic}
                  onChange={(e) => setDoubtTopic(e.target.value)}
                  placeholder="E.g., Quantum Entanglement, Pythagoras Theorem, Photosynthesis"
                  required
                  className="col-span-2 p-2.5 text-xs rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={doubtLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                {doubtLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Deconstruct Concept with AI</span>
              </button>
            </form>

            {doubtResult && (
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-indigo-700">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Concept Mastery: {doubtResult.topic}</span>
                </h4>
                <p className="text-slate-600 leading-relaxed">{doubtResult.simpleExplanation}</p>

                {/* 3-Step Breakdown */}
                {Array.isArray(doubtResult.threeStepBreakdown) && (
                  <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 block text-[11px]">Core Step-by-Step Breakdown:</span>
                    {doubtResult.threeStepBreakdown.map((s, idx) => (
                      <p key={idx} className="text-slate-600 text-[11px] leading-tight">
                        • {s}
                      </p>
                    ))}
                  </div>
                )}

                {/* Memory Hook */}
                {doubtResult.memoryHook && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-medium text-[11px]">
                    {doubtResult.memoryHook}
                  </div>
                )}

                {/* Quick Interactive Self-Test */}
                {doubtResult.quickSelfTest && (
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 mt-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                      Quick Self-Check Challenge
                    </span>
                    <p className="font-semibold text-slate-800 mb-2">{doubtResult.quickSelfTest.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {doubtResult.quickSelfTest.options?.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedQuizOption(i);
                            setShowQuizExplanation(true);
                          }}
                          className={`p-2 rounded-lg text-left text-[11px] border transition ${
                            selectedQuizOption === i
                              ? i === doubtResult.quickSelfTest.correctIndex
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                                : 'bg-red-50 border-red-500 text-red-800'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {showQuizExplanation && (
                      <p className="mt-2 text-[11px] text-emerald-700 font-medium">
                        💡 {doubtResult.quickSelfTest.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attendance Goal & Eligibility Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Attendance Goal & Exam Eligibility Simulator</h3>
                  <p className="text-xs text-slate-500">Calculate how many consecutive classes you must attend to achieve your target percentage</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Current Attendance Rate</span>
                    <span className="text-indigo-600 font-bold">{currentAttPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={currentAttPercent}
                    onChange={(e) => setCurrentAttPercent(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Target Attendance (e.g. 75% for Board Exams)</span>
                    <span className="text-emerald-600 font-bold">{targetAttPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={targetAttPercent}
                    onChange={(e) => setTargetAttPercent(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Consecutive Classes Needed
                  </span>
                  <span className="text-4xl font-extrabold text-indigo-900 block my-2">
                    {calculateClassesNeeded()}
                  </span>
                  <p className="text-xs text-slate-600">
                    {calculateClassesNeeded() === 0
                      ? '🎉 You have already achieved or surpassed this attendance goal!'
                      : `Attend your next ${calculateClassesNeeded()} classes without absence to reach ${targetAttPercent}%.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Academic XP Badge */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Next Milestone: Silver Scholar Rank</span>
              </span>
              <span className="text-indigo-600 font-bold">Level 3</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 3: PARENT GUARDIAN AI INSIGHTS & REAL-TIME PULSE */}
      {/* ========================================================================= */}
      {role === 'parent' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Parent 360° Guardian AI Pulse</h3>
                <p className="text-xs text-slate-500">Holistic academic and behavioral progress digest generated for parents</p>
              </div>
            </div>

            <button
              onClick={handleGenerateParentSummary}
              disabled={parentSummaryLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-60"
            >
              {parentSummaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate AI Weekly Digest</span>
            </button>
          </div>

          {/* Child Safe Campus Indicator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Campus Safety Status</span>
              <span className="text-lg font-bold text-emerald-950 mt-1 block">Present & Engaged</span>
              <span className="text-[11px] text-emerald-700 mt-1 block">Gate check-in recorded on time</span>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <span className="text-[11px] font-bold text-indigo-800 uppercase block">Academic Pace</span>
              <span className="text-lg font-bold text-indigo-950 mt-1 block">Top 15% Percentile</span>
              <span className="text-[11px] text-indigo-700 mt-1 block">Science & Math homework submitted</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[11px] font-bold text-purple-800 uppercase block">Teacher Feedback</span>
              <span className="text-lg font-bold text-purple-950 mt-1 block">Positive Behavior</span>
              <span className="text-[11px] text-purple-700 mt-1 block">Curiosity Star badge awarded</span>
            </div>
          </div>

          {/* Generated AI Parent Summary */}
          {parentSummary && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 text-sm">{parentSummary.summaryHeadline}</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-700 block mb-1">🌟 Recent Highlights & Strengths</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    {parentSummary.highlights?.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-amber-700 block mb-1">🎯 Areas to Gently Support</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    {parentSummary.attentionAreas?.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {parentSummary.parentTip && (
                <div className="p-3 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl font-medium text-[11px]">
                  💡 <strong>Weekend Family Suggestion:</strong> {parentSummary.parentTip}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMMON CHANGE PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Security & Password Management</h3>
                  <p className="text-[11px] text-slate-500">Update your school credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {pwdMessage.text && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs ${
                  pwdMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {pwdMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-60"
                >
                  {pwdLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuturisticSmartCampus;
