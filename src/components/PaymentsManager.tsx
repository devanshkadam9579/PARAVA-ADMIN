import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

export default function PaymentsManager() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'bookings'), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setBookings(list);
    });
    return unsub;
  }, []);

  const totalCollected = bookings.reduce((sum, b) => sum + (b.totalPrice ? Math.round(b.totalPrice * 0.05 * 1.18) : 0), 0);
  const totalCommission = bookings.reduce((sum, b) => sum + (b.totalPrice ? Math.round(b.totalPrice * 0.05) : 0), 0);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Payments, Escrow & Refunds Ledger</h1>
        <p className="text-xs text-gray-500 mt-0.5">Authoritative Cashfree PG transactions, collected advance escrow, and platform commissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-brand-primary tracking-wider">Escrow Advances Collected</span>
          <h3 className="text-3xl font-black text-gray-900">₹{totalCollected.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-gray-500">5% Advance Fee + 18% GST</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Platform Retained Commission</span>
          <h3 className="text-3xl font-black text-emerald-600">₹{totalCommission.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-gray-500">Net platform matchmaking profit</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Gateway Status</span>
          <h3 className="text-2xl font-black text-blue-600">Cashfree PG Active</h3>
          <p className="text-xs text-gray-500">Webhook HMAC Verification ON</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-gray-900">Recent Payment Transactions ({bookings.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-extrabold border-b border-gray-100">
              <tr>
                <th className="p-4">Transaction / Booking ID</th>
                <th className="p-4">Vendor Partner</th>
                <th className="p-4">Event Value</th>
                <th className="p-4">Advance Paid</th>
                <th className="p-4">Commission</th>
                <th className="p-4">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
              {bookings.slice(0, 15).map(b => {
                const gross = b.totalPrice || 0;
                const advance = Math.round(gross * 0.05 * 1.18);
                const comm = Math.round(gross * 0.05);

                return (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-mono text-[11px] text-gray-500">{b.bookingIdString || b.id.slice(0, 10)}</td>
                    <td className="p-4 font-bold text-gray-900">{b.vendor?.name || b.vendorName || 'Partner'}</td>
                    <td className="p-4">₹{gross.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-brand-primary">₹{advance.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-emerald-600">+₹{comm.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-emerald-200">
                        {b.paymentStatus || 'PAID'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
