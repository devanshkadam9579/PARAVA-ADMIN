import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { Check } from 'lucide-react';

export default function VendorVerificationManager() {
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'vendors'), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setVendors(list);
    });
    return unsub;
  }, []);

  const handleApprove = async (vendorId: string) => {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'vendors', vendorId), {
        approved: true,
        verificationStatus: 'APPROVED',
        status: 'ACTIVE',
        approvedAt: new Date().toISOString()
      });
      alert('Vendor approved successfully and live on Customer Web!');
    } catch (e: any) {
      alert('Approval failed: ' + e.message);
    }
  };

  const handleReject = async (vendorId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const db = getDb();
      await updateDoc(doc(db, 'vendors', vendorId), {
        approved: false,
        verificationStatus: 'REJECTED',
        status: 'SUSPENDED',
        rejectionReason: reason,
        rejectedAt: new Date().toISOString()
      });
      alert('Vendor application rejected.');
    } catch (e: any) {
      alert('Rejection failed: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vendor Partner Verification Queue</h1>
        <p className="text-xs text-gray-500 mt-0.5">Inspect business registrations, Aadhaar/GST compliance, and approve marketplace listings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map(v => (
          <div key={v.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-brand-primary">{v.category}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  v.approved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {v.approved ? 'VERIFIED' : 'PENDING REVIEW'}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-gray-900">{v.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Founder: {v.founderName || 'Specialist'} • City: {v.location || 'Kolhapur'}</p>
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">{v.description}</p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
              {!v.approved ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleReject(v.id)}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(v.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                  >
                    <Check size={14} />
                    <span>Approve Partner</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleReject(v.id)}
                  className="text-xs font-bold text-gray-400 hover:text-red-600"
                >
                  Suspend Verification
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
