import React, { useState, useEffect } from 'react';
import {
  Grid, Search, MapPin, Phone, MessageCircle, Star, ShieldCheck,
  Clock, Globe, Mail, PlusCircle, ThumbsUp, X, CheckSquare, MessageSquare
} from 'lucide-react';
import { useApp } from '../App.tsx';

// Import Firestore SDK hooks
import { collection, addDoc } from 'firebase/firestore';
import { firestoreDb } from '../firebase.ts';

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

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    name: string;
  };
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
    subCategory: 'Tutors & Photographers',
    phone: '0786110762',
    whatsapp: '263786110762',
    email: 'info@zimservices.co.zw',
    website: 'https://zimhub.co.zw',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    location: 'Harare'
  });

  // Inline card-level reviews tracking state
  const [activeReviewsId, setActiveReviewsId] = useState<number | null>(null);
  const [activeReviewsList, setActiveReviewsList] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

        // Sync listed business to Firebase Firestore database as requested!
        try {
          await addDoc(collection(firestoreDb, 'businesses'), {
            name: added.name,
            description: added.description,
            category: added.category,
            subCategory: added.subCategory,
            phone: added.phone,
            whatsapp: added.whatsapp,
            email: added.email,
            website: added.website,
            hours: added.hours,
            location: added.location,
            rating: added.rating,
            createdAt: new Date().toISOString()
          });
          console.log('[Firestore] Successfully synchronized business directory document.');
        } catch (fsErr: any) {
          console.warn(`[Firestore sync warning] ${fsErr.message}`);
        }

        setShowAddModal(false);
        setNewBiz({
          name: '',
          description: '',
          category: 'Local Services',
          subCategory: 'Tutors & Photographers',
          phone: '0786110762',
          whatsapp: '263786110762',
          email: 'info@zimservices.co.zw',
          website: 'https://zimhub.co.zw',
          hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
          location: 'Harare'
        });
        addNotification('Listing Created', `Successfully listed "${added.name}" on the business directory!`, 'System');
      }
    } catch (err) {
      alert('Failed to register business on backend.');
    }
  };

  const toggleCardReviews = async (bizId: number) => {
    if (activeReviewsId === bizId) {
      setActiveReviewsId(null);
      setActiveReviewsList([]);
      return;
    }

    try {
      setActiveReviewsId(bizId);
      setReviewComment('');
      setReviewRating(5);
      const res = await fetch(`/api/reviews/Business/${bizId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReviewsList(data);
      }
    } catch (e) {
      setActiveReviewsList([]);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent, bizId: number) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      setSubmittingReview(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId: bizId,
          targetType: 'Business',
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        const newRev = await res.json();

        // Sync rating feedback review to Firebase Firestore database
        try {
          await addDoc(collection(firestoreDb, 'reviews'), {
            bizId: bizId,
            rating: reviewRating,
            comment: reviewComment,
            userEmail: user?.email,
            createdAt: new Date().toISOString()
          });
          console.log('[Firestore] Successfully synchronized business feedback review document.');
        } catch (fsErr: any) {
          console.warn(`[Firestore sync warning] ${fsErr.message}`);
        }

        // Refresh reviews list
        setActiveReviewsList([newRev, ...activeReviewsList]);
        setReviewComment('');
        fetchBusinesses(); // Refresh average stars
        addNotification('Review Posted', 'Thank you for your rating and feedback on this service!', 'Feedback');
      } else {
        alert('Could not submit feedback review.');
      }
    } catch (e) {
      alert('Error saving review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const categories = ['Local Services', 'Restaurants', 'Healthcare', 'Transport', 'Education', 'Government'];
  const locations = ['Harare', 'Bulawayo', 'Victoria Falls', 'Nyanga', 'Gweru', 'Mutare'];

  return (
    <div className="space-y-6">

      {/* --- PAGE HEADER --- */}
      <div className="flex justify-between items-center gap-2 border-b pb-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-tight">Business Directory</h1>
          <p className="text-slate-400 text-[10px]">Find plumbers, restaurants, medical clinics, and transport shuttles</p>
        </div>

        {user ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" /> List Service
          </button>
        ) : null}
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
                    {biz.rating || '5.0'}
                  </div>
                </div>

                <p className="text-[10px] text-slate-600 leading-relaxed">{biz.description}</p>

                <div className="flex gap-3 text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-50">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {biz.location}</span>
                  {biz.hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {biz.hours}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                <button
                  onClick={() => toggleCardReviews(biz.id)}
                  className="text-[9px] text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Reviews ({activeReviewsId === biz.id ? activeReviewsList.length : 'Toggle View'})
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

              {/* INLINE EXPANDED CARD REVIEWS PANEL AND INPUT FORM */}
              {activeReviewsId === biz.id && (
                <div className="bg-slate-50 rounded-xl p-3 border space-y-3 animate-in slide-in-from-top-2">
                  <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Customer Reviews</span>

                  {activeReviewsList.length === 0 ? (
                    <p className="text-[9px] text-slate-400 italic">No reviews yet. Be the first to leave a feedback comment!</p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {activeReviewsList.map(rev => (
                        <div key={rev.id} className="bg-white p-2 rounded-lg border text-[9px] space-y-0.5">
                          <div className="flex justify-between items-center text-slate-500 font-extrabold">
                            <span>{rev.user?.name || 'Anonymous User'}</span>
                            <span className="text-amber-500 font-black">★ {rev.rating}</span>
                          </div>
                          <p className="text-slate-700 leading-normal">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Leave a Review form */}
                  {user ? (
                    <form onSubmit={(e) => handleSubmitReview(e, biz.id)} className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <label className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wide">Leave feedback</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star} type="button" onClick={() => setReviewRating(star)}
                              className="text-xs"
                            >
                              <Star className={`w-3.5 h-3.5 ${reviewRating >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text" required placeholder="Write a comment..." value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          className="w-full bg-white border rounded-lg p-1.5 text-[10px] focus:outline-none"
                        />
                        <button
                          type="submit" disabled={submittingReview}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] px-2.5 rounded-lg shrink-0"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-[8px] text-center text-slate-400 font-semibold pt-1 border-t">Sign in to rate this service</p>
                  )}
                </div>
              )}

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
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Subcategory</label>
                  <input
                    type="text" placeholder="e.g. Plumbing & Repair" value={newBiz.subCategory}
                    onChange={e => setNewBiz({...newBiz, subCategory: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">City Location</label>
                  <select
                    value={newBiz.location} onChange={e => setNewBiz({...newBiz, location: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Business Hours</label>
                  <input
                    type="text" placeholder="8:00 AM - 5:00 PM" value={newBiz.hours}
                    onChange={e => setNewBiz({...newBiz, hours: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">WhatsApp Number *</label>
                  <input
                    type="text" required placeholder="263786110762" value={newBiz.whatsapp}
                    onChange={e => setNewBiz({...newBiz, whatsapp: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text" placeholder="+263771100200" value={newBiz.phone}
                    onChange={e => setNewBiz({...newBiz, phone: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email" placeholder="contact@services.co.zw" value={newBiz.email}
                    onChange={e => setNewBiz({...newBiz, email: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Website URL</label>
                  <input
                    type="text" placeholder="www.yourservices.co.zw" value={newBiz.website}
                    onChange={e => setNewBiz({...newBiz, website: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
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
