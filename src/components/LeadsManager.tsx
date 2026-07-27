import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Search, User, Phone, CheckCircle, Trash2, Calendar, MapPin } from 'lucide-react';

export default function LeadsManager() {
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'leads'), (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.timestamp - a.timestamp));
    });
    return unsub;
  }, []);

  const handleResolve = async (id: string, currentStatus: boolean) => {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'leads', id), { resolved: !currentStatus });
    } catch (e) {
      alert('Failed to update lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete lead?')) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'leads', id));
    } catch (e) {
      alert('Failed to delete lead');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Leads Pipeline</h2>
        <p className="text-sm text-gray-500 mt-1">Manage customer inquiries and vendor connections.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search leads by customer or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLeads.map(lead => (
          <div key={lead.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition ${lead.resolved ? 'border-gray-200 opacity-60' : 'border-emerald-200 hover:shadow-md'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${lead.resolved ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                  {lead.resolved ? 'Resolved' : 'New Lead'}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12}/> {new Date(lead.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleResolve(lead.id, lead.resolved)} className="text-gray-400 hover:text-emerald-500 transition" title="Toggle Resolve">
                  <CheckCircle size={16} className={lead.resolved ? 'text-emerald-500' : ''} />
                </button>
                <button onClick={() => handleDelete(lead.id)} className="text-gray-400 hover:text-red-500 transition" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Details</p>
                <p className="font-bold text-gray-800 flex items-center gap-2"><User size={14}/> {lead.userName}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1"><Phone size={14}/> {lead.userPhone}</p>
              </div>
              
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Interested In</p>
                <p className="font-bold text-brand-primary flex items-center gap-2">
                  <MapPin size={14}/> {lead.vendorName}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {filteredLeads.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-200 border-dashed">
            No leads found.
          </div>
        )}
      </div>
    </div>
  );
}
