import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Search, Mail, Phone, Calendar } from 'lucide-react';

export default function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">User Directory</h2>
        <p className="text-sm text-gray-500 mt-1">View and manage registered platform users.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
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
    </div>
  );
}
