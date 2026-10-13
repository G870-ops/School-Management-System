import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { QRCodeSVG } from 'qrcode.react';
import {
  UserCheck,
  QrCode,
  Plus,
  Search,
  Clock,
  Car,
  Phone,
  LogOut,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

const STATUS_COLORS = {
  'Inside Campus': 'bg-emerald-100 text-emerald-700',
  'Checked Out': 'bg-slate-100 text-slate-500',
  Approved: 'bg-blue-100 text-blue-700',
  Denied: 'bg-red-100 text-red-700',
};

const PURPOSES = [
  'Parent-Teacher Meeting',
  'Fee Payment & Accounts',
  'Emergency Child Pickup',
  'Vendor & Maintenance',
  'Campus Tour & Admission Inquiry',
  'Official Government / Board Inspection',
  'General Visit',
];

const VisitorGatePass = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Inside Campus');
  const [showForm, setShowForm] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [stats, setStats] = useState({ activeInside: 0, totalToday: 0 });
  const [form, setForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    purpose: 'General Visit',
    personToMeet: '',
    vehicleNumber: '',
    notes: '',
  });

  const fetchPasses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await axiosInstance.get('/visitors', { params });
      setPasses(res.data.data || []);
      setStats(res.data.stats || { activeInside: 0, totalToday: 0 });
    } catch (err) {
      console.error('Failed to fetch visitor passes:', err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchPasses();
  }, [fetchPasses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.visitorName || !form.visitorPhone || !form.personToMeet) {
      alert('Visitor Name, Phone, and Person to Meet are required.');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/visitors/create', form);
      setForm({
        visitorName: '',
        visitorPhone: '',
        visitorEmail: '',
        purpose: 'General Visit',
        personToMeet: '',
        vehicleNumber: '',
        notes: '',
      });
      setShowForm(false);
      fetchPasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate gate pass');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (passId) => {
    setCheckingOut(passId);
    try {
      await axiosInstance.put(`/visitors/${passId}/checkout`);
      fetchPasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Currently Inside</p>
            <p className="text-3xl font-bold text-emerald-700">{stats.activeInside}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Passes Issued</p>
            <p className="text-3xl font-bold text-indigo-700">{stats.totalToday}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-center">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Gate Pass
          </button>
        </div>
      </div>

      {/* New Gate Pass Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-500" />
            Issue New Campus Gate Pass
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Visitor Name *</label>
              <input
                type="text"
                required
                value={form.visitorName}
                onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                placeholder="Full name of visitor"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={form.visitorPhone}
                onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })}
                placeholder="+1 555 000 0000"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email (optional)</label>
              <input
                type="email"
                value={form.visitorEmail}
                onChange={(e) => setForm({ ...form, visitorEmail: e.target.value })}
                placeholder="visitor@email.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Person to Meet *</label>
              <input
                type="text"
                required
                value={form.personToMeet}
                onChange={(e) => setForm({ ...form, personToMeet: e.target.value })}
                placeholder="Teacher name / Principal / Admin"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Purpose of Visit</label>
              <select
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                placeholder="e.g. KA 05 AB 1234 (optional)"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Any additional remarks..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Generate QR Gate Pass
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or pass code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'Inside Campus', 'Checked Out', 'Denied'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Passes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : passes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No visitor passes found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {passes.map((pass) => (
            <div
              key={pass._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-indigo-300 transition cursor-pointer flex flex-col gap-3"
              onClick={() => setSelectedPass(selectedPass?._id === pass._id ? null : pass)}
            >
              {/* Pass Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {pass.passCode}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[pass.status] || 'bg-slate-100 text-slate-500'}`}>
                  {pass.status}
                </span>
              </div>

              {/* Visitor Info */}
              <div>
                <p className="font-bold text-slate-800 text-sm">{pass.visitorName}</p>
                <p className="text-xs text-slate-500">{pass.purpose}</p>
              </div>

              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {pass.visitorPhone}
                </div>
                {pass.vehicleNumber && pass.vehicleNumber !== 'None' && (
                  <div className="flex items-center gap-1.5">
                    <Car className="w-3 h-3" /> {pass.vehicleNumber}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  In: {new Date(pass.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {pass.checkOutTime && (
                    <span className="ml-2 text-slate-400">
                      | Out: {new Date(pass.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code + Checkout (when expanded) */}
              {selectedPass?._id === pass._id && (
                <div
                  className="mt-2 flex flex-col items-center gap-3 border-t border-slate-100 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <QRCodeSVG
                    value={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/visitors/verify/${pass.passCode}`}
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#4f46e5"
                    level="M"
                  />
                  <p className="text-[10px] text-slate-400 text-center">
                    Scan to verify at security gate
                  </p>
                  {pass.status === 'Inside Campus' && (
                    <button
                      onClick={() => handleCheckOut(pass._id)}
                      disabled={checkingOut === pass._id}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition"
                    >
                      {checkingOut === pass._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      Mark as Checked Out
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitorGatePass;
