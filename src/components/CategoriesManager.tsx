import CloudinaryImageUploader from './CloudinaryImageUploader';
import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Grid, Trash2, Plus, Edit2, X, Save } from 'lucide-react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export default function CategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editImage, setEditImage] = useState('');

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const customId = newCatName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    const defaultImage = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400';
    const imageUrl = newCatImage || newCatIcon || defaultImage;

    const payload = {
      id: customId,
      name: newCatName.trim(),
      icon: newCatIcon || 'Sparkles',
      iconName: newCatIcon || 'Sparkles',
      image: imageUrl
    };

    // Helper to call backend Admin SDK API (bypasses Firestore Security Rules)
    const callBackendAdd = async () => {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName('');
        setNewCatIcon('');
        setNewCatImage('');
      } else {
        alert(`Error adding category: ${data.error}`);
      }
    };

    try {
      const db = getDb();
      await setDoc(doc(db, 'categories', customId), payload);
      setNewCatName('');
      setNewCatIcon('');
      setNewCatImage('');
    } catch (e: any) {
      console.warn("Client SDK setDoc failed, executing backend Admin SDK:", e?.message || e);
      try {
        await callBackendAdd();
      } catch (backendErr: any) {
        alert(`Error adding category: ${backendErr?.message || backendErr}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete category "${id}"?`)) return;

    const callBackendDelete = async () => {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/categories/${id}`, {
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
  
  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditName(cat.name || '');
    setEditIcon(cat.icon || cat.iconName || 'Sparkles');
    setEditImage(cat.image || cat.icon || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const defaultImage = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400';
    const payload = {
      id: editingId,
      name: editName.trim(),
      icon: editIcon || 'Sparkles',
      iconName: editIcon || 'Sparkles',
      image: editImage || defaultImage
    };

    const callBackendSave = async () => {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/categories`, {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Manage Categories</h2>
        <p className="text-sm text-gray-500 mt-1">Add, edit, or remove vendor service categories for Frontend & Admin.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Add New Category</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category Name *</label>
              <input required type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Wedding Planners" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Icon / Tag Name</label>
              <input type="text" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} placeholder="e.g. Camera, Sparkles, Building" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
            </div>
          </div>

          <div className="space-y-2 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200">
            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">Category SVG / Cover Image (Camera / Gallery or URL)</label>
            <CloudinaryImageUploader
              label="📷 Upload SVG / Icon / Photo from Camera or Gallery"
              currentImageUrl={newCatImage}
              onImageUploaded={(url) => setNewCatImage(url)}
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase">or URL:</span>
              <input 
                type="text" 
                value={newCatImage} 
                onChange={e => setNewCatImage(e.target.value)} 
                placeholder="https://... (SVG/PNG/JPG Link)" 
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-brand-primary" 
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="bg-brand-primary text-white h-[42px] px-8 rounded-xl text-xs font-bold hover:bg-brand-primary-dark transition flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm">
              <Plus size={16} /> Add Category
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map(cat => {
          const displayImage = cat.image || (cat.icon && cat.icon.startsWith('http') ? cat.icon : null);
          return (
            <div key={cat.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center relative group min-h-[160px]">
              {editingId === cat.id ? (
                <div className="absolute inset-0 bg-white rounded-2xl p-3 flex flex-col gap-2 z-10 border-2 border-brand-primary shadow-lg">
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none" placeholder="Name" />
                  <input type="url" value={editImage} onChange={e => setEditImage(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none" placeholder="Image URL" />
                  <input type="text" value={editIcon} onChange={e => setEditIcon(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none" placeholder="Icon Name" />
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-1 flex items-center justify-center"><X size={14}/></button>
                    <button onClick={handleSaveEdit} className="flex-1 bg-brand-primary text-white rounded-lg py-1 flex items-center justify-center"><Save size={14}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                    <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 overflow-hidden border border-gray-100">
                    {displayImage ? (
                      <img src={displayImage} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <Grid className="text-gray-400" size={24} />
                    )}
                  </div>
                  <p className="font-bold text-sm text-center text-gray-800">{cat.name}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
