import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Download, Search, Trash2, CheckCircle, XCircle, Plus, Edit2 } from 'lucide-react';
import Papa from 'papaparse';
import VendorEditorOverlay from './VendorEditorOverlay';

export default function VendorsManager() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'vendors'), (snap) => {
      setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredVendors.map(v => ({
      ID: v.id,
      Name: v.name,
      Category: v.category,
      Location: v.location,
      Phone: v.phone || '',
      Price: v.basePrice || v.price || '',
      Rating: v.rating || 0,
      Approved: v.approved ? 'Yes' : 'No'
    })));
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_vendors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const db = getDb();
      await updateDoc(doc(db, 'vendors', id), { approved: !currentStatus });
    } catch (e) {
      console.error(e);
      alert('Failed to update approval status');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this vendor?')) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'vendors', id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete vendor');
    }
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === 'All' || v.location === filterCity;
    const matchesStatus = filterStatus === 'All' 
      ? true 
      : filterStatus === 'Approved' ? v.approved === true : v.approved === false;
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  const uniqueCities = ['All', ...Array.from(new Set(vendors.map(v => v.location).filter(Boolean)))];

  const pendingCount = vendors.filter(v => !v.approved).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Vendor CRM & Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage, onboard, and rank vendors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={() => { setSelectedVendor(null); setShowEditor(true); }}
            className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-brand-primary-dark transition"
          >
            <Plus size={16} />
            Onboard Vendor
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setFilterStatus('All')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filterStatus === 'All' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
        >
          All Vendors
        </button>
        <button 
          onClick={() => setFilterStatus('Approved')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filterStatus === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
        >
          Approved
        </button>
        <button 
          onClick={() => setFilterStatus('Pending')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${filterStatus === 'Pending' ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
        >
          Requests
          {pendingCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${filterStatus === 'Pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search vendors by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={filterCity} 
            onChange={e => setFilterCity(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-brand-primary min-w-[140px]"
          >
            {uniqueCities.map(city => <option key={city as string} value={city as string}>{city}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Vendor Name</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Category & Location</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Region Rank</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <p className="font-bold">No vendors found.</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                filteredVendors.map(vendor => (
                  <tr 
                    key={vendor.id} 
                    onClick={() => { setSelectedVendor(vendor); setShowEditor(true); }}
                    className="hover:bg-gray-50/80 cursor-pointer transition group"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        <img src={vendor.image || vendor.images?.[0] || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-gray-100" />
                        <div>
                          <p>{vendor.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 font-mono">ID: {vendor.id}</span>
                            <a 
                              href={`http://localhost:5173/?vendor=${vendor.id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-[9px] font-bold text-brand-primary hover:underline bg-brand-primary/10 px-1.5 py-0.5 rounded"
                            >
                              Open Portal ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800 font-medium">{vendor.category}</p>
                      <p className="text-[10px] text-gray-400">{vendor.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center bg-purple-50 text-purple-600 font-black text-xs px-2.5 py-1 rounded-lg">
                        #{vendor.regionRank || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {vendor.approved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle size={12} /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                          <XCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={(e) => handleToggleApproval(vendor.id, vendor.approved || false, e)}
                          className={`p-2 rounded-lg transition ${vendor.approved ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          title={vendor.approved ? 'Revoke Approval' : 'Approve Vendor'}
                        >
                          {vendor.approved ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button 
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          title="Edit Vendor"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(vendor.id, e)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="Delete Vendor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditor && (
        <VendorEditorOverlay 
          vendor={selectedVendor} 
          onClose={() => setShowEditor(false)} 
        />
      )}
    </div>
  );
}
