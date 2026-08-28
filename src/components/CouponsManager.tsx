import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, RefreshCw } from 'lucide-react';

const BACKEND_API_URL = 'https://parava-backend-1.onrender.com';

export default function CouponsManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState<number>(10);
  const [type, setType] = useState<'percentage' | 'flat'>('percentage');
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [minSpend, setMinSpend] = useState<number | ''>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/coupons`);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error("Error fetching coupons:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discount: Number(discount),
          type,
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
          minSpend: minSpend ? Number(minSpend) : 0,
          expiryDate: expiryDate || null,
          active: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setNotification(`Coupon ${code.toUpperCase()} created successfully.`);
        setCode('');
        setDiscount(10);
        setMaxDiscount('');
        setMinSpend('');
        setExpiryDate('');
        fetchCoupons();
      } else {
        setNotification(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm(`Delete coupon "${couponId}"?`)) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/coupons/${couponId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Coupon ${couponId} deleted.`);
        fetchCoupons();
      }
    } catch (err: any) {
      setNotification(`Failed to delete coupon: ${err.message}`);
    }
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Ticket size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Coupons & Promotional Discount Codes</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Create customer checkout promo codes with instant backend verification
            </p>
          </div>
        </div>

        <button
          onClick={fetchCoupons}
          disabled={isLoading}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs border border-gray-200 transition active:scale-95"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {notification}
        </div>
      )}

      {/* Creation Form */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Create New Promo Code</h3>
        
        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. FESTIVE20, WELCOME100"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase text-gray-900 outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Discount Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:bg-white focus:border-brand-primary"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Cash (₹)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Discount Value *</label>
            <input
              type="number"
              required
              min={1}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Minimum Order Value (₹)</label>
            <input
              type="number"
              placeholder="Optional (e.g. 1000)"
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold h-[38px] rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <Plus size={14} />
              <span>{isSubmitting ? 'Creating...' : 'Create Coupon'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
            Active Discount Coupons ({coupons.length})
          </h3>
        </div>

        {coupons.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            {isLoading ? 'Loading coupons...' : 'No coupons created yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min. Spend</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-4 font-mono font-bold text-gray-900">{c.code}</td>
                    <td className="p-4 font-bold text-slate-800">
                      {c.type === 'percentage' ? `${c.discount}% OFF` : `₹${c.discount} FLAT OFF`}
                    </td>
                    <td className="p-4 text-gray-600">
                      {c.minSpend ? `₹${c.minSpend}` : 'None'}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                        Active
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold p-1 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
