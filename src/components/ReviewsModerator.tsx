import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { Star, Eye, EyeOff, Download, Search } from 'lucide-react';
import Papa from 'papaparse';

export default function ReviewsModerator() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'reviews'), (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setReviews(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleToggleHide = async (reviewId: string, currentHidden: boolean) => {
    try {
      const db = getDb();
      if (!db) return;
      await updateDoc(doc(db, 'reviews', reviewId), {
        hidden: !currentHidden,
        moderatedAt: new Date().toISOString()
      });
    } catch (e: any) {
      alert('Moderation update failed: ' + e.message);
    }
  };

  const filtered = reviews.filter(r => {
    if (filter === 'visible' && r.hidden) return false;
    if (filter === 'hidden' && !r.hidden) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.vendorName || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('No review records available to export.');
      return;
    }

    const csvData = filtered.map(r => ({
      'Review ID': r.id,
      'Customer Name': r.customerName || 'Client',
      'Vendor Name': r.vendorName || '',
      'Vendor ID': r.vendorId || '',
      'Rating': r.rating || 5,
      'Comment': r.comment || '',
      'Status': r.hidden ? 'HIDDEN' : 'VISIBLE',
      'Created At': r.createdAt || '',
      'Moderated At': r.moderatedAt || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_reviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Reviews Moderation</h1>
          <p className="text-xs text-gray-500 mt-0.5">Moderate customer reviews and feedback submitted on completed celebration bookings</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviewer, vendor, comment..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-primary"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-brand-primary"
          >
            <option value="all">All Reviews ({reviews.length})</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden ({reviews.filter(r => r.hidden).length})</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download CSV report of customer reviews"
          >
            <Download size={14} />
            <span>Extract CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 font-bold text-gray-400">Loading reviews...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-2">
          <Star size={36} className="mx-auto text-amber-400" />
          <h4 className="font-extrabold text-sm text-gray-900">No customer reviews match this filter</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{r.rating} / 5</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHide(r.id, r.hidden)}
                  className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border transition ${
                    r.hidden ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900'
                  }`}
                >
                  {r.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{r.hidden ? 'Unhide (Make Public)' : 'Hide Review'}</span>
                </button>
              </div>

              <p className="text-xs text-gray-700 italic">"{r.comment}"</p>
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                <span>By {r.customerName || 'Client'}{r.vendorName ? ` • For ${r.vendorName}` : ''}</span>
                <span>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
