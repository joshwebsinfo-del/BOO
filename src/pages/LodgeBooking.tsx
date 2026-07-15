import React, { useState, useEffect } from 'react';
import {
  Building, Calendar, Clock, DollarSign, Eye, ShieldAlert, Check,
  MessageSquare, Users, CreditCard, ChevronRight, MapPin, Sparkles, X, PlusCircle
} from 'lucide-react';
import { useApp } from '../App.tsx';

interface Room {
  id: number;
  lodgeId: number;
  name: string;
  type: string;
  pricePerDay: number;
  pricePerHour: number;
  image?: string;
  capacity: number;
}

interface Lodge {
  id: number;
  name: string;
  description: string;
  location: string;
  image?: string;
  isFeatured: boolean;
  rooms: Room[];
}

export default function LodgeBooking() {
  const { user, token, addNotification } = useApp();
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Selected Booking States
  const [selectedLodge, setSelectedLodge] = useState<Lodge | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Reservation details state
  const [isHourly, setIsHourly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hourlyBlock, setHourlyBlock] = useState('10:00-12:00');
  const [guestName, setGuestName] = useState(user ? user.name : '');
  const [guestPhone, setGuestPhone] = useState('0786110762'); // Default support phone
  const [paymentMethod, setPaymentMethod] = useState('EcoCash');
  const [paymentPhone, setPaymentPhone] = useState('');

  const [showCheckout, setShowCheckout] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // Add Lodge Modal (for lodge owners)
  const [showAddLodgeModal, setShowAddLodgeModal] = useState(false);
  const [newLodge, setNewLodge] = useState({
    name: '',
    description: '',
    location: 'Nyanga',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'
  });

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'Standard Ensuite',
    pricePerDay: '80',
    pricePerHour: '20',
    capacity: '2',
    image: 'https://images.unsplash.com/photo-1611891404114-5090bc95c3a4?auto=format&fit=crop&q=80&w=600'
  });

  const fetchLodges = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lodges');
      if (res.ok) {
        const data = await res.json();
        setLodges(data);
      }
    } catch (e) {
      console.warn('Backend connection issue while fetching lodges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLodges();
  }, []);

  // Recalculate price when check-in details change
  useEffect(() => {
    if (!selectedRoom) return;
    if (isHourly) {
      setTotalPrice(selectedRoom.pricePerHour);
    } else {
      if (!startDate || !endDate) {
        setTotalPrice(selectedRoom.pricePerDay);
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      setTotalPrice(selectedRoom.pricePerDay * diffDays);
    }
  }, [isHourly, startDate, endDate, selectedRoom]);

  const handleLodgeSelect = (lodge: Lodge) => {
    setSelectedLodge(lodge);
    setSelectedRoom(null);
  };

  const handleBookClick = (room: Room) => {
    if (!user) {
      alert('Please login to reserve rooms.');
      return;
    }
    setSelectedRoom(room);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setShowCheckout(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !startDate) return;

    try {
      // 1. Simulate ecoCash/innBucks prompt checkout
      const payRes = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: totalPrice,
          phone: paymentPhone || guestPhone,
          paymentMethod,
          reference: `LODGE-${selectedRoom.id}`
        })
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        alert(payData.error || 'Payment failed.');
        return;
      }

      // 2. Register room booking
      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          startDate,
          endDate: isHourly ? startDate : endDate,
          isHourly,
          hourlyBlock: isHourly ? hourlyBlock : null,
          totalPrice,
          paymentMethod,
          guestName,
          guestPhone
        })
      });

      if (bookRes.ok) {
        const bookData = await bookRes.json();
        addNotification(
          'Booking Successful!',
          `Lodge booking confirmed for "${selectedRoom.name}". Total paid $${totalPrice}. Receipt Reference: ${payData.reference}.`,
          'Booking'
        );
        setShowCheckout(false);
        setSelectedRoom(null);
        alert(`Booking Confirmed!\nReceipt: ${payData.reference}\nCheck-in details have been sent to your account notifications.`);
      } else {
        const err = await bookRes.json();
        alert(err.error || 'Booking conflict detected. Try other dates.');
      }
    } catch (e) {
      alert('Error finalizing lodge booking checkout.');
    }
  };

  const handleAddLodge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/lodges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newLodge)
      });
      if (res.ok) {
        setShowAddLodgeModal(false);
        fetchLodges();
        addNotification('Lodge Registered', `Lodge "${newLodge.name}" listed successfully.`, 'System');
      }
    } catch (e) {
      alert('Failed to register lodge.');
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLodge) return;
    try {
      const res = await fetch(`/api/lodges/${selectedLodge.id}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newRoom)
      });
      if (res.ok) {
        setShowAddRoomModal(false);
        fetchLodges();
        // Refresh active selected lodge rooms
        const updated = lodges.find(l => l.id === selectedLodge.id);
        if (updated) setSelectedLodge(updated);
        addNotification('Room Listed', `Successfully added room "${newRoom.name}"!`, 'System');
      }
    } catch (e) {
      alert('Failed to add room.');
    }
  };

  const hourlyBlocks = [
    '08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'
  ];

  return (
    <div className="space-y-8">

      {/* --- HEADER ROW --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Premium Lodge Booking</h1>
          <p className="text-slate-500 text-sm">Book hourly ensuite rooms or overnight stays in luxury hotels and guest houses across Zimbabwe.</p>
        </div>

        {user?.role === 'Lodge Owner' || user?.role === 'Administrator' ? (
          <button
            onClick={() => setShowAddLodgeModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Add Your Lodge
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-slate-500 text-xs mt-2">Discovering properties...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* --- LODGE LIST COLUMN --- */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Available Locations</h2>
            <div className="space-y-3">
              {lodges.map(lodge => (
                <div
                  key={lodge.id}
                  onClick={() => handleLodgeSelect(lodge)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 bg-white ${selectedLodge?.id === lodge.id ? 'border-emerald-600 ring-1 ring-emerald-600 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                >
                  {lodge.image && (
                    <img
                      src={lodge.image}
                      alt={lodge.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase border border-slate-100">
                      {lodge.location}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">{lodge.name}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{lodge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- ROOM DETAIL & RESERVATION SLOTS --- */}
          <div className="lg:col-span-2 space-y-4">
            {selectedLodge ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">

                {/* Lodge Cover Detail */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <MapPin className="w-3.5 h-3.5" /> {selectedLodge.location}, Zimbabwe
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{selectedLodge.name}</h2>
                    </div>
                    {user?.role === 'Lodge Owner' || user?.role === 'Administrator' ? (
                      <button
                        onClick={() => setShowAddRoomModal(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Add Room Option
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedLodge.description}</p>
                </div>

                {/* Rooms Grid */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Room Type</h3>
                  {selectedLodge.rooms.length === 0 ? (
                    <p className="text-xs text-center text-slate-400 py-6">No rooms loaded for this lodge yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {selectedLodge.rooms.map(room => (
                        <div key={room.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                          <div className="flex gap-4">
                            {room.image && (
                              <img
                                src={room.image}
                                alt={room.name}
                                className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-100"
                              />
                            )}
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-sm text-slate-900">{room.name}</h4>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Max Capacity: {room.capacity} adults</p>

                              <div className="flex flex-wrap gap-2 pt-1">
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100/50">
                                  Overnight: ${room.pricePerDay}/day
                                </span>
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-100/50">
                                  Hourly Block: ${room.pricePerHour}/2hr
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleBookClick(room)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm tracking-wide transition-all active:scale-95 shrink-0 self-end sm:self-auto"
                          >
                            Reserve Now
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-100/50 border border-slate-200/50 rounded-3xl p-12 text-center space-y-3">
                <Building className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">No Lodge Selected</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">Select any premium lodge listing from the left sidebar to view its rooms, pricing packages, and real-time availability slots.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- CHECKOUT SIMULATED POPUP --- */}
      {showCheckout && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Secure Guest Checkout</h3>
                <p className="text-[11px] text-slate-500">ZimHub Instant Payment Processing</p>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Summary */}
            <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex gap-3 text-xs">
              {selectedRoom.image && (
                <img src={selectedRoom.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
              )}
              <div>
                <p className="font-extrabold text-slate-950">{selectedRoom.name}</p>
                <p className="text-slate-500 mt-0.5">Capacity: {selectedRoom.capacity} Guests Max</p>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {/* Overnight stay vs 2-hour slot */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsHourly(false)}
                  className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all ${!isHourly ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500'}`}
                >
                  Overnight Stay
                </button>
                <button
                  type="button"
                  onClick={() => setIsHourly(true)}
                  className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all ${isHourly ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500'}`}
                >
                  Hourly Block (2-Hour)
                </button>
              </div>

              {/* Date & Block Inputs */}
              {!isHourly ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Check-In *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Check-Out *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Stay Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Hourly Block (2-hr) *</label>
                    <select
                      value={hourlyBlock}
                      onChange={e => setHourlyBlock(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      {hourlyBlocks.map(block => <option key={block} value={block}>{block}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Guest Details */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Guest Name *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Guest Contact *</label>
                  <input
                    type="text"
                    required
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {['EcoCash', 'Innbucks', 'ZIPIT', 'Paynow'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2 border text-center rounded-xl text-xs font-bold transition-all ${paymentMethod === method ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Mobile Number for Prompt Checkout (e.g. 077...)</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter payment account number"
                    value={paymentPhone}
                    onChange={e => setPaymentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation & Checkout */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-500">Amount Due:</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Includes standard 10% VAT</p>
                </div>
                <span className="text-xl font-extrabold text-slate-900">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm p-3.5 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <CreditCard className="w-4 h-4" /> Authorize Prompt Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD LODGE MODAL --- */}
      {showAddLodgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">List Your Zimbabwe Lodge</h3>
              <button onClick={() => setShowAddLodgeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLodge} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lodge Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nyanga Cloud Lodge"
                  value={newLodge.name}
                  onChange={e => setNewLodge({...newLodge, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description *</label>
                <textarea
                  required
                  placeholder="Provide a description of rooms, mountain views, and activities..."
                  value={newLodge.description}
                  onChange={e => setNewLodge({...newLodge, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Location *</label>
                <select
                  value={newLodge.location}
                  onChange={e => setNewLodge({...newLodge, location: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Nyanga">Nyanga</option>
                  <option value="Victoria Falls">Victoria Falls</option>
                  <option value="Harare">Harare</option>
                  <option value="Bulawayo">Bulawayo</option>
                  <option value="Kariba">Kariba</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={newLodge.image}
                  onChange={e => setNewLodge({...newLodge, image: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Submit Lodge Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD ROOM MODAL --- */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">Add Room Option</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Room Option Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Ensuite Double Room"
                  value={newRoom.name}
                  onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Price per Day ($)</label>
                  <input
                    type="number"
                    required
                    value={newRoom.pricePerDay}
                    onChange={e => setNewRoom({...newRoom, pricePerDay: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Price per Hour ($)</label>
                  <input
                    type="number"
                    required
                    value={newRoom.pricePerHour}
                    onChange={e => setNewRoom({...newRoom, pricePerHour: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Adult Capacity</label>
                  <input
                    type="number"
                    required
                    value={newRoom.capacity}
                    onChange={e => setNewRoom({...newRoom, capacity: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Room Type</label>
                  <select
                    value={newRoom.type}
                    onChange={e => setNewRoom({...newRoom, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Standard">Standard Ensuite</option>
                    <option value="Deluxe">Deluxe Suite</option>
                    <option value="Executive Suite">Executive Mountain Suite</option>
                    <option value="Resort Suite">Zambezi Resort Suite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Room Image URL</label>
                <input
                  type="text"
                  value={newRoom.image}
                  onChange={e => setNewRoom({...newRoom, image: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Submit Room Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
