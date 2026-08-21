import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { doc, setDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { X, Save, Image as ImageIcon, MapPin, Phone, Link as LinkIcon, DollarSign, Award, ShieldCheck, User, Video } from 'lucide-react';

interface VendorEditorOverlayProps {
  vendor?: any;
  onClose: () => void;
}

export default function VendorEditorOverlay({ vendor, onClose }: VendorEditorOverlayProps) {
  const isEdit = !!vendor;
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const [formData, setFormData] = useState<any>({
    vendorPortalId: `PARVA-VEN-${Date.now()}`,
    name: '',
    category: 'Venues',
    region: 'Mumbai',
    location: '',
    fullAddress: '',
    googleMapsUrl: '',
    description: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    image1: '',
    image2: '',
    image3: '',
    image4: '',
    image5: '',
    reelUrl: '',
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
    approved: false,
    services: []
  });

  const [newService, setNewService] = useState({ name: '', price: '', unit: 'event', description: '', image: '' });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendor) {
      setFormData({
        ...vendor,
        vendorPortalId: vendor.vendorPortalId || vendor.id || `PARVA-VEN-${Date.now()}`,
        region: vendor.region || 'Mumbai',
        category: vendor.category || 'Venues',
        googleMapsUrl: vendor.googleMapsUrl || '',
        founderImage: vendor.founderImage || '',
        basePrice: vendor.basePrice || vendor.price || '',
        minBudget: vendor.minBudget || vendor.basePrice || '',
        maxBudget: vendor.maxBudget || '',
        eventsHandled: vendor.eventsHandled ? vendor.eventsHandled.join(', ') : '',
        image1: vendor.images?.[0] || vendor.image || '',
        image2: vendor.images?.[1] || '',
        image3: vendor.images?.[2] || '',
        image4: vendor.images?.[3] || '',
        image5: vendor.images?.[4] || '',
        regionRank: vendor.regionRank || '0',
        trustScore: vendor.trustScore || '90',
        services: vendor.services || []
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
      
      const images = [formData.image1, formData.image2, formData.image3, formData.image4, formData.image5].filter(Boolean);

      const payload = {
        ...formData,
        eventsHandled: formData.eventsHandled.split(',').map((e: string) => e.trim()).filter(Boolean),
        basePrice: Number(formData.basePrice) || Number(formData.minBudget) || 0,
        price: Number(formData.basePrice) || Number(formData.minBudget) || 0,
        minBudget: Number(formData.minBudget) || 0,
        maxBudget: Number(formData.maxBudget) || 0,
        rating: Number(formData.rating) || 5,
        trustScore: Number(formData.trustScore) || 90,
        regionRank: Number(formData.regionRank) || 0,
        images,
        updatedAt: new Date().toISOString()
      };

      // Clean up individual image keys before saving
      delete payload.image1;
      delete payload.image2;
      delete payload.image3;
      delete payload.image4;
      delete payload.image5;
      delete payload.image;

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
      <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
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
              <Award size={14} /> Basic Information & Portal Access
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Dedicated Vendor ID (For Portal Access) *</label>
                <div className="relative">
                  <ShieldCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="text" name="vendorPortalId" value={formData.vendorPortalId} onChange={handleChange} className="w-full bg-indigo-50/50 border border-indigo-200 text-indigo-700 font-mono rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Vendor Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category *</label>
                <input 
                  required 
                  list="vendor-categories"
                  type="text" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  placeholder="Select or type category..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                />
                <datalist id="vendor-categories">
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Events Handled (Comma Separated)</label>
                <input type="text" name="eventsHandled" value={formData.eventsHandled} onChange={handleChange} placeholder="Wedding, Birthday, Corporate" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Min Budget (₹) *</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="number" name="minBudget" value={formData.minBudget} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Max Budget (₹)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" name="maxBudget" value={formData.maxBudget} onChange={handleChange} placeholder="Optional" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"></textarea>
              </div>
            </div>
          </section>

          {/* Section: Founder Info */}
          <section>
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User size={14} /> Meet the Founder
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Founder Name</label>
                <input type="text" name="founderName" value={formData.founderName} onChange={handleChange} placeholder="e.g. Rajvardhan Patil" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Founder Role</label>
                <input type="text" name="founderBio" value={formData.founderBio} onChange={handleChange} placeholder="e.g. 10 Years Experience" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Founder Profile Image URL</label>
                <div className="relative">
                  <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="url" name="founderImage" value={formData.founderImage} onChange={handleChange} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Media (Images & Reels) */}
          <section>
            <h3 className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> Media & Portfolio
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Reel / Video URL</label>
                <div className="relative">
                  <Video size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="url" name="reelUrl" value={formData.reelUrl} onChange={handleChange} placeholder="Instagram Reel or Video Link" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
              
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Portfolio Images (Up to 5)</label>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex gap-2">
                      <span className="bg-gray-100 text-gray-400 font-bold text-xs w-8 flex items-center justify-center rounded-xl">{num}</span>
                      <input type="url" name={`image${num}`} value={formData[`image${num}` as keyof typeof formData]} onChange={handleChange} placeholder={`Image URL ${num}`} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Instagram Link</label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="url" name="instagram" value={formData.instagram} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Contact & Location */}
          <section>
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={14} /> Contact & Location
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Region *</label>
                <select name="region" value={formData.region} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary">
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Goa">Goa</option>
                  <option value="Udaipur">Udaipur</option>
                  <option value="Jaipur">Jaipur</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">City / Specific Area *</label>
                <input required type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Bandra West" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Full Address / Pincode</label>
                <input type="text" name="fullAddress" value={formData.fullAddress} onChange={handleChange} placeholder="Detailed address..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Google Maps Embed URL</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="url" name="googleMapsUrl" value={formData.googleMapsUrl} onChange={handleChange} placeholder="https://www.google.com/maps/embed?pb=..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
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

          {/* Section: Performance & Ranking */}
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
                <input type="number" name="regionRank" value={formData.regionRank} onChange={handleChange} placeholder="0 = Default" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
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

          {/* Section: Services Builder */}
          <section>
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award size={14} /> Services Builder
            </h3>
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Service Name</label>
                  <input type="text" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} placeholder="e.g. 3-Tier Fondant Cake" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Price (₹)</label>
                  <input type="number" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Unit</label>
                  <input type="text" value={newService.unit} onChange={(e) => setNewService({ ...newService, unit: e.target.value })} placeholder="e.g. cake, hour, event" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-rose-400" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                  <input type="text" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} placeholder="Short details about the service" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-rose-400" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Image URL (Optional)</label>
                  <input type="url" value={newService.image} onChange={(e) => setNewService({ ...newService, image: e.target.value })} placeholder="https://..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-rose-400" />
                </div>
                <div className="col-span-2">
                  <button 
                    onClick={() => {
                      if (newService.name && newService.price) {
                        setFormData((prev: any) => ({
                          ...prev,
                          services: [...(prev.services || []), { ...newService, price: Number(newService.price) }]
                        }));
                        setNewService({ name: '', price: '', unit: 'event', description: '', image: '' });
                      }
                    }}
                    className="w-full py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition"
                  >
                    + Add Service
                  </button>
                </div>
              </div>

              {formData.services && formData.services.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Added Services ({formData.services.length})</p>
                  {formData.services.map((svc: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200">
                      <div className="flex gap-3 items-center">
                        {svc.image ? (
                          <img src={svc.image} alt={svc.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <ImageIcon size={14} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-gray-800">{svc.name}</p>
                          <p className="text-[10px] text-gray-500">₹{svc.price} / {svc.unit}</p>
                        </div>
                      </div>
                      <button onClick={() => {
                        setFormData((prev: any) => ({
                          ...prev,
                          services: prev.services.filter((_: any, i: number) => i !== idx)
                        }));
                      }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
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
