import React, { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Download, Search, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function VendorsManager() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

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
      Email: v.email || '',
      Price: v.price || '',
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

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'vendors', id), { approved: !currentStatus });
    } catch (e) {
      console.error(e);
      alert('Failed to update approval status');
    }
  };

  const handleDelete = async (id: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Vendor Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage, filter, and export vendor data.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-brand-primary-dark transition"
        >
          <Download size={16} />
          Export to CSV
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
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-brand-primary min-w-[140px]"
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Approval</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Vendor Name</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Category</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Location</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No vendors found matching your filters.</td>
                </tr>
              ) : (
                filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        <img src={vendor.image || vendor.images?.[0] || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                        <div>
                          <p>{vendor.name}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{vendor.email || vendor.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{vendor.category}</td>
                    <td className="px-6 py-4 text-gray-600">{vendor.location}</td>
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
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleToggleApproval(vendor.id, vendor.approved || false)}
                          className={`p-2 rounded-lg transition ${vendor.approved ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          title={vendor.approved ? 'Revoke Approval' : 'Approve Vendor'}
                        >
                          {vendor.approved ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(vendor.id)}
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
    </div>
  );
}
