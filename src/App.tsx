import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, getDb } from './lib/firebase';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, Grid, Tag, Inbox, LogOut, Search, Bell
} from 'lucide-react';

// Sub-components to be imported later
import Dashboard from './components/Dashboard';
import VendorsManager from './components/VendorsManager';
import CategoriesManager from './components/CategoriesManager';
import PromosManager from './components/PromosManager';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Verify master admin status
        const db = getDb();
        const userRef = doc(db, 'users', u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().role === 'master_admin') {
          setUser(u);
          setIsAdmin(true);
        } else {
          auth.signOut();
          setErrorMsg('Access denied. Master Admin privileges required.');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const auth = getAuthInstance();
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    getAuthInstance().signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-[24px] shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-brand-primary tracking-tight">PARVA</h1>
            <p className="text-gray-500 font-medium text-sm mt-1 uppercase tracking-widest">Admin Workspace</p>
          </div>
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold mb-4 border border-red-100 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand-primary transition"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand-primary transition"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-sm py-3.5 rounded-xl transition shadow-lg shadow-brand-primary/20 mt-4"
            >
              Secure Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'vendors', label: 'Vendor Directory', icon: <Users size={18} /> },
    { id: 'categories', label: 'Categories', icon: <Grid size={18} /> },
    { id: 'promos', label: 'Promotions', icon: <Tag size={18} /> },
    { id: 'leads', label: 'Lead Insights', icon: <Inbox size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans text-brand-text">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 relative h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-brand-primary tracking-tight">PARVA</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Global Admin</p>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm
                ${activeTab === tab.id 
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-bold text-xs transition"
          >
            <LogOut size={14} />
            Sign Out Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm z-0">
          <h2 className="text-lg font-black text-gray-800 capitalize">{tabs.find(t => t.id === activeTab)?.label}</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Global search..." 
                className="bg-gray-100 border-none rounded-full px-4 py-1.5 pl-9 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none w-64"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 shadow flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'vendors' && <VendorsManager />}
            {activeTab === 'categories' && <CategoriesManager />}
            {activeTab === 'promos' && <PromosManager />}
            {activeTab === 'leads' && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
                <Inbox className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-700">Leads Management</h3>
                <p className="mt-2 text-sm">Leads implementation coming in next iteration.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
