import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Ticket, Plus, Trash2, Percent } from 'lucide-react';

export default function CouponsManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newType, setNewType] = useState('flat'); // flat or percentage
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDiscount) return;
    
    try {
      const db = getDb();
      const codeId = newCode.toUpperCase().replace(/\s+/g, '');
      await setDoc(doc(db, 'coupons', codeId), {
        code: codeId,
        discount: Number(newDiscount),
        type: newType,
        message: newMessage || `Coupon applied successfully!`,
        active: true,
        createdAt: new Date().toISOString()
      });
      
      setNewCode('');
      setNewDiscount('');
      setNewMessage('');
    } catch (err) {
      alert('Failed to add coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'coupons', id));
    } catch (e) {
      alert('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Coupons & Promos</h2>
        <p className="text-sm text-gray-500 mt-1">Manage discount codes for customers.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Create New Coupon</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Code *</label>
            <input required type="text" placeholder="e.g. WELCOME50" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary uppercase" />
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Discount Amount *</label>
            <input required type="number" placeholder="50" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Type *</label>
            <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary">
              <option value="flat">Flat (₹)</option>
              <option value="percentage">Percent (%)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Success Message (Optional)</label>
            <div className="flex gap-2">
              <input type="text" placeholder="e.g. ₹50 flat discount applied!" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              <button type="submit" className="bg-brand-primary text-white h-[42px] px-5 rounded-xl text-sm font-bold hover:bg-brand-primary-dark transition flex items-center justify-center gap-1 min-w-fit">
                <Plus size={16} /> Create
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map(coupon => (
          <div key={coupon.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
              {coupon.type === 'flat' ? <Ticket className="text-brand-primary/40" size={24} /> : <Percent className="text-brand-primary/40" size={24} />}
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-2xl font-black text-brand-primary">{coupon.code}</h4>
                <button onClick={() => handleDelete(coupon.id)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {coupon.type === 'flat' ? `₹${coupon.discount} Flat Off` : `${coupon.discount}% Off`}
              </p>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{coupon.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
