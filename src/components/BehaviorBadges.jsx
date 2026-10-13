import React, { useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import {
  Star,
  Award,
  AlertTriangle,
  Trophy,
  Heart,
  Zap,
  Shield,
  Plus,
  Loader2,
  Trash2,
} from 'lucide-react';

const BADGE_ICONS = {
  star: Star,
  award: Award,
  'alert-triangle': AlertTriangle,
  trophy: Trophy,
  heart: Heart,
  zap: Zap,
  shield: Shield,
};

const BADGE_COLORS = {
  Merit: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  'Achievement Badge': 'bg-amber-50 border-amber-200 text-amber-700',
  Demerit: 'bg-red-50 border-red-200 text-red-700',
};

const ICON_COLORS = {
  Merit: 'text-emerald-500',
  'Achievement Badge': 'text-amber-500',
  Demerit: 'text-red-500',
};

const CATEGORIES = [
  'Academic Excellence',
  'Leadership & Integrity',
  'Discipline & Respect',
  'Sportsmanship',
  'Community Service',
  'Creative Arts & Innovation',
  'Attendance Star',
  'Behavioral Infraction',
];

const BehaviorBadges = ({ studentId, _studentName, role }) => {
  const { user } = useContext(AuthContext);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({ totalMerits: 0, totalDemerits: 0, netPoints: 0 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId: studentId || '',
    type: 'Merit',
    category: 'Academic Excellence',
    title: '',
    description: '',
    points: 10,
    badgeIcon: 'award',
  });

  const canAward = role === 'teacher' || role === 'admin';
  const targetStudentId = studentId || user?._id;

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/behavior/student/${targetStudentId}`);
      setBadges(res.data.data || []);
      setStats(res.data.stats || { totalMerits: 0, totalDemerits: 0, netPoints: 0 });
    } catch (err) {
      console.error('Failed to fetch badges:', err.message);
    } finally {
      setLoading(false);
    }
  }, [targetStudentId]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/auth/users?role=student');
      setStudents(res.data.data || []);
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
    if (canAward) fetchStudents();
  }, [canAward, fetchBadges, fetchStudents]);

  const handleAward = async (e) => {
    e.preventDefault();
    if (!form.title || !form.studentId) {
      alert('Student and Badge Title are required.');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/behavior/award', {
        ...form,
        points: form.type === 'Demerit' ? -Math.abs(Number(form.points)) : Math.abs(Number(form.points)),
      });
      setForm({ studentId: studentId || '', type: 'Merit', category: 'Academic Excellence', title: '', description: '', points: 10, badgeIcon: 'award' });
      setShowForm(false);
      fetchBadges();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to award badge');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (badgeId) => {
    if (!window.confirm('Remove this behavior record?')) return;
    try {
      await axiosInstance.delete(`/behavior/${badgeId}`);
      fetchBadges();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Merits</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.totalMerits}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-red-600 uppercase">Demerits</p>
          <p className="text-2xl font-bold text-red-700">{stats.totalDemerits}</p>
        </div>
        <div className={`${stats.netPoints >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200'} border rounded-2xl p-4 text-center`}>
          <p className={`text-xs font-semibold uppercase ${stats.netPoints >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>Net Points</p>
          <p className={`text-2xl font-bold ${stats.netPoints >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
            {stats.netPoints >= 0 ? '+' : ''}{stats.netPoints}
          </p>
        </div>
      </div>

      {/* Award Badge Button */}
      {canAward && (
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Award Merit / Demerit'}
        </button>
      )}

      {/* Award Form */}
      {showForm && canAward && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5">
          <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" /> Award Behavior Badge
          </h4>
          <form onSubmit={handleAward} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!studentId && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Student *</label>
                <select
                  required
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.classId || 'N/A'})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, points: e.target.value === 'Demerit' ? 5 : 10, badgeIcon: e.target.value === 'Demerit' ? 'alert-triangle' : 'award' })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="Merit">Merit</option>
                <option value="Demerit">Demerit</option>
                <option value="Achievement Badge">Achievement Badge</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Badge Title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Perfect Attendance, Library Disruption"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Points</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description (optional)</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Details about this merit or demerit..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Award Badge
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Badges List */}
      {loading && badges.length === 0 ? (
        <div className="flex justify-center py-8"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>
      ) : badges.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No behavior records found.</div>
      ) : (
        <div className="space-y-3">
          {badges.map((badge) => {
            const IconComponent = BADGE_ICONS[badge.badgeIcon] || Award;
            return (
              <div
                key={badge._id}
                className={`flex items-start gap-4 p-4 rounded-2xl border ${BADGE_COLORS[badge.type] || 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className={`p-2 rounded-xl bg-white/60 ${ICON_COLORS[badge.type] || 'text-slate-500'}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm truncate">{badge.title}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-xs font-bold ${badge.points >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {badge.points >= 0 ? '+' : ''}{badge.points} pts
                      </span>
                      {canAward && (
                        <button
                          onClick={() => handleDelete(badge._id)}
                          className="ml-2 text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-75 mt-0.5">{badge.category} • {badge.type}</p>
                  {badge.description && <p className="text-xs mt-1 opacity-80">{badge.description}</p>}
                  <p className="text-[10px] mt-1 opacity-60">
                    By {badge.awardedBy?.name || 'Teacher'} • {new Date(badge.dateAwarded).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BehaviorBadges;
