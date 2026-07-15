import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, MapPin, Tag, MessageCircle, Filter,
  PlusCircle, Star, Trash2, X, AlertCircle
} from 'lucide-react';
import { useApp } from '../App.tsx';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  condition: string; // New, Used
  image?: string;
  whatsapp?: string;
  location: string;
  sellerId: number;
}

export default function Marketplace() {
  const { user, token, addNotification } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Phones & Laptops',
    condition: 'New',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600',
    whatsapp: '263786110762',
    location: 'Harare'
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedCategory) queryParams.append('category', selectedCategory);
      if (selectedCondition) queryParams.append('condition', selectedCondition);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.warn('Backend connection issue while fetching products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedCondition, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });

      if (res.ok) {
        const added = await res.json();
        setProducts([added, ...products]);
        setShowAddModal(false);
        setNewProduct({
          name: '',
          description: '',
          price: '',
          category: 'Phones & Laptops',
          condition: 'New',
          image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600',
          whatsapp: '263786110762',
          location: 'Harare'
        });
        addNotification('Product Posted', `Successfully listed "${added.name}" on the marketplace!`, 'Classified');
      }
    } catch (err) {
      alert('Failed to register product.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Delete this product listing?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        addNotification('Listing Deleted', 'Successfully removed your product from the marketplace.', 'System');
      }
    } catch (e) {
      alert('Failed to delete product.');
    }
  };

  const categories = ['Phones & Laptops', 'Vehicles', 'Agriculture', 'Furniture & Electronics', 'Fashion & Books', 'Services & Food'];

  return (
    <div className="space-y-8">

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">ZimHub Classified Marketplace</h1>
          <p className="text-slate-500 text-sm">Discover tech gadgets, agricultural inputs, used vehicles, and fresh food from verified sellers across Zimbabwe.</p>
        </div>
        {user ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Post Classified Ad
          </button>
        ) : (
          <div className="text-xs bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-slate-500">
            💡 Sign in to list items for sell or trade.
          </div>
        )}
      </div>

      {/* --- FILTER CONTROL GRID --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search iPhones, laptops, SC727 seed maize..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-sm font-medium w-full"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select
            value={selectedCondition}
            onChange={e => setSelectedCondition(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            <option value="">Any Condition</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
          </select>

          <input
            type="number"
            placeholder="Max Price ($)"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold w-28 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* --- PRODUCTS GRID --- */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-slate-500 text-xs mt-2">Discovering items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No marketplace products match your filters.</p>
          <p className="text-slate-400 text-xs">Consider broadening your search parameters or list a new item!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(prod => (
            <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">

              {/* Product Image */}
              <div className="relative">
                {prod.image ? (
                  <img src={prod.image} className="w-full h-48 object-cover" alt={prod.name} />
                ) : (
                  <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}
                <span className="absolute top-3 left-3 text-[10px] bg-slate-900/80 backdrop-blur-sm text-white font-bold px-2 py-1 rounded-md">
                  {prod.condition}
                </span>
                <span className="absolute bottom-3 right-3 text-lg font-black bg-emerald-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-xl shadow-sm">
                  ${prod.price.toLocaleString()}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{prod.category}</p>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight leading-snug line-clamp-1">{prod.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{prod.description}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {prod.location}</span>

                  <div className="flex gap-1">
                    {prod.whatsapp && (
                      <a
                        href={`https://wa.me/${prod.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Seller
                      </a>
                    )}
                    {user && (user.id === prod.sellerId || user.role === 'Administrator') && (
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- ADD CLASSIFIED AD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">Post a Classified Advert</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPad Air 4th Gen 64GB"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description *</label>
                <textarea
                  required
                  placeholder="Describe your item condition, specs, box accessories, etc..."
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Price ($ USD) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 450"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Condition</label>
                  <select
                    value={newProduct.condition}
                    onChange={e => setNewProduct({...newProduct, condition: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City Location</label>
                  <input
                    type="text"
                    value={newProduct.location}
                    onChange={e => setNewProduct({...newProduct, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp Contact (263...)</label>
                  <input
                    type="text"
                    value={newProduct.whatsapp}
                    onChange={e => setNewProduct({...newProduct, whatsapp: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Product Image URL</label>
                  <input
                    type="text"
                    value={newProduct.image}
                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Submit Classified Advertisement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
