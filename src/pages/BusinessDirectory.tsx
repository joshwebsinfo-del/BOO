import React, { useState, useEffect } from 'react';
import {
  Grid, Search, MapPin, Phone, MessageCircle, Star, ShieldCheck,
  Clock, Globe, Mail, PlusCircle, ThumbsUp, X, CheckSquare
} from 'lucide-react';
import { useApp } from '../App.tsx';

interface Business {
  id: number;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  hours?: string;
  location: string;
  rating: number;
  isVerified: boolean;
}

export default function BusinessDirectory() {
  const { user, token, addNotification } = useApp();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Add Business Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBiz, setNewBiz] = useState({
    name: '',
    description: '',
    category: 'Local Services',
    subCategory: '',
    phone: '',
    whatsapp: '263786110762',
    email: '',
    website: '',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    location: 'Harare'
  });

  // Selected Business Review states
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [bizReviews, setBizReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedCategory) queryParams.append('category', selectedCategory);
      if (selectedLocation) queryParams.append('location', selectedLocation);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await fetch(`/api/businesses?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (e) {
      console.warn('Backend connection issue while fetching businesses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBusinesses();
  };

  const handleAddBiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBiz.name || !newBiz.description) return;

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newBiz)
      });

      if (res.ok) {
        const added = await res.json();
        setBusinesses([added, ...businesses]);
        setShowAddModal(false);
        setNewBiz({
          name: '',
          description: '',
          category: 'Local Services',
          subCategory: '',
          phone: '',
          whatsapp: '263786110762',
          email: '',
          website: '',
          hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
          location: 'Harare'
        });
        addNotification('Listing Created', `Successfully listed "${added.name}" on the business directory!`, 'System');
      }
    } catch (err) {
      alert('Failed to register business on backend.');
    }
  };

  const selectBusinessForReviews = async (biz: Business) => {
    setSelectedBiz(biz);
    try {
      const res = await fetch(`/api/reviews/Business/${biz.id}`);
      if (res.ok) {
        const data = await res.json();
        setBizReviews(data);
      }
    } catch (e) {
      setBizReviews([]);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz || !reviewComment) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId: selectedBiz.id,
          targetType: 'Business',
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        const newRev = await res.json();
        setBizReviews([newRev, ...bizReviews]);
        setReviewComment('');
        fetchBusinesses();
        addNotification('Review Added', `Thank you for rating ${selectedBiz.name}!`, 'Feedback');
      }
    } catch (e) {
      alert('Review submission failed.');
    }
  };

  const categories = ['Local Services', 'Restaurants', 'Healthcare', 'Transport', 'Education', 'Government'];
  const locations = ['Harare', 'Bulawayo', 'Victoria Falls', 'Nyanga', 'Gweru', 'Mutare'];

  return (
    <div className="space-y-6">

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col gap-1 border-b pb-3">
        <h1 className="text-xl font-black text-slate-900 leading-tight">Business Directory</h1>
        <p className="text-slate-400 text-[10px]">Find plumbers, restaurants, medical clinics, and transport shuttles</p>
      </div>

      {/* --- FILTERS & SEARCH ROW --- */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-[11px] font-medium w-full"
          />
        </form>

        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-700 text-[10px] font-black cursor-pointer"
          >
            <option value="">Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-700 text-[10px] font-black cursor-pointer"
          >
            <option value="">Cities</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      </div>

      {/* --- SLEEK CARDS DIRECTORY --- */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-4 space-y-1">
          <Grid className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-xs">No listings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {businesses.map(biz => (
            <div key={biz.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <span className="text-[8px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border uppercase">
                      {biz.category}
                    </span>
                    <h3 className="font-black text-xs text-slate-900 mt-1 flex items-center gap-1 leading-snug">
                      {biz.name}
                      {biz.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                    </h3>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-600 font-extrabold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                    <Star className="w-3 h-3 fill-amber-500" />
                    {biz.rating || 'N/A'}
                  </div>
                </div>

                <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2">{biz.description}</p>

                <div className="flex gap-3 text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-50">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {biz.location}</span>
                  {biz.hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {biz.hours.split(':')[0]}...</span>}
                </div>
              </div>

              <div className="flex items-center justify-between gap-1 pt-1">
                <button
                  onClick={() => selectBusinessForReviews(biz)}
                  className="text-[9px] text-slate-500 hover:text-emerald-600 font-bold"
                >
                  💬 Reviews ({bizReviews.length && selectedBiz?.id === biz.id ? bizReviews.length : 'View'})
                </button>

                <div className="flex gap-1">
                  {biz.whatsapp && (
                    <a
                      href={`https://wa.me/${biz.whatsapp}`}
                      target="_blank" rel="noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                  {biz.phone && (
                    <a
                      href={`tel:${biz.phone}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs"
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD BUSINESS DIALOG --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-5 border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-extrabold text-sm text-slate-900">List Your Business</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBiz} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Business Name *</label>
                <input
                  type="text" required placeholder="Harare Solars" value={newBiz.name}
                  onChange={e => setNewBiz({...newBiz, name: e.target.value})}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Description *</label>
                <textarea
                  required placeholder="Explain services..." value={newBiz.description}
                  onChange={e => setNewBiz({...newBiz, description: e.target.value})}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none h-14"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Category</label>
                  <select
                    value={newBiz.category} onChange={e => setNewBiz({...newBiz, category: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs font-semibold focus:outline-none"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">City</label>
                  <select
                    value={newBiz.location} onChange={e => setNewBiz({...newBiz, location: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs font-semibold focus:outline-none"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-lg shadow-sm">
                Submit Directory Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
