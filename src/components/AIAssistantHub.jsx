import React, { useState, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import {
  Sparkles,
  Bot,
  Brain,
  FileText,
  Bell,
  Calendar,
  BookOpen,
  DollarSign,
  Send,
  Loader2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

const AI_TABS = [
  { id: 'chat', label: 'AI Chat Assistant', icon: Bot, roles: ['admin', 'teacher', 'student', 'parent'] },
  { id: 'insights', label: 'School Insights', icon: Sparkles, roles: ['admin', 'teacher'] },
  { id: 'quiz', label: 'Quiz Generator', icon: Brain, roles: ['teacher', 'admin', 'student'] },
  { id: 'homework', label: 'Homework Helper', icon: BookOpen, roles: ['student', 'parent', 'teacher', 'admin'] },
  { id: 'notice', label: 'Notice Generator', icon: Bell, roles: ['admin', 'teacher'] },
  { id: 'reminder', label: 'Fee Reminder Notice', icon: DollarSign, roles: ['admin', 'teacher'] },
  { id: 'planner', label: 'Event Planner', icon: Calendar, roles: ['admin', 'teacher'] },
  { id: 'comment', label: 'Report Commenter', icon: FileText, roles: ['teacher', 'admin'] },
];

const AIAssistantHub = () => {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || 'student';
  const availableTabs = AI_TABS.filter((t) => t.roles.includes(userRole));

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'chat');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: `Hello ${user?.name || ''}! I'm your EduPro AI assistant. Ask me anything about academics, schedule, or school policies!` },
  ]);
  const [chatInput, setChatInput] = useState('');

  // School Insights State
  const [insightsResult, setInsightsResult] = useState('');

  // Quiz State
  const [quizForm, setQuizForm] = useState({ subject: 'Physics', topic: 'Newton Laws of Motion', grade: '10', questionCount: 4 });
  const [quizResult, setQuizResult] = useState([]);

  // Homework Helper State
  const [hwQuestion, setHwQuestion] = useState('');
  const [hwSubject, setHwSubject] = useState('Mathematics');
  const [hwResult, setHwResult] = useState('');

  // Notice State
  const [noticeForm, setNoticeForm] = useState({ topic: 'Annual Science Fair', audience: 'All Students & Parents', eventDate: 'Next Friday', keyDetails: 'Exhibits submission by 9:00 AM' });
  const [noticeResult, setNoticeResult] = useState('');

  // Fee Reminder State
  const [reminderForm, setReminderForm] = useState({ studentName: 'John Doe', parentName: 'Mr. Doe', feeTitle: 'Term 1 Tuition Fee', amount: 450, dueDate: '2026-10-15', daysOverdue: '3' });
  const [reminderResult, setReminderResult] = useState('');

  // Event Planner State
  const [eventForm, setEventForm] = useState({ eventName: 'Annual Sports Meet 2026', targetDate: 'November 20', budget: '2500', expectedAttendees: '600' });
  const [eventResult, setEventResult] = useState('');

  // Report Card Comment State
  const [commentForm, setCommentForm] = useState({ studentName: 'Jane Smith', performance: 'Excellent', gradeLevel: '10', strengths: 'Consistent homework, active participation', weaknesses: 'Time management in exams' });
  const [commentResult, setCommentResult] = useState('');

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handlers
  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/ai/chat', { message: userText, history: chatMessages });
      setChatMessages((prev) => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'I am currently processing your request. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/insights', {});
      setInsightsResult(res.data.insights);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating insights');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/generate-quiz', quizForm);
      setQuizResult(res.data.quiz || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHomeworkHelp = async (e) => {
    e.preventDefault();
    if (!hwQuestion.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/homework-helper', { question: hwQuestion, subject: hwSubject });
      setHwResult(res.data.solution);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating homework solution');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNotice = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/notice', noticeForm);
      setNoticeResult(res.data.notice);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating notice');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReminder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/fee-reminder', reminderForm);
      setReminderResult(res.data.reminder);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEventPlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/event-planner', eventForm);
      setEventResult(res.data.plan);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating event plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/generate-comment', commentForm);
      setCommentResult(res.data.comment);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              EduPro AI Intelligence Suite
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                Active
              </span>
            </h2>
            <p className="text-xs text-indigo-200">
              Role-tuned AI Assistant for School Insights, Quiz Generation, Homework Helper, Circulars & More
            </p>
          </div>
        </div>

        {/* Tab Selector Pills */}
        <div className="flex flex-wrap gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/10">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Panel */}
      <div className="p-6">
        {/* TAB 1: AI CHAT ASSISTANT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[460px]">
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100 mb-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center space-x-2 text-indigo-600 text-xs font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>EduPro AI is thinking...</span>
                </div>
              )}
            </div>
            <form onSubmit={handleChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask EduPro AI about curriculum, timetable, exams, doubts, or school advice..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Ask AI</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: SCHOOL INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Executive School Health & Trend Analysis</h3>
                <p className="text-xs text-slate-500">
                  AI scans real-time attendance, fee recovery rates, and curriculum progress to generate strategic insights.
                </p>
              </div>
              <button
                onClick={handleGenerateInsights}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{insightsResult ? 'Re-Analyze Metrics' : 'Run AI School Audit'}</span>
              </button>
            </div>

            {insightsResult ? (
              <div className="p-5 bg-indigo-50/40 rounded-xl border border-indigo-100 text-sm leading-relaxed relative">
                <button
                  onClick={() => copyText(insightsResult)}
                  className="absolute top-4 right-4 p-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Report'}</span>
                </button>
                <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line">
                  {insightsResult}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
                <p className="text-sm font-medium">Click "Run AI School Audit" to generate an executive intelligence summary.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUIZ GENERATOR */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <form onSubmit={handleGenerateQuiz} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  value={quizForm.subject}
                  onChange={(e) => setQuizForm({ ...quizForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Topic</label>
                <input
                  type="text"
                  value={quizForm.topic}
                  onChange={(e) => setQuizForm({ ...quizForm, topic: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Grade Level</label>
                <input
                  type="text"
                  value={quizForm.grade}
                  onChange={(e) => setQuizForm({ ...quizForm, grade: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  <span>Generate Quiz</span>
                </button>
              </div>
            </form>

            {quizResult.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Generated Multiple-Choice Questions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizResult.map((q, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <p className="font-semibold text-slate-800 text-sm mb-2">{idx + 1}. {q.question}</p>
                      <div className="space-y-1.5">
                        {q.options?.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg text-xs border ${
                              opt === q.correctAnswer
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 mt-2 italic bg-slate-50 p-2 rounded">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: HOMEWORK HELPER */}
        {activeTab === 'homework' && (
          <div className="space-y-4">
            <form onSubmit={handleGenerateHomeworkHelp} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                  <input
                    type="text"
                    value={hwSubject}
                    onChange={(e) => setHwSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    placeholder="e.g. Chemistry, Algebra, World History"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Question or Concept Doubt</label>
                  <input
                    type="text"
                    value={hwQuestion}
                    onChange={(e) => setHwQuestion(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    placeholder="e.g. How does photosynthesis light reaction produce ATP?"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                <span>Explain Step-by-Step with AI</span>
              </button>
            </form>

            {hwResult && (
              <div className="p-5 bg-sky-50/50 rounded-xl border border-sky-100 text-sm text-slate-800 leading-relaxed whitespace-pre-line relative">
                <button
                  onClick={() => copyText(hwResult)}
                  className="absolute top-4 right-4 p-2 bg-white text-slate-600 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {hwResult}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NOTICE GENERATOR */}
        {activeTab === 'notice' && (
          <div className="space-y-4">
            <form onSubmit={handleGenerateNotice} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Circular Topic</label>
                <input
                  type="text"
                  value={noticeForm.topic}
                  onChange={(e) => setNoticeForm({ ...noticeForm, topic: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={noticeForm.audience}
                  onChange={(e) => setNoticeForm({ ...noticeForm, audience: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date / Period</label>
                <input
                  type="text"
                  value={noticeForm.eventDate}
                  onChange={(e) => setNoticeForm({ ...noticeForm, eventDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Key Action Points</label>
                <input
                  type="text"
                  value={noticeForm.keyDetails}
                  onChange={(e) => setNoticeForm({ ...noticeForm, keyDetails: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  <span>Generate Official Circular Notice</span>
                </button>
              </div>
            </form>

            {noticeResult && (
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs text-sm whitespace-pre-line leading-relaxed relative">
                <button
                  onClick={() => copyText(noticeResult)}
                  className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Notice'}</span>
                </button>
                {noticeResult}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: FEE REMINDER GENERATOR */}
        {activeTab === 'reminder' && (
          <div className="space-y-4">
            <form onSubmit={handleGenerateReminder} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Student Name</label>
                <input
                  type="text"
                  value={reminderForm.studentName}
                  onChange={(e) => setReminderForm({ ...reminderForm, studentName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Parent Name</label>
                <input
                  type="text"
                  value={reminderForm.parentName}
                  onChange={(e) => setReminderForm({ ...reminderForm, parentName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fee Title</label>
                <input
                  type="text"
                  value={reminderForm.feeTitle}
                  onChange={(e) => setReminderForm({ ...reminderForm, feeTitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={reminderForm.amount}
                  onChange={(e) => setReminderForm({ ...reminderForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={reminderForm.dueDate}
                  onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Days Overdue</label>
                <input
                  type="number"
                  value={reminderForm.daysOverdue}
                  onChange={(e) => setReminderForm({ ...reminderForm, daysOverdue: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  <span>Generate Customized Reminder Notice (SMS & Email)</span>
                </button>
              </div>
            </form>

            {reminderResult && (
              <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-200 text-sm whitespace-pre-line leading-relaxed relative">
                <button
                  onClick={() => copyText(reminderResult)}
                  className="absolute top-4 right-4 p-2 bg-white text-slate-600 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {reminderResult}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: EVENT PLANNER */}
        {activeTab === 'planner' && (
          <div className="space-y-4">
            <form onSubmit={handleGenerateEventPlan} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Event Name</label>
                <input
                  type="text"
                  value={eventForm.eventName}
                  onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Date</label>
                <input
                  type="text"
                  value={eventForm.targetDate}
                  onChange={(e) => setEventForm({ ...eventForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Estimated Budget ($)</label>
                <input
                  type="text"
                  value={eventForm.budget}
                  onChange={(e) => setEventForm({ ...eventForm, budget: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Attendees</label>
                <input
                  type="text"
                  value={eventForm.expectedAttendees}
                  onChange={(e) => setEventForm({ ...eventForm, expectedAttendees: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  <span>Generate Event Master Plan</span>
                </button>
              </div>
            </form>

            {eventResult && (
              <div className="p-5 bg-white rounded-xl border border-slate-200 text-sm whitespace-pre-line leading-relaxed relative">
                <button
                  onClick={() => copyText(eventResult)}
                  className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {eventResult}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: REPORT COMMENTER */}
        {activeTab === 'comment' && (
          <div className="space-y-4">
            <form onSubmit={handleGenerateComment} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Student Name</label>
                <input
                  type="text"
                  value={commentForm.studentName}
                  onChange={(e) => setCommentForm({ ...commentForm, studentName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Performance</label>
                <select
                  value={commentForm.performance}
                  onChange={(e) => setCommentForm({ ...commentForm, performance: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                >
                  <option value="Outstanding">Outstanding (A+)</option>
                  <option value="Excellent">Excellent (A)</option>
                  <option value="Good">Good (B+)</option>
                  <option value="Satisfactory">Satisfactory (B)</option>
                  <option value="Needs Improvement">Needs Improvement (C/D)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Key Strengths</label>
                <input
                  type="text"
                  value={commentForm.strengths}
                  onChange={(e) => setCommentForm({ ...commentForm, strengths: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Growth Areas</label>
                <input
                  type="text"
                  value={commentForm.weaknesses}
                  onChange={(e) => setCommentForm({ ...commentForm, weaknesses: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>Generate Report Card Comment</span>
                </button>
              </div>
            </form>

            {commentResult && (
              <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-200 text-sm text-slate-800 leading-relaxed relative">
                <button
                  onClick={() => copyText(commentResult)}
                  className="absolute top-4 right-4 p-2 bg-white text-slate-600 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <p className="font-medium text-emerald-900 mb-1">Personalized Teacher Observation:</p>
                <p className="italic">{commentResult}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantHub;
