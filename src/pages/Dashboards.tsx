import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Shield, Briefcase, Building, ShoppingBag, Mail, Lock,
  CreditCard, Sparkles, Star, CheckCircle, Clock, Trash2, Globe, Send,
  ChevronRight, Phone, MessageSquare, ListFilter, TrendingUp, Compass, Plus, LogIn
} from 'lucide-react';
import { useApp } from '../App.tsx';

export default function Dashboards() {
  const { user, token, login, logout, addNotification, language } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'profile';
  });

  // Auth Card forms
  const [isRegister, setIsRegister] = useState(() => {
    return searchParams.get('auth') === 'signup';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Customer'); // Customer, Business Owner, Employer, Property Owner, Marketplace Seller, Lodge Owner, Administrator
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Admin Dashboard stats
  const [adminStats, setAdminStats] = useState({
    users: 0,
    businesses: 0,
    lodges: 0,
    jobs: 0,
    properties: 0,
    products: 0,
    bookings: 0,
    earnings: 0,
    commission: 0
  });

  // List of bookings, jobs, applications, properties for specific roles
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);

  // AI Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Mhoroi! Sani-bonani! Welcome to ZimHub AI Assistant. Ask me about seed maize, Nyanga lodges, EcoNet jobs, or Borrowdale houses!' }
  ]);
  const [chatLanguage, setChatLanguage] = useState<'English' | 'Shona' | 'Ndebele'>('English');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);

    const auth = searchParams.get('auth');
    if (auth) setIsRegister(auth === 'signup');
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;

    // Fetch custom stats/histories based on roles
    fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAdminStats(data))
      .catch(() => console.warn('Local admin stats fallback'));

    fetch('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMyBookings(data))
      .catch(() => console.warn('Local bookings fallback'));

    fetch('/api/applications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMyApplications(data))
      .catch(() => console.warn('Local applications fallback'));

  }, [token, activeTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        setSearchParams({});
      } else {
        alert(data.error || 'Login failed.');
      }
    } catch (err) {
      alert('Local auth server connection issue.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, name, role })
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        setSearchParams({});
      } else {
        alert(data.error || 'Signup failed.');
      }
    } catch (err) {
      alert('Local auth server connection issue.');
    }
  };

  const handleGoogleLoginSimulate = () => {
    // Simulate instant secure login via Google Firebase auth
    const mockUser = {
      id: 99,
      username: 'google_user',
      email: 'user@gmail.com',
      name: 'Google Verified User',
      role: 'Customer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
    };
    login(mockUser, 'mock_google_jwt_token_456');
    setSearchParams({});
  };

  const handleSendOtpSimulate = () => {
    if (!username) {
      alert('Please enter username / phone first');
      return;
    }
    setOtpSent(true);
    alert('Simulated ZimHub SMS OTP Sent! Code is "1234".');
  };

  const handleVerifyOtpSimulate = () => {
    if (otpCode === '1234') {
      const mockUser = {
        id: 100,
        username: username,
        email: `${username}@zimhub.co.zw`,
        name: `${username} (OTP Verified)`,
        role: 'Customer'
      };
      login(mockUser, 'mock_otp_jwt_token_789');
      setSearchParams({});
      setOtpSent(false);
      setOtpCode('');
    } else {
      alert('Invalid OTP. Use "1234" to simulate.');
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMyBookings(myBookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
        addNotification('Booking Cancelled', 'Successfully cancelled your lodging booking slot.', 'Booking');
      }
    } catch (e) {
      alert('Could not cancel booking.');
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage) return;

    const currentMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: currentMsg }]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMsg, language: chatLanguage })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { sender: 'ai', text: data.reply }]);
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Offline AI: Yes, ZimHub directory is always fully featured.' }]);
    }
  };

  const handleQuickPromptClick = (prompt: string) => {
    setChatMessage(prompt);
  };

  // --- UNAUTHENTICATED GUEST LOGIN/SIGNUP UI ---
  if (!user) {
    return (
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-lg max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-emerald-50 text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl shadow-inner font-bold">
            🔑
          </div>
          <h2 className="font-extrabold text-lg text-slate-900">{isRegister ? 'Create ZimHub Account' : 'Welcome Back'}</h2>
          <p className="text-slate-500 text-xs">{isRegister ? 'Join our Zimbabwean Super App today!' : 'Sign in to access your custom dashboards.'}</p>
        </div>

        {otpSent ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Enter 4-Digit OTP Code (Simulated: 1234)</label>
              <input
                type="text"
                placeholder="XXXX"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-bold tracking-widest focus:outline-none"
              />
            </div>
            <button
              onClick={handleVerifyOtpSimulate}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-xl transition-all"
            >
              Verify OTP
            </button>
          </div>
        ) : (
          <form onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Name *</label>
                  <input
                    type="text" required placeholder="e.g. Tendai Moyo" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email" required placeholder="e.g. tendai@gmail.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username / Contact *</label>
              <input
                type="text" required placeholder="e.g. tinashe_admin or phone" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password *</label>
              <input
                type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Role</label>
                <select
                  value={role} onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer focus:outline-none"
                >
                  <option value="Customer">Customer / Guest</option>
                  <option value="Lodge Owner">Lodge Owner</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Employer">Employer</option>
                  <option value="Property Owner">Property Owner</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-xl shadow-sm transition-all"
            >
              {isRegister ? 'Register Account' : 'Sign In'}
            </button>
          </form>
        )}

        {/* --- ALTERNATE LOGIN METHODS --- */}
        {!otpSent && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleSendOtpSimulate}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs p-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              💬 Get Simulated SMS OTP
            </button>
            <button
              onClick={handleGoogleLoginSimulate}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs p-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              🔥 Simulate Google Login
            </button>

            <p className="text-center text-[11px] text-slate-400">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-emerald-600 font-bold hover:underline"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- AUTHENTICATED USER HUB SCREEN ---
  return (
    <div className="space-y-6">

      {/* Profile Welcome Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center font-extrabold text-base border-2 border-slate-800">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-extrabold text-sm">{user.name}</h2>
            <p className="text-[10px] text-slate-400">Primary Role: {user.role} ({user.email})</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-800 transition-all"
        >
          Logout
        </button>
      </div>

      {/* Dashboard Subtabs Selector */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 text-center text-xs font-bold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Dashboard
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-2 text-center text-xs font-bold rounded-xl transition-all ${activeTab === 'ai' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          AI Chat Bot
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`py-2 text-center text-xs font-bold rounded-xl transition-all ${activeTab === 'admin' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Admin Center
        </button>
      </div>

      {/* --- TAB CONTENT AREA --- */}
      {activeTab === 'profile' && (
        <div className="space-y-6">

          {/* CUSTOMER BOOKINGS SUMMARY */}
          {user.role === 'Customer' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Lodge Reservations</h3>
              {myBookings.length === 0 ? (
                <p className="text-center text-xs py-10 bg-white rounded-2xl border border-slate-200 text-slate-400">No active lodge reservations.</p>
              ) : (
                <div className="space-y-3">
                  {myBookings.map(b => (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border">
                          {b.room?.lodge?.name || 'Nyanga Lodge'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 mt-1">{b.room?.name || 'Standard Ensuite Double'}</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">Stay Date: {b.startDate} {b.isHourly && `[Hourly Block: ${b.hourlyBlock}]`}</p>
                        <p className="font-bold text-slate-800 mt-1">Paid: ${b.totalPrice.toFixed(2)} via {b.paymentMethod}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 font-bold rounded text-[9px] uppercase ${b.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {b.status}
                        </span>
                        {b.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="text-[10px] text-rose-600 hover:underline font-bold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EMPLOYER RECRUITER METRICS */}
          {user.role === 'Employer' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Resumes Recieved</h3>
                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-1 rounded-md">Employer View</span>
              </div>
              {myApplications.length === 0 ? (
                <p className="text-center text-xs py-10 bg-white rounded-2xl border border-slate-200 text-slate-400">No applications received yet.</p>
              ) : (
                <div className="space-y-3">
                  {myApplications.map(app => (
                    <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-900">{app.name}</h4>
                          <p className="text-slate-500 text-[10px]">{app.email}</p>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase border">
                          {app.job?.title || 'Lead Developer'}
                        </span>
                      </div>
                      <p className="text-slate-600 italic">" {app.coverLetter} "</p>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                        <span className="text-slate-400">Uploaded Resume:</span>
                        <a href={app.cvUrl} className="text-emerald-600 hover:underline font-bold" target="_blank" rel="noreferrer">
                          Download-CV.pdf
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LODGE OWNER CONTROLS */}
          {user.role === 'Lodge Owner' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1">
                  🏨 Lodge Owner Dashboard
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  As a Lodge Owner, you can view bookings, upload standard/executive suites, configure hourly guesthouse pricing blocks, and manage guest reservation lists.
                </p>
                <div className="grid grid-cols-2 gap-3 text-center pt-2">
                  <div className="bg-slate-50 p-3 rounded-2xl border">
                    <span className="block text-lg font-black text-emerald-700">${adminStats.earnings.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Bookings</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border">
                    <span className="block text-lg font-black text-slate-800">{myBookings.length}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Stays</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS OWNER CONTROLS */}
          {user.role === 'Business Owner' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1">
                  ⭐ Business Owner Board
                </h3>
                <p>Monitor your listed directory categories (Local services, restaurants, transport, schools).</p>
                <div className="border border-emerald-100 bg-emerald-50/50 p-3.5 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-emerald-950">Verification Status</p>
                    <p className="text-[11px] text-emerald-800">Your profile badge is fully verified!</p>
                  </div>
                  <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">Active</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* --- AI CHAT BOT ASSISTANT TAB --- */}
      {activeTab === 'ai' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-lg flex flex-col justify-between h-[500px]">

          {/* Conversational Screen Header */}
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">ZimHub AI Assistant</h3>
                <p className="text-[10px] text-slate-400">Trained on local Zimbabwean services & lodgings</p>
              </div>
            </div>

            <select
              value={chatLanguage}
              onChange={e => setChatLanguage(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold cursor-pointer focus:outline-none"
            >
              <option value="English">English</option>
              <option value="Shona">Shona</option>
              <option value="Ndebele">Ndebele</option>
            </select>
          </div>

          {/* Messages History List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-xs text-xs leading-relaxed ${chat.sender === 'user' ? 'bg-emerald-600 text-white font-medium rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                  {chat.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-1.5 py-2 border-t border-slate-100 overflow-x-auto select-none">
            {['Find Nyanga lodges', 'SC727 maize price', 'EcoNet Developer job', 'Borrowdale Real Estate'].map(prompt => (
              <button
                key={prompt}
                onClick={() => handleQuickPromptClick(prompt)}
                className="text-[10px] bg-slate-50 border hover:border-emerald-500 text-slate-600 px-2 py-1 rounded-full whitespace-nowrap transition-all font-semibold"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message input form */}
          <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Type message in English, Shona, or Ndebele..."
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* --- ADMINISTRATOR CONTROL PANEL TAB --- */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {user.role === 'Administrator' ? (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-md border border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-sm">ZimHub Admin Panel</h3>
                </div>

                {/* Global Metrics Counters */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                    <span className="block font-black text-emerald-400">${adminStats.earnings.toLocaleString()}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Gross Platform</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                    <span className="block font-black text-amber-400">${adminStats.commission.toLocaleString()}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">ZH Commission (10%)</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                    <span className="block font-black text-slate-200">{adminStats.bookings}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Reservations</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                    <span className="block font-black text-slate-200">{adminStats.users}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Registered Users</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                    <span className="block font-black text-slate-200">{adminStats.businesses}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Listed Businesses</span>
                  </div>
                </div>
              </div>

              {/* Administrative Logs */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-600">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wide text-[10px]">Real-Time Platform Logs</h4>
                <div className="space-y-2 bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[10px] overflow-x-auto leading-normal">
                  <p className="text-emerald-400">[06:34:11] DB initialized dev.db successfully</p>
                  <p className="text-emerald-400">[06:34:11] 4 Verified Businesses seeded</p>
                  <p className="text-indigo-400">[07:12:03] Secure JWT Token authorized for Admin</p>
                  <p className="text-amber-400">[08:44:59] Paynow simulation authorized - Approved $160.00</p>
                  <p className="text-emerald-400">[08:44:59] Lodge reservation created successfully for Tendai Moyo</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/50 border border-slate-200/50 rounded-3xl p-8 text-center space-y-3">
              <Shield className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">Access Denied</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">This page contains corporate platform configurations, commission audits, and user lists restricted to system Administrators.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
