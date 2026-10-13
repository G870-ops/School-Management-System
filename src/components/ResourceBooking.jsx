import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Cpu,
  FlaskConical,
  Mic2,
  Dumbbell,
  Monitor,
  Languages,
  Presentation,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react';

const RESOURCE_ICONS = {
  'Advanced Robotics & AI Lab': Cpu,
  'Senior Physics & Chemistry Lab': FlaskConical,
  'Main Campus Auditorium': Mic2,
  'Indoor Sports Complex & Gymnasium': Dumbbell,
  'Smart Interactive Projector Hub': Monitor,
  'Digital Language & Media Lab': Languages,
  'Conference & Board Room': Presentation,
};

const TIME_SLOTS = [
  '08:30 AM - 10:00 AM',
  '10:15 AM - 11:45 AM',
  '12:15 PM - 01:45 PM',
  '02:00 PM - 03:30 PM',
  '03:45 PM - 05:15 PM',
];

const RESOURCES = [
  'Advanced Robotics & AI Lab',
  'Senior Physics & Chemistry Lab',
  'Main Campus Auditorium',
  'Indoor Sports Complex & Gymnasium',
  'Smart Interactive Projector Hub',
  'Digital Language & Media Lab',
  'Conference & Board Room',
];

const ResourceBooking = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [availability, setAvailability] = useState({});
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null); // { resource, timeSlot }
  const [form, setForm] = useState({ purpose: '', classId: '' });
  const [cancelling, setCancelling] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' | 'myBookings'

  const fetchAvailability = async (date) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/resources/availability', { params: { date } });
      setAvailability(res.data.availability || {});
    } catch (err) {
      console.error('Availability fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await axiosInstance.get('/resources/bookings', { params: { myBookings: 'true' } });
      setMyBookings(res.data.data || []);
    } catch (err) {
      console.error('My bookings fetch error:', err.message);
    }
  };

  useEffect(() => {
    fetchAvailability(selectedDate);
    fetchMyBookings();
  }, [selectedDate]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.purpose) { alert('Please enter purpose of booking.'); return; }
    setLoading(true);
    try {
      await axiosInstance.post('/resources/book', {
        resourceName: bookingSlot.resource,
        date: selectedDate,
        timeSlot: bookingSlot.timeSlot,
        purpose: form.purpose,
        classId: form.classId || 'General',
      });
      alert(`Booked! ${bookingSlot.resource} – ${bookingSlot.timeSlot} on ${selectedDate}`);
      setBookingSlot(null);
      setForm({ purpose: '', classId: '' });
      fetchAvailability(selectedDate);
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      await axiosInstance.put(`/resources/${bookingId}/cancel`);
      fetchMyBookings();
      fetchAvailability(selectedDate);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <label className="text-sm font-semibold text-slate-700">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={today}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('grid')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${view === 'grid' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Availability Grid
          </button>
          <button
            onClick={() => setView('myBookings')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${view === 'myBookings' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            My Bookings
          </button>
        </div>
      </div>

      {/* Booking Dialog */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 mb-1">Book Resource</h3>
            <p className="text-xs text-slate-500 mb-4">{bookingSlot.resource} • {bookingSlot.timeSlot} • {selectedDate}</p>
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Purpose *</label>
                <input
                  required
                  type="text"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="e.g. Grade 10A Physics Lab Session"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Class ID</label>
                <input
                  type="text"
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  placeholder="e.g. Grade-10A"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setBookingSlot(null)} className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Grid */}
      {view === 'grid' && (
        loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 border-b border-slate-200">Resource</th>
                  {TIME_SLOTS.map((slot) => (
                    <th key={slot} className="text-center px-3 py-3 text-xs font-bold text-slate-600 border-b border-slate-200 min-w-[130px]">
                      <Clock className="w-3 h-3 inline mr-1 text-indigo-400" />
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map((resource) => {
                  const Icon = RESOURCE_ICONS[resource] || Cpu;
                  return (
                    <tr key={resource} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-xs text-slate-700">{resource}</span>
                        </div>
                      </td>
                      {TIME_SLOTS.map((slot) => {
                        const slotData = availability[resource]?.[slot];
                        const isAvailable = slotData?.available !== false;
                        return (
                          <td key={slot} className="px-2 py-3 text-center">
                            {isAvailable ? (
                              <button
                                onClick={() => setBookingSlot({ resource, timeSlot: slot })}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition"
                              >
                                <CheckCircle className="w-3 h-3" /> Book
                              </button>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200">
                                  <XCircle className="w-3 h-3" /> Booked
                                </span>
                                {slotData?.bookedBy && (
                                  <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[110px]">{slotData.bookedBy}</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* My Bookings */}
      {view === 'myBookings' && (
        <div className="space-y-3">
          {myBookings.length === 0 ? (
            <div className="text-center py-10 text-slate-400">You have no bookings yet.</div>
          ) : myBookings.map((booking) => {
            const Icon = RESOURCE_ICONS[booking.resourceName] || Cpu;
            return (
              <div key={booking._id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-4">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{booking.resourceName}</p>
                  <p className="text-xs text-slate-500">{booking.date} • {booking.timeSlot}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{booking.purpose}</p>
                  <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                    booking.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' :
                    'bg-amber-100 text-amber-700'
                  }`}>{booking.status}</span>
                </div>
                {booking.status === 'Confirmed' && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    disabled={cancelling === booking._id}
                    className="text-red-400 hover:text-red-600 transition shrink-0"
                  >
                    {cancelling === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResourceBooking;
