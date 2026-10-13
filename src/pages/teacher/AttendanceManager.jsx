import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Sidebar from '../../components/Sidebar';
import { Save, Check, X } from 'lucide-react';

const AttendanceManager = () => {
  const [classId, setClassId] = useState('Grade-10A');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClassAttendance = async () => {
      try {
        const [studentsResponse, attendanceResponse] = await Promise.all([
          axiosInstance.get(`/auth/users?role=student&classId=${encodeURIComponent(classId)}`),
          axiosInstance.get(`/attendance/monthly?classId=${encodeURIComponent(classId)}&month=${date.slice(5, 7)}&year=${date.slice(0, 4)}`),
        ]);
        const recordsByStudent = new Map(
          (attendanceResponse.data.data || [])
            .filter((record) => record.date === date)
            .map((record) => [String(record.student?._id || record.student), record.status])
        );
        setStudents((studentsResponse.data.data || []).map((student) => ({
          studentId: student._id,
          name: student.name,
          roll: student.rollNumber || 'N/A',
          status: recordsByStudent.get(String(student._id)) || 'Present',
        })));
      } catch (error) {
        setStudents([]);
        console.error('Failed to load class attendance:', error);
      }
    };

    fetchClassAttendance();
  }, [classId, date]);

  const handleStatusChange = (id, newStatus) => {
    setStudents(students.map(s => s.studentId === id ? { ...s, status: newStatus } : s));
  };

  const handleSave = async () => {
    if (students.length === 0) {
      alert('No students are registered in this class.');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/attendance/mark', {
        classId,
        date,
        attendanceData: students.map(s => ({ studentId: s.studentId, status: s.status }))
      });
      alert('Attendance saved successfully & real-time notices sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Daily Attendance Sheet</h1>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Class</label>
            <input type="text" value={classId} onChange={(e) => setClassId(e.target.value)} className="p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 border rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 text-sm font-semibold">
              <tr>
                <th className="p-4">Roll</th>
                <th className="p-4">Student Name</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr><td colSpan="3" className="p-6 text-center text-slate-500">No students found for this class.</td></tr>
              ) : students.map((st) => (
                <tr key={st.studentId} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-slate-500">{st.roll}</td>
                  <td className="p-4 font-medium text-slate-800">{st.name}</td>
                  <td className="p-4 flex justify-center space-x-2">
                    <button 
                      onClick={() => handleStatusChange(st.studentId, 'Present')}
                      className={`p-2 rounded-lg flex items-center space-x-1 ${st.status === 'Present' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      <Check className="w-4 h-4" /> <span>Present</span>
                    </button>
                    <button 
                      onClick={() => handleStatusChange(st.studentId, 'Absent')}
                      className={`p-2 rounded-lg flex items-center space-x-1 ${st.status === 'Absent' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      <X className="w-4 h-4" /> <span>Absent</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={handleSave} disabled={loading || students.length === 0} className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 hover:bg-indigo-700 disabled:opacity-60">
          <Save className="w-5 h-5" /> <span>{loading ? 'Saving...' : 'Submit Attendance'}</span>
        </button>
      </div>
    </div>
  );
};

export default AttendanceManager;