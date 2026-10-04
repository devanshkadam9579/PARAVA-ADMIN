import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { Calendar, Download } from 'lucide-react';
import Papa from 'papaparse';

export default function BookingsManager() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [commissionPct, setCommissionPct] = useState<number>(10);

  useEffect(() => {
    const db = getDb();
    if (!db) return;

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setBookings(list);
      setLoading(false);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.commissionPercentage !== undefined) setCommissionPct(Number(d.commissionPercentage));
      }
    });

    return () => {
      unsubBookings();
      unsubSettings();
    };
  }, []);

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('No bookings available to export.');
      return;
    }

    const csvData = filtered.map(b => {
      const gross = b.totalPrice || b.priceSnapshot?.totalEventValue || 0;
      const comm = b.commissionBreakdown?.platformCommission || b.pricing?.commissionAmount || Math.round(gross * (commissionPct / 100));
      const payout = b.commissionBreakdown?.vendorPayout || (gross - comm);

      return {
        'Booking ID': b.bookingIdString || b.id,
        'Vendor Name': b.vendor?.name || b.vendorName || '',
        'Vendor ID': b.vendorId || b.vendor?.id || '',
        'Category': b.serviceName || b.vendor?.category || '',
        'Customer Name': b.customerName || b.customerData?.name || '',
        'Customer Phone': b.customerPhone || b.customerData?.phone || '',
        'Customer Email': b.customerEmail || b.customerData?.email || '',
        'Event Date': b.eventDate || '',
        'Event Time Slot': b.eventTimeSlot || '',
        'Event City': b.city || b.vendor?.city || '',
        'Gross Amount (INR)': gross,
        'Platform Commission (INR)': comm,
        'Vendor Net Payout (INR)': payout,
        'Status': b.status || 'PENDING',
        'Payment Status': b.paymentStatus || 'PENDING',
        'Created At': b.createdAt || '',
        'Special Requests': b.specialRequests || b.notes || ''
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        adminUpdatedDate: new Date().toISOString()
      });
      alert(`Booking ${bookingId} status updated to ${newStatus}`);
    } catch (e: any) {
      alert('Failed to update status: ' + e.message);
    }
  };

  const filtered = bookings.filter(b => {
    if (filter !== 'all' && (b.status || '').toLowerCase() !== filter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (b.id || '').toLowerCase().includes(q) ||
             (b.customerName || '').toLowerCase().includes(q) ||
             (b.vendor?.name || b.vendorName || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Marketplace Bookings Console</h1>
          <p className="text-xs text-gray-500 mt-0.5">Authoritative bookings registry, price snapshots, and state machine transitions</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search booking, client, vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-primary"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-brand-primary capitalize"
          >
            <option value="all">All Statuses ({bookings.length})</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download CSV report of current bookings"
          >
            <Download size={14} />
            <span>Extract CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 font-bold text-gray-400">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-2">
          <Calendar size={36} className="mx-auto text-gray-300" />
          <h4 className="font-extrabold text-sm text-gray-900">No bookings match this filter</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(b => {
            const gross = b.totalPrice || b.priceSnapshot?.totalEventValue || 0;
            const commission = b.commissionBreakdown?.platformCommission || b.pricing?.commissionAmount || Math.round(gross * (commissionPct / 100));
            const vendorPayout = b.commissionBreakdown?.vendorPayout || (gross - commission);
            const appliedCommissionPct = b.commissionBreakdown?.platformCommissionPercentage !== undefined ? b.commissionBreakdown.platformCommissionPercentage : commissionPct;

            return (
              <div key={b.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-black text-gray-400 uppercase">ID: {b.bookingIdString || b.id.slice(0, 10)}</span>
                    <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] bg-brand-primary-light text-brand-primary border border-brand-border">
                      {b.status || 'PENDING'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-gray-900">{b.vendor?.name || b.vendorName || 'Verified Partner'}</h3>
                  <p className="text-xs text-gray-500">{b.serviceName || b.vendor?.category || 'Celebration Service'} • Client: {b.customerName || 'Valued User'}</p>

                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 mt-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Event Date:</span>
                      <span className="font-bold text-gray-900">{b.eventDate} ({b.eventTimeSlot || 'Evening'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross Total:</span>
                      <span className="font-black text-gray-900">₹{gross.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Platform Commission ({appliedCommissionPct}%):</span>
                      <span className="font-bold text-emerald-600">+₹{commission.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vendor Net Payout:</span>
                      <span className="font-bold text-gray-700">₹{vendorPayout.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                  <select
                    onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                    defaultValue=""
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl outline-none"
                  >
                    <option value="" disabled>Change Status...</option>
                    <option value="CONFIRMED">Set CONFIRMED</option>
                    <option value="COMPLETED">Set COMPLETED</option>
                    <option value="CANCELLED">Set CANCELLED</option>
                    <option value="REFUNDED">Set REFUNDED</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
