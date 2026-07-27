import React, { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Users, Grid, Tag, Inbox, Building2, TrendingUp, DollarSign
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    vendors: 0,
    categories: 0,
    promos: 0,
    leads: 0,
    bookings: 0
  });

  useEffect(() => {
    const db = getDb();
    
    const unsubs = [
      onSnapshot(collection(db, 'vendors'), snap => setStats(s => ({ ...s, vendors: snap.size }))),
      onSnapshot(collection(db, 'categories'), snap => setStats(s => ({ ...s, categories: snap.size }))),
      onSnapshot(collection(db, 'promos'), snap => setStats(s => ({ ...s, promos: snap.size }))),
      onSnapshot(collection(db, 'leads'), snap => setStats(s => ({ ...s, leads: snap.size }))),
      onSnapshot(collection(db, 'bookings'), snap => setStats(s => ({ ...s, bookings: snap.size })))
    ];

    return () => unsubs.forEach(fn => fn());
  }, []);

  const cards = [
    { label: 'Total Vendors', value: stats.vendors, icon: <Building2 className="text-blue-500" size={24}/>, bg: 'bg-blue-50' },
    { label: 'Active Promos', value: stats.promos, icon: <Tag className="text-emerald-500" size={24}/>, bg: 'bg-emerald-50' },
    { label: 'Total Leads', value: stats.leads, icon: <Inbox className="text-amber-500" size={24}/>, bg: 'bg-amber-50' },
    { label: 'Categories', value: stats.categories, icon: <Grid className="text-purple-500" size={24}/>, bg: 'bg-purple-50' },
    { label: 'Total Bookings', value: stats.bookings, icon: <TrendingUp className="text-rose-500" size={24}/>, bg: 'bg-rose-50' },
    { label: 'Platform Revenue', value: '₹0', icon: <DollarSign className="text-indigo-500" size={24}/>, bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">System Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time metrics and database statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
