import React, { useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import ChatRoom from '../../components/ChatRoom';
import AIAssistantHub from '../../components/AIAssistantHub';
import BehaviorBadges from '../../components/BehaviorBadges';
import ResourceBooking from '../../components/ResourceBooking';
import {
  BookOpen,
  CheckCircle,
  FileUp,
  Calendar,
  Award,
  Users,
  Clock,
  PlusCircle,
  Download,
  Loader2,
  Trash2,
  Pencil,
  UserPlus,
  Cpu,
} from 'lucide-react';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EMPTY_TIMETABLE_PERIOD = {
  periodNumber: '',
  subject: '',
  teacherName: '',
  teacherId: '',
  originalTeacherName: '',
  startTime: '09:00',
  endTime: '09:45',
  room: 'Room 101',
};

const toTimetableTime = (value) => {
  const [hourValue, minuteValue] = value.split(':').map(Number);
  const suffix = hourValue >= 12 ? 'PM' : 'AM';
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minuteValue).padStart(2, '0')} ${suffix}`;
};

const toTimeInputValue = (value) => {
  const match = /^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$/i.exec(String(value || '').trim());
  if (!match) return '';
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
};

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(false);
  const [canCreateStudents, setCanCreateStudents] = useState(user?.canCreateStudents === true);
  const [studentAccount, setStudentAccount] = useState({ name: '', email: '', password: '', rollNumber: '' });
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [studentAccountError, setStudentAccountError] = useState('');
  const [studentAccountMessage, setStudentAccountMessage] = useState('');

  // --- ATTENDANCE STATE ---
  const [classId, setClassId] = useState('Grade-10A');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentsList, setStudentsList] = useState([]);
  const [_attendanceRecords, _setAttendanceRecords] = useState([]);

  // --- HOMEWORK STATE ---
  const [homeworkList, setHomeworkList] = useState([]);
  const [newHw, setNewHw] = useState({ title: '', description: '', subject: 'Mathematics', classId: 'Grade-10A', dueDate: '' });
  const [selectedHwForSubmissions, setSelectedHwForSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradeInput, setGradeInput] = useState({ grade: 'A', marksObtained: 90, feedback: 'Well done!' });

  // --- STUDY MATERIAL STATE ---
  const [materials, setMaterials] = useState([]);
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', subject: 'Mathematics', classId: 'Grade-10A', category: 'PDF' });
  const [materialFile, setMaterialFile] = useState(null);

  // --- TIMETABLE STATE ---
  const [timetableDays, setTimetableDays] = useState([]);
  const [timetableEditorOpen, setTimetableEditorOpen] = useState(false);
  const [timetableDay, setTimetableDay] = useState('Monday');
  const [timetableDraft, setTimetableDraft] = useState(EMPTY_TIMETABLE_PERIOD);
  const [editingPeriodNumber, setEditingPeriodNumber] = useState(null);
  const [savingTimetable, setSavingTimetable] = useState(false);
  const [timetableError, setTimetableError] = useState('');

  // --- EXAMS & RESULTS STATE ---
  const [exams, setExams] = useState([]);
  const [newExam, setNewExam] = useState({ title: 'Midterm Assessment', examType: 'Midterm Exam', classId: 'Grade-10A', subject: 'Mathematics', examDate: '', totalMarks: 100, passingMarks: 35 });
  const [selectedExam, setSelectedExam] = useState(null);
  const [examMarks, setExamMarks] = useState({});

  // --- LEAVE MANAGEMENT STATE ---
  const [classLeaves, setClassLeaves] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState('Pending');
  const [reviewingLeaveId, setReviewingLeaveId] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/auth/users?role=student&classId=${classId}`);
      setStudentsList((res.data.data || []).map((student) => ({
        studentId: student._id,
        name: student.name,
        roll: student.rollNumber || 'N/A',
        status: 'Present',
      })));
    } catch (err) {
      console.error(err);
    }
  }, [classId]);

  const fetchHomework = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/homework/class/${classId}`);
      setHomeworkList(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [classId]);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/materials/class/${classId}`);
      setMaterials(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [classId]);

  const fetchTimetable = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/timetable/class/${classId}`);
      setTimetableDays(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [classId]);

  const fetchExams = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/exams/class/${classId}`);
      setExams(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [classId]);

  const fetchClassLeaves = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/leave/class/${encodeURIComponent(classId)}`);
      setClassLeaves(res.data.data || []);
    } catch {
      // non-critical
    }
  }, [classId]);

  // Initial Data Fetching
  useEffect(() => {
    fetchStudents();
    fetchHomework();
    fetchMaterials();
    fetchTimetable();
    fetchExams();
    fetchClassLeaves();
  }, [fetchStudents, fetchHomework, fetchMaterials, fetchTimetable, fetchExams, fetchClassLeaves]);

  useEffect(() => {
    if (user?.role !== 'teacher') return undefined;
    let active = true;
    axiosInstance.get('/auth/me')
      .then((response) => {
        if (active) setCanCreateStudents(response.data.data?.canCreateStudents === true);
      })
      .catch(() => {
        if (active) setCanCreateStudents(false);
      });
    return () => { active = false; };
  }, [user?._id, user?.role]);

  const openTimetableEditor = (day, period = null) => {
    const dayPeriods = timetableDays.find((entry) => entry.dayOfWeek === day)?.periods || [];
    setTimetableDay(day);
    setEditingPeriodNumber(period?.periodNumber ?? null);
    setTimetableDraft(period ? {
      ...period,
      originalTeacherName: period.teacherName || '',
      startTime: toTimeInputValue(period.startTime),
      endTime: toTimeInputValue(period.endTime),
    } : {
      ...EMPTY_TIMETABLE_PERIOD,
      periodNumber: String(Math.max(0, ...dayPeriods.map((entry) => Number(entry.periodNumber) || 0)) + 1),
      teacherName: user?.name || '',
      teacherId: user?._id || '',
      originalTeacherName: user?.name || '',
    });
    setTimetableError('');
    setTimetableEditorOpen(true);
  };

  const closeTimetableEditor = () => {
    setTimetableEditorOpen(false);
    setEditingPeriodNumber(null);
    setTimetableError('');
  };

  const saveTimetablePeriod = async (event) => {
    event.preventDefault();
    setSavingTimetable(true);
    setTimetableError('');

    const currentPeriods = timetableDays.find((entry) => entry.dayOfWeek === timetableDay)?.periods || [];
    const teacherName = timetableDraft.teacherName.trim();
    const period = {
      ...(timetableDraft._id ? { _id: timetableDraft._id } : {}),
      periodNumber: Number(timetableDraft.periodNumber),
      subject: timetableDraft.subject.trim(),
      teacherName,
      teacherId: teacherName === timetableDraft.originalTeacherName.trim()
        ? timetableDraft.teacherId || undefined
        : undefined,
      startTime: toTimetableTime(timetableDraft.startTime),
      endTime: toTimetableTime(timetableDraft.endTime),
      room: timetableDraft.room.trim() || 'Room 101',
    };
    const otherPeriods = currentPeriods.filter((entry) => Number(entry.periodNumber) !== Number(editingPeriodNumber));
    const periods = [...otherPeriods, period].sort((first, second) => first.periodNumber - second.periodNumber);

    try {
      const response = await axiosInstance.post('/timetable/save', { classId, dayOfWeek: timetableDay, periods });
      setTimetableDays((current) => [
        ...current.filter((entry) => entry.dayOfWeek !== timetableDay),
        response.data.data,
      ].sort((first, second) => WEEK_DAYS.indexOf(first.dayOfWeek) - WEEK_DAYS.indexOf(second.dayOfWeek)));
      closeTimetableEditor();
    } catch (err) {
      setTimetableError(err.response?.data?.message || 'Unable to save this period. Please try again.');
    } finally {
      setSavingTimetable(false);
    }
  };

  const deleteTimetablePeriod = async (day, periodNumber) => {
    if (!window.confirm(`Delete period ${periodNumber} from ${day}?`)) return;
    const dayPeriods = timetableDays.find((entry) => entry.dayOfWeek === day)?.periods || [];
    const periods = dayPeriods.filter((period) => Number(period.periodNumber) !== Number(periodNumber));
    setTimetableError('');
    setSavingTimetable(true);
    try {
      const response = await axiosInstance.post('/timetable/save', { classId, dayOfWeek: day, periods });
      setTimetableDays((current) => [
        ...current.filter((entry) => entry.dayOfWeek !== day),
        response.data.data,
      ].sort((first, second) => WEEK_DAYS.indexOf(first.dayOfWeek) - WEEK_DAYS.indexOf(second.dayOfWeek)));
    } catch (err) {
      setTimetableError(err.response?.data?.message || 'Unable to remove this period. Please try again.');
    } finally {
      setSavingTimetable(false);
    }
  };

  const handleReviewLeave = async (leaveId, status) => {
    try {
      await axiosInstance.put(`/leave/${leaveId}/review`, { status, reviewNote });
      setReviewingLeaveId(null);
      setReviewNote('');
      fetchClassLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review leave request.');
    }
  };

  const handleCreateStudentAccount = async (event) => {
    event.preventDefault();
    setCreatingStudent(true);
    setStudentAccountError('');
    setStudentAccountMessage('');
    try {
      const response = await axiosInstance.post('/auth/create-student', {
        ...studentAccount,
        classId,
      });
      setStudentAccountMessage(response.data.message);
      if (response.data.data?.emailSent) {
        setStudentAccount({ name: '', email: '', password: '', rollNumber: '' });
        fetchStudents();
      }
    } catch (err) {
      setStudentAccountError(err.response?.data?.message || 'Unable to create this student account.');
    } finally {
      setCreatingStudent(false);
    }
  };

  // --- ATTENDANCE ACTIONS ---
  const handleAttStatusChange = (id, newStatus) => {
    setStudentsList(prev => prev.map(s => s.studentId === id ? { ...s, status: newStatus } : s));
  };

  const handleSaveAttendance = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/attendance/mark', {
        classId,
        date: attDate,
        attendanceData: studentsList.map(s => ({ studentId: s.studentId, status: s.status })),
      });
      alert('Attendance saved successfully and broadcasted to Parents in real-time!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  // --- HOMEWORK ACTIONS ---
  const handleCreateHomework = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/homework/create', newHw);
      alert('Homework published & dispatched to students!');
      setNewHw({ title: '', description: '', subject: 'Mathematics', classId, dueDate: '' });
      fetchHomework();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create homework');
    } finally {
      setLoading(false);
    }
  };

  const viewSubmissions = async (hw) => {
    setSelectedHwForSubmissions(hw);
    try {
      const res = await axiosInstance.get(`/homework/${hw._id}/submissions`);
      setSubmissions(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeSubmission = async (submissionId) => {
    try {
      await axiosInstance.put(`/homework/submissions/${submissionId}/grade`, gradeInput);
      alert('Submission graded successfully!');
      if (selectedHwForSubmissions) viewSubmissions(selectedHwForSubmissions);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grade submission');
    }
  };

  // --- STUDY MATERIAL ACTIONS ---
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialFile) {
      alert('Please select a study resource file to upload.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('description', newMaterial.description);
      formData.append('subject', newMaterial.subject);
      formData.append('classId', classId);
      formData.append('category', newMaterial.category);
      formData.append('file', materialFile);

      await axiosInstance.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Study material uploaded successfully via Cloudinary/Storage!');
      setNewMaterial({ title: '', description: '', subject: 'Mathematics', classId, category: 'PDF' });
      setMaterialFile(null);
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // --- EXAM ACTIONS ---
  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/exams/create', newExam);
      alert('Test / Exam created and scheduled!');
      setNewExam({ title: '', examType: 'Unit Test', classId, subject: 'Mathematics', examDate: '', totalMarks: 100, passingMarks: 35 });
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule exam');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExamMarks = async () => {
    if (!selectedExam) return;
    if (studentsList.length === 0) {
      alert('No students are registered in this class.');
      return;
    }
    const hasInvalidMarks = studentsList.some((student) => {
      const marks = examMarks[student.studentId];
      return marks === undefined || marks === '' || !Number.isFinite(Number(marks)) || Number(marks) < 0 || Number(marks) > selectedExam.totalMarks;
    });
    if (hasInvalidMarks) {
      alert('Enter a valid mark for every student before publishing results.');
      return;
    }
    setLoading(true);
    try {
      const resultsPayload = studentsList.map((student) => ({
        studentId: student.studentId,
        marksObtained: Number(examMarks[student.studentId]),
        totalMarks: selectedExam.totalMarks,
        remarks: '',
        aiComment: '',
      }));

      await axiosInstance.post(`/exams/${selectedExam._id}/results`, { results: resultsPayload });
      alert('Exam results published to students and parents.');
      fetchExams();
      setSelectedExam(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish marks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                Faculty Control Hub
              </span>
              <span className="text-xs text-slate-400">Class: {classId}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Teacher Dashboard</h1>
            <p className="text-xs text-slate-500">Welcome, {user?.name}. Manage attendance, assignments, study resources, and examinations.</p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs font-semibold text-slate-600">Active Class:</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                closeTimetableEditor();
              }}
              className="text-sm font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Grade-10A">Grade-10A</option>
              <option value="Grade-10B">Grade-10B</option>
              <option value="Grade-9A">Grade-9A</option>
              <option value="Grade-11-Sci">Grade-11 (Science)</option>
              <option value="Grade-12-Sci">Grade-12 (Science)</option>
            </select>
          </div>
        </div>

        {/* Global AI Intelligence Hub Component */}
        <AIAssistantHub />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
          {[
            { id: 'attendance', label: 'Attendance Register', icon: CheckCircle },
            { id: 'homework', label: 'Homework & Submissions', icon: BookOpen },
            { id: 'materials', label: 'Study Material (Cloudinary)', icon: FileUp },
            { id: 'exams', label: 'Tests & Examination', icon: Award },
            { id: 'timetable', label: 'Weekly Timetable', icon: Calendar },
            { id: 'leave', label: `Leave Requests${classLeaves.filter(l => l.status === 'Pending').length ? ` (${classLeaves.filter(l => l.status === 'Pending').length})` : ''}`, icon: Clock },
            ...(canCreateStudents ? [{ id: 'student_accounts', label: 'Student Accounts', icon: UserPlus }] : []),
            { id: 'chat', label: 'Student & Parent Chat', icon: Users },
            { id: 'behavior', label: 'Merit & Demerit Badges', icon: Award },
            { id: 'resources', label: 'Room & Lab Booking', icon: Cpu },
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
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ATTENDANCE */}
        {/* ========================================================= */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="p-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Enrolled Count</label>
                  <span className="inline-block px-3 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm">
                    {studentsList.length} Students
                  </span>
                </div>
              </div>
              <button
                onClick={handleSaveAttendance}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-xs transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Save & Broadcast Attendance</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Roll</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {studentsList.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono text-slate-500">{st.roll}</td>
                      <td className="p-4 font-semibold text-slate-800">{st.name}</td>
                      <td className="p-4 flex justify-center space-x-2">
                        {['Present', 'Absent', 'Late'].map((stType) => (
                          <button
                            key={stType}
                            onClick={() => handleAttStatusChange(st.studentId, stType)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              st.status === stType
                                ? stType === 'Present'
                                  ? 'bg-emerald-600 text-white'
                                  : stType === 'Absent'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {stType}
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: HOMEWORK & SUBMISSIONS */}
        {/* ========================================================= */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Homework Creation Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  <span>Assign New Homework</span>
                </h3>
                <form onSubmit={handleCreateHomework} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={newHw.title}
                      onChange={(e) => setNewHw({ ...newHw, title: e.target.value })}
                      placeholder="e.g. Exercise 4.2 Quadratic Equations"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                    <input
                      type="text"
                      value={newHw.subject}
                      onChange={(e) => setNewHw({ ...newHw, subject: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newHw.dueDate}
                      onChange={(e) => setNewHw({ ...newHw, dueDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Instructions / Description</label>
                    <textarea
                      rows={3}
                      value={newHw.description}
                      onChange={(e) => setNewHw({ ...newHw, description: e.target.value })}
                      placeholder="Solve questions 1 through 15 and write the step-by-step proofs."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    Publish Assignment
                  </button>
                </form>
              </div>

              {/* Active Homework List */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <span>Current Class Assignments</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{homeworkList.length} total</span>
                </h3>

                {homeworkList.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">No homework assigned yet for {classId}.</p>
                ) : (
                  <div className="space-y-3">
                    {homeworkList.map((hw) => (
                      <div key={hw._id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{hw.subject}</span>
                          <h4 className="font-bold text-slate-800 text-sm mt-1">{hw.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-1">{hw.description}</p>
                          <span className="text-xs text-slate-400">Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => viewSubmissions(hw)}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                        >
                          View Submissions
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submissions Review Modal / Panel */}
                {selectedHwForSubmissions && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-sm mb-3">
                      Submissions for: <span className="text-indigo-600">{selectedHwForSubmissions.title}</span>
                    </h4>
                    {submissions.length === 0 ? (
                      <p className="text-xs text-slate-400">No student submissions submitted yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {submissions.map((sub) => (
                          <div key={sub._id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{sub.student?.name}</p>
                                <p className="text-[11px] text-slate-400">Submitted at {new Date(sub.submittedAt).toLocaleString()}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                {sub.status} {sub.grade && `(${sub.grade})`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg mb-3">{sub.submissionText || 'Completed assignment attachment.'}</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Grade (A+)"
                                value={gradeInput.grade}
                                onChange={(e) => setGradeInput({ ...gradeInput, grade: e.target.value })}
                                className="w-20 px-2 py-1 text-xs border rounded"
                              />
                              <input
                                type="number"
                                placeholder="Marks"
                                value={gradeInput.marksObtained}
                                onChange={(e) => setGradeInput({ ...gradeInput, marksObtained: e.target.value })}
                                className="w-20 px-2 py-1 text-xs border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Feedback"
                                value={gradeInput.feedback}
                                onChange={(e) => setGradeInput({ ...gradeInput, feedback: e.target.value })}
                                className="flex-1 px-2 py-1 text-xs border rounded"
                              />
                              <button
                                onClick={() => handleGradeSubmission(sub._id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold"
                              >
                                Save Grade
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STUDY MATERIAL */}
        {/* ========================================================= */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-indigo-600" />
                  <span>Upload Study Resource</span>
                </h3>
                <form onSubmit={handleUploadMaterial} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Resource Title</label>
                    <input
                      type="text"
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                      placeholder="e.g. Chapter 4 Trigonometry Notes"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                    <select
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
                    >
                      <option value="PDF">PDF Textbook / Document</option>
                      <option value="Notes">Lecture Notes</option>
                      <option value="Worksheet">Practice Worksheet</option>
                      <option value="Previous Year Paper">Previous Year Examination Paper</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                    <input
                      type="text"
                      value={newMaterial.subject}
                      onChange={(e) => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select File (Cloudinary Upload)</label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setMaterialFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    {loading ? 'Uploading...' : 'Upload Resource'}
                  </button>
                </form>
              </div>

              {/* Resource Library */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <span>Class Study Materials Repository</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{materials.length} available</span>
                </h3>

                {materials.length === 0 ? (
                  <p className="text-sm text-slate-400 py-8 text-center">No study materials uploaded for {classId} yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {materials.map((mat) => (
                      <div key={mat._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                              {mat.category}
                            </span>
                            <span className="text-xs text-slate-400">{mat.subject}</span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm">{mat.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{mat.description || 'Reference materials and syllabus practice exercises.'}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-[11px] text-slate-400">{mat.fileSize || 'PDF Doc'}</span>
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: TESTS & EXAMINATIONS */}
        {/* ========================================================= */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Exam Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>Create / Schedule Exam</span>
                </h3>
                <form onSubmit={handleCreateExam} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Assessment Title</label>
                    <input
                      type="text"
                      value={newExam.title}
                      onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                    <select
                      value={newExam.examType}
                      onChange={(e) => setNewExam({ ...newExam, examType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
                    >
                      <option value="Quiz">Quick Quiz</option>
                      <option value="Unit Test">Unit Test</option>
                      <option value="Midterm Exam">Midterm Exam</option>
                      <option value="Final Exam">Final Exam</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                    <input
                      type="text"
                      value={newExam.subject}
                      onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={newExam.examDate}
                        onChange={(e) => setNewExam({ ...newExam, examDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={newExam.totalMarks}
                        onChange={(e) => setNewExam({ ...newExam, totalMarks: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    Schedule Assessment
                  </button>
                </form>
              </div>

              {/* Exams List & Grading Sheet */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
                <h3 className="font-bold text-slate-800 mb-4">Scheduled Assessments</h3>
                {exams.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No assessments scheduled yet.</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {exams.map((ex) => (
                      <div key={ex._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">{ex.examType}</span>
                          <h4 className="font-bold text-slate-800 text-sm mt-1">{ex.title}</h4>
                          <p className="text-xs text-slate-500">Date: {new Date(ex.examDate).toLocaleDateString()} | Total: {ex.totalMarks} Marks</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ex.status === 'Results Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {ex.status}
                          </span>
                          <button
                            onClick={() => setSelectedExam(ex)}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                          >
                            Enter Marks
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Grading Sheet for Selected Exam */}
                {selectedExam && (
                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Grading Sheet: {selectedExam.title}</h4>
                        <p className="text-xs text-slate-500">Enter student scores out of {selectedExam.totalMarks}. AI report comments will be attached automatically.</p>
                      </div>
                      <button
                        onClick={handleSaveExamMarks}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                        <span>Publish Results & Report Cards</span>
                      </button>
                    </div>

                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-semibold">
                          <tr>
                            <th className="p-3">Roll</th>
                            <th className="p-3">Student</th>
                            <th className="p-3">Marks Obtained</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentsList.map((st) => (
                            <tr key={st.studentId} className="hover:bg-slate-50">
                              <td className="p-3 font-mono text-slate-500 text-xs">{st.roll}</td>
                              <td className="p-3 font-medium text-slate-800">{st.name}</td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={selectedExam.totalMarks}
                                  value={examMarks[st.studentId] ?? ''}
                                  onChange={(e) => setExamMarks({ ...examMarks, [st.studentId]: e.target.value })}
                                  className="w-24 px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STUDENT ACCOUNT MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'student_accounts' && canCreateStudents && (
          <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><UserPlus className="h-5 w-5" /></div>
              <div>
                <h3 className="font-bold text-slate-800">Create Student Login</h3>
                <p className="text-xs text-slate-500">New account will be assigned to {classId}. Student username is their email address.</p>
              </div>
            </div>
            <form onSubmit={handleCreateStudentAccount} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">
                Student name
                <input type="text" required maxLength={100} autoComplete="name" value={studentAccount.name} onChange={(event) => setStudentAccount({ ...studentAccount, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Login username (email)
                <input type="email" required autoComplete="email" value={studentAccount.email} onChange={(event) => setStudentAccount({ ...studentAccount, email: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Initial password
                <input type="password" required minLength={8} autoComplete="new-password" value={studentAccount.password} onChange={(event) => setStudentAccount({ ...studentAccount, password: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <span className="mt-1 block font-normal text-slate-500">At least 8 characters. The password is hashed before storage.</span>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Roll number (optional)
                <input type="text" maxLength={40} value={studentAccount.rollNumber} onChange={(event) => setStudentAccount({ ...studentAccount, rollNumber: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              {studentAccountError && <p role="alert" className="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{studentAccountError}</p>}
              {studentAccountMessage && <p role="status" className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{studentAccountMessage}</p>}
              <button type="submit" disabled={creatingStudent} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                <UserPlus className="h-4 w-4" />
                {creatingStudent ? 'Creating student...' : 'Create student account'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: TIMETABLE */}
        {/* ========================================================= */}
        {activeTab === 'timetable' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Weekly Academic Timetable ({classId})</span>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full">Monday-Saturday</span>
            </h3>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Manage periods, subjects, teachers, times, and rooms for the selected class.</p>
              <button
                type="button"
                onClick={() => openTimetableEditor(timetableDay)}
                disabled={savingTimetable}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <PlusCircle className="h-4 w-4" /> Add Period
              </button>
            </div>

            {timetableError && !timetableEditorOpen && (
              <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {timetableError}
              </div>
            )}

            {timetableEditorOpen && (
              <form onSubmit={saveTimetablePeriod} className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-800">{editingPeriodNumber === null ? 'Add period' : 'Edit period'}</h4>
                  <button type="button" onClick={closeTimetableEditor} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Cancel</button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs font-semibold text-slate-700">
                    Day
                    <select value={timetableDay} disabled={editingPeriodNumber !== null} onChange={(event) => setTimetableDay(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100">
                      {WEEK_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Period number
                    <input type="number" min="1" step="1" required value={timetableDraft.periodNumber} onChange={(event) => setTimetableDraft({ ...timetableDraft, periodNumber: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Subject
                    <input type="text" required maxLength={100} value={timetableDraft.subject} onChange={(event) => setTimetableDraft({ ...timetableDraft, subject: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Teacher
                    <input type="text" required maxLength={100} value={timetableDraft.teacherName} onChange={(event) => setTimetableDraft({ ...timetableDraft, teacherName: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Starts
                    <input type="time" required value={timetableDraft.startTime} onChange={(event) => setTimetableDraft({ ...timetableDraft, startTime: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Ends
                    <input type="time" required value={timetableDraft.endTime} onChange={(event) => setTimetableDraft({ ...timetableDraft, endTime: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Room
                    <input type="text" maxLength={100} value={timetableDraft.room} onChange={(event) => setTimetableDraft({ ...timetableDraft, room: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </label>
                  <div className="flex items-end">
                    <button type="submit" disabled={savingTimetable} className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                      {savingTimetable ? 'Saving...' : 'Save Period'}
                    </button>
                  </div>
                </div>
                {timetableError && <p role="alert" className="mt-3 text-xs font-medium text-rose-700">{timetableError}</p>}
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {WEEK_DAYS.map((day) => {
                const daySchedule = timetableDays.find((entry) => entry.dayOfWeek === day);
                const isToday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()) === day;
                return (
                <div key={day} className={`bg-slate-50 p-4 rounded-xl border ${isToday ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 text-center bg-white py-1.5 rounded-lg border border-slate-200">
                    {day}{isToday ? ' · Today' : ''}
                  </h4>
                  <div className="space-y-2 text-xs">
                    {(daySchedule?.periods || []).slice().sort((a, b) => a.periodNumber - b.periodNumber).map((period) => (
                      <div key={`${day}-${period.periodNumber}`} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-800">{period.startTime} - {period.endTime}</p>
                            <p className="text-indigo-600 font-medium">{period.subject}</p>
                            <p className="text-[10px] text-slate-400">{period.room || 'Room 101'}{period.teacherName ? ` • ${period.teacherName}` : ''}</p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button type="button" title="Edit period" aria-label={`Edit ${day} period ${period.periodNumber}`} onClick={() => openTimetableEditor(day, period)} disabled={savingTimetable} className="rounded p-1 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Delete period" aria-label={`Delete ${day} period ${period.periodNumber}`} onClick={() => deleteTimetablePeriod(day, period.periodNumber)} disabled={savingTimetable} className="rounded p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!daySchedule?.periods?.length && <p className="py-4 text-center text-slate-400">No periods scheduled.</p>}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: LEAVE MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'leave' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Student Leave Requests — {classId}</h3>
                <p className="text-xs text-slate-500">Review, approve, or reject leave requests from students in your class.</p>
              </div>
              <div className="flex gap-2">
                {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
                  <button
                    key={f}
                    onClick={() => setLeaveFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      leaveFilter === f
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {(leaveFilter === 'All' ? classLeaves : classLeaves.filter(l => l.status === leaveFilter)).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-400 text-sm">No {leaveFilter === 'All' ? '' : leaveFilter.toLowerCase()} leave requests for {classId}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(leaveFilter === 'All' ? classLeaves : classLeaves.filter(l => l.status === leaveFilter)).map(leave => (
                  <div key={leave._id} className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800">{leave.studentName}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{leave.leaveType}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{leave.status}</span>
                        </div>
                        <p className="text-sm text-slate-700">{leave.reason}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          📅 {new Date(leave.fromDate).toLocaleDateString()} → {new Date(leave.toDate).toLocaleDateString()}
                          <span className="ml-2 text-slate-400">• Submitted {new Date(leave.createdAt).toLocaleDateString()}</span>
                        </p>
                        {leave.reviewNote && (
                          <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 p-2 rounded-lg">Your note: {leave.reviewNote}</p>
                        )}
                      </div>
                      {leave.status === 'Pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setReviewingLeaveId(reviewingLeaveId === leave._id ? null : leave._id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleReviewLeave(leave._id, 'Approved')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReviewLeave(leave._id, 'Rejected')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                    {reviewingLeaveId === leave._id && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Add Review Note (optional)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="e.g. Medical certificate required..."
                            className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleReviewLeave(leave._id, 'Approved')}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold transition hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewLeave(leave._id, 'Rejected')}
                            className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold transition hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: REAL-TIME CHAT */}
        {/* ========================================================= */}
        {activeTab === 'chat' && (
          <div>
            <h3 className="font-bold text-slate-800 mb-4">Real-Time Faculty & Student Communication</h3>
            <ChatRoom defaultRoomId="admin-teacher-chat" />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: MERIT & DEMERIT BADGES (NEW) */}
        {/* ========================================================= */}
        {activeTab === 'behavior' && (
          <div>
            <div className="mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Student Merit & Demerit Records</h3>
              <p className="text-xs text-slate-500 mt-0.5">Award commendations, record infractions, and view student behavior leaderboard.</p>
            </div>
            <BehaviorBadges role="teacher" />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: ROOM & LAB BOOKING (NEW) */}
        {/* ========================================================= */}
        {activeTab === 'resources' && (
          <div>
            <div className="mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Campus Room & Lab Booking</h3>
              <p className="text-xs text-slate-500 mt-0.5">Reserve labs, auditorium, media room and sports complex for your class sessions.</p>
            </div>
            <ResourceBooking />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
