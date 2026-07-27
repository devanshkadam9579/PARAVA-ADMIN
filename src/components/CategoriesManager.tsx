import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Grid, Trash2, Plus, Edit2, X, Save } from 'lucide-react';

export default function CategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

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
    const customId = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    try {
      const db = getDb();
      await setDoc(doc(db, 'categories', customId), {
        name: newCatName,
        icon: newCatIcon || 'grid'
      });
      setNewCatName('');
      setNewCatIcon('');
    } catch (e: any) {
      alert(`Error adding category: ${e?.message || e}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete category?')) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'categories', id));
    } catch (e: any) {
      alert(`Failed to delete: ${e?.message || e}`);
    }
  };
  
  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || 'grid');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const db = getDb();
      await updateDoc(doc(db, 'categories', editingId), {
        name: editName,
        icon: editIcon
      });
      setEditingId(null);
    } catch (e) {
      alert('Failed to update category');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Manage Categories</h2>
        <p className="text-sm text-gray-500 mt-1">Add, edit, or remove vendor service categories.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Add New Category</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category Name</label>
            <input required type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Wedding Planners" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Icon URL (Image / GIF)</label>
            <input type="url" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} placeholder="https://... (GIF or PNG)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
            <p className="text-[9px] text-gray-400 mt-1">Recommended: 1:1 Aspect Ratio, min 100x100px.</p>
          </div>
          <button type="submit" className="bg-brand-primary text-white h-[42px] px-6 rounded-xl text-sm font-bold hover:bg-brand-primary-dark transition flex items-center gap-2 mt-[22px]">
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center relative group">
            
            {editingId === cat.id ? (
              <div className="absolute inset-0 bg-white rounded-2xl p-3 flex flex-col gap-2 z-10 border-2 border-brand-primary shadow-lg">
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none" placeholder="Name" />
                <input type="url" value={editIcon} onChange={e => setEditIcon(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none" placeholder="Image/GIF URL" />
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
                  {cat.icon && cat.icon.startsWith('http') ? (
                    <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <Grid className="text-gray-400" size={24} />
                  )}
                </div>
                <p className="font-bold text-sm text-center text-gray-800">{cat.name}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
