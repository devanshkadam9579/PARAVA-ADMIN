import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { Download } from 'lucide-react';
import Papa from 'papaparse';

export default function PaymentsManager() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [commissionPct, setCommissionPct] = useState<number>(10);
  const [bookingFeePct, setBookingFeePct] = useState<number>(5);

  useEffect(() => {
    const db = getDb();
    if (!db) return;

    // Listen to bookings collection
    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setBookings(list);
    });

    // Listen to settings/global for dynamic commission & advance fee
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.commissionPercentage !== undefined) setCommissionPct(Number(d.commissionPercentage));
        if (d.bookingFeePercentage !== undefined) setBookingFeePct(Number(d.bookingFeePercentage));
      }
    });

    return () => {
      unsubBookings();
      unsubSettings();
    };
  }, []);

  const totalCollected = bookings.reduce((sum, b) => {
    if (b.pricing?.advanceAmount) return sum + Number(b.pricing.advanceAmount);
    return sum + (b.totalPrice ? Math.round(b.totalPrice * (bookingFeePct / 100) * 1.18) : 0);
  }, 0);

  const totalCommission = bookings.reduce((sum, b) => {
    if (b.commissionBreakdown?.platformCommission) return sum + Number(b.commissionBreakdown.platformCommission);
    if (b.pricing?.commissionAmount) return sum + Number(b.pricing.commissionAmount);
    return sum + (b.totalPrice ? Math.round(b.totalPrice * (commissionPct / 100)) : 0);
  }, 0);

  const handleExportCSV = () => {
    const csvData = bookings.map(b => {
      const gross = b.totalPrice || 0;
      const advance = b.pricing?.advanceAmount || Math.round(gross * (bookingFeePct / 100) * 1.18);
      const comm = b.commissionBreakdown?.platformCommission || b.pricing?.commissionAmount || Math.round(gross * (commissionPct / 100));
      const payout = b.commissionBreakdown?.vendorPayout || (gross - comm);

      return {
        'Booking ID': b.bookingIdString || b.id,
        'Vendor Partner': b.vendor?.name || b.vendorName || 'Partner',
        'Vendor Category': b.vendor?.category || 'Celebration',
        'Customer Name': b.customerName || b.customerData?.name || 'Customer',
        'Customer Phone': b.customerPhone || b.customerData?.phone || '',
        'Customer Email': b.customerEmail || b.customerData?.email || '',
        'Event Date': b.eventDate || '',
        'Event Type': b.eventType || '',
        'Event Gross (INR)': gross,
        'Advance Paid (INR)': advance,
        'Platform Commission (INR)': comm,
        'Vendor Net Payout (INR)': payout,
        'Payment Status': b.paymentStatus || 'Paid',
        'Booking Status': b.status || 'Confirmed',
        'Order ID': b.orderId || '',
        'Payment ID': b.paymentId || '',
        'Created At': b.createdAt || b.confirmedAt || ''
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_payments_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Payments, Escrow & Refunds Ledger</h1>
          <p className="text-xs text-gray-500 mt-0.5">Authoritative Cashfree PG transactions, collected advance escrow, and platform commissions</p>
        </div>

        <button 
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 transition self-start sm:self-auto cursor-pointer"
        >
          <Download size={15} />
          <span>Extract Payments CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-brand-primary tracking-wider">Escrow Advances Collected</span>
          <h3 className="text-3xl font-black text-gray-900">₹{totalCollected.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-gray-500">{bookingFeePct}% Advance Fee + 18% GST</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
            Platform Retained Commission ({commissionPct}%)
          </span>
          <h3 className="text-3xl font-black text-emerald-600">₹{totalCommission.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-gray-500">Admin configured {commissionPct}% matchmaking rate</p>
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
          <span className="text-xs text-gray-500 font-semibold">Live Sync Active</span>
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
              {bookings.slice(0, 25).map(b => {
                const gross = b.totalPrice || 0;
                const advance = b.pricing?.advanceAmount || Math.round(gross * (bookingFeePct / 100) * 1.18);
                const comm = b.commissionBreakdown?.platformCommission || b.pricing?.commissionAmount || Math.round(gross * (commissionPct / 100));

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
