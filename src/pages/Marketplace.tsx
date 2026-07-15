import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, MapPin, Tag, MessageCircle, Filter,
  PlusCircle, Star, Trash2, X, AlertCircle, Upload, ThumbsUp
} from 'lucide-react';
import { useApp } from '../App.tsx';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  image?: string;
  whatsapp?: string;
  location: string;
  sellerId: number;
  seller?: {
    name: string;
    role: string;
  };
}

export default function Marketplace() {
  const { user, token, addNotification } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
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

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [sellerRatings, setSellerRatings] = useState<Record<number, { likes: number; dislikes: number }>>({
    3: { likes: 14, dislikes: 1 },
    1: { likes: 32, dislikes: 0 }
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

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNewProduct(prev => ({ ...prev, image: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
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
        setImagePreview(null);
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

  const handleSellerLike = (sellerId: number) => {
    setSellerRatings(prev => {
      const curr = prev[sellerId] || { likes: 0, dislikes: 0 };
      return {
        ...prev,
        [sellerId]: { ...curr, likes: curr.likes + 1 }
      };
    });
  };

  const categories = ['Phones & Laptops', 'Vehicles', 'Agriculture', 'Furniture & Electronics', 'Fashion & Books', 'Services & Food'];

  return (
    <div className="space-y-6">

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col gap-1 border-b pb-3">
        <h1 className="text-xl font-black text-slate-900 leading-tight">Classifieds Market</h1>
        <p className="text-slate-400 text-[10px]">Buy and sell tech, agriculture, fashion, and vehicles</p>
      </div>

      {/* --- FILTER CONTROL GRID --- */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-[11px] font-medium w-full"
          />
        </form>

        <div className="grid grid-cols-3 gap-1.5">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1 text-slate-700 text-[9px] font-black cursor-pointer"
          >
            <option value="">Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select
            value={selectedCondition}
            onChange={e => setSelectedCondition(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1 text-slate-700 text-[9px] font-black cursor-pointer"
          >
            <option value="">Condition</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
          </select>

          <input
            type="number" placeholder="Max ($)" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1 text-slate-700 text-[9px] font-black focus:outline-none"
          />
        </div>
      </div>

      {/* --- SLEEK SLIM CARDS GRID --- */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-4 space-y-1">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-xs">No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map(prod => {
            const rating = sellerRatings[prod.sellerId] || { likes: 0, dislikes: 0 };
            return (
              <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex">

                {/* Product Thumbnail (Compact layout) */}
                <div className="relative w-28 h-28 shrink-0">
                  {prod.image ? (
                    <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}
                  <span className="absolute top-1.5 left-1.5 text-[7px] bg-slate-900/80 text-white font-extrabold px-1 py-0.5 rounded">
                    {prod.condition}
                  </span>
                </div>

                {/* Info and contact details (Right side of compact card) */}
                <div className="p-3 flex-1 flex flex-col justify-between min-w-0 space-y-1.5">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest truncate">{prod.category}</p>
                    <h3 className="font-extrabold text-[11px] text-slate-900 truncate leading-snug">{prod.name}</h3>
                    <p className="text-[10px] text-emerald-700 font-black">${prod.price.toLocaleString()}</p>
                  </div>

                  {/* Seller Panel Compact */}
                  <div className="flex justify-between items-center text-[8px] bg-slate-50 border rounded-lg p-1">
                    <span className="text-slate-600 truncate max-w-[80px]">Seller: {prod.seller?.name || 'Local Seller'}</span>
                    <button
                      onClick={() => handleSellerLike(prod.sellerId)}
                      className="text-emerald-700 font-extrabold flex items-center gap-0.5 hover:underline"
                    >
                      👍 Like ({rating.likes})
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-50">
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {prod.location}</span>
                    <div className="flex gap-1">
                      {prod.whatsapp && (
                        <a
                          href={`https://wa.me/${prod.whatsapp}`}
                          target="_blank" rel="noreferrer"
                          className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-extrabold text-[8px] flex items-center gap-0.5 border border-emerald-100"
                        >
                          <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                        </a>
                      )}
                      {user && (user.id === prod.sellerId || user.role === 'Administrator') && (
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="text-rose-500 hover:text-rose-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD CLASSIFIED AD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-5 border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-extrabold text-sm text-slate-900">Post Classified Ad</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Product Name *</label>
                <input
                  type="text" required placeholder="iPhone 14" value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">Description *</label>
                <textarea
                  required placeholder="Details..." value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none h-14"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Price ($USD) *</label>
                  <input
                    type="number" required placeholder="Price" value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">Condition</label>
                  <select
                    value={newProduct.condition} onChange={e => setNewProduct({...newProduct, condition: e.target.value})}
                    className="w-full bg-slate-50 border rounded-lg p-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div className="border border-dashed rounded-lg p-2 bg-slate-50/50 space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" /> Upload Photo
                </label>
                <input
                  type="file" accept="image/*" onChange={handleDeviceImageUpload}
                  className="w-full text-[10px] text-slate-400 cursor-pointer"
                />
                {imagePreview && (
                  <img src={imagePreview} className="w-10 h-10 rounded object-cover border" alt="" />
                )}
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-3 rounded-lg shadow-sm">
                Publish Advertisement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
