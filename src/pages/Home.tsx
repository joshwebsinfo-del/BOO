import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Grid, Sparkles, Building, Briefcase, ShoppingBag,
  MapPin, Coffee, HelpCircle, GraduationCap, HeartPulse, Bus, Landmark, CheckCircle, Flame,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../App.tsx';

export default function Home() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [stats, setStats] = useState({
    users: 120,
    businesses: 45,
    lodges: 12,
    jobs: 8,
    properties: 15,
    products: 32
  });

  useEffect(() => {
    // Fetch stats from backend if online
    fetch('/api/dashboard/stats')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Fallback stats');
      })
      .then(data => setStats(data))
      .catch(() => console.log('Using local mock stats fallback'));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery && !selectedLocation) return;
    // Route to directory with queries
    navigate(`/directory?search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(selectedLocation)}`);
  };

  const categories = [
    { name: 'Lodges & Hotels', icon: <Building className="w-5 h-5 text-emerald-600" />, count: stats.lodges, path: '/lodges' },
    { name: 'Job Openings', icon: <Briefcase className="w-5 h-5 text-sky-600" />, count: stats.jobs, path: '/jobs' },
    { name: 'Marketplace', icon: <ShoppingBag className="w-5 h-5 text-amber-600" />, count: stats.products, path: '/marketplace' },
    { name: 'Properties', icon: <Building className="w-5 h-5 text-indigo-600" />, count: stats.properties, path: '/property' },
    { name: 'Restaurants', icon: <Coffee className="w-5 h-5 text-rose-600" />, count: 3, path: '/directory?category=Restaurants' },
    { name: 'Local Services', icon: <Grid className="w-5 h-5 text-orange-600" />, count: 5, path: '/directory?category=Local Services' },
    { name: 'Healthcare', icon: <HeartPulse className="w-5 h-5 text-teal-600" />, count: 2, path: '/directory?category=Healthcare' },
    { name: 'Transport & Shuttles', icon: <Bus className="w-5 h-5 text-purple-600" />, count: 3, path: '/directory?category=Transport' },
    { name: 'Government Offices', icon: <Landmark className="w-5 h-5 text-slate-600" />, count: 4, path: '/directory?category=Government' },
  ];

  // Language translated headers
  const getHeader = () => {
    if (language === 'Shona') return {
      title: 'Tsvaga zvese zvemu Zimbabwe',
      subtitle: 'Kubva kumahotera, mabasa, motokari, dzimba nehunyanzvi hweko - zvese mudura rimwe chete!',
      trending: 'Zvirikunzi pfee',
      popular: 'Mhando dzeKutsvaga',
    };
    if (language === 'Ndebele') return {
      title: 'Dinga konke kweZimbabwe',
      subtitle: 'Kusukela kuma-lodges, imisebenzi, izimota, izindlu lobuchwepheshe - konke endaweni eyodwa!',
      trending: 'Izithandwayo kakhulu',
      popular: 'Inhlobo zokudinga',
    };
    return {
      title: 'Everything Zimbabwe. One Platform.',
      subtitle: 'Discover lodges, jobs, buy/sell products, properties, restaurants, medical help, and local services in one seamless ecosystem.',
      trending: 'Trending Now',
      popular: 'Popular Categories',
    };
  };

  const headers = getHeader();

  return (
    <div className="space-y-12">

      {/* --- HERO SECTION --- */}
      <div className="relative text-center py-12 md:py-20 max-w-4xl mx-auto space-y-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 uppercase tracking-wider animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Ultimate Zimbabwe Super App
        </span>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {headers.title}
        </h1>

        <p className="text-slate-600 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
          {headers.subtitle}
        </p>

        {/* --- GLOBAL SEARCH BAR --- */}
        <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto bg-white p-2.5 rounded-2xl shadow-xl border border-slate-200 flex flex-col md:flex-row gap-2 items-stretch">
          <div className="flex-1 flex items-center gap-2 px-3 border-b md:border-b-0 md:border-r border-slate-100 py-2">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search lodgings, electricians, jobs, laptops, houses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-sm font-medium"
            />
          </div>

          <div className="w-full md:w-48 flex items-center gap-2 px-3 py-2">
            <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 text-sm font-medium cursor-pointer"
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shrink-0 transition-all active:scale-95"
          >
            Search Everything
          </button>
        </form>

        {/* Live Counters */}
        <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-500 pt-2">
          <span>🎯 {stats.businesses} Verified Businesses</span>
          <span>•</span>
          <span>🏨 {stats.lodges} Premium Lodges</span>
          <span>•</span>
          <span>💼 {stats.jobs} Job Offers</span>
          <span>•</span>
          <span>🛒 {stats.products} Classified Ads</span>
        </div>
      </div>

      {/* --- CATEGORY SELECTOR GRID --- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Grid className="w-5 h-5 text-emerald-600" /> {headers.popular}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.path}
              className="glass-panel p-4 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group h-32"
            >
              <div className="flex items-start justify-between">
                <span className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                  {cat.icon}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 tracking-tight mt-2">{cat.name}</h3>
                <p className="text-[11px] text-slate-500 font-medium">{cat.count || 0} active listings</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* --- TRENDING / PROMOTED ADVERTS SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banner 1: Lodge Booking Promo */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-950 to-teal-800 text-white p-8 flex flex-col justify-between h-64 shadow-lg border border-emerald-900">
          <div className="space-y-2 max-w-md">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/35 uppercase tracking-widest">
              Lodge Spotlight
            </span>
            <h3 className="text-2xl font-bold tracking-tight">Nyanga Highlands Getaway</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Book standard 2-hour ensuite blocks or overnight cabins at Mountain View Lodge. Interactive booking calendar, secure local payments.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Overnight from <span className="text-emerald-400 font-extrabold text-lg">$80/day</span></span>
            <Link to="/lodges" className="bg-white hover:bg-emerald-50 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold transition-all">
              Book Instant
            </Link>
          </div>
        </div>

        {/* Banner 2: Premium Seller */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 flex flex-col justify-between h-64 shadow-lg border border-slate-700">
          <div className="space-y-2 max-w-md">
            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-extrabold px-2.5 py-1 rounded-full border border-amber-500/35 uppercase tracking-widest">
              Classified Spotlight
            </span>
            <h3 className="text-2xl font-bold tracking-tight">Agri-Business Seed Maize</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Get certified high-yield SC727 seed maize bags. Locally processed for optimal Zimbabwean soil performance. WhatsApp the verified seller directly.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Price per 50kg bag <span className="text-amber-400 font-extrabold text-lg">$95</span></span>
            <Link to="/marketplace" className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all">
              View Products
            </Link>
          </div>
        </div>
      </div>

      {/* --- REVENUE AND SUB ADVERTISING SECTION --- */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="p-2 space-y-2">
          <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">Business Verification</h4>
          <p className="text-xs text-slate-500">Get the ZimHub gold badge. Grow customer trust, display full gallery details, and access precise analytics.</p>
        </div>
        <div className="p-2 space-y-2">
          <Flame className="w-6 h-6 text-amber-600 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">Featured Placement</h4>
          <p className="text-xs text-slate-500">Boost listing visibility on our home feed. Top-ranked for job boards, marketplace items, and guesthouses.</p>
        </div>
        <div className="p-2 space-y-2">
          <Search className="w-6 h-6 text-indigo-600 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">Dynamic Local Search</h4>
          <p className="text-xs text-slate-500">Filter through ministries, transport routes, electricians, mechanics, and hospitals in under five seconds.</p>
        </div>
      </div>
    </div>
  );
}
