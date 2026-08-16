import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Trash2, Plus } from 'lucide-react';

export default function PromosManager() {
  const [promos, setPromos] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newBadge, setNewBadge] = useState('Featured Offer');
  const [newActionText, setNewActionText] = useState('Explore Now');

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'promos'), (snap) => {
      setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newImage) return;
    const customId = 'promo-' + Date.now();
    try {
      const db = getDb();
      await setDoc(doc(db, 'promos', customId), {
        id: customId,
        title: newTitle.trim(),
        subtitle: newSubtitle.trim(),
        image: newImage.trim(),
        badge: newBadge.trim() || 'Featured Offer',
        gradient: 'from-pink-500/80 to-purple-600/80',
        tag: 'Celebration',
        actionText: newActionText.trim() || 'Explore Now'
      });
      setNewTitle('');
      setNewSubtitle('');
      setNewImage('');
      setNewBadge('Featured Offer');
      setNewActionText('Explore Now');
    } catch (e: any) {
      console.error(e);
      alert(`Error adding promo: ${e?.message || e}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this promo banner?')) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'promos', id));
    } catch (e: any) {
      console.error(e);
      alert(`Failed to delete: ${e?.message || e}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Manage Promotions</h2>
        <p className="text-sm text-gray-500 mt-1">Configure homepage hero banners and offers.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Add New Banner</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Headline (Title)</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Subtitle (Optional)</label>
            <input 
              type="text" 
              value={newSubtitle}
              onChange={e => setNewSubtitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Badge Text</label>
            <input 
              type="text" 
              value={newBadge}
              onChange={e => setNewBadge(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Button Action Text</label>
            <input 
              type="text" 
              value={newActionText}
              onChange={e => setNewActionText(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Image URL</label>
            <input 
              type="url" 
              value={newImage}
              onChange={e => setNewImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-brand-primary text-white h-[42px] px-6 rounded-xl text-sm font-bold hover:bg-brand-primary-dark transition flex items-center justify-center gap-2">
              <Plus size={16} /> Publish Banner
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {promos.map(promo => (
          <div key={promo.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row h-[200px]">
            <div className="sm:w-1/2 h-full relative">
              <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
              <div className="absolute inset-0 p-6 flex flex-col justify-center">
                {promo.badge && (
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full w-fit mb-1">
                    {promo.badge}
                  </span>
                )}
                <h4 className="text-white font-black text-xl leading-tight">{promo.title}</h4>
                {promo.subtitle && <p className="text-white/80 text-xs mt-1">{promo.subtitle}</p>}
                <div className="mt-3 inline-block bg-white/20 backdrop-blur-md border border-white/40 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full w-fit">
                  {promo.actionText || 'Explore Now'}
                </div>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between bg-gray-50/50">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Banner ID</p>
                <p className="text-xs text-gray-600 truncate">{promo.id}</p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => handleDelete(promo.id)}
                  className="flex items-center gap-1.5 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
