import React, { useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import ChatRoom from '../../components/ChatRoom';
import AIAssistantHub from '../../components/AIAssistantHub';
import BehaviorBadges from '../../components/BehaviorBadges';
import UpiPaymentModal from '../../components/UpiPaymentModal';
import { payFeeWithStripe, verifyStripeReturn } from '../../utils/feePayment';
import { formatFeeAmount } from '../../utils/currency';
import {
  User,
  CheckCircle2,
  DollarSign,
  BookOpen,
  AlertCircle,
  Bell,
  Award,
  CreditCard,
} from 'lucide-react';

const ParentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [_loading, setLoading] = useState(true);

  // States
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, percentage: '0%' });
  const [homeworkList, setHomeworkList] = useState([]);
  const [notices, setNotices] = useState([]);
  const [reportCard, setReportCard] = useState(null);
  const [payingFeeId, setPayingFeeId] = useState(null);
  const [upiFee, setUpiFee] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const child = children.find((student) => student._id === selectedChildId);

  const fetchChildren = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/auth/my-children');
      const linkedChildren = response.data.data || [];
      setChildren(linkedChildren);
      setSelectedChildId((currentId) =>
        linkedChildren.some((student) => student._id === currentId) ? currentId : linkedChildren[0]?._id || ''
      );
    } catch (err) {
      console.error('Failed to load linked students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchParentData = useCallback(async (studentId = selectedChildId) => {
    const selectedStudent = children.find((student) => student._id === studentId);
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const [feeRes, attRes, hwRes, notRes, reportRes] = await Promise.all([
        axiosInstance.get(`/fees/my-fees?studentId=${encodeURIComponent(selectedStudent._id)}`),
        axiosInstance.get(`/attendance/student/${selectedStudent._id}`),
        axiosInstance.get(`/homework/class/${encodeURIComponent(selectedStudent.classId || '')}`),
        axiosInstance.get('/notices'),
        axiosInstance.get(`/exams/student/${selectedStudent._id}/report-card`),
      ]);
      setFees(feeRes.data.data || []);
      setAttendance(attRes.data.data || []);
      setAttendanceStats(attRes.data.stats || { total: 0, present: 0, percentage: '0%' });
      setHomeworkList(hwRes.data.data || []);
      setNotices(notRes.data.data || []);
      setReportCard(reportRes.data.data || null);
    } catch (err) {
      console.error('Failed to fetch parent dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [children, selectedChildId]);

  useEffect(() => {
    fetchChildren(); 
  }, [user?._id, fetchChildren]);

  useEffect(() => {
    if (selectedChildId) fetchParentData(selectedChildId);
    else if (children.length === 0) setLoading(false);
  }, [selectedChildId, children.length, fetchParentData]);

  useEffect(() => {
    verifyStripeReturn().then((result) => {
      if (!result) return;
      if (result.cancelled) {
        alert('Payment was cancelled.');
        return;
      }
      alert('Payment verified successfully. Your receipt is ready.');
      window.location.reload();
    }).catch((err) => {
      alert(err.response?.data?.message || err.message || 'Payment verification failed.');
    });
  }, []);

  const handlePayFee = async (feeId) => {
    setPayingFeeId(feeId);
    try {
      await payFeeWithStripe(feeId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setPayingFeeId(null);
    }
  };

  const pendingAmount = fees
    .filter((f) => f.status !== 'Paid')
    .reduce((acc, f) => acc + f.amount, 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {upiFee && (
        <UpiPaymentModal
          fee={upiFee}
          onClose={() => setUpiFee(null)}
          onSubmitted={() => {
            setUpiFee(null);
            fetchParentData();
            alert('UPI reference submitted. The invoice will be marked paid after school confirmation.');
          }}
        />
      )}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Parent Portal</h1>
                {children.length > 0 ? (
                  <select
                    value={selectedChildId}
                    onChange={(event) => setSelectedChildId(event.target.value)}
                    className="max-w-full text-xs bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg font-bold"
                    aria-label="Select linked student"
                  >
                    {children.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.classId || 'No class'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                    No linked student
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Welcome, {user?.name}. Monitor academic progress, fee billing, and school announcements.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">Child Attendance</p>
              <p className="text-lg font-bold text-emerald-700">{attendanceStats.percentage}</p>
            </div>
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-[10px] text-amber-600 font-semibold uppercase">Pending Dues</p>
              <p className="text-lg font-bold text-amber-700">{formatFeeAmount(pendingAmount)}</p>
            </div>
          </div>
        </div>

        {/* Global AI Intelligence Hub */}
        <AIAssistantHub />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
          {[
            { id: 'overview', label: 'Child Academic Overview', icon: BookOpen },
            { id: 'fees', label: 'Fee Statements & Payment', icon: CreditCard },
            { id: 'attendance', label: 'Attendance Tracking', icon: CheckCircle2 },
            { id: 'results', label: 'Exam Results & Report Card', icon: Award },
            { id: 'notices', label: 'School Notices & Circulars', icon: Bell },
            { id: 'chat', label: 'School & Teacher Chat', icon: User },
            { id: 'badges', label: "Child's Badges & Points", icon: Award },
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

        {/* TAB 1: ACADEMIC OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Child's Attendance</p>
                  <p className="text-2xl font-bold text-slate-800">{attendanceStats.percentage}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">{attendanceStats.present} days present</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Fee Status</p>
                  <p className="text-2xl font-bold text-slate-800">{formatFeeAmount(pendingAmount)}</p>
                  <p className="text-[11px] text-amber-600 font-semibold">{fees.filter(f => f.status !== 'Paid').length} invoices pending</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Active Homework</p>
                  <p className="text-2xl font-bold text-slate-800">{homeworkList.length}</p>
                  <p className="text-[11px] text-indigo-600 font-semibold">Assigned in {child?.classId || "your child's class"}</p>
                </div>
              </div>
            </div>

            {/* Child Homework List */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span>Active Assignments for {child?.name || 'your child'}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{homeworkList.length} total</span>
              </h3>

              {homeworkList.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No pending homework assignments.</p>
              ) : (
                <div className="space-y-3">
                  {homeworkList.map((hw) => (
                    <div key={hw._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                          {hw.subject}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{hw.title}</h4>
                        <p className="text-xs text-slate-500">{hw.description}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                        Assigned
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FEES */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">School Fee Statements & Online Settlement</h3>
                <p className="text-xs text-slate-500">Pay child tuition, transport, and term fees securely.</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full">
                Auto-Synced with Accounts
              </span>
            </div>

            {fees.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No fee statements published yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Title</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Receipt / Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {fees.map((fee) => (
                    <tr key={fee._id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-800">{fee.title}</td>
                      <td className="p-4 font-bold text-slate-900">{formatFeeAmount(fee.amount)}</td>
                      <td className="p-4 text-slate-500 text-xs">{new Date(fee.dueDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {fee.status === 'Paid' ? (
                          <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            {fee.receiptNumber || 'PAID'}
                          </span>
                        ) : (
                          fee.upiPaymentStatus === 'Under Review' ? (
                            <span className="text-xs font-semibold text-amber-700">UPI payment under review</span>
                          ) : (
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => handlePayFee(fee._id)}
                                disabled={payingFeeId === fee._id}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
                              >
                                {payingFeeId === fee._id ? 'Processing...' : 'Pay by card'}
                              </button>
                              <button
                                onClick={() => setUpiFee(fee)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                              >
                                UPI / QR
                              </button>
                            </div>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Attendance History for {child?.name || 'your child'}</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                {attendanceStats.percentage} Present
              </span>
            </h3>

            {attendance.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No attendance records found.</p>
            ) : (
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {attendance.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{rec.date}</td>
                        <td className="p-3 text-slate-500">{rec.classId}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold ${
                              rec.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'Absent'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXAM RESULTS & REPORT CARD */}
        {activeTab === 'results' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>{child?.name || 'Your child'}'s Academic Progress & Report Card</span>
                </h3>
                <p className="text-xs text-slate-500">Verified examination results with AI qualitative observations.</p>
              </div>
              {reportCard?.summary && (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-xl text-sm border border-amber-200">
                    Grade: {reportCard.summary.overallGrade}
                  </span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm border border-indigo-200">
                    Average: {reportCard.summary.overallPercentage}
                  </span>
                </div>
              )}
            </div>

            {!reportCard || reportCard.results?.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No examination results published yet for this term.</p>
            ) : (
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                    <tr>
                      <th className="p-3">Exam Title</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Teacher & AI Observation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {reportCard.results.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{r.exam?.title || 'Exam'}</td>
                        <td className="p-3 text-indigo-600 font-medium">{r.exam?.subject || 'General'}</td>
                        <td className="p-3 font-bold">{r.marksObtained} / {r.totalMarks}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                            {r.grade}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 italic">
                          {r.aiComment || r.remarks || 'Consistent academic performance.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SCHOOL NOTICES */}
        {activeTab === 'notices' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <span>Official School Notices & Circulars</span>
            </h3>

            {notices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                <p>No active school notices published.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((not) => (
                  <div key={not._id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">
                        {not.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(not.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base mt-2">{not.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{not.content}</p>
                    <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200">
                      Published by: <strong>{not.authorName || 'School Administration'}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: CHAT */}
        {activeTab === 'chat' && (
          <div>
            <h3 className="font-bold text-slate-800 mb-4">Parent Communication Channel</h3>
            <ChatRoom defaultRoomId="parent-communication" />
          </div>
        )}

        {/* TAB 7: CHILD'S BADGES & POINTS (NEW) */}
        {activeTab === 'badges' && (
          <div>
            <div className="mb-5">
              <h3 className="font-bold text-slate-800 text-lg">{child?.name || 'Your child'}'s Merit Badges & Behavior Points</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monitor your child's commendations, achievements, and behavior records issued by teachers.</p>
            </div>
            {child ? <BehaviorBadges studentId={child._id} role="parent" /> : <p className="text-sm text-slate-500">Link a student to view badges.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;