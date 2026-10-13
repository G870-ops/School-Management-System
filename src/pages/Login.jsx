import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import {
  GraduationCap,
  Lock,
  Mail,
  Building,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  User,
  ArrowLeft,
} from 'lucide-react';

const Login = () => {
  // Modes: 'login' | 'verify_email' | 'forgot_password' | 'register_student' | 'register_school'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(() => localStorage.getItem('edupro_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(() => localStorage.getItem('edupro_remembered_role') || 'student');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Email Verification State (6-Digit OTP)
  const [verifyEmailAddress, setVerifyEmailAddress] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password Reset State
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'verify_reset'
  const [resetData, setResetData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Student Self-Registration State
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    password: '',
    classId: 'Grade-10A',
    parentEmail: '',
    phone: '',
  });

  // School Admin Setup State
  const [schoolStep, setSchoolStep] = useState('input'); // 'input' | 'otp'
  const [schoolData, setSchoolData] = useState({
    schoolName: '',
    adminName: '',
    email: '',
    password: '',
    otp: '',
  });

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();


  // Cooldown countdown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const roleOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Teacher', value: 'teacher' },
    { label: 'Parent', value: 'parent' },
    { label: 'Admin', value: 'admin' },
  ];

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setSuccessMsg('');
  };

  // Demo Credentials Preset
  const setDemoCredentials = (targetRole) => {
    setRole(targetRole);
    if (targetRole === 'admin') {
      setEmail('admin@school.com');
      setPassword('School@123');
    } else if (targetRole === 'teacher') {
      setEmail('teacher@school.com');
      setPassword('School@123');
    } else if (targetRole === 'parent') {
      setEmail('parent@school.com');
      setPassword('School@123');
    } else {
      setEmail('student@school.com');
      setPassword('School@123');
    }
    setError('');
    setSuccessMsg(`Preset credentials filled for ${targetRole.toUpperCase()}`);
  };

  // Password Strength Calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 3 || score === 4) return { score: 2, label: 'Good', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  // ==========================================
  // 1. LOGIN SUBMIT HANDLER
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      const { token, ...userData } = response.data.data;
      login(userData, token);

      if (rememberMe) {
        localStorage.setItem('edupro_remembered_email', email.trim().toLowerCase());
        localStorage.setItem('edupro_remembered_role', role);
      } else {
        localStorage.removeItem('edupro_remembered_email');
        localStorage.removeItem('edupro_remembered_role');
      }

      if (userData.role === 'admin') navigate('/admin/dashboard');
      else if (userData.role === 'teacher') navigate('/teacher/dashboard');
      else if (userData.role === 'parent') navigate('/parent/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      const resData = err.response?.data;

      // Unverified Account Detection: Auto-transition to 6-digit OTP verification
      if (resData?.requiresVerification) {
        setVerifyEmailAddress(email.trim().toLowerCase());
        setMode('verify_email');
        setResendCooldown(60);
        setError(resData.message || 'Please verify your email using the 6-digit code sent to your inbox.');
        return;
      }

      setError(resData?.message || err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. EMAIL VERIFICATION SUBMIT HANDLER (6-Digit OTP)
  // ==========================================
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (verifyOtp.length !== 6) {
      setError('Please enter all 6 numeric digits of your verification code.');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/verify-email', {
        email: verifyEmailAddress,
        otp: verifyOtp,
      });

      setSuccessMsg(response.data?.message || 'Email verified successfully! Signing you in...');

      if (response.data?.data?.token) {
        const { token, ...userData } = response.data.data;
        login(userData, token);
        setTimeout(() => {
          if (userData.role === 'admin') navigate('/admin/dashboard');
          else if (userData.role === 'teacher') navigate('/teacher/dashboard');
          else if (userData.role === 'parent') navigate('/parent/dashboard');
          else navigate('/student/dashboard');
        }, 1200);
      } else {
        setTimeout(() => {
          setMode('login');
          setVerifyOtp('');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP for Verification
  const handleResendVerificationOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/resend-otp', {
        email: verifyEmailAddress,
        purpose: 'email_verification',
      });
      setResendCooldown(60);
      setSuccessMsg(response.data?.message || 'A fresh 6-digit code has been dispatched to your email.');
      if (response.data?.otp) {
        setSuccessMsg(`Development Mode: Use OTP ${response.data.otp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. FORGOT & RESET PASSWORD HANDLERS
  // ==========================================
  const handleSendForgotPasswordOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/forgot-password', {
        email: resetData.email.trim().toLowerCase(),
      });
      setResetStep('verify_reset');
      setResendCooldown(60);
      setSuccessMsg(response.data?.message || 'If an account exists, a 6-digit reset code has been sent.');
      if (response.data?.otp) {
        setSuccessMsg(`Development Mode: Use Reset OTP ${response.data.otp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (resetData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (resetData.otp.length !== 6) {
      setError('Please provide the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/reset-password', {
        email: resetData.email.trim().toLowerCase(),
        otp: resetData.otp.trim(),
        newPassword: resetData.newPassword,
      });

      setSuccessMsg(response.data?.message || 'Password reset successfully! You can now log in.');
      setEmail(resetData.email.trim().toLowerCase());
      setPassword('');
      setResetData({ email: '', otp: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => {
        setMode('login');
        setResetStep('request');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 4. STUDENT REGISTRATION (Triggers 6-Digit OTP)
  // ==========================================
  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (studentData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/register', {
        name: studentData.name.trim(),
        email: studentData.email.trim().toLowerCase(),
        password: studentData.password,
        role: 'student',
        classId: studentData.classId,
        phone: studentData.phone,
      });

      setVerifyEmailAddress(studentData.email.trim().toLowerCase());
      setMode('verify_email');
      setResendCooldown(60);
      setSuccessMsg(response.data?.message || 'Account created! Enter the 6-digit verification OTP sent to your email.');

      if (response.data?.data?.otp) {
        setSuccessMsg(`Development Mode: Verification OTP is ${response.data.data.otp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Student registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 5. SCHOOL ADMIN SETUP (Backward-Compatible OTP Flow)
  // ==========================================
  const handleSendSchoolOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/send-otp', {
        email: schoolData.email.trim().toLowerCase(),
        purpose: 'school_registration',
        schoolName: schoolData.schoolName,
      });
      setSchoolStep('otp');
      setResendCooldown(60);
      setSuccessMsg('Verification OTP has been sent to the official school email.');
      if (response.data?.otp) {
        setSuccessMsg(`Development Mode OTP: ${response.data.otp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send school registration OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySchoolOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const verification = await axiosInstance.post('/auth/verify-otp', {
        email: schoolData.email.trim().toLowerCase(),
        otp: schoolData.otp,
        purpose: 'school_registration',
      });

      const regRes = await axiosInstance.post('/auth/register', {
        name: schoolData.adminName,
        email: schoolData.email.trim().toLowerCase(),
        password: schoolData.password,
        role: 'admin',
        schoolName: schoolData.schoolName,
        registrationToken: verification.data.registrationToken,
      });

      const { token, ...userData } = regRes.data.data;
      login(userData, token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification or admin registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/40 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white mb-2 shadow-lg shadow-indigo-600/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">EduPro School Portal</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Secure AI-Powered Educational Management</p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Mode Selector Tabs (Visible during normal unauthenticated flows) */}
        {!['verify_email', 'forgot_password'].includes(mode) && (
          <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 rounded-lg transition ${
                mode === 'login' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register_student');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 rounded-lg transition ${
                mode === 'register_student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Student Join
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register_school');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1 rounded-lg transition ${
                mode === 'register_school' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register School
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: SIGN IN MODE */}
        {/* ========================================================================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Portal</label>
                <span className="text-[11px] text-indigo-600 font-semibold capitalize">{role} Account</span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleRoleChange(opt.value)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition ${
                      role === opt.value
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                  placeholder="name@school.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetData({ email, otp: '', newPassword: '', confirmPassword: '' });
                    setResetStep('request');
                    setMode('forgot_password');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember my email</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-md shadow-indigo-600/20 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Sign In as {role.toUpperCase()}</span>
            </button>

            {/* Quick Demo Credentials Preset Bar */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block text-center mb-2">
                ⚡ Quick Demo Login Credentials:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDemoCredentials(opt.value)}
                    className="py-1 px-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[10px] font-semibold text-slate-600 transition text-center"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: 6-DIGIT EMAIL VERIFICATION VIEW */}
        {/* ========================================================================= */}
        {mode === 'verify_email' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="text-center">
              <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Email Verification Required</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit numeric OTP sent to:
                <br />
                <strong className="text-slate-800">{verifyEmailAddress}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 text-center mb-2">
                6-Digit Security Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoFocus
                required
                value={verifyOtp}
                onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ''))}
                className="w-48 mx-auto block text-center tracking-widest text-2xl font-black py-2.5 border-2 border-indigo-500 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="••••••"
              />
              <span className="text-[11px] text-slate-400 text-center block mt-1.5">
                ⏱ Code valid for 10 minutes
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || verifyOtp.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-600/20 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify & Activate Account</span>
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerificationOTP}
                disabled={loading || resendCooldown > 0}
                className="text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FORGOT & RESET PASSWORD FLOW */}
        {/* ========================================================================= */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">
            {resetStep === 'request' ? (
              <form onSubmit={handleSendForgotPasswordOTP} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Reset Your Password</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your registered email address. We will dispatch a secure 6-digit OTP to authorize your password change.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      value={resetData.email}
                      onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                      required
                      autoComplete="email"
                      placeholder="name@school.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm disabled:opacity-60 shadow-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Send 6-Digit Reset Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="w-full py-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel and Return to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Enter Reset OTP & New Password</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the code sent to <strong className="text-slate-800">{resetData.email}</strong>.
                  </p>
                </div>

                {/* 6-Digit OTP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 text-center mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={resetData.otp}
                    onChange={(e) => setResetData({ ...resetData, otp: e.target.value.replace(/\D/g, '') })}
                    className="w-40 mx-auto block text-center tracking-widest text-2xl font-black py-2 border-2 border-indigo-400 rounded-xl outline-none"
                    placeholder="••••••"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetData.newPassword}
                      onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                      required
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {resetData.newPassword && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrength(resetData.newPassword).color}`}
                          style={{ width: `${(getPasswordStrength(resetData.newPassword).score / 3) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {getPasswordStrength(resetData.newPassword).label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={resetData.confirmPassword}
                    onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || resetData.otp.length !== 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm disabled:opacity-60 shadow-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Verify Code & Reset Password</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setResetStep('request')}
                    className="text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Edit Email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendForgotPasswordOTP}
                    disabled={loading || resendCooldown > 0}
                    className="text-indigo-600 font-semibold disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: STUDENT SELF-REGISTRATION (Triggers Verification OTP) */}
        {/* ========================================================================= */}
        {mode === 'register_student' && (
          <form onSubmit={handleStudentRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={studentData.name}
                  onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                  required
                  placeholder="Alex Johnson"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={studentData.email}
                  onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
                  required
                  placeholder="alex@school.com"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={studentData.password}
                  onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Class</label>
                <select
                  value={studentData.classId}
                  onChange={(e) => setStudentData({ ...studentData, classId: e.target.value })}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 outline-none"
                >
                  <option value="Grade-9A">Grade 9-A</option>
                  <option value="Grade-10A">Grade 10-A</option>
                  <option value="Grade-10B">Grade 10-B</option>
                  <option value="Grade-11-Sci">Grade 11 (Science)</option>
                  <option value="Grade-12-Sci">Grade 12 (Science)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={studentData.phone}
                  onChange={(e) => setStudentData({ ...studentData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              🔒 Submitting registration will dispatch a cryptographically hashed 6-digit OTP to your email.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm disabled:opacity-60 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Register & Receive OTP Code</span>
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: SCHOOL ADMIN REGISTRATION (Preserved with Modern UI) */}
        {/* ========================================================================= */}
        {mode === 'register_school' && schoolStep === 'input' && (
          <form onSubmit={handleSendSchoolOTP} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">School Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={schoolData.schoolName}
                  onChange={(e) => setSchoolData({ ...schoolData, schoolName: e.target.value })}
                  required
                  placeholder="St. Augustine International Academy"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Principal / Admin Full Name</label>
              <input
                type="text"
                value={schoolData.adminName}
                onChange={(e) => setSchoolData({ ...schoolData, adminName: e.target.value })}
                required
                placeholder="Dr. Katherine Vance"
                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official School Email</label>
              <input
                type="email"
                value={schoolData.email}
                onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                required
                placeholder="principal@school.edu"
                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password</label>
              <input
                type="password"
                value={schoolData.password}
                onChange={(e) => setSchoolData({ ...schoolData, password: e.target.value })}
                required
                minLength={8}
                placeholder="School@123"
                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Send OTP Verification Email</span>
            </button>
          </form>
        )}

        {mode === 'register_school' && schoolStep === 'otp' && (
          <form onSubmit={handleVerifySchoolOTP} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
              <p className="text-xs text-indigo-700">
                A 6-digit verification code was sent to <strong>{schoolData.email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={schoolData.otp}
                onChange={(e) => setSchoolData({ ...schoolData, otp: e.target.value.replace(/\D/g, '') })}
                placeholder="123456"
                className="w-44 mx-auto block text-center tracking-widest text-2xl font-bold py-2 border border-indigo-400 rounded-xl outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || schoolData.otp.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify & Create School Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setSchoolStep('input')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Back to School Details
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;