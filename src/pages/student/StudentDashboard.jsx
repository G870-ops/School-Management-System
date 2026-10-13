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
  BookOpen,
  CheckCircle,
  Clock,
  Download,
  CreditCard,
  Award,
  Calendar,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const classId = user?.classId || 'Grade-10A';

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Data States
  const [homeworkList, setHomeworkList] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [_attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, percentage: '0%' });
  const [materials, setMaterials] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [timetableDays, setTimetableDays] = useState([]);
  const [reportCard, setReportCard] = useState(null);

  // Homework submission modal state
  const [selectedHw, setSelectedHw] = useState(null);
  const [submissionText, setSubmissionText] = useState('');

  const [payingFeeId, setPayingFeeId] = useState(null);
  const [upiFee, setUpiFee] = useState(null);

  // Leave Request State
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'Personal', fromDate: '', toDate: '', reason: '' });
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState({ type: '', text: '' });

  const fetchStudentData = useCallback(async () => {
    try {
      // 1. Homework
      const hwRes = await axiosInstance.get(`/homework/class/${classId}`);
      setHomeworkList(hwRes.data.data || []);

      // 2. My Submissions
      const subRes = await axiosInstance.get('/homework/my-submissions');
      setMySubmissions(subRes.data.data || []);

      // 3. Attendance
      const attRes = await axiosInstance.get(`/attendance/student/${user?._id}`);
      setAttendanceRecords(attRes.data.data || []);
      if (attRes.data.stats) setAttendanceStats(attRes.data.stats);

      // 4. Study Materials
      const matRes = await axiosInstance.get(`/materials/class/${classId}`);
      setMaterials(matRes.data.data || []);

      // 5. Fees
      const feeRes = await axiosInstance.get('/fees/my-fees');
      setFees(feeRes.data.data || []);

      // 6. Exams
      const examRes = await axiosInstance.get(`/exams/class/${classId}`);
      setExams(examRes.data.data || []);

      const timetableRes = await axiosInstance.get(`/timetable/class/${encodeURIComponent(classId)}`);
      setTimetableDays(timetableRes.data.data || []);

      // 7. Report Card
      const reportRes = await axiosInstance.get(`/exams/student/${user?._id}/report-card`);
      setReportCard(reportRes.data.data || null);
    } catch (err) {
      console.error('Error fetching student dashboard info:', err);
    }
  }, [classId, user]);

  const fetchMyLeaves = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/leave/my');
      setMyLeaves(res.data.data || []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
    fetchMyLeaves();
  }, [fetchStudentData, fetchMyLeaves]);

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

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setLeaveMsg({ type: '', text: '' });
    setLeaveLoading(true);
    try {
      await axiosInstance.post('/leave/request', leaveForm);
      setLeaveMsg({ type: 'success', text: 'Leave request submitted successfully. Your teacher will review it.' });
      setLeaveForm({ leaveType: 'Personal', fromDate: '', toDate: '', reason: '' });
      fetchMyLeaves();
    } catch (err) {
      setLeaveMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit leave request.' });
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await axiosInstance.delete(`/leave/${leaveId}`);
      fetchMyLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!selectedHw) return;
    setLoading(true);
    try {
      await axiosInstance.post(`/homework/${selectedHw._id}/submit`, {
        submissionText,
      });
      alert('Homework submitted successfully to your teacher!');
      setSelectedHw(null);
      setSubmissionText('');
      fetchStudentData();
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {upiFee && (
        <UpiPaymentModal
          fee={upiFee}
          onClose={() => setUpiFee(null)}
          onSubmitted={() => {
            setUpiFee(null);
            fetchStudentData();
            alert('UPI reference submitted. The invoice will be marked paid after school confirmation.');
          }}
        />
      )}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Welcome Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                Student Academic Workspace
              </span>
              <span className="text-xs text-slate-400">Class: {classId} • Roll: {user?.rollNumber || '101'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Hello, {user?.name}</h1>
            <p className="text-xs text-slate-500">Track homework, examination scores, attendances, digital library and live tuition.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">Attendance</p>
              <p className="text-lg font-bold text-emerald-700">{attendanceStats.percentage}</p>
            </div>
            <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
              <p className="text-[10px] text-indigo-600 font-semibold uppercase">Pending Fees</p>
              <p className="text-lg font-bold text-indigo-700">
                {formatFeeAmount(fees.filter(f => f.status !== 'Paid').reduce((acc, f) => acc + f.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Global AI Assistant Suite */}
        <AIAssistantHub />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
          {[
            { id: 'overview', label: 'Homework & Submissions', icon: BookOpen },
            { id: 'materials', label: 'Study Library', icon: FileText },
            { id: 'fees', label: 'Fee Payment', icon: CreditCard },
            { id: 'exams', label: 'Exams & Report', icon: Award },
            { id: 'timetable', label: 'Timetable', icon: Calendar },
            { id: 'leave', label: 'Leave Requests', icon: AlertCircle },
            { id: 'chat', label: 'Chat', icon: CheckCircle2 },
            { id: 'badges', label: 'My Badges', icon: Award },
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

        {/* TAB 1: HOMEWORK */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assigned Homework */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span>Assigned Class Homework</span>
                  </span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">{homeworkList.length} Tasks</span>
                </h3>

                {homeworkList.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No pending homework assignments.</p>
                ) : (
                  <div className="space-y-3">
                    {homeworkList.map((hw) => {
                      const isSubmitted = mySubmissions.some(s => s.homework?._id === hw._id || s.homework === hw._id);
                      return (
                        <div key={hw._id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                              {hw.subject}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm mt-1">{hw.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{hw.description}</p>
                            <p className="text-[11px] text-indigo-600 font-semibold mt-2">
                              Due Date: {new Date(hw.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            {isSubmitted ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                                <CheckCircle className="w-3.5 h-3.5" /> Submitted
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedHw(hw)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                              >
                                Submit Work
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submissions & Teacher Feedback */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>My Submissions & Teacher Feedback</span>
                </h3>

                {mySubmissions.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">You haven't submitted any homework yet.</p>
                ) : (
                  <div className="space-y-3">
                    {mySubmissions.map((sub) => (
                      <div key={sub._id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-slate-800 text-sm">{sub.homework?.title || 'Assignment'}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                            {sub.status} {sub.grade && `(${sub.grade})`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 italic mb-2">"{sub.submissionText}"</p>
                        {sub.feedback && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800">
                            <strong>Teacher Feedback:</strong> {sub.feedback} {sub.marksObtained !== null && `• Marks: ${sub.marksObtained}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Homework Modal */}
            {selectedHw && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Submit Assignment</h3>
                  <p className="text-xs text-slate-500 mb-4">{selectedHw.title} ({selectedHw.subject})</p>

                  <form onSubmit={handleSubmitHomework} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Your Solution / Answer Text</label>
                      <textarea
                        rows={4}
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Write your answer, summary, or link your Google Drive/Cloud document here..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedHw(null)}
                        className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
                      >
                        {loading ? 'Submitting...' : 'Confirm Submission'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDY LIBRARY */}
        {activeTab === 'materials' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Digital Study Library</h3>
                <p className="text-xs text-slate-500">Download syllabus notes, PDFs, worksheets, and previous year examination papers.</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-xl">
                {materials.length} Resources Available
              </span>
            </div>

            {materials.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No study materials uploaded for your class yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((mat) => (
                  <div key={mat._id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                          {mat.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{mat.subject}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{mat.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mat.description || 'Verified study materials and worksheets.'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[11px] text-slate-400">{mat.fileSize || 'PDF'}</span>
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
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
        )}

        {/* TAB 3: FEES */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Online Fee Statements & Payment</h3>
                <p className="text-xs text-slate-500">Pay term tuition, laboratory, and examination dues securely online.</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl">
                Encrypted Checkout Active
              </span>
            </div>

            {fees.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No fee statements published for this account.</p>
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
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

        {/* TAB 4: EXAMS & REPORT CARD */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            {/* Upcoming Exam Schedule */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Upcoming Examination Schedule</span>
              </h3>

              {exams.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No exams scheduled currently.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {exams.map((ex) => (
                    <div key={ex._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {ex.examType}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">{ex.title}</h4>
                      <p className="text-xs text-indigo-600 font-semibold">{ex.subject}</p>
                      <p className="text-xs text-slate-500 mt-1">Date: {new Date(ex.examDate).toLocaleDateString()}</p>
                      <p className="text-[11px] text-slate-400">Total Marks: {ex.totalMarks} (Pass: {ex.passingMarks})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Official Report Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Official Academic Report Card</span>
                  </h3>
                  <p className="text-xs text-slate-500">Comprehensive score breakdown, grade points, and AI performance evaluation.</p>
                </div>
                {reportCard?.summary && (
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-xl text-sm border border-amber-200">
                      Overall Grade: {reportCard.summary.overallGrade}
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
                <div className="space-y-4">
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                        <tr>
                          <th className="p-3">Examination</th>
                          <th className="p-3">Subject</th>
                          <th className="p-3">Marks</th>
                          <th className="p-3">Grade</th>
                          <th className="p-3">AI Observation & Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {reportCard.results.map((res) => (
                          <tr key={res._id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-800">{res.exam?.title || 'Exam'}</td>
                            <td className="p-3 text-indigo-600 font-medium">{res.exam?.subject || 'Academics'}</td>
                            <td className="p-3 font-bold">{res.marksObtained} / {res.totalMarks}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                                {res.grade}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 italic">
                              {res.aiComment || res.remarks || 'Commendable effort.'}
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
        )}

        {/* TAB 5: TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Class Timetable: {classId}</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold">Academic Schedule</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                const daySchedule = timetableDays.find((entry) => entry.dayOfWeek === day);
                const isToday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()) === day;
                return (
                <div key={day} className={`bg-slate-50 p-4 rounded-xl border ${isToday ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 text-center bg-white py-1.5 rounded-lg border border-slate-200">
                    {day}{isToday ? ' · Today' : ''}
                  </h4>
                  <div className="space-y-2 text-xs">
                    {(daySchedule?.periods || []).slice().sort((a, b) => a.periodNumber - b.periodNumber).map((period) => (
                      <div key={`${day}-${period.periodNumber}`} className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <p className="font-bold text-slate-800">{period.startTime} - {period.endTime}</p>
                        <p className="text-indigo-600 font-medium">{period.subject}</p>
                        <p className="text-[10px] text-slate-400">{period.room || 'Room 101'}{period.teacherName ? ` • ${period.teacherName}` : ''}</p>
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

        {/* TAB 6: LEAVE REQUESTS */}
        {activeTab === 'leave' && (
          <div className="space-y-6">
            {/* Submit Leave Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Apply for Leave
              </h3>
              {leaveMsg.text && (
                <div className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${
                  leaveMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {leaveMsg.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{leaveMsg.text}</span>
                </div>
              )}
              <form onSubmit={handleSubmitLeave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {['Sick Leave', 'Family Emergency', 'Personal', 'Event', 'Medical Appointment', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.fromDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.toDate}
                      min={leaveForm.fromDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave</label>
                  <textarea
                    rows={3}
                    required
                    maxLength={500}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="Briefly explain your reason for the leave request..."
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={leaveLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 disabled:opacity-60"
                  >
                    {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {leaveLoading ? 'Submitting...' : 'Submit Leave Request'}
                  </button>
                </div>
              </form>
            </div>

            {/* My Leave History */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                My Leave Request History
              </h3>
              {myLeaves.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No leave requests submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {myLeaves.map((leave) => (
                    <div key={leave._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                            {leave.leaveType}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{leave.status}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{leave.reason}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(leave.fromDate).toLocaleDateString()} → {new Date(leave.toDate).toLocaleDateString()}
                        </p>
                        {leave.reviewNote && (
                          <p className="text-xs text-slate-600 mt-1 italic">
                            Teacher note: {leave.reviewNote} — {leave.reviewedByName}
                          </p>
                        )}
                      </div>
                      {leave.status === 'Pending' && (
                        <button
                          onClick={() => handleCancelLeave(leave._id)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold border border-red-200 px-2.5 py-1 rounded-lg transition shrink-0"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: CHAT */}
        {activeTab === 'chat' && (
          <div>
            <h3 className="font-bold text-slate-800 mb-4">School & Teacher Chat</h3>
            <ChatRoom defaultRoomId="teacher-student-chat" />
          </div>
        )}

        {/* TAB 7: MY BADGES & POINTS (NEW) */}
        {activeTab === 'badges' && (
          <div>
            <div className="mb-5">
              <h3 className="font-bold text-slate-800 text-lg">My Merit Badges & Behavior Points</h3>
              <p className="text-xs text-slate-500 mt-0.5">View your commendations, achievement badges, and overall behavior score.</p>
            </div>
            <BehaviorBadges studentId={user?._id} role="student" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;