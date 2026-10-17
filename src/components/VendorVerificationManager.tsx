import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { authenticatedFetch, BACKEND_API_URL } from '../lib/apiClient';
import { 
  Check, Download, Search, AlertCircle, CheckCircle, ShieldCheck, 
  X, Eye, ExternalLink, FileText, Loader2,
  Building, RefreshCw
} from 'lucide-react';
import Papa from 'papaparse';

export default function VendorVerificationManager() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [kycMap, setKycMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'action_required' | 'incomplete' | 'verified' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Review modal state
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [checklist, setChecklist] = useState({
    aadhaarVerified: false,
    panVerified: false,
    addressVerified: false
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const db = getDb();
    if (!db) return;

    // Real-time listener for vendors collection
    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setVendors(list);
      setLoading(false);
    });

    // Real-time listener for authoritative vendor_kyc collection
    const unsubKyc = onSnapshot(collection(db, 'vendor_kyc'), (snap) => {
      const map: Record<string, any> = {};
      snap.forEach(docSnap => {
        map[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
      setKycMap(map);
    });

    return () => {
      unsubVendors();
      unsubKyc();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getMergedKyc = (v: any) => {
    const kycDoc = kycMap[v.id] || {};
    const embeddedKyc = v.kyc || {};
    return {
      ...embeddedKyc,
      ...kycDoc,
      status: kycDoc.status || embeddedKyc.status || (v.approved ? 'VERIFIED' : 'NOT_SUBMITTED')
    };
  };

  const isKycIncomplete = (v: any) => {
    const phone = (v.phone || '').replace(/[^0-9]/g, '');
    const email = (v.email || '').trim();
    const name = (v.name || '').trim();
    const hasBasicDetails = phone.length >= 10 && email.includes('@') && name.length >= 2;
    const kyc = getMergedKyc(v);
    const hasKycSubmitted = kyc && kyc.status && kyc.status !== 'NOT_SUBMITTED';
    return !hasBasicDetails || !hasKycSubmitted;
  };

  const handleOpenReviewModal = (vendor: any) => {
    setSelectedVendor(vendor);
    const kyc = getMergedKyc(vendor);
    setRemarks(kyc.adminRemarks || vendor.rejectionReason || '');
    setChecklist({
      aadhaarVerified: Boolean(kyc.aadhaarFrontUrl && kyc.aadhaarBackUrl && kyc.status === 'VERIFIED'),
      panVerified: Boolean(kyc.panUrl && kyc.status === 'VERIFIED'),
      addressVerified: Boolean(kyc.registeredAddress && kyc.status === 'VERIFIED')
    });
  };

  const submitReview = async (action: 'VERIFY' | 'REQUEST_CHANGES' | 'REJECT') => {
    if (!selectedVendor) return;

    if ((action === 'REQUEST_CHANGES' || action === 'REJECT') && !remarks.trim()) {
      showToast(`Please provide mandatory remarks explaining why you are ${action === 'REQUEST_CHANGES' ? 'requesting changes' : 'rejecting/suspending'} this partner.`, 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/vendor-kyc/${selectedVendor.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          remarks: remarks.trim() || (action === 'VERIFY' ? 'All KYC documents and business details verified successfully.' : ''),
          documentReviews: checklist
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Review operation failed on server.');
      }

      showToast(
        action === 'VERIFY'
          ? `Partner "${selectedVendor.name}" verified & approved! In-app notice & Resend email sent.`
          : action === 'REQUEST_CHANGES'
          ? `Changes requested from "${selectedVendor.name}". In-app notice & Resend email sent.`
          : `Partner "${selectedVendor.name}" rejected/suspended.`
      );
      setSelectedVendor(null);
      setRemarks('');
    } catch (err: any) {
      showToast(err.message || 'Error submitting review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = vendors.filter(v => {
    const kyc = getMergedKyc(v);
    const incomplete = isKycIncomplete(v);

    if (filter === 'pending' && (v.approved || kyc.status !== 'PENDING_VERIFICATION')) return false;
    if (filter === 'action_required' && kyc.status !== 'ACTION_REQUIRED') return false;
    if (filter === 'incomplete' && (v.approved || !incomplete)) return false;
    if (filter === 'verified' && !v.approved) return false;
    if (filter === 'rejected' && (v.status !== 'SUSPENDED' && v.verificationStatus !== 'REJECTED' && kyc.status !== 'REJECTED')) return false;

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
      const kyc = getMergedKyc(v);
      const incomplete = isKycIncomplete(v);
      return {
        'Vendor ID': v.id,
        'Business Name': v.name || '',
        'Category': v.category || '',
        'City / Location': v.location || '',
        'Founder Name': v.founderName || '',
        'Phone': v.phone || '',
        'Email': v.email || '',
        'Approval Status': v.approved ? 'VERIFIED' : 'PENDING',
        'KYC Status': kyc.status || (v.approved ? 'VERIFIED' : incomplete ? 'INCOMPLETE' : 'PENDING'),
        'Aadhaar Number': kyc.aadhaarNumber || '',
        'Aadhaar Front URL': kyc.aadhaarFrontUrl || '',
        'Aadhaar Back URL': kyc.aadhaarBackUrl || '',
        'PAN Number': kyc.panNumber || '',
        'PAN URL': kyc.panUrl || '',
        'GST Number': kyc.gstNumber || '',
        'License Number': kyc.licenseNumber || '',
        'Registered Address': kyc.registeredAddress || '',
        'Admin Remarks': kyc.adminRemarks || v.rejectionReason || '',
        'Created At': v.createdAt || '',
        'Approved At': v.approvedAt || ''
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_vendor_kyc_verification_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-md transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-red-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vendor Partner KYC & Verification Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">Inspect government ID documents (Aadhaar/PAN), trade licenses, and authorize marketplace partners</p>
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
            <option value="pending">Pending KYC Review ({vendors.filter(v => !v.approved && getMergedKyc(v).status === 'PENDING_VERIFICATION').length})</option>
            <option value="action_required">Action Required ({vendors.filter(v => getMergedKyc(v).status === 'ACTION_REQUIRED').length})</option>
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

      {/* Grid or Empty */}
      {loading ? (
        <div className="text-center py-12 font-bold text-gray-400">Loading verification queue...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <p className="font-extrabold text-sm text-gray-900">No vendor partners found matching criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(v => {
            const kyc = getMergedKyc(v);
            const incomplete = isKycIncomplete(v);

            return (
              <div key={v.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-brand-primary">{v.category}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      v.approved 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : kyc.status === 'ACTION_REQUIRED'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                        : (v.status === 'SUSPENDED' || v.verificationStatus === 'REJECTED' || kyc.status === 'REJECTED')
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : kyc.status === 'PENDING_VERIFICATION'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : incomplete
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {v.approved 
                        ? 'VERIFIED' 
                        : kyc.status === 'ACTION_REQUIRED'
                        ? 'ACTION REQUIRED'
                        : (v.status === 'SUSPENDED' || v.verificationStatus === 'REJECTED' || kyc.status === 'REJECTED')
                        ? 'REJECTED'
                        : kyc.status === 'PENDING_VERIFICATION'
                        ? 'PENDING REVIEW'
                        : incomplete
                        ? 'KYC INCOMPLETE'
                        : 'NOT SUBMITTED'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-gray-900">{v.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Founder: {v.founderName || 'Specialist'} • City: {v.location || 'Kolhapur'}</p>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{v.description}</p>

                  {/* Document preview badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {kyc.aadhaarFrontUrl && kyc.aadhaarBackUrl ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200 flex items-center gap-1">
                        <Check size={11} /> Aadhaar Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold border border-rose-200">
                        Aadhaar Missing
                      </span>
                    )}

                    {kyc.panUrl ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200 flex items-center gap-1">
                        <Check size={11} /> PAN Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold border border-rose-200">
                        PAN Missing
                      </span>
                    )}

                    {kyc.licenseUrl && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold border border-blue-200 flex items-center gap-1">
                        <Check size={11} /> License Uploaded
                      </span>
                    )}
                  </div>

                  {/* Rejection / Action remarks banner */}
                  {(kyc.adminRemarks || v.rejectionReason) && (
                    <p className={`text-[11px] mt-2 font-semibold p-2 rounded-xl border ${
                      kyc.status === 'ACTION_REQUIRED' 
                        ? 'bg-amber-50 text-amber-900 border-amber-200' 
                        : 'bg-red-50 text-red-900 border-red-200'
                    }`}>
                      <strong>Review Note:</strong> {kyc.adminRemarks || v.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between gap-2 border-t border-gray-100">
                  <div className="text-[11px] text-gray-400 font-mono">
                    ID: {v.id.substring(0, 8)}...
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReviewModal(v)}
                      className="px-3.5 py-1.5 bg-brand-primary hover:bg-[#79194a] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>{v.approved ? 'Inspect KYC' : 'Review & Verify'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Document Checklist Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col my-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-base font-black text-gray-900">Partner KYC & Document Inspection</h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedVendor.name} • {selectedVendor.category} • ID: {selectedVendor.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Partner Contact Details */}
              {(() => {
                const kyc = getMergedKyc(selectedVendor);
                return (
                  <>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
                      <h3 className="text-xs font-black uppercase text-gray-700 tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Building size={14} className="text-brand-primary" />
                        Business & Contact Profile
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 block font-semibold">Contact Person / Founder:</span>
                          <span className="font-bold text-gray-900">{kyc.contactPerson || selectedVendor.founderName || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-semibold">Official Phone:</span>
                          <span className="font-bold text-gray-900">{kyc.contactPhone || selectedVendor.phone || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-semibold">Email:</span>
                          <span className="font-bold text-gray-900">{selectedVendor.email || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-semibold">Registered Business Address:</span>
                          <span className="font-bold text-gray-900">{kyc.registeredAddress || selectedVendor.location || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Documents Showcase */}
                    <div>
                      <h3 className="text-xs font-black uppercase text-gray-700 tracking-wider mb-3 flex items-center gap-1.5">
                        <FileText size={14} className="text-brand-primary" />
                        Submitted Identity & Business Documents
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Aadhaar Front */}
                        <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-gray-800">Aadhaar Card (Front)</span>
                            {kyc.aadhaarNumber && (
                              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                                {kyc.aadhaarNumber}
                              </span>
                            )}
                          </div>
                          {kyc.aadhaarFrontUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white h-36">
                              <img src={kyc.aadhaarFrontUrl} alt="Aadhaar Front" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setZoomedImage({ url: kyc.aadhaarFrontUrl, title: 'Aadhaar Card (Front)' })}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1 transition cursor-pointer"
                              >
                                <Eye size={14} /> Enlarge Document
                              </button>
                            </div>
                          ) : (
                            <div className="h-36 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 text-xs">
                              <AlertCircle size={20} className="text-gray-300 mb-1" />
                              Not Uploaded
                            </div>
                          )}
                        </div>

                        {/* Aadhaar Back */}
                        <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-gray-800">Aadhaar Card (Back)</span>
                          </div>
                          {kyc.aadhaarBackUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white h-36">
                              <img src={kyc.aadhaarBackUrl} alt="Aadhaar Back" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setZoomedImage({ url: kyc.aadhaarBackUrl, title: 'Aadhaar Card (Back)' })}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1 transition cursor-pointer"
                              >
                                <Eye size={14} /> Enlarge Document
                              </button>
                            </div>
                          ) : (
                            <div className="h-36 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 text-xs">
                              <AlertCircle size={20} className="text-gray-300 mb-1" />
                              Not Uploaded
                            </div>
                          )}
                        </div>

                        {/* PAN Card */}
                        <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-gray-800">PAN Card</span>
                            {kyc.panNumber && (
                              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200 uppercase">
                                {kyc.panNumber}
                              </span>
                            )}
                          </div>
                          {kyc.panUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white h-36">
                              <img src={kyc.panUrl} alt="PAN Card" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setZoomedImage({ url: kyc.panUrl, title: 'PAN Card' })}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1 transition cursor-pointer"
                              >
                                <Eye size={14} /> Enlarge Document
                              </button>
                            </div>
                          ) : (
                            <div className="h-36 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 text-xs">
                              <AlertCircle size={20} className="text-gray-300 mb-1" />
                              Not Uploaded
                            </div>
                          )}
                        </div>

                        {/* Business License / FSSAI */}
                        <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-gray-800">Trade License / FSSAI</span>
                            {kyc.licenseNumber && (
                              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                                {kyc.licenseNumber}
                              </span>
                            )}
                          </div>
                          {kyc.licenseUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white h-36">
                              <img src={kyc.licenseUrl} alt="Business License" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setZoomedImage({ url: kyc.licenseUrl, title: 'Business License / FSSAI' })}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1 transition cursor-pointer"
                              >
                                <Eye size={14} /> Enlarge Document
                              </button>
                            </div>
                          ) : (
                            <div className="h-36 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 text-xs">
                              <FileText size={20} className="text-gray-300 mb-1" />
                              Optional / None Uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200">
                      <h3 className="text-xs font-black uppercase text-emerald-900 tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-600" />
                        Admin Verification Checklist
                      </h3>
                      <div className="space-y-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                          <input
                            type="checkbox"
                            checked={checklist.aadhaarVerified}
                            onChange={e => setChecklist(prev => ({ ...prev, aadhaarVerified: e.target.checked }))}
                            className="rounded text-brand-primary focus:ring-brand-primary"
                          />
                          <span>Aadhaar Front & Back are authentic, clear, and name matches applicant</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                          <input
                            type="checkbox"
                            checked={checklist.panVerified}
                            onChange={e => setChecklist(prev => ({ ...prev, panVerified: e.target.checked }))}
                            className="rounded text-brand-primary focus:ring-brand-primary"
                          />
                          <span>PAN Card number and document copy are authentic and verified</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                          <input
                            type="checkbox"
                            checked={checklist.addressVerified}
                            onChange={e => setChecklist(prev => ({ ...prev, addressVerified: e.target.checked }))}
                            className="rounded text-brand-primary focus:ring-brand-primary"
                          />
                          <span>Business address and contact details match physical operations</span>
                        </label>
                      </div>
                    </div>

                    {/* Remarks Input */}
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-1.5">
                        Admin Remarks & Reviewer Notes <span className="text-gray-400 font-normal lowercase">(mandatory for requesting changes or rejection)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="Provide clear feedback to partner. If requesting changes, describe exactly which document needs re-uploading (e.g. 'Aadhaar back is blurry, please re-upload clear photo')."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={submittingReview}
                        onClick={() => submitReview('REJECT')}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        Reject Application
                      </button>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={submittingReview}
                          onClick={() => submitReview('REQUEST_CHANGES')}
                          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw size={13} />
                          <span>Request Changes</span>
                        </button>

                        <button
                          type="button"
                          disabled={submittingReview}
                          onClick={() => submitReview('VERIFY')}
                          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {submittingReview ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              <span>Verify & Approve Partner</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Full Document Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">{zoomedImage.title}</span>
              <div className="flex items-center gap-2">
                <a
                  href={zoomedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-xs font-bold px-2 py-1 rounded bg-white/10 flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-100 max-h-[80vh] overflow-auto">
              <img src={zoomedImage.url} alt={zoomedImage.title} className="max-w-full h-auto rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
