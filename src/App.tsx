import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Menu, X, Globe, LogIn, LogOut, Heart, Bell, MessageSquare,
  User, Shield, Briefcase, Home as HomeIcon, MapPin, Phone, MessageCircle,
  Grid, Building, ShoppingBag, PlusCircle, Sparkles, CheckCircle2, ChevronRight,
  Wifi, Battery, Signal, ArrowLeft, Send, Languages, CreditCard, ChevronLeft
} from 'lucide-react';

// Import Pages
import Home from './pages/Home.tsx';
import BusinessDirectory from './pages/BusinessDirectory.tsx';
import LodgeBooking from './pages/LodgeBooking.tsx';
import Marketplace from './pages/Marketplace.tsx';
import Jobs from './pages/Jobs.tsx';
import Property from './pages/Property.tsx';
import Dashboards from './pages/Dashboards.tsx';

// --- AUTH & GLOBAL CONTEXT ---
interface UserSession {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AppContextType {
  user: UserSession | null;
  token: string | null;
  language: 'English' | 'Shona' | 'Ndebele';
  setLanguage: (lang: 'English' | 'Shona' | 'Ndebele') => void;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  login: (user: UserSession, token: string) => void;
  logout: () => void;
  notifications: Array<{ id: number; title: string; message: string; isRead: boolean }>;
  addNotification: (title: string, message: string, type?: string) => void;
  markNotificationsRead: () => void;
  isOnline: boolean;
  activeToast: { id: number; title: string; message: string } | null;
  dismissToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

// --- DYNAMIC AUDIO SYNTHESIZER FOR POPUP SOUNDS ---
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2: E5 (659.25 Hz) after 90ms offset
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain2.gain.setValueAtTime(0.12, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.35);
      } catch (e) {}
    }, 90);

    // Tone 3: G5 (783.99 Hz) after 180ms offset
    setTimeout(() => {
      try {
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(783.99, ctx.currentTime);
        gain3.gain.setValueAtTime(0.12, ctx.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc3.start(ctx.currentTime);
        osc3.stop(ctx.currentTime + 0.35);
      } catch (e) {}
    }, 180);

  } catch (e) {
    console.warn('Audio synthesis blocked by browser auto-play policy.');
  }
};

// --- APP PROVIDER COMPONENT ---
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('zimhub_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('zimhub_token');
  });
  const [language, setLanguage] = useState<'English' | 'Shona' | 'Ndebele'>('English');
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('zimhub_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Real-time Toast popup state
  const [activeToast, setActiveToast] = useState<{ id: number; title: string; message: string } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (token) {
      fetchNotifications();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  // Dismiss Toast automatically after 4 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.warn('Could not fetch notifications from backend, using state.');
    }
  };

  const login = (sessionUser: UserSession, sessionToken: string) => {
    setUser(sessionUser);
    setToken(sessionToken);
    localStorage.setItem('zimhub_user', JSON.stringify(sessionUser));
    localStorage.setItem('zimhub_token', sessionToken);
    addNotification('Welcome to ZimHub!', `Logged in successfully as ${sessionUser.name}.`, 'System');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('zimhub_user');
    localStorage.removeItem('zimhub_token');
  };

  const toggleFavorite = (id: number) => {
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('zimhub_favorites', JSON.stringify(updated));
  };

  const addNotification = async (title: string, message: string, type = 'General') => {
    const newNotif = { id: Date.now(), title, message, isRead: false, createdAt: new Date() };
    setNotifications(prev => [newNotif, ...prev]);

    // Launch beautiful animated toast popup
    setActiveToast({ id: Date.now(), title, message });
    // Play beautiful synthesized dynamic audio cue
    playNotificationSound();

    if (token) {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title, message, type })
        });
      } catch (e) {
        console.warn('Backend unavailable for live notifications.');
      }
    }
  };

  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const dismissToast = () => setActiveToast(null);

  return (
    <AppContext.Provider value={{
      user, token, language, setLanguage, favorites, toggleFavorite, login, logout,
      notifications, addNotification, markNotificationsRead, isOnline, activeToast, dismissToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

// --- MOBILE APP CONTAINER SHELL ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, language, setLanguage, notifications, markNotificationsRead, isOnline, activeToast, dismissToast } = useApp();
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleBack = () => {
    if (location.pathname !== '/') {
      navigate(-1);
    }
  };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'ZimHub Super App';
      case '/directory': return 'Business Directory';
      case '/lodges': return 'Lodge Booking';
      case '/marketplace': return 'Classifieds Market';
      case '/jobs': return 'Zimbabwe Jobs';
      case '/property': return 'Real Estate';
      case '/dashboards': return user ? `${user.role} Hub` : 'Account Area';
      default: return 'ZimHub';
    }
  };

  return (
    // Centered smartphone frame container on desktop, expands beautifully on real mobile viewports
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-0 sm:py-8 font-sans selection:bg-emerald-500 selection:text-white antialiased">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Smartphone Outer Bezel & Shadow (Only visible on desktop/tablets) */}
      <div className="relative w-full max-w-md h-full sm:h-[840px] bg-slate-900 sm:rounded-[45px] sm:border-[12px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col transition-all">

        {/* --- SMARTPHONE TOP STATUS BAR (Carrier, Notch, Signal, Battery) --- */}
        <div className="bg-emerald-900 text-white px-6 pt-3 pb-2 flex justify-between items-center text-xs font-bold shrink-0 select-none relative">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] tracking-wider uppercase">ZimCell</span>
            {!isOnline && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>}
          </div>

          {/* Mock Camera Notch */}
          <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 top-2 w-28 h-4 bg-slate-800 rounded-b-xl z-50"></div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="font-semibold">89%</span>
            <Battery className="w-4 h-4 text-emerald-300" />
          </div>
        </div>

        {/* --- MOBILE APP TOP HEADER BAR --- */}
        <header className="bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 relative z-30">
          <div className="flex items-center gap-3">
            {location.pathname !== '/' ? (
              <button onClick={handleBack} className="p-1.5 hover:bg-emerald-700/60 rounded-full transition-all" title="Back">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            ) : (
              /* --- EXQUISITE BRAND LOGO FEATURING ZIMBABWE FLAG MIX --- */
              <div className="flex items-center gap-2">
                <svg className="w-9 h-6 rounded shadow-sm border border-emerald-950 shrink-0 select-none" viewBox="0 0 70 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Stripes of the Zimbabwean flag: Green, Gold, Red, Black, Red, Gold, Green */}
                  <rect width="70" height="5.7" fill="#319251" />
                  <rect y="5.7" width="70" height="5.7" fill="#FCD116" />
                  <rect y="11.4" width="70" height="5.7" fill="#DE2110" />
                  <rect y="17.1" width="70" height="5.7" fill="#000000" />
                  <rect y="22.8" width="70" height="5.7" fill="#DE2110" />
                  <rect y="28.5" width="70" height="5.7" fill="#FCD116" />
                  <rect y="34.2" width="70" height="5.7" fill="#319251" />
                  {/* Triangle (White) */}
                  <polygon points="0,0 26,20 0,40" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
                  {/* Star (Red) */}
                  <polygon points="8,17 10,13 12,17 15,18 12,21 13,25 10,23 7,25 8,21 5,18" fill="#DE2110" />
                  {/* Zimbabwe Bird Emblem (Gold) */}
                  <path d="M10,15 C9,16 9,18 10,19 C11,20 12,20 12,18 Z" fill="#FCD116" stroke="#5c4403" strokeWidth="0.3" />
                </svg>
                <div className="bg-gradient-to-r from-amber-400 to-yellow-300 text-emerald-950 font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider shadow-inner">
                  ZimHub
                </div>
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-sm tracking-tight">{getPageTitle()}</h1>
              <p className="text-[9px] text-emerald-200 uppercase tracking-widest font-bold -mt-0.5">Everything Zimbabwe</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangMenuOpen(!langMenuOpen);
                  setNotifPanelOpen(false);
                }}
                className="p-1.5 hover:bg-emerald-700/60 rounded-full flex items-center text-xs gap-1 font-bold"
              >
                <Languages className="w-4 h-4 text-emerald-100" />
                <span className="text-[10px] text-emerald-100">{language.slice(0, 3)}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 w-24 overflow-hidden z-50">
                  {(['English', 'Shona', 'Ndebele'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-emerald-800 hover:text-white ${language === lang ? 'text-emerald-400 bg-emerald-950/50' : 'text-slate-300'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Alert Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifPanelOpen(!notifPanelOpen);
                  setLangMenuOpen(false);
                  markNotificationsRead();
                }}
                className="p-1.5 hover:bg-emerald-700/60 rounded-full relative"
              >
                <Bell className="w-4 h-4 text-emerald-100" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border border-emerald-800"></span>
                )}
              </button>

              {/* Notification Slide Panel */}
              {notifPanelOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-1">
                  <div className="p-3 border-b border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">Alerts & Receipts</span>
                    <button onClick={() => setNotifPanelOpen(false)} className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300">
                      Clear
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-800 bg-slate-900">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-[11px] text-center text-slate-400">No active alerts.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-slate-950 transition-colors">
                          <p className="font-bold text-[11px] text-slate-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span>
                            {n.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Assistant Floating Access */}
            <Link to="/dashboards?tab=ai" className="p-1.5 hover:bg-emerald-700/60 rounded-full text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </Link>
          </div>
        </header>

        {/* --- HIGH-FIDELITY ANIMATED POP-DOWN NOTIFICATION TOAST --- */}
        {activeToast && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-350 ease-out border-l-4 border-l-emerald-500">
            <div className="bg-emerald-900/50 p-2 rounded-xl text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-100 truncate">{activeToast.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{activeToast.message}</p>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* --- NATIVE SCROLLABLE PHONE SCREEN BODY --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 bg-slate-50 text-slate-800">
          {children}
        </div>

        {/* --- NATIVE BOTTOM NAVIGATION TAB BAR --- */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2.5 px-4 flex justify-between items-center z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] rounded-t-[20px] sm:rounded-b-[0px]">
          <Link to="/" className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all ${location.pathname === '/' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <HomeIcon className="w-4 h-4 shrink-0" />
            <span className="text-[9px]">Home</span>
          </Link>
          <Link to="/directory" className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all ${location.pathname === '/directory' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Grid className="w-4 h-4 shrink-0" />
            <span className="text-[9px]">Directory</span>
          </Link>
          <Link to="/lodges" className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all ${location.pathname === '/lodges' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Building className="w-4 h-4 shrink-0" />
            <span className="text-[9px]">Lodges</span>
          </Link>
          <Link to="/marketplace" className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all ${location.pathname === '/marketplace' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="text-[9px]">Market</span>
          </Link>
          <Link to="/jobs" className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all ${location.pathname === '/jobs' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="text-[9px]">Jobs</span>
          </Link>
          <Link to="/dashboards" className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all ${location.pathname === '/dashboards' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <User className="w-4 h-4 shrink-0" />
            <span className="text-[9px]">{user ? user.role.split(' ')[0] : 'Profile'}</span>
          </Link>
        </nav>

        {/* Simulated iOS Home Indicator Bar (Only visible inside bezel on desktop/tablet viewports) */}
        <div className="hidden sm:block absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-400/40 rounded-full z-50"></div>
      </div>
    </div>
  );
};

// --- APP COMPONENT WITH ROUTING ---
const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/directory" element={<BusinessDirectory />} />
            <Route path="/lodges" element={<LodgeBooking />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/property" element={<Property />} />
            <Route path="/dashboards" element={<Dashboards />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
