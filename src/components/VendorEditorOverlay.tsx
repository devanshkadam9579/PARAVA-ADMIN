import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { X, Save, Image as ImageIcon, MapPin, Phone, Link as LinkIcon, DollarSign, Award, ShieldCheck } from 'lucide-react';

interface VendorEditorOverlayProps {
  vendor?: any;
  onClose: () => void;
}

export default function VendorEditorOverlay({ vendor, onClose }: VendorEditorOverlayProps) {
  const isEdit = !!vendor;
  const [formData, setFormData] = useState<any>({
    name: '',
    category: '',
    location: '',
    description: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    image: '',
    basePrice: '',
    rating: '5.0',
    trustScore: '90',
    regionRank: '0',
    approved: false,
    latitude: '',
    longitude: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendor) {
      setFormData({
        ...vendor,
        basePrice: vendor.basePrice || vendor.price || '',
        image: vendor.image || vendor.images?.[0] || '',
        regionRank: vendor.regionRank || '0',
        trustScore: vendor.trustScore || '90'
      });
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = getDb();
      const id = isEdit ? vendor.id : `vendor-${Date.now()}`;
      
      const payload = {
        ...formData,
        basePrice: Number(formData.basePrice) || 0,
        price: Number(formData.basePrice) || 0,
        rating: Number(formData.rating) || 5,
        trustScore: Number(formData.trustScore) || 90,
        regionRank: Number(formData.regionRank) || 0,
        images: [formData.image],
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        await updateDoc(doc(db, 'vendors', id), payload);
      } else {
        await setDoc(doc(db, 'vendors', id), {
          ...payload,
          id,
          createdAt: new Date().toISOString()
        });
      }
      
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error saving vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-800">{isEdit ? 'Edit Vendor Profile' : 'Onboard New Vendor'}</h2>
            <p className="text-xs text-gray-500 mt-1">{isEdit ? `ID: ${vendor.id}` : 'Fill in all required fields'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Basic Info */}
          <section>
            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award size={14} /> Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Vendor Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category *</label>
                <input required type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g., Venues, Photography" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Base Price (₹) *</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"></textarea>
              </div>
            </div>
          </section>

          {/* Section 2: Contact & Location */}
          <section>
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={14} /> Contact & Location
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">City / Region *</label>
                <input required type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Mumbai, Maharashtra" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">WhatsApp</label>
                <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
            </div>
          </section>

          {/* Section 3: Media & Social */}
          <section>
            <h3 className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> Media & Socials
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Primary Image URL</label>
                <input type="url" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Instagram Link</label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="url" name="instagram" value={formData.instagram} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Performance & Ranking */}
          <section>
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={14} /> Admin Controls (Ranking & Trust)
            </h3>
            <div className="grid grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Trust Score (0-100)</label>
                <input type="number" name="trustScore" value={formData.trustScore} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Region Rank Boost</label>
                <input type="number" name="regionRank" value={formData.regionRank} onChange={handleChange} placeholder="0 = Default, 100 = Top" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Rating (Out of 5)</label>
                <input type="number" step="0.1" name="rating" value={formData.rating} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div className="col-span-3 pt-2 flex items-center gap-3">
                <input type="checkbox" id="approved" name="approved" checked={formData.approved} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                <label htmlFor="approved" className="text-sm font-bold text-gray-700">Vendor is Approved & Publicly Visible</label>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-brand-primary-dark transition flex items-center gap-2 disabled:opacity-50">
            <Save size={16} />
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Onboard Vendor')}
          </button>
        </div>
      </div>
    </div>
  );
}
