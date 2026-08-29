import CloudinaryImageUploader from './CloudinaryImageUploader';
import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import CalendarBlocker from './CalendarBlocker';
import { X, Save, Image as ImageIcon, Phone, DollarSign, Award, User, Video, Plus, Trash2, Layers } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Venues',
  'Decorators',
  'Catering',
  'Photography',
  'DJ & Sound',
  'Makeup Artists',
  'Cake & Desserts',
  'Event Planners'
];

const DEFAULT_CITIES = [
  'Kolhapur',
  'Pune',
  'Mumbai',
  'Goa',
  'Bangalore',
  'Delhi',
  'Jaipur',
  'Udaipur'
];

interface VendorEditorOverlayProps {
  vendor?: any;
  onClose: () => void;
}

export default function VendorEditorOverlay({ vendor, onClose }: VendorEditorOverlayProps) {
  const isEdit = !!vendor;
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>(DEFAULT_CITIES);

  useEffect(() => {
    const db = getDb();
    // Subscribe to live categories
    const unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
      const liveCats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (liveCats.length > 0) {
        setCategories(liveCats);
      } else {
        setCategories(DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name })));
      }
    });

    // Subscribe to live cities
    const unsubCities = onSnapshot(collection(db, 'cities'), (snap) => {
      const liveCities = snap.docs.map(d => d.data().name || d.id).filter(Boolean);
      if (liveCities.length > 0) {
        setCities(Array.from(new Set([...liveCities, ...DEFAULT_CITIES])));
      }
    });

    return () => {
      unsubCat();
      unsubCities();
    };
  }, []);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (vendor?.categories && Array.isArray(vendor.categories)) return vendor.categories;
    if (vendor?.category) return [vendor.category];
    return ['Venues'];
  });

  const [imagesList, setImagesList] = useState<string[]>(() => {
    if (vendor?.images && Array.isArray(vendor.images) && vendor.images.length > 0) {
      return vendor.images;
    }
    return ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600'];
  });

  const [videosList, setVideosList] = useState<string[]>(() => {
    if (vendor?.videos && Array.isArray(vendor.videos) && vendor.videos.length > 0) {
      return vendor.videos;
    }
    return vendor?.reelUrl ? [vendor.reelUrl] : [''];
  });

  const [formData, setFormData] = useState<any>({
    vendorPortalId: `PARVA-VEN-${Date.now()}`,
    name: '',
    category: 'Venues',
    region: 'Kolhapur',
    location: 'Kolhapur',
    fullAddress: '',
    googleMapsUrl: '',
    description: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    founderName: '',
    founderBio: '',
    founderImage: '',
    basePrice: '',
    minBudget: '',
    maxBudget: '',
    eventsHandled: '',
    rating: '5.0',
    trustScore: '90',
    regionRank: '0',
    approved: true,
    services: [],
    busyDates: []
  });

  const [newService, setNewService] = useState({ name: '', price: '', unit: 'event', description: '', image: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendor) {
      setFormData({
        ...vendor,
        vendorPortalId: vendor.vendorPortalId || vendor.id || `PARVA-VEN-${Date.now()}`,
        region: vendor.region || vendor.location || 'Kolhapur',
        location: vendor.location || vendor.region || 'Kolhapur',
        category: vendor.category || (vendor.categories?.[0]) || 'Venues',
        googleMapsUrl: vendor.googleMapsUrl || '',
        founderImage: vendor.founderImage || '',
        basePrice: vendor.basePrice || vendor.price || '',
        minBudget: vendor.minBudget || vendor.basePrice || '',
        maxBudget: vendor.maxBudget || '',
        eventsHandled: Array.isArray(vendor.eventsHandled) ? vendor.eventsHandled.join(', ') : (vendor.eventsHandled || ''),
        regionRank: vendor.regionRank || vendor.rank || '0',
        trustScore: vendor.trustScore || '90',
        approved: vendor.approved !== false,
        services: vendor.services || [],
        busyDates: vendor.busyDates || []
      });
      if (vendor.categories && Array.isArray(vendor.categories)) {
        setSelectedCategories(vendor.categories);
      } else if (vendor.category) {
        setSelectedCategories([vendor.category]);
      }
      if (vendor.images && Array.isArray(vendor.images)) {
        setImagesList(vendor.images);
      }
      if (vendor.videos && Array.isArray(vendor.videos)) {
        setVideosList(vendor.videos);
      }
    }
  }, [vendor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      if (selectedCategories.length > 1) {
        const next = selectedCategories.filter(c => c !== catName);
        setSelectedCategories(next);
        setFormData((p: any) => ({ ...p, category: next[0] }));
      }
    } else {
      const next = [...selectedCategories, catName];
      setSelectedCategories(next);
      setFormData((p: any) => ({ ...p, category: next[0] }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = getDb();
      const id = isEdit ? vendor.id : `vendor-${Date.now()}`;
      
      const cleanImages = imagesList.map(img => img.trim()).filter(Boolean);
      const cleanVideos = videosList.map(v => v.trim()).filter(Boolean);

      const payload = {
        ...formData,
        id,
        category: selectedCategories[0] || formData.category || 'Venues',
        categories: selectedCategories.length > 0 ? selectedCategories : [formData.category || 'Venues'],
        location: formData.location || formData.region || 'Kolhapur',
        region: formData.region || formData.location || 'Kolhapur',
        eventsHandled: formData.eventsHandled ? formData.eventsHandled.split(',').map((e: string) => e.trim()).filter(Boolean) : ['Weddings', 'Birthdays', 'Corporate'],
        basePrice: Number(formData.basePrice) || Number(formData.minBudget) || 0,
        price: Number(formData.basePrice) || Number(formData.minBudget) || 0,
        minBudget: Number(formData.minBudget) || Number(formData.basePrice) || 0,
        maxBudget: Number(formData.maxBudget) || 0,
        rating: Number(formData.rating) || 5,
        trustScore: Number(formData.trustScore) || 90,
        regionRank: Number(formData.regionRank) || 0,
        rank: Number(formData.regionRank) || 0,
        images: cleanImages.length > 0 ? cleanImages : ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600'],
        videos: cleanVideos,
        reelUrl: cleanVideos[0] || '',
        approved: true,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'vendors', id), payload, { merge: true });
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`Error saving vendor: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (!newService.name || !newService.price) return;
    setFormData((prev: any) => ({
      ...prev,
      services: [...prev.services, { ...newService, price: Number(newService.price) }]
    }));
    setNewService({ name: '', price: '', unit: 'event', description: '', image: '' });
  };

  const removeService = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      services: prev.services.filter((_: any, i: number) => i !== idx)
    }));
  };

  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES.map(n => ({ id: n.toLowerCase(), name: n }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between z-20">
          <div>
            <h2 className="text-lg font-black text-gray-900">{isEdit ? 'Edit Vendor Partner' : 'Onboard New Vendor'}</h2>
            <p className="text-xs text-gray-500">Live synchronization with customer app & Explore directory</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-8 flex-1">
          {/* Section: Basic Info */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center gap-2">
              <Award size={14} /> Basic Information & Portal Access
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Partner Portal ID *</label>
                <input 
                  type="text" 
                  name="vendorPortalId" 
                  value={formData.vendorPortalId} 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold outline-none focus:border-brand-primary" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Business Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="e.g. Sayaji Ballroom & Royal Caterers" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-primary" 
                />
              </div>
            </div>

            {/* Multi-Category Selection */}
            <div className="space-y-1.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block">
                  Select Provided Service Categories (Multiple Allowed)
                </label>
                <span className="text-[10px] text-brand-primary font-bold">{selectedCategories.length} Selected</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {displayCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.name);
                  return (
                    <button
                      type="button"
                      key={cat.id || cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">City / Region *</label>
                <select 
                  name="region" 
                  value={formData.region} 
                  onChange={(e) => {
                    handleChange(e);
                    setFormData((prev: any) => ({ ...prev, location: e.target.value }));
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-primary"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Detailed Operational Locality</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. Tarabai Park, Kolhapur" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary" 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Catchy Tagline / Specialty</label>
              <input 
                type="text" 
                name="tagline" 
                value={formData.tagline || ''} 
                onChange={handleChange} 
                placeholder="e.g. Making celebrations royal and memorable" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary" 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Full Biography / Description</label>
              <textarea 
                rows={3} 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Comprehensive details regarding experience, catering menus, setup capacity..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary resize-none" 
              />
            </div>
          </section>

          {/* Section: Contact Details */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-2">
              <Phone size={14} /> Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Calling Phone *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">WhatsApp Number</label>
                <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="9876543210" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary" />
              </div>
            </div>
          </section>

          {/* Section: Pricing & Capacity */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={14} /> Baseline Pricing & Capacity
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Base Price (₹)</label>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} placeholder="25000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Min Budget (₹)</label>
                <input type="number" name="minBudget" value={formData.minBudget} onChange={handleChange} placeholder="20000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Capacity (Guests)</label>
                <input type="number" name="capacity" value={formData.capacity || ''} onChange={handleChange} placeholder="500" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-primary" />
              </div>
            </div>
          </section>

          {/* Section: Dynamic Unlimited Images & Media */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-purple-600 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} /> Showcase Portfolio Photos ({imagesList.length})
              </h3>
              <button
                type="button"
                onClick={() => setImagesList([...imagesList, ''])}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 border border-purple-200 transition active:scale-95"
              >
                <Plus size={12} />
                <span>Add Image Slot</span>
              </button>
            </div>

            <div className="space-y-3">
              {imagesList.map((imgUrl, idx) => (
                <div key={idx} className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200 space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-700 uppercase">
                      {idx === 0 ? '📷 Primary Cover Photo' : `Showcase Image #${idx + 1}`}
                    </span>
                    {imagesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setImagesList(imagesList.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <CloudinaryImageUploader
                    label={`Upload Photo #${idx + 1} (Camera / Gallery)`}
                    currentImageUrl={imgUrl}
                    onImageUploaded={(url) => {
                      const updated = [...imagesList];
                      updated[idx] = url;
                      setImagesList(updated);
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">or URL:</span>
                    <input
                      type="text"
                      placeholder="Paste image link https://..."
                      value={imgUrl}
                      onChange={(e) => {
                        const updated = [...imagesList];
                        updated[idx] = e.target.value;
                        setImagesList(updated);
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Video Shorts & Reels */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-2">
                <Video size={14} /> Video Shorts & Event Reels ({videosList.length})
              </h3>
              <button
                type="button"
                onClick={() => setVideosList([...videosList, ''])}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 border border-rose-200 transition active:scale-95"
              >
                <Plus size={12} />
                <span>Add Video Slot</span>
              </button>
            </div>

            <div className="space-y-3">
              {videosList.map((vidUrl, idx) => (
                <div key={idx} className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200 space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-700 uppercase">
                      Video Reel #{idx + 1}
                    </span>
                    {videosList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVideosList(videosList.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <CloudinaryImageUploader
                    label={`Record / Upload MP4 Video #${idx + 1}`}
                    currentImageUrl={vidUrl}
                    allowVideo={true}
                    onImageUploaded={(url) => {
                      const updated = [...videosList];
                      updated[idx] = url;
                      setVideosList(updated);
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">or URL:</span>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/shorts/... or https://..."
                      value={vidUrl}
                      onChange={(e) => {
                        const updated = [...videosList];
                        updated[idx] = e.target.value;
                        setVideosList(updated);
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Founder Information */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Meet the Founder
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Founder Full Name</label>
                <input type="text" name="founderName" value={formData.founderName} onChange={handleChange} placeholder="e.g. Aditya Deshmukh" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Experience / Role</label>
                <input type="text" name="founderBio" value={formData.founderBio} onChange={handleChange} placeholder="e.g. 10+ Years Experience" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary" />
              </div>
            </div>

            <div className="space-y-1.5 bg-gray-50/80 p-3 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">Founder Profile Photo (Camera / Gallery or URL)</label>
              <CloudinaryImageUploader
                label="📷 Take Founder Photo / Pick from Gallery"
                currentImageUrl={formData.founderImage}
                onImageUploaded={(url) => setFormData((prev: any) => ({ ...prev, founderImage: url }))}
              />
              <input
                type="text"
                placeholder="or paste URL https://..."
                value={formData.founderImage}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, founderImage: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-brand-primary"
              />
            </div>
          </section>

          {/* Section: Packages & Services */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} /> Packages & Custom Services ({formData.services?.length || 0})
            </h3>
            
            {/* Add new service form */}
            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Service Name (e.g. Stage Decor)"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addService}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-1 transition active:scale-95"
                >
                  <Plus size={12} /> Add Service
                </button>
              </div>
            </div>

            {/* List of services */}
            <div className="space-y-2">
              {(formData.services || []).map((srv: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
                  <div>
                    <span className="text-xs font-black text-gray-800">{srv.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium ml-2">₹{srv.price}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeService(idx)}
                    className="text-gray-400 hover:text-red-500 p-1 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Operational Calendar Schedule */}
          <section className="space-y-2">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              📅 Operational Booking Calendar Blocker
            </h3>
            <CalendarBlocker 
              busyDates={formData.busyDates || []} 
              onChange={(newDates) => setFormData((prev: any) => ({ ...prev, busyDates: newDates }))} 
            />
          </section>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 z-20">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || !formData.name}
            className="px-7 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold flex items-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save & Publish Vendor'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
