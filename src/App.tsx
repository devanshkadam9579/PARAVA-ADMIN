import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, getDb } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, Grid, Tag, Inbox, LogOut, Search, Bell, Building2, Settings, Ticket
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import VendorsManager from './components/VendorsManager';
import CategoriesManager from './components/CategoriesManager';
import PromosManager from './components/PromosManager';
import UsersManager from './components/UsersManager';
import LeadsManager from './components/LeadsManager';
import SettingsManager from './components/SettingsManager';
import CouponsManager from './components/CouponsManager';
import CouponsManager from './components/CouponsManager';

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const auth = getAuthInstance();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const db = getDb();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        if (data?.role === 'master_admin' || data?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const auth = getAuthInstance();
      const cred = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      
      const db = getDb();
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      const data = userDoc.data();
      
      if (data?.role === 'master_admin' || data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        alert('Access Denied. You are not an administrator.');
        await auth.signOut();
      }
    } catch (e: any) {
      alert('Login failed: ' + e.message);
    }
  };

  const handleLogout = async () => {
    await getAuthInstance().signOut();
  };

  if (isAdmin === null) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Checking credentials...</div>;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">PARAVA <span className="text-brand-primary">ADMIN</span></h1>
            <p className="text-sm text-gray-500 mt-2">Secure access required</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Admin Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" placeholder="devansh@parva.com" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Password</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Unlock Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'vendors', label: 'Vendors CRM', icon: <Building2 size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'leads', label: 'Leads', icon: <Inbox size={18} /> },
    { id: 'categories', label: 'Categories', icon: <Grid size={18} /> },
    { id: 'promos', label: 'Promotions', icon: <Tag size={18} /> },
    { id: 'coupons', label: 'Coupons', icon: <Ticket size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">PARAVA <span className="text-brand-primary">CRM</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.id 
                  ? 'bg-brand-primary/10 text-brand-primary' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Global Search (Coming Soon)..." 
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                disabled
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
              DK
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'vendors' && <VendorsManager />}
          {activeTab === 'users' && <UsersManager />}
          {activeTab === 'leads' && <LeadsManager />}
          {activeTab === 'categories' && <CategoriesManager />}
          {activeTab === 'promos' && <PromosManager />}
          {activeTab === 'coupons' && <CouponsManager />}
          {activeTab === 'settings' && <SettingsManager />}
          {activeTab === 'coupons' && <CouponsManager />}
        </div>
      </main>
    </div>
  );
}
