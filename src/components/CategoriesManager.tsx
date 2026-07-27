import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Grid, Trash2, Plus } from 'lucide-react';

export default function CategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');

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
        icon: newCatIcon || 'grid' // fallback generic icon
      });
      setNewCatName('');
      setNewCatIcon('');
    } catch (e) {
      console.error(e);
      alert('Error adding category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete category?')) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Manage Categories</h2>
        <p className="text-sm text-gray-500 mt-1">Add or remove vendor service categories.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Add New Category</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category Name</label>
            <input 
              type="text" 
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="e.g. Wedding Planners"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Lucide Icon Name</label>
            <input 
              type="text" 
              value={newCatIcon}
              onChange={e => setNewCatIcon(e.target.value)}
              placeholder="e.g. music, camera, heart"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <button type="submit" className="bg-brand-primary text-white h-[42px] px-6 rounded-xl text-sm font-bold hover:bg-brand-primary-dark transition flex items-center gap-2">
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center relative group">
            <button 
              onClick={() => handleDelete(cat.id)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition"
            >
              <Trash2 size={14} />
            </button>
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Grid className="text-gray-400" size={20} />
            </div>
            <p className="font-bold text-sm text-center text-gray-800">{cat.name}</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{cat.icon}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
