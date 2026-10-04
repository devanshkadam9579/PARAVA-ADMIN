import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Search, Mail, Phone, Calendar, Download } from 'lucide-react';
import Papa from 'papaparse';

export default function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all') {
      const uRole = (u.role || 'user').toLowerCase();
      if (roleFilter === 'admin' && !(uRole === 'admin' || uRole === 'master_admin')) return false;
      if (roleFilter !== 'admin' && uRole !== roleFilter) return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) || 
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      alert('No users available to export.');
      return;
    }

    const csvData = filteredUsers.map(u => ({
      'User ID': u.id,
      'Name': u.name || 'Anonymous User',
      'Email': u.email || '',
      'Phone': u.phone || '',
      'Role': u.role || 'user',
      'City': u.city || '',
      'Created At': u.createdAt || '',
      'Last Login': u.lastLoginAt || u.updatedAt || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-black text-gray-900">User Directory</h2>
          <p className="text-xs text-gray-500 mt-1">Authoritative client and vendor user directory ({users.length} registered)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download CSV report of platform users"
          >
            <Download size={14} />
            <span>Extract CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users by name, email, phone, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-none focus:bg-white focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-brand-primary capitalize"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="user">Customers</option>
            <option value="vendor">Vendors</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 font-bold text-gray-400">Loading user directory...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <p className="font-extrabold text-sm text-gray-900">No users match this filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">User</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Contact Info</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Role</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {user.name || 'Anonymous User'}
                      <p className="text-[9px] text-gray-400 font-normal uppercase tracking-widest mt-0.5">ID: {user.id.substring(0,8)}...</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-2 text-xs">
                          <Mail size={12} className="text-gray-400" /> {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone size={12} className="text-gray-400" /> {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' || user.role === 'master_admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={12} /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
