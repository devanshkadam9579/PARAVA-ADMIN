import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getDb, getAuthInstance } from '../lib/firebase';
import { Check, Download, Search, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export default function VendorVerificationManager() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'incomplete' | 'verified' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'vendors'), (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setVendors(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isKycIncomplete = (v: any) => {
    const phone = (v.phone || '').replace(/[^0-9]/g, '');
    const email = (v.email || '').trim();
    const name = (v.name || '').trim();
    const desc = (v.description || '').trim();
    const hasBasicDetails = phone.length >= 10 && email.includes('@') && name.length >= 2 && desc.length >= 10;
    const hasKycSubmitted = v.kyc && v.kyc.status && v.kyc.status !== 'NOT_SUBMITTED';
    return !hasBasicDetails || !hasKycSubmitted;
  };

  const handleApprove = async (vendorId: string) => {
    try {
      const db = getDb();
      if (db) {
        await updateDoc(doc(db, 'vendors', vendorId), {
          approved: true,
          verificationStatus: 'APPROVED',
          status: 'ACTIVE',
          approvedAt: new Date().toISOString()
        });
      }

      // Backend API sync
      try {
        const auth = getAuthInstance();
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        if (token) {
          await fetch(`${BACKEND_API_URL}/api/admin/vendors/${vendorId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              approved: true,
              verificationStatus: 'APPROVED',
              status: 'ACTIVE'
            })
          });
        }
      } catch (beErr) {
        console.warn('Backend vendor approval sync note:', beErr);
      }

      showToast('Vendor partner verified and approved successfully!');
    } catch (e: any) {
      showToast('Approval failed: ' + e.message, 'error');
    }
  };

  const handleReject = async (vendorId: string) => {
    const reason = prompt('Enter rejection or suspension reason:');
    if (!reason) return;
    try {
      const db = getDb();
      if (db) {
        await updateDoc(doc(db, 'vendors', vendorId), {
          approved: false,
          verificationStatus: 'REJECTED',
          status: 'SUSPENDED',
          rejectionReason: reason,
          rejectedAt: new Date().toISOString()
        });
      }

      // Backend API sync
      try {
        const auth = getAuthInstance();
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        if (token) {
          await fetch(`${BACKEND_API_URL}/api/admin/vendors/${vendorId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              approved: false,
              verificationStatus: 'REJECTED',
              status: 'SUSPENDED',
              rejectionReason: reason
            })
          });
        }
      } catch (beErr) {
        console.warn('Backend vendor rejection sync note:', beErr);
      }

      showToast('Vendor listing suspended/rejected.');
    } catch (e: any) {
      showToast('Rejection failed: ' + e.message, 'error');
    }
  };

  const filtered = vendors.filter(v => {
    const incomplete = isKycIncomplete(v);
    if (filter === 'pending' && (v.approved || incomplete)) return false;
    if (filter === 'incomplete' && (v.approved || !incomplete)) return false;
    if (filter === 'verified' && !v.approved) return false;
    if (filter === 'rejected' && (v.status !== 'SUSPENDED' && v.verificationStatus !== 'REJECTED' && v.kyc?.status !== 'REJECTED')) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        (v.name || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q) ||
        (v.location || '').toLowerCase().includes(q) ||
        (v.founderName || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.phone || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('No vendor verification records available to export.');
      return;
    }

    const csvData = filtered.map(v => {
      const incomplete = isKycIncomplete(v);
      return {
        'Vendor ID': v.id,
        'Business Name': v.name || '',
        'Category': v.category || '',
        'City / Location': v.location || '',
        'Founder Name': v.founderName || '',
        'Phone': v.phone || '',
        'Email': v.email || '',
        'Rating': v.rating || 5.0,
        'Review Count': v.reviewsCount || 0,
        'Approval Status': v.approved ? 'VERIFIED' : 'PENDING',
        'KYC Status': v.approved ? 'VERIFIED' : incomplete ? 'KYC_INCOMPLETE' : (v.kyc?.status || 'PENDING_REVIEW'),
        'Verification Status': v.verificationStatus || (v.approved ? 'APPROVED' : 'PENDING'),
        'Listing Status': v.status || 'ACTIVE',
        'Rejection Reason': v.rejectionReason || '',
        'Created At': v.createdAt || '',
        'Approved At': v.approvedAt || ''
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_vendor_verification_queue_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-md transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-red-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vendor Partner Verification Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">Inspect business registrations, KYC compliance, and approve marketplace listings</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search partner, city..."
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
            <option value="all">All Vendors ({vendors.length})</option>
            <option value="pending">Pending Review ({vendors.filter(v => !v.approved && !isKycIncomplete(v)).length})</option>
            <option value="incomplete">KYC Incomplete ({vendors.filter(v => !v.approved && isKycIncomplete(v)).length})</option>
            <option value="verified">Verified ({vendors.filter(v => v.approved).length})</option>
            <option value="rejected">Suspended / Rejected</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download CSV report of verification queue"
          >
            <Download size={14} />
            <span>Extract CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 font-bold text-gray-400">Loading verification queue...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <p className="font-extrabold text-sm text-gray-900">No vendor partners found matching criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(v => {
            const incomplete = isKycIncomplete(v);

            return (
              <div key={v.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-brand-primary">{v.category}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      v.approved 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : (v.status === 'SUSPENDED' || v.verificationStatus === 'REJECTED' || v.kyc?.status === 'REJECTED')
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : incomplete
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {v.approved 
                        ? 'VERIFIED' 
                        : (v.status === 'SUSPENDED' || v.verificationStatus === 'REJECTED' || v.kyc?.status === 'REJECTED')
                        ? 'REJECTED'
                        : incomplete
                        ? 'KYC INCOMPLETE'
                        : 'PENDING REVIEW'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-gray-900">{v.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Founder: {v.founderName || 'Specialist'} • City: {v.location || 'Kolhapur'}</p>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{v.description}</p>

                  {/* Missing details indicators */}
                  {incomplete && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(!v.name || v.name.length < 2) && (
                        <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">Missing Business Name</span>
                      )}
                      {(!v.phone || v.phone.replace(/[^0-9]/g, '').length < 10) && (
                        <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">Missing Phone</span>
                      )}
                      {(!v.email || !v.email.includes('@')) && (
                        <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">Missing Email</span>
                      )}
                      {(!v.description || v.description.length < 10) && (
                        <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">Missing Info / Bio</span>
                      )}
                      {(!v.kyc || v.kyc?.status === 'NOT_SUBMITTED') && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">KYC Docs Not Uploaded</span>
                      )}
                    </div>
                  )}

                  {v.rejectionReason && (
                    <p className="text-[11px] text-red-600 mt-2 font-semibold bg-red-50 p-2 rounded-xl border border-red-100">
                      Reason: {v.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                  {!v.approved ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReject(v.id)}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        Reject Application
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(v.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Approve Partner</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReject(v.id)}
                      className="text-xs font-bold text-gray-400 hover:text-red-600 cursor-pointer"
                    >
                      Suspend Verification
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
