import React, { useState, useEffect } from 'react';
import {
  Building, MapPin, DollarSign, BedDouble, Search,
  PlusCircle, X, Sparkles, Phone, MessageSquare, ShieldAlert
} from 'lucide-react';
import { useApp } from '../App.tsx';

interface Property {
  id: number;
  title: string;
  description: string;
  type: string; // Rent, Sale, Student
  category: string; // House, Commercial, Land, Apartment
  price: number;
  location: string;
  bedrooms: number;
  image?: string;
  isFeatured: boolean;
  ownerId: number;
}

export default function Property() {
  const { user, token, addNotification } = useApp();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Post Property Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProperty, setNewProperty] = useState({
    title: '',
    description: '',
    type: 'Rent',
    category: 'House',
    price: '',
    location: 'Harare',
    bedrooms: '3',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600'
  });

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedType) queryParams.append('type', selectedType);
      if (selectedCategory) queryParams.append('category', selectedCategory);
      if (selectedLocation) queryParams.append('location', selectedLocation);

      const res = await fetch(`/api/properties?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (e) {
      console.warn('Backend connection issue while fetching properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [selectedType, selectedCategory, selectedLocation]);

  const handlePostProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProperty.title || !newProperty.price) return;

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProperty)
      });

      if (res.ok) {
        const added = await res.json();
        setProperties([added, ...properties]);
        setShowAddModal(false);
        setNewProperty({
          title: '',
          description: '',
          type: 'Rent',
          category: 'House',
          price: '',
          location: 'Harare',
          bedrooms: '3',
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600'
        });
        addNotification('Property Listed', `Successfully uploaded property "${added.title}" on ZimHub Real Estate!`, 'Properties');
      }
    } catch (e) {
      alert('Failed to post property listing.');
    }
  };

  const categories = ['House', 'Commercial', 'Land', 'Apartment'];
  const locations = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Victoria Falls', 'Nyanga'];

  return (
    <div className="space-y-8">

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">ZimHub Real Estate & Housing</h1>
          <p className="text-slate-500 text-sm">Find secure family houses, student boarding accommodation, land stands, and commercial property rentals in Zimbabwe.</p>
        </div>
        {user?.role === 'Property Owner' || user?.role === 'Administrator' ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Advertise Property
          </button>
        ) : (
          <div className="text-xs bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-slate-500">
            💡 Verified property owners can publish rentals and commercial stands.
          </div>
        )}
      </div>

      {/* --- FILTER CONTROL GRID --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedType('')}
            className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all ${selectedType === '' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            All Types
          </button>
          <button
            onClick={() => setSelectedType('Rent')}
            className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all ${selectedType === 'Rent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            To Rent
          </button>
          <button
            onClick={() => setSelectedType('Sale')}
            className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all ${selectedType === 'Sale' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            For Sale
          </button>
        </div>

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

      {/* --- AI SMART PROPERTY SUGGESTION PANEL --- */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-xs items-center justify-between">
        <div className="flex gap-2 items-center">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-extrabold text-emerald-950">AI Smart Property Recommendations</p>
            <p className="text-emerald-800">Our AI identifies that Borrowdale double-storey stands represent premium long-term mineral & residential asset appreciation.</p>
          </div>
        </div>
        <span className="hidden sm:inline bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-1 rounded-md uppercase border border-emerald-200">AI Powered</span>
      </div>

      {/* --- PROPERTY LISTINGS GRID --- */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-slate-500 text-xs mt-2">Discovering real estate...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Building className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No properties found matching criteria.</p>
          <p className="text-slate-400 text-xs">Browse other locations or post a new land stand advert!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => (
            <div key={prop.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">

              <div className="relative">
                {prop.image ? (
                  <img src={prop.image} className="w-full h-48 object-cover" alt={prop.title} />
                ) : (
                  <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                    <Building className="w-12 h-12" />
                  </div>
                )}
                <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-2 py-1 rounded-md text-white ${prop.type === 'Sale' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                  For {prop.type}
                </span>
                <span className="absolute bottom-3 right-3 text-lg font-black bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1 rounded-xl shadow-sm">
                  ${prop.price.toLocaleString()}
                  {prop.type === 'Rent' && <span className="text-[10px] font-medium text-slate-300"> / mo</span>}
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                    {prop.category}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight leading-snug line-clamp-1 mt-1">{prop.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{prop.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100 font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {prop.location}</span>
                  {prop.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-slate-400" /> {prop.bedrooms} Bedrooms</span>}
                </div>

                <div className="flex gap-2 pt-3">
                  <a
                    href="https://wa.me/263786110762"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-4 h-4" /> Contact Owner on WhatsApp
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- ADD PROPERTY MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">List Your Real Estate Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostProperty} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spacious 2 Bed Flat near Avondale Shops"
                  value={newProperty.title}
                  onChange={e => setNewProperty({...newProperty, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description *</label>
                <textarea
                  required
                  placeholder="Details about water borehole, electricity load-shedding level, solar backup, garage parking..."
                  value={newProperty.description}
                  onChange={e => setNewProperty({...newProperty, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Price ($ USD) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 120000"
                    value={newProperty.price}
                    onChange={e => setNewProperty({...newProperty, price: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Listing Type</label>
                  <select
                    value={newProperty.type}
                    onChange={e => setNewProperty({...newProperty, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Rent">To Rent</option>
                    <option value="Sale">For Sale</option>
                    <option value="Student">Student Accommodation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={newProperty.category}
                    onChange={e => setNewProperty({...newProperty, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={newProperty.bedrooms}
                    onChange={e => setNewProperty({...newProperty, bedrooms: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City Location</label>
                  <select
                    value={newProperty.location}
                    onChange={e => setNewProperty({...newProperty, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Property Image URL</label>
                <input
                  type="text"
                  value={newProperty.image}
                  onChange={e => setNewProperty({...newProperty, image: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Submit Real Estate Stand
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
