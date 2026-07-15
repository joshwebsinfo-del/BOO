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
    whatsapp: '263786110762', // Default support whatsapp
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
        // Refresh directory rating
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
    <div className="space-y-8">

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Zimbabwe Business Directory</h1>
          <p className="text-slate-500 text-sm">Discover verified businesses, ministries, emergency medical clinics, transport hubs, and professional plumbers.</p>
        </div>
        {user ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Add Your Business
          </button>
        ) : (
          <div className="text-xs bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-slate-500">
            💡 Sign in to advertise your business or local service.
          </div>
        )}
      </div>

      {/* --- FILTERS & SEARCH ROW --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search electricians, dental clinics, ministries..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-sm font-medium w-full"
          />
          <button type="submit" className="hidden">Submit</button>
        </form>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <option value="">All Cities</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      </div>

      {/* --- DIRECTORY LISTINGS GRID --- */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-slate-500 text-xs mt-2">Loading directories...</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Grid className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No businesses found matching your filters.</p>
          <p className="text-slate-400 text-xs">Be the first to list a business or professional service in this category!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businesses.map(biz => (
            <div key={biz.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                      {biz.category} {biz.subCategory && `• ${biz.subCategory}`}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1 flex items-center gap-1">
                      {biz.name}
                      {biz.isVerified && <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" title="ZimHub Verified" />}
                    </h3>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500 font-extrabold text-xs bg-amber-50 px-2 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    {biz.rating || 'N/A'}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{biz.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {biz.location}</span>
                  {biz.hours && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {biz.hours}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => selectBusinessForReviews(biz)}
                  className="text-xs text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-1"
                >
                  💬 Reviews ({bizReviews.length && selectedBiz?.id === biz.id ? bizReviews.length : 'View'})
                </button>

                <div className="flex gap-1.5">
                  {biz.whatsapp && (
                    <a
                      href={`https://wa.me/${biz.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" /> Whatsapp
                    </a>
                  )}
                  {biz.phone && (
                    <a
                      href={`tel:${biz.phone}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl text-xs font-bold transition-all"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD BUSINESS MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">List Your Zimbabwe Business</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBiz} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Harare Solar Solutions"
                  value={newBiz.name}
                  onChange={e => setNewBiz({...newBiz, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description *</label>
                <textarea
                  required
                  placeholder="Explain your services, rates, availability..."
                  value={newBiz.description}
                  onChange={e => setNewBiz({...newBiz, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={newBiz.category}
                    onChange={e => setNewBiz({...newBiz, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Solar, Plumbing, Dental"
                    value={newBiz.subCategory}
                    onChange={e => setNewBiz({...newBiz, subCategory: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0772100200"
                    value={newBiz.phone}
                    onChange={e => setNewBiz({...newBiz, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp (263...)</label>
                  <input
                    type="text"
                    placeholder="e.g. 263786110762"
                    value={newBiz.whatsapp}
                    onChange={e => setNewBiz({...newBiz, whatsapp: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City Location</label>
                  <select
                    value={newBiz.location}
                    onChange={e => setNewBiz({...newBiz, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Operational Hours</label>
                  <input
                    type="text"
                    value={newBiz.hours}
                    onChange={e => setNewBiz({...newBiz, hours: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Submit Directory Listing
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- BUSINESS REVIEWS OVERLAY MODAL --- */}
      {selectedBiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Reviews for {selectedBiz.name}</h3>
                <p className="text-[11px] text-slate-500">ZimHub Peer-to-Peer feedback</p>
              </div>
              <button onClick={() => setSelectedBiz(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Reviews List */}
            <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1">
              {bizReviews.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No reviews submitted yet. Be the first to review!</p>
              ) : (
                bizReviews.map(r => (
                  <div key={r.id} className="pt-2 pb-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{r.user?.name || 'Anonymous User'}</span>
                      <div className="flex items-center text-amber-500 font-bold text-[10px]">
                        <Star className="w-3 h-3 fill-amber-500 inline mr-0.5" /> {r.rating}
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 italic">"{r.comment}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Write Review Form */}
            {user ? (
              <form onSubmit={handleSubmitReview} className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Your Rating:</label>
                  <select
                    value={reviewRating}
                    onChange={e => setReviewRating(parseInt(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold cursor-pointer text-amber-500 focus:outline-none"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 - Premium)</option>
                    <option value="4">⭐⭐⭐⭐ (4 - Excellent)</option>
                    <option value="3">⭐⭐⭐ (3 - Average)</option>
                    <option value="2">⭐⭐ (2 - Poor)</option>
                    <option value="1">⭐ (1 - Terrible)</option>
                  </select>
                </div>

                <div>
                  <textarea
                    required
                    placeholder="Share your experience working with this business/service..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none h-16"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="text-center text-xs text-slate-400 bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                Please login to write a review.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
