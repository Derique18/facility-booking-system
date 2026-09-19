import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { formatLocalDateTime } from '../utils/date.helper';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface Facility {
  id: string;
  name: string;
  category: string;
  description: string;
  capacity?: number;
  location?: string;
  openTime?: string;
  closeTime?: string;
  createdBy?: UserProfile;
  created_by?: UserProfile;
}

interface Booking {
  id: string;
  facilityId?: string;
  facility: { id?: string; name: string };
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface TimeSlot {
  timeSlot: string;
  status: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
}

const OFFICIAL_CATEGORIES = ['Office', 'Lounge', 'Experience center', 'Shop', 'Conference Room', 'Auditorium', 'Boardroom', 'Event Space', 'Studio'];

export default function Dashboard() {
  // URL Routing for Tabs
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'facilities';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [capacitySort, setCapacitySort] = useState<'highest' | 'lowest' | ''>('');

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [inspectedAdmin, setInspectedAdmin] = useState<UserProfile | null>(null);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingMessage, setBookingMessage] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);

  const currentUserId = localStorage.getItem('userId') || '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [facRes, bookRes] = await Promise.all([
        API.get('/facilities').catch(() => ({ data: { data: [] } })),
        API.get('/bookings/user/me').catch(() => API.get('/bookings/me').catch(() => ({ data: { data: [] } })))
      ]);

      setFacilities(facRes.data?.data || facRes.data || []);
      setMyBookings(bookRes.data?.data || bookRes.data || []);
    } catch (err: any) {
      setError('Failed to load portal data from server.');
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

  const locations = useMemo(() => {
    const set = new Set(facilities.map((f) => f.location).filter(Boolean));
    return Array.from(set);
  }, [facilities]);

  const filteredFacilities = useMemo(() => {
    let filtered = facilities.filter((facility) => {
      const matchesSearch =
        facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? facility.category === selectedCategory : true;
      const matchesLocation = selectedLocation ? facility.location === selectedLocation : true;

      return matchesSearch && matchesCategory && matchesLocation;
    });

    if (capacitySort === 'highest') {
      filtered.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
    } else if (capacitySort === 'lowest') {
      filtered.sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
    }

    return filtered;
  }, [facilities, searchQuery, selectedCategory, selectedLocation, capacitySort]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setCapacitySort('');
  };

  const handleSlotSelection = (slot: TimeSlot) => {
    if (slot.status === 'BOOKED') {
      handleJoinWaitlist(slot);
      return;
    }
    if (slot.status === 'MAINTENANCE') return;

    const slotStartHour = parseInt(slot.timeSlot.split(' - ')[0].split(':')[0]);

    setSelectedSlots((prev) => {
      if (prev.length === 0) return [slot.timeSlot];
      const prevStarts = prev.map(s => parseInt(s.split(' - ')[0].split(':')[0])).sort((a, b) => a - b);
      if (prevStarts.includes(slotStartHour)) {
        return prev.length === 1 ? [] : [slot.timeSlot];
      }
      const minStart = prevStarts[0];
      const maxStart = prevStarts[prevStarts.length - 1];

      if (slotStartHour === maxStart + 1 || slotStartHour === minStart - 1) {
        if (prev.length >= 5) {
          alert('You can only book up to a maximum of 5 consecutive hours.');
          return prev;
        }
        return [...prev, slot.timeSlot].sort((a, b) => parseInt(a.split(' - ')[0].split(':')[0]) - parseInt(b.split(' - ')[0].split(':')[0]));
      }
      return [slot.timeSlot];
    });
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
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

      // Timezone fix for Booking
      const startTime = new Date(`${selectedDate}T${startHourStr}:00`).toISOString();
      const endTime = new Date(`${selectedDate}T${endHourStr}:00`).toISOString();

      const payload: Record<string, any> = {
        facilityId: selectedFacility.id,
        startTime,
        endTime,
        date: new Date(selectedDate).toISOString()
      };

      if (currentUserId && currentUserId.trim() !== '') {
        payload.userId = currentUserId.trim();
      }

      await API.post('/bookings', payload);

      alert('Booking request submitted successfully!');
      setSelectedFacility(null);
      setSelectedDate('');
      setSelectedSlots([]);
      setAvailableSlots([]);
      fetchData();
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setBookingMessage(
        Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : serverMessage || 'Validation failed. Please verify booking slot dates.'
      );
    }
  };

  const handleJoinWaitlist = async (slot: TimeSlot) => {
    if (!selectedFacility || !selectedDate) return;
    const confirmWaitlist = window.confirm(
      `This time slot (${slot.timeSlot}) is currently booked. Would you like to join the waitlist to be emailed automatically if it opens up?`
    );
    if (!confirmWaitlist) return;

    try {
      const [startHourStr, endHourStr] = slot.timeSlot.split(' - ');
      
      // Timezone fix for Waitlist
      const startTime = new Date(`${selectedDate}T${startHourStr}:00`).toISOString();
      const endTime = new Date(`${selectedDate}T${endHourStr}:00`).toISOString();

      await API.post('/bookings/waitlist', {
        facilityId: selectedFacility.id,
        date: selectedDate,
        startTime,
        endTime
      });

      alert('Successfully joined the waitlist! We will email you if this slot opens up.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join waitlist.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will also notify any waitlisted users.')) return;

    try {
      await API.delete(`/bookings/${bookingId}`);
      alert('Booking cancelled successfully.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const adminFacilities = useMemo(() => {
    if (!inspectedAdmin) return [];
    return facilities.filter((f) => {
      const creator = f.createdBy || f.created_by;
      return creator?.email === inspectedAdmin.email;
    });
  }, [facilities, inspectedAdmin]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Note: Navbar now correctly passes URL-based tab state! */}
        <Navbar title="Facility Portal" activeTab={activeTab as any} setActiveTab={setActiveTab as any} />

        <main className="max-w-7xl mx-auto px-6 py-8">
          {loading && <p className="text-slate-500 text-sm">Loading portal data...</p>}
          {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}

          {!loading && activeTab === 'facilities' && (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search facilities by name or keyword..."
                      className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                  </div>

                  {(searchQuery || selectedCategory || selectedLocation || capacitySort) && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-2 border border-rose-200 bg-rose-50 rounded-lg transition"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border p-2 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="">All Categories</option>
                      {OFFICIAL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Location</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full border p-2 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="">All Locations</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Sort by Capacity</label>
                    <select
                      value={capacitySort}
                      onChange={(e) => setCapacitySort(e.target.value as any)}
                      className="w-full border p-2 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="">Default Sorting</option>
                      <option value="highest">Highest Capacity First</option>
                      <option value="lowest">Lowest Capacity First</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Available Spaces ({filteredFacilities.length})
                </h2>
              </div>

              {filteredFacilities.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
                  <p className="text-slate-500 text-sm mb-2">No facilities match your search criteria.</p>
                  <button onClick={clearFilters} className="text-xs text-blue-600 font-semibold hover:underline">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFacilities.map((facility) => {
                    const creator = facility.createdBy || facility.created_by;

                    return (
                      <div
                        key={facility.id}
                        className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                              {facility.category}
                            </span>
                            <button
                              onClick={() =>
                                setInspectedAdmin(
                                  creator || { id: 'sys', email: 'admin@veritas.edu.ng', firstName: 'System Admin' }
                                )
                              }
                              className="text-[11px] text-slate-500 hover:text-blue-600 underline font-medium"
                            >
                              Hosted by {creator?.firstName || creator?.email?.split('@')[0] || 'System Admin'}
                            </button>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 mb-2">{facility.name}</h3>
                          <p className="text-slate-600 text-xs mb-4">{facility.description}</p>

                          <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-3 mb-6">
                            <p>📍 Location: <span className="text-slate-800 font-medium">{facility.location || 'Main Campus'}</span></p>
                            <p>👥 Capacity: <span className="text-slate-800 font-medium">{facility.capacity || 'N/A'} people</span></p>
                            <p>⏱️ Hours: <span className="text-slate-800 font-medium">{facility.openTime || '09:00'} - {facility.closeTime || '18:00'}</span></p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedFacility(facility)}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                        >
                          Book Facility
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!loading && activeTab === 'bookings' && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-6">My Booking Requests</h2>
              {myBookings.length === 0 ? (
                <p className="text-slate-500 text-sm">You have no active or past bookings.</p>
              ) : (
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-6 py-3">Facility</th>
                        <th className="px-6 py-3">Start Time</th>
                        <th className="px-6 py-3">End Time</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {myBookings.map((b) => (
                        <tr key={b.id}>
                          <td className="px-6 py-4 font-semibold text-slate-900">{b.facility?.name || 'Facility'}</td>
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
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1 rounded font-bold text-xs transition"
                            >
                              Cancel Booking
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Admin Profile Inspector Modal */}
      {inspectedAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow">
                {(inspectedAdmin.firstName?.[0] || inspectedAdmin.email[0]).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {inspectedAdmin.firstName ? `${inspectedAdmin.firstName} ${inspectedAdmin.lastName || ''}` : inspectedAdmin.email}
                </h3>
                <p className="text-xs text-slate-500">{inspectedAdmin.email}</p>
                <span className="inline-block mt-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  Facility Administrator
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-800 border-t pt-3 mb-2">
              Managed Facilities ({adminFacilities.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2 mb-6">
              {adminFacilities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No associated facilities found.</p>
              ) : (
                adminFacilities.map((f) => (
                  <div key={f.id} className="p-2 bg-slate-50 rounded border text-xs flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{f.name}</span>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 border rounded">{f.category}</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setInspectedAdmin(null)}
              className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold hover:bg-slate-900"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal with Dynamic Hours & Multi-Slot Picker */}
      {selectedFacility && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Book {selectedFacility.name}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Operating Hours: {selectedFacility.openTime || '09:00'} – {selectedFacility.closeTime || '18:00'} (Select up to 5 consecutive hours).
            </p>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
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
                  className="w-full border p-2 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                        if (isBooked) style = 'bg-red-50 text-red-500 border-red-200 cursor-pointer opacity-85';
                        if (isMaintenance) style = 'bg-slate-800 text-slate-400 border-slate-900 cursor-not-allowed';
                        if (isSelected) style = 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105';

                        return (
                          <div
                            key={index}
                            onClick={() => handleSlotSelection(slot)}
                            className={`border rounded-lg p-2 text-center transition-all ${style}`}
                          >
                            <p className="font-semibold">{slot.timeSlot}</p>
                            <span className="text-[10px] uppercase font-bold">
                              {isSelected ? 'Selected' : isAvailable ? 'Available' : isBooked ? 'Waitlist' : 'Maintenance'}
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
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}