import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Trash2, Plus, Tag } from 'lucide-react';

export default function CouponsManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [newDiscountValue, setNewDiscountValue] = useState(0);

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    if (!code || newDiscountValue <= 0) return;
    try {
      const db = getDb();
      await setDoc(doc(db, 'coupons', code), {
        code,
        discountType: newDiscountType,
        discountValue: Number(newDiscountValue),
        active: true
      });
      setNewCode('');
      setNewDiscountValue(0);
    } catch (e: any) {
      console.error(e);
      alert(`Error adding coupon: ${e?.message || e}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'coupons', id));
    } catch (e: any) {
      console.error(e);
      alert(`Failed to delete: ${e?.message || e}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Manage Coupons</h2>
        <p className="text-sm text-gray-500 mt-1">Create and manage discount codes for checkout.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Create New Coupon</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Coupon Code</label>
            <input 
              type="text" 
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="e.g. WELCOME50"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary uppercase"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Discount Type</label>
            <select 
              value={newDiscountType}
              onChange={e => setNewDiscountType(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
            >
              <option value="flat">Flat Amount (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Discount Value</label>
            <input 
              type="number" 
              min="1"
              value={newDiscountValue}
              onChange={e => setNewDiscountValue(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              required
            />
          </div>
          <div className="md:col-span-1">
            <button type="submit" className="w-full bg-brand-primary text-white h-[42px] px-4 rounded-xl text-sm font-bold hover:bg-brand-primary-dark transition flex items-center justify-center gap-2">
              <Plus size={16} /> Create Coupon
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map(coupon => (
          <div key={coupon.id} className="bg-white rounded-2xl shadow-sm border border-brand-primary/20 p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/10 rounded-bl-[100px] -z-0" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={14} className="text-brand-primary" />
                  <h4 className="text-brand-primary-dark font-black text-lg tracking-wide">{coupon.code}</h4>
                </div>
                <p className="text-gray-600 font-medium text-sm">
                  {coupon.discountType === 'flat' 
                    ? `₹${coupon.discountValue} OFF` 
                    : `${coupon.discountValue}% OFF (Advance Only)`}
                </p>
              </div>
              <button 
                onClick={() => handleDelete(coupon.id)}
                className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-3 text-center py-10 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
            <p className="text-gray-400 font-bold text-sm">No coupons found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
