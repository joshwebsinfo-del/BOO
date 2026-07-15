import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Grid, Sparkles, Building, Briefcase, ShoppingBag,
  MapPin, Coffee, HelpCircle, GraduationCap, HeartPulse, Bus, Landmark, CheckCircle, Flame,
  ChevronRight, Star, MessageCircle, ArrowUpRight, Award, Compass, MessageSquare
} from 'lucide-react';
import { useApp } from '../App.tsx';

interface ServiceItem {
  id: number;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  location: string;
  rating: number;
  phone?: string;
  whatsapp?: string;
  isVerified: boolean;
}

export default function Home() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    users: 120,
    businesses: 4,
    lodges: 2,
    jobs: 2,
    properties: 2,
    products: 3
  });

  useEffect(() => {
    // 1. Fetch system statistics
    fetch('/api/dashboard/stats')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Fallback stats');
      })
      .then(data => setStats(data))
      .catch(() => console.log('Using local mock stats fallback'));

    // 2. Fetch all services dynamically for homepage querying
    fetch('/api/businesses')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Fallback services');
      })
      .then(data => {
        setAllServices(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery && !selectedLocation) return;
    navigate(`/directory?search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(selectedLocation)}`);
  };

  const categories = [
    { name: 'Lodges & Hotels', icon: <Building className="w-5 h-5 text-emerald-600" />, count: stats.lodges, path: '/lodges' },
    { name: 'Job Openings', icon: <Briefcase className="w-5 h-5 text-sky-600" />, count: stats.jobs, path: '/jobs' },
    { name: 'Marketplace', icon: <ShoppingBag className="w-5 h-5 text-amber-600" />, count: stats.products, path: '/marketplace' },
    { name: 'Properties', icon: <Building className="w-5 h-5 text-indigo-600" />, count: stats.properties, path: '/property' },
    { name: 'Restaurants', icon: <Coffee className="w-5 h-5 text-rose-600" />, count: allServices.filter(b => b.category === 'Restaurants').length || 1, path: '/directory?category=Restaurants' },
    { name: 'Local Services', icon: <Grid className="w-5 h-5 text-orange-600" />, count: allServices.filter(b => b.category === 'Local Services').length || 1, path: '/directory?category=Local Services' },
    { name: 'Healthcare', icon: <HeartPulse className="w-5 h-5 text-teal-600" />, count: allServices.filter(b => b.category === 'Healthcare').length || 1, path: '/directory?category=Healthcare' },
    { name: 'Transport & Shuttles', icon: <Bus className="w-5 h-5 text-purple-600" />, count: allServices.filter(b => b.category === 'Transport').length || 1, path: '/directory?category=Transport' },
  ];

  // Derive "Top Rated Services" (Rating 4.6 or higher)
  const topRatedServices = allServices.filter(item => item.rating >= 4.6);

  // Derive "Frequently Contacted" (Services with active whatsapp or verified shield)
  const frequentlyContacted = allServices.filter(item => item.isVerified || item.whatsapp);

  // Language translated headers
  const getHeader = () => {
    if (language === 'Shona') return {
      title: 'ZimHub - Zvese zvemu Zimbabwe',
      subtitle: 'Tsvaga mahotera, mabasa, motokari, dzimba nehunyanzvi hweko - zvese mudura rimwe chete pafoni yako!',
      trending: 'Zvirikunzi pfee',
      popular: 'Mhando dzeKutsvaga',
    };
    if (language === 'Ndebele') return {
      title: 'ZimHub - Konke kweZimbabwe',
      subtitle: 'Dinga ama-lodges, imisebenzi, izimota, izindlu lobuchwepheshe - konke endaweni eyodwa pafoni yakho!',
      trending: 'Izithandwayo kakhulu',
      popular: 'Inhlobo zokudinga',
    };
    return {
      title: 'Everything Zimbabwe. One Platform.',
      subtitle: 'Discover premium lodges, job vacancies, buy/sell products, real estate, clinics, and local services in one unified ecosystem.',
      trending: 'Trending Now',
      popular: 'Popular Categories',
    };
  };

  const headers = getHeader();

  return (
    <div className="space-y-10">

      {/* --- HERO SECTION --- */}
      <div className="relative text-center py-6 space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-extrabold border border-emerald-100 uppercase tracking-widest animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Ultimate Zimbabwe Super App
        </span>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
          {headers.title}
        </h1>

        <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
          {headers.subtitle}
        </p>

        {/* --- GLOBAL SEARCH BAR --- */}
        <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-100">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search guesthouses, tutors, solar, laptops..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-[11px] font-semibold py-1.5"
            />
          </div>

          <div className="flex justify-between items-center px-3 py-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 text-[11px] font-extrabold cursor-pointer"
              >
                <option value="">All Zimbabwe</option>
                <option value="Harare">Harare</option>
                <option value="Bulawayo">Bulawayo</option>
                <option value="Victoria Falls">Victoria Falls</option>
                <option value="Nyanga">Nyanga</option>
                <option value="Gweru">Gweru</option>
                <option value="Mutare">Mutare</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              Search Hub
            </button>
          </div>
        </form>

        {/* Live Counters */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[10px] font-extrabold text-slate-400 pt-1">
          <span>🎯 {stats.businesses} Verified Services</span>
          <span>•</span>
          <span>🏨 {stats.lodges} Lodges Listed</span>
          <span>•</span>
          <span>💼 {stats.jobs} Vacancies</span>
          <span>•</span>
          <span>🛒 {stats.products} Classifieds</span>
        </div>
      </div>

      {/* --- CATEGORY SELECTOR GRID --- */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-emerald-600" /> {headers.popular}
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.path}
              className="bg-white border p-3 rounded-2xl hover:border-emerald-500 hover:shadow-sm transition-all flex flex-col justify-between group h-24 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <span className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                  {cat.icon}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div>
                <h3 className="font-extrabold text-[11px] text-slate-800 tracking-tight">{cat.name}</h3>
                <p className="text-[9px] text-slate-400 font-bold">{cat.count || 0} active listings</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* --- HIGH-FIDELITY USER DYNAMIC SECTION: TOP RATED SERVICES --- */}
      {topRatedServices.length > 0 && (
        <div className="space-y-3.5">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> Top Rated Services & stars
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {topRatedServices.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/directory?search=${encodeURIComponent(item.name)}`)}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all shadow-sm cursor-pointer flex gap-3 justify-between items-center"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black tracking-wide border">
                      {item.category}
                    </span>
                    {item.isVerified && <span className="text-[7px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-black border border-emerald-100">Verified</span>}
                  </div>
                  <h3 className="font-extrabold text-xs text-slate-900 truncate leading-snug">{item.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal">{item.description}</p>
                  <p className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-300" /> {item.location}, Zimbabwe</p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className="inline-flex items-center gap-0.5 text-amber-600 font-extrabold text-[10px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 shadow-sm">
                    ★ {item.rating}
                  </span>
                  <span className="block text-[8px] text-slate-400 font-extrabold uppercase">Highly Rated</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- HIGH-FIDELITY USER DYNAMIC SECTION: FREQUENTLY CONTACTED --- */}
      {frequentlyContacted.length > 0 && (
        <div className="space-y-3.5">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-600 animate-pulse" /> Frequently Contacted Services
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {frequentlyContacted.map(item => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[7px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black tracking-wide border">
                      {item.category}
                    </span>
                    <span className="text-[8px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-black border border-rose-100 animate-pulse">
                      🔥 Active Inquiry
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xs text-slate-900 leading-snug">{item.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t text-[9px] text-slate-400 font-bold">
                  <span>📍 {item.location}</span>
                  {item.whatsapp && (
                    <a
                      href={`https://wa.me/${item.whatsapp}`}
                      target="_blank" rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                    >
                      <MessageCircle className="w-3 h-3 text-white" /> WhatsApp Seller
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
