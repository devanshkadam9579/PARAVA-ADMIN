import CloudinaryImageUploader from './CloudinaryImageUploader';
import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { authenticatedFetch } from '../lib/apiClient';
import { collection, onSnapshot, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Grid, Trash2, Plus, Edit2, X, Save, CheckCircle, Ban, Download } from 'lucide-react';
import Papa from 'papaparse';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export default function CategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatOrder, setNewCatOrder] = useState<number>(10);
  const [newCatStatus, setNewCatStatus] = useState<'active' | 'inactive'>('active');
  const [newCatServices, setNewCatServices] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOrder, setEditOrder] = useState<number>(10);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editServices, setEditServices] = useState('');

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by displayOrder
      items.sort((a: any, b: any) => (Number(a.displayOrder) || 100) - (Number(b.displayOrder) || 100));
      setCategories(items);
    });
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const customId = newCatName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const defaultImage = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400';
    const imageUrl = newCatImage || newCatIcon || defaultImage;
    const parsedServices = newCatServices ? newCatServices.split(',').map(s => s.trim()).filter(Boolean) : [];

    const payload = {
      id: customId,
      name: newCatName.trim(),
      icon: newCatIcon || 'Sparkles',
      iconName: newCatIcon || 'Sparkles',
      image: imageUrl,
      imageUrl: imageUrl,
      description: newCatDesc.trim(),
      displayOrder: Number(newCatOrder) || 10,
      status: newCatStatus,
      services: parsedServices,
      updatedAt: new Date().toISOString()
    };

    const callBackendAdd = async () => {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        resetAddForm();
      } else {
        alert(`Error adding category: ${data.error}`);
      }
    };

    try {
      const db = getDb();
      await setDoc(doc(db, 'categories', customId), payload);
      resetAddForm();
    } catch (e: any) {
      console.warn("Client SDK setDoc failed, executing backend Admin SDK:", e?.message || e);
      try {
        await callBackendAdd();
      } catch (backendErr: any) {
        alert(`Error adding category: ${backendErr?.message || backendErr}`);
      }
    }
  };

  const resetAddForm = () => {
    setNewCatName('');
    setNewCatIcon('');
    setNewCatImage('');
    setNewCatDesc('');
    setNewCatOrder(10);
    setNewCatStatus('active');
    setNewCatServices('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete category "${id}"?`)) return;

    const callBackendDelete = async () => {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/categories/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) {
        alert(`Failed to delete: ${data.error}`);
      }
    };

    try {
      const db = getDb();
      await deleteDoc(doc(db, 'categories', id));
    } catch (e: any) {
      console.warn("Client SDK deleteDoc failed, executing backend Admin SDK:", e?.message || e);
      try {
        await callBackendDelete();
      } catch (backendErr: any) {
        alert(`Failed to delete category: ${backendErr?.message || backendErr}`);
      }
    }
  };

  const handleToggleStatus = async (cat: any) => {
    const nextStatus = cat.status === 'inactive' ? 'active' : 'inactive';
    try {
      const db = getDb();
      await updateDoc(doc(db, 'categories', cat.id), { status: nextStatus, updatedAt: new Date().toISOString() });
    } catch (e: any) {
      // Fallback to backend Admin API
      await authenticatedFetch(`${BACKEND_API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cat, status: nextStatus })
      });
    }
  };
  
  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditName(cat.name || '');
    setEditIcon(cat.icon || cat.iconName || 'Sparkles');
    setEditImage(cat.image || cat.imageUrl || cat.icon || '');
    setEditDesc(cat.description || '');
    setEditOrder(Number(cat.displayOrder) || 10);
    setEditStatus(cat.status === 'inactive' ? 'inactive' : 'active');
    setEditServices(Array.isArray(cat.services) ? cat.services.join(', ') : '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const defaultImage = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400';
    const parsedServices = editServices ? editServices.split(',').map(s => s.trim()).filter(Boolean) : [];
    const payload = {
      id: editingId,
      name: editName.trim(),
      icon: editIcon || 'Sparkles',
      iconName: editIcon || 'Sparkles',
      image: editImage || defaultImage,
      imageUrl: editImage || defaultImage,
      description: editDesc.trim(),
      displayOrder: Number(editOrder) || 10,
      status: editStatus,
      services: parsedServices,
      updatedAt: new Date().toISOString()
    };

    const callBackendSave = async () => {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
      } else {
        alert(`Failed to update category: ${data.error}`);
      }
    };

    try {
      const db = getDb();
      await updateDoc(doc(db, 'categories', editingId), payload);
      setEditingId(null);
    } catch (e: any) {
      console.warn("Client SDK updateDoc failed, executing backend Admin SDK:", e?.message || e);
      try {
        await callBackendSave();
      } catch (backendErr: any) {
        alert(`Failed to update category: ${backendErr?.message || backendErr}`);
      }
    }
  };

  const handleExportCSV = () => {
    if (categories.length === 0) {
      alert('No categories to export.');
      return;
    }
    const csvData = categories.map(c => ({
      'Category ID': c.id,
      'Name': c.name || '',
      'Status': c.status || 'active',
      'Display Order': c.displayOrder || 10,
      'Icon': c.icon || c.iconName || '',
      'Image URL': c.image || c.imageUrl || '',
      'Description': c.description || '',
      'Services': Array.isArray(c.services) ? c.services.join('; ') : '',
      'Updated At': c.updatedAt || ''
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_categories_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Service Categories CMS</h2>
          <p className="text-xs text-gray-500 mt-1">Authoritative Single Source of Truth for Customer Portal, Vendor App & Search Filtering</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-xs font-bold text-gray-600 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-xs">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle size={14} /> {categories.filter(c => c.status !== 'inactive').length} Active
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <Ban size={14} /> {categories.filter(c => c.status === 'inactive').length} Inactive
            </span>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download CSV catalog of categories"
          >
            <Download size={14} />
            <span>Extract CSV</span>
          </button>
        </div>
      </div>

      {/* Add New Category Form */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200/80 space-y-4">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Plus size={14} className="text-brand-primary" /> Create New Service Category
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category Name *</label>
              <input 
                required 
                type="text" 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                placeholder="e.g. Wedding Planners / Drone Specialists" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-primary focus:bg-white" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Lucide Icon Name</label>
              <input 
                type="text" 
                value={newCatIcon} 
                onChange={e => setNewCatIcon(e.target.value)} 
                placeholder="e.g. Camera, Music, Building2" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Display Order</label>
              <input 
                type="number" 
                value={newCatOrder} 
                onChange={e => setNewCatOrder(Number(e.target.value))} 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description / Subtitle</label>
              <input 
                type="text" 
                value={newCatDesc} 
                onChange={e => setNewCatDesc(e.target.value)} 
                placeholder="Brief summary shown on explore pages..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-brand-primary focus:bg-white" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Standard Services / Inclusions (comma-separated)</label>
              <input 
                type="text" 
                value={newCatServices} 
                onChange={e => setNewCatServices(e.target.value)} 
                placeholder="e.g. Mandap Decor, Stage Lights, Entrance Gate" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-brand-primary focus:bg-white" 
              />
            </div>
          </div>

          <div className="space-y-2 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">Category Cover Image / Banner</label>
            <CloudinaryImageUploader
              label="📷 Upload Photo from Camera or Device"
              currentImageUrl={newCatImage}
              onImageUploaded={(url) => setNewCatImage(url)}
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase">or Image URL:</span>
              <input 
                type="text" 
                value={newCatImage} 
                onChange={e => setNewCatImage(e.target.value)} 
                placeholder="https://images.unsplash.com/... or Cloudinary URL" 
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-brand-primary" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-700">Initial Status:</label>
              <select
                value={newCatStatus}
                onChange={e => setNewCatStatus(e.target.value as any)}
                className="bg-gray-100 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 outline-none"
              >
                <option value="active">Active (Visible on Customer App)</option>
                <option value="inactive">Inactive (Hidden from Explore)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="bg-brand-primary text-white h-[40px] px-6 rounded-xl text-xs font-extrabold hover:bg-brand-primary-dark transition flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm"
            >
              <Plus size={15} /> Add Category
            </button>
          </div>
        </form>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {categories.map(cat => {
          const displayImage = cat.image || cat.imageUrl || (cat.icon && cat.icon.startsWith('http') ? cat.icon : null);
          const isInactive = cat.status === 'inactive';

          return (
            <div 
              key={cat.id} 
              className={`bg-white rounded-3xl shadow-xs border overflow-hidden flex flex-col justify-between transition-all relative group ${
                isInactive ? 'opacity-70 border-gray-200' : 'border-gray-200/90 hover:shadow-md'
              }`}
            >
              {editingId === cat.id ? (
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white z-10 border-2 border-brand-primary rounded-3xl">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-brand-primary">Edit Category #{cat.id}</span>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none" placeholder="Name" />
                    <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none" placeholder="Description" />
                    <input type="url" value={editImage} onChange={e => setEditImage(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono outline-none" placeholder="Image URL" />
                    <input type="text" value={editServices} onChange={e => setEditServices(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none" placeholder="Services (comma separated)" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none" placeholder="Order" />
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold outline-none">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1">
                      <X size={14}/> Cancel
                    </button>
                    <button onClick={handleSaveEdit} className="flex-1 bg-brand-primary text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1 shadow-sm">
                      <Save size={14}/> Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    {/* Header Image & Badges */}
                    <div className="relative h-32 w-full bg-gray-100 overflow-hidden">
                      {displayImage ? (
                        <img src={displayImage} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                          <Grid size={32} />
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white">
                          #{cat.displayOrder || 10}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isInactive ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {isInactive ? 'Inactive' : 'Active'}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => startEdit(cat)} 
                          className="p-1.5 rounded-xl bg-white/90 backdrop-blur-xs text-gray-700 hover:text-brand-primary shadow-xs transition"
                          title="Edit Category"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)} 
                          className="p-1.5 rounded-xl bg-white/90 backdrop-blur-xs text-gray-700 hover:text-rose-600 shadow-xs transition"
                          title="Delete Category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sm text-gray-900 leading-tight">{cat.name}</h4>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border transition ${
                            isInactive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {isInactive ? 'Enable' : 'Disable'}
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {cat.description || 'Verified celebration category for vendor exploration & bookings.'}
                      </p>

                      {cat.services && cat.services.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                          {cat.services.slice(0, 3).map((s: string, idx: number) => (
                            <span key={idx} className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))}
                          {cat.services.length > 3 && (
                            <span className="text-[9px] font-bold text-gray-400 self-center">
                              +{cat.services.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
