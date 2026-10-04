import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Search, User, Phone, CheckCircle, Trash2, Calendar, MapPin, Download } from 'lucide-react';
import Papa from 'papaparse';

export default function LeadsManager() {
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'leads'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || a.timestamp || 0).getTime();
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || b.timestamp || 0).getTime();
        return tB - tA;
      });
      setLeads(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleResolve = async (id: string, currentStatus: boolean) => {
    try {
      const db = getDb();
      if (!db) return;
      await updateDoc(doc(db, 'leads', id), { 
        resolved: !currentStatus,
        resolvedAt: new Date().toISOString()
      });
    } catch (e: any) {
      alert('Failed to update lead: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete lead record?')) return;
    try {
      const db = getDb();
      if (!db) return;
      await deleteDoc(doc(db, 'leads', id));
    } catch (e: any) {
      alert('Failed to delete lead: ' + e.message);
    }
  };

  const filteredLeads = leads.filter(l => {
    if (statusFilter === 'new' && l.resolved) return false;
    if (statusFilter === 'resolved' && !l.resolved) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (l.userName || l.customerName || '').toLowerCase().includes(q) ||
        (l.vendorName || '').toLowerCase().includes(q) ||
        (l.userPhone || l.customerPhone || '').includes(q) ||
        (l.eventType || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert('No leads available to export.');
      return;
    }

    const csvData = filteredLeads.map(l => ({
      'Lead ID': l.id,
      'Customer Name': l.userName || l.customerName || 'Customer',
      'Customer Phone': l.userPhone || l.customerPhone || '',
      'Customer Email': l.userEmail || l.customerEmail || '',
      'Vendor Partner': l.vendorName || '',
      'Vendor ID': l.vendorId || '',
      'Event Type': l.eventType || '',
      'Event Date': l.eventDate || '',
      'Status': l.resolved ? 'RESOLVED' : 'NEW_LEAD',
      'Created Date': l.createdAt ? (l.createdAt.toDate ? l.createdAt.toDate().toISOString() : l.createdAt) : (l.timestamp ? new Date(l.timestamp).toISOString() : '')
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_leads_pipeline_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Leads & Inquiry Pipeline</h2>
          <p className="text-xs text-gray-500 mt-1">Direct inquiries, connection requests, and booking pipeline leads ({leads.length} total)</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
          title="Download CSV report of customer leads"
        >
          <Download size={14} />
          <span>Extract CSV</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search leads by customer, vendor, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-none focus:bg-white focus:border-brand-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-brand-primary capitalize"
        >
          <option value="all">All Leads ({leads.length})</option>
          <option value="new">New Inquiries ({leads.filter(l => !l.resolved).length})</option>
          <option value="resolved">Resolved Leads ({leads.filter(l => l.resolved).length})</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 font-bold text-gray-400">Loading leads pipeline...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <div key={lead.id} className={`bg-white rounded-2xl border p-5 shadow-xs transition ${lead.resolved ? 'border-gray-200 opacity-60' : 'border-emerald-200 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${lead.resolved ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                    {lead.resolved ? 'Resolved' : 'New Lead'}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12}/> 
                    {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : (lead.timestamp ? new Date(lead.timestamp).toLocaleDateString() : 'Recent')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleResolve(lead.id, lead.resolved)} className="text-gray-400 hover:text-emerald-500 transition cursor-pointer" title="Toggle Resolve">
                    <CheckCircle size={16} className={lead.resolved ? 'text-emerald-500' : ''} />
                  </button>
                  <button onClick={() => handleDelete(lead.id)} className="text-gray-400 hover:text-red-500 transition cursor-pointer" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Details</p>
                  <p className="font-bold text-gray-800 flex items-center gap-2 text-xs"><User size={13}/> {lead.userName || lead.customerName || 'Anonymous Client'}</p>
                  {(lead.userPhone || lead.customerPhone) && (
                    <p className="text-xs text-gray-600 flex items-center gap-2 mt-1"><Phone size={13}/> {lead.userPhone || lead.customerPhone}</p>
                  )}
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Interested In</p>
                  <p className="font-bold text-brand-primary flex items-center gap-2 text-xs">
                    <MapPin size={13}/> {lead.vendorName || 'Platform Vendor'}
                  </p>
                  {lead.eventType && (
                    <p className="text-[11px] text-gray-500 mt-0.5">Event: {lead.eventType}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredLeads.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-200 border-dashed">
              No leads found matching criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
