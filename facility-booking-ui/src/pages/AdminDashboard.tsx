import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { formatLocalDateTime } from '../utils/date.helper';

interface UserProfile {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatarUrl?: string;
}

interface Facility {
  id: string;
  name: string;
  category: string;
  description?: string;
  capacity?: number;
  location?: string;
  openTime?: string;
  closeTime?: string;
  createdBy?: UserProfile;
  created_by?: UserProfile;
}

interface Booking {
  id: string;
  facility: Facility;
  user: UserProfile;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface TimeSlot {
  timeSlot: string;
  status: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
}

const OFFICIAL_CATEGORIES = ['Office', 'Lounge', 'Experience center', 'Shop', 'Conference Room', 'Auditorium', 'Boardroom', 'Event Space', 'Studio'];

export default function AdminDashboard() {
  // URL Routing for Tabs
  const [searchParams, setSearchParams] = useSearchParams();
  const adminTab = searchParams.get('tab') || 'my-facilities';
  
  const setAdminTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentEmail = localStorage.getItem('userEmail') || '';
  const currentUserId = localStorage.getItem('userId') || '';

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingMessage, setBookingMessage] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Office');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [createError, setCreateError] = useState('');

  const [blockFacilityId, setBlockFacilityId] = useState('');
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [bookRes, facRes] = await Promise.all([
        API.get('/bookings').catch(() => ({ data: { data: [] } })),
        API.get('/facilities').catch(() => ({ data: { data: [] } }))
      ]);

      setBookings(bookRes.data?.data || bookRes.data || []);
      setFacilities(facRes.data?.data || facRes.data || []);
    } catch (err: any) {
      setError('Failed to fetch admin console data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedFacility || !selectedDate) {
      setAvailableSlots([]);
      setSelectedSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setSlotLoading(true);
      try {
        const res = await API.get(`/bookings/facilities/${selectedFacility.id}/available-slots?date=${selectedDate}`);
        setAvailableSlots(res.data?.data || []);
        setSelectedSlots([]);
      } catch (err) {
        console.error('Failed to load time slots', err);
        setAvailableSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };

    fetchSlots();
  }, [selectedFacility, selectedDate]);

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    try {
      await API.post('/facilities', {
        name,
        category,
        description,
        location,
        capacity: Number(capacity),
        openTime,
        closeTime
      });

      alert('Facility created successfully!');
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      setLocation('');
      setCapacity('');
      setOpenTime('09:00');
      setCloseTime('18:00');
      setCategory('Office');
      fetchAdminData();
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setCreateError(
        Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : serverMessage || 'Validation failed. Please check form inputs.'
      );
    }
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Timezone fix for blocking slots
      const startTime = new Date(`${blockDate}T${blockStartTime}:00`).toISOString();
      const endTime = new Date(`${blockDate}T${blockEndTime}:00`).toISOString();

      await API.post('/bookings/block', {
        facilityId: blockFacilityId,
        date: blockDate,
        startTime,
        endTime,
        reason: blockReason
      });

      alert('Time slot successfully blocked for maintenance!');
      setIsBlockModalOpen(false);
      setBlockFacilityId('');
      setBlockDate('');
      setBlockStartTime('');
      setBlockEndTime('');
      setBlockReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to block slot.');
    }
  };

  const handleDeleteFacility = async (facilityId: string) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;

    try {
      await API.delete(`/facilities/${facilityId}`);
      alert('Facility deleted successfully!');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot delete facility with active or pending bookings.');
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  const handleSlotSelection = (slot: TimeSlot) => {
    if (slot.status === 'BOOKED' || slot.status === 'MAINTENANCE') return;

    const slotStartHour = parseInt(slot.timeSlot.split(' - ')[0].split(':')[0]);

    setSelectedSlots((prev) => {
      if (prev.length === 0) return [slot.timeSlot];
      const prevStarts = prev.map(s => parseInt(s.split(' - ')[0].split(':')[0])).sort((a, b) => a - b);
      if (prevStarts.includes(slotStartHour)) return prev.length === 1 ? [] : [slot.timeSlot];
      const minStart = prevStarts[0];
      const maxStart = prevStarts[prevStarts.length - 1];
      if (slotStartHour === maxStart + 1 || slotStartHour === minStart - 1) {
        if (prev.length >= 5) {
          alert('You can book up to a maximum of 5 consecutive hours.');
          return prev;
        }
        return [...prev, slot.timeSlot].sort((a, b) => parseInt(a.split(' - ')[0].split(':')[0]) - parseInt(b.split(' - ')[0].split(':')[0]));
      }
      return [slot.timeSlot];
    });
  };

  const handleCreateAdminBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility || !selectedDate || selectedSlots.length === 0) {
      setBookingMessage('Please select a date and at least one available time slot.');
      return;
    }

    try {
      setBookingMessage('');
      const firstSlot = selectedSlots[0];
      const lastSlot = selectedSlots[selectedSlots.length - 1];
      
      const startHourStr = firstSlot.split(' - ')[0];
      const endHourStr = lastSlot.split(' - ')[1];

      // Timezone fix for creating admin bookings
      const startTime = new Date(`${selectedDate}T${startHourStr}:00`).toISOString();
      const endTime = new Date(`${selectedDate}T${endHourStr}:00`).toISOString();

      await API.post('/bookings', {
        facilityId: selectedFacility.id,
        startTime,
        endTime,
        date: new Date(selectedDate).toISOString(),
        userId: currentUserId,
        userRole: 'ADMIN'
      });

      alert('Facility booked successfully! (Auto-approved for facility owners).');
      setSelectedFacility(null);
      setSelectedDate('');
      setSelectedSlots([]);
      fetchAdminData();
    } catch (err: any) {
      setBookingMessage(err.response?.data?.message || 'Validation failed. Please verify booking slot dates.');
    }
  };

  const myFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const creator = f.createdBy || f.created_by;
      return creator?.email === currentEmail || !creator;
    });
  }, [facilities, currentEmail]);

  const myFacilityBookings = useMemo(() => {
    const myFacilityIds = new Set(myFacilities.map((f) => f.id));
    return bookings.filter((b) => {
      const isMyFacility = myFacilityIds.has(b.facility?.id);
      const matchesStatus = statusFilter === 'ALL' ? true : b.status === statusFilter;
      return isMyFacility && matchesStatus;
    });
  }, [bookings, myFacilities, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar title="Admin Console" />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button
                onClick={() => setAdminTab('my-facilities')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                  adminTab === 'my-facilities' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Facilities ({myFacilities.length})
              </button>
              <button
                onClick={() => setAdminTab('approvals')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                  adminTab === 'approvals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approval Queue ({myFacilityBookings.length})
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsBlockModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                <span>🔧</span> Block Maintenance Slot
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                <span>+</span> Create New Facility
              </button>
            </div>
          </div>

          {loading && <p className="text-slate-500 text-sm">Loading admin data...</p>}
          {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}

          {/* Tab 1: My Facilities */}
          {!loading && adminTab === 'my-facilities' && (
            <div>
              {myFacilities.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                  <p className="text-slate-500 text-sm mb-3">You have not posted any facilities yet.</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Create your first facility now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myFacilities.map((f) => {
                    return (
                      <div key={f.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                              {f.category}
                            </span>
                            <button
                              onClick={() => handleDeleteFacility(f.id)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition"
                            >
                              Delete
                            </button>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{f.name}</h3>
                          <p className="text-slate-600 text-xs mb-4">{f.description || 'No description provided.'}</p>
                          <div className="text-xs text-slate-500 space-y-1 border-t border-slate-100 pt-3">
                            <p>📍 Location: <span className="text-slate-800 font-medium">{f.location || 'Main Campus'}</span></p>
                            <p>👥 Capacity: <span className="text-slate-800 font-medium">{f.capacity || 'N/A'} people</span></p>
                            <p>⏱️ Hours: <span className="text-slate-800 font-medium">{f.openTime || '09:00'} - {f.closeTime || '18:00'}</span></p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFacility(f)}
                          className="w-full mt-4 bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                          Book this Facility
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Approvals Queue */}
          {!loading && adminTab === 'approvals' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs text-slate-500">Showing booking requests for facilities created by you.</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border p-1.5 rounded-lg bg-white focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Only</option>
                    <option value="APPROVED">Approved Only</option>
                    <option value="REJECTED">Rejected Only</option>
                  </select>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
                {myFacilityBookings.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No booking requests found for your facilities.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Facility</th>
                        <th className="px-6 py-3">Start Time</th>
                        <th className="px-6 py-3">End Time</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {myFacilityBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setInspectedUser(b.user)}
                              className="font-semibold text-blue-600 hover:underline text-left block"
                            >
                              {b.user?.email || 'N/A'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-semibold">
                            {b.facility?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{formatLocalDateTime(b.startTime)}</td>
                          <td className="px-6 py-4 text-slate-600">{formatLocalDateTime(b.endTime)}</td>
                          <td className="px-6 py-4 font-semibold">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                b.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {b.status === 'PENDING' ? (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(b.id, 'APPROVED')}
                                  className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-emerald-700 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(b.id, 'REJECTED')}
                                  className="bg-rose-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-rose-700 transition"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No action</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals remain below */}
      {selectedFacility && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Book {selectedFacility.name} (Admin Override)</h3>
            <p className="text-xs text-slate-500 mb-4">
              Operating Hours: {selectedFacility.openTime || '09:00'} – {selectedFacility.closeTime || '18:00'}.
            </p>

            <form onSubmit={handleCreateAdminBooking} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlots([]);
                  }}
                  className="w-full border p-2 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-2">Available Time Slots</label>
                  {slotLoading ? (
                    <p className="text-slate-400 animate-pulse">Calculating available slots...</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-slate-400 italic">No time slots computed.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot, index) => {
                        const isAvailable = slot.status === 'AVAILABLE';
                        const isBooked = slot.status === 'BOOKED';
                        const isMaintenance = slot.status === 'MAINTENANCE';
                        const isSelected = selectedSlots.includes(slot.timeSlot);

                        let style = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer';
                        if (isBooked) style = 'bg-red-50 text-red-500 border-red-200 opacity-50 cursor-not-allowed';
                        if (isMaintenance) style = 'bg-slate-800 text-slate-400 border-slate-900 cursor-not-allowed';
                        if (isSelected) style = 'bg-emerald-600 text-white border-emerald-700 shadow-md transform scale-105';

                        return (
                          <div
                            key={index}
                            onClick={() => handleSlotSelection(slot)}
                            className={`border rounded-lg p-2 text-center transition-all ${style}`}
                          >
                            <p className="font-semibold">{slot.timeSlot}</p>
                            <span className="text-[10px] uppercase font-bold">
                              {isSelected ? 'Selected' : isAvailable ? 'Available' : isBooked ? 'Booked' : 'Maintenance'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {bookingMessage && (
                <div className="p-2 bg-rose-50 border-l-2 border-rose-500 text-rose-700 text-xs rounded">
                  {bookingMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedFacility(null)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Confirm Admin Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Blackout Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Block Slot for Maintenance</h3>
            <p className="text-xs text-slate-500 mb-4">This will render the slot as dark grey and unavailable to users.</p>

            <form onSubmit={handleBlockSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Facility</label>
                <select
                  required
                  value={blockFacilityId}
                  onChange={(e) => setBlockFacilityId(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">Select facility you manage...</option>
                  {myFacilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Hour (e.g. 09:00)</label>
                  <input
                    type="text"
                    placeholder="09:00"
                    required
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Hour (e.g. 10:00)</label>
                  <input
                    type="text"
                    placeholder="10:00"
                    required
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="Routine maintenance"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                >
                  Block Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Facility */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create New Facility</h3>
            <p className="text-xs text-slate-500 mb-4">Add a new facility to the system listing.</p>

            {createError && (
              <div className="mb-3 p-2 bg-rose-50 border-l-2 border-rose-500 text-rose-700 text-xs rounded">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateFacility} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Executive Boardroom B"
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white focus:outline-none"
                >
                  {OFFICIAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about equipment, amenities, or capacity..."
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Block C"
                    className="w-full border p-2 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
                    placeholder="15"
                    className="w-full border p-2 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Open Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full border p-2 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Close Time (HH:MM)</label>
                  <input
                    type="text"
                    required
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    placeholder="18:00"
                    className="w-full border p-2 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Inspection Modal */}
      {inspectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow">
                {(inspectedUser.firstName?.[0] || inspectedUser.email[0]).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {inspectedUser.firstName ? `${inspectedUser.firstName} ${inspectedUser.lastName || ''}` : inspectedUser.email}
                </h3>
                <p className="text-xs text-slate-500">{inspectedUser.email}</p>
              </div>
            </div>

            <button
              onClick={() => setInspectedUser(null)}
              className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold hover:bg-slate-900 mt-4"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}