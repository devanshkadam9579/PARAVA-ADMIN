import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, getDb } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, Grid, Tag, LogOut, Building2, Settings, Ticket, MapPin, Mail, Radio, DollarSign, ShieldCheck, Star, History, Calendar, Inbox
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import VendorsManager from './components/VendorsManager';
import CategoriesManager from './components/CategoriesManager';
import PromosManager from './components/PromosManager';
import UsersManager from './components/UsersManager';
import SettingsManager from './components/SettingsManager';
import CitiesManager from './components/CitiesManager';
import CouponsManager from './components/CouponsManager';
import EmailLogsManager from './components/EmailLogsManager';
import BroadcasterManager from './components/BroadcasterManager';
import BookingsManager from './components/BookingsManager';
import PaymentsManager from './components/PaymentsManager';
import VendorVerificationManager from './components/VendorVerificationManager';
import ReviewsModerator from './components/ReviewsModerator';
import AuditLogsManager from './components/AuditLogsManager';
import LeadsManager from './components/LeadsManager';

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const auth = getAuthInstance();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const emailLower = (user.email || '').toLowerCase().trim();
        const isMaster = [
          'devanshkadam2@gmail.com',
          'devenshkadam2@gmail.com',
          'devansh@parva.com',
          'admin@myparva.com',
          'rohan@myparva.com',
          'devanshkadam9579@gmail.com',
          'admin@parva.com'
        ].includes(emailLower);
        if (isMaster) {
          setIsAdmin(true);
          return;
        }
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
      
      const emailLower = (cred.user.email || '').toLowerCase().trim();
      const isMaster = [
        'devanshkadam2@gmail.com',
        'devenshkadam2@gmail.com',
        'devansh@parva.com',
        'admin@myparva.com',
        'rohan@myparva.com',
        'devanshkadam9579@gmail.com',
        'admin@parva.com'
      ].includes(emailLower);
      if (isMaster) {
        setIsAdmin(true);
        return;
      }

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
    setIsAdmin(false);
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
            <p className="text-sm text-gray-500 mt-2">Dedicated Master Management Console</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Admin Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-xs font-semibold" placeholder="devansh@parva.com" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Password</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-xs font-semibold" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-xs uppercase tracking-wider">
              Unlock Master Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Financials', icon: <LayoutDashboard size={18} /> },
    { id: 'bookings', label: 'Bookings Console', icon: <Calendar size={18} /> },
    { id: 'leads', label: 'Leads & Inquiries', icon: <Inbox size={18} /> },
    { id: 'payments', label: 'Payments & Escrow', icon: <DollarSign size={18} /> },
    { id: 'verification', label: 'Vendor Verification', icon: <ShieldCheck size={18} /> },
    { id: 'vendors', label: 'Vendors CRM', icon: <Building2 size={18} /> },
    { id: 'reviews', label: 'Review Moderation', icon: <Star size={18} /> },
    { id: 'categories', label: 'Service Categories', icon: <Grid size={18} /> },
    { id: 'promos', label: 'Promotions & Banners', icon: <Tag size={18} /> },
    { id: 'coupons', label: 'Coupons & Discounts', icon: <Ticket size={18} /> },
    { id: 'cities', label: 'City Operations', icon: <MapPin size={18} /> },
    { id: 'users', label: 'User Accounts', icon: <Users size={18} /> },
    { id: 'broadcast', label: 'Live Push Broadcast', icon: <Radio size={18} /> },
    { id: 'email_logs', label: 'Email Delivery Logs', icon: <Mail size={18} /> },
    { id: 'audit_logs', label: 'Security Audit Logs', icon: <History size={18} /> },
    { id: 'settings', label: 'Platform Policies', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <h1 className="text-lg font-black text-gray-900 tracking-tight">PARAVA <span className="text-brand-primary">ADMIN CONSOLE</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === item.id 
                  ? 'bg-brand-primary text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={16} /> Sign Out Console
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              PARVA CELEBRATIONS ENTERPRISE GATEWAY
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
              👑
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'bookings' && <BookingsManager />}
          {activeTab === 'leads' && <LeadsManager />}
          {activeTab === 'payments' && <PaymentsManager />}
          {activeTab === 'verification' && <VendorVerificationManager />}
          {activeTab === 'vendors' && <VendorsManager />}
          {activeTab === 'reviews' && <ReviewsModerator />}
          {activeTab === 'categories' && <CategoriesManager />}
          {activeTab === 'promos' && <PromosManager />}
          {activeTab === 'coupons' && <CouponsManager />}
          {activeTab === 'cities' && <CitiesManager />}
          {activeTab === 'users' && <UsersManager />}
          {activeTab === 'broadcast' && <BroadcasterManager />}
          {activeTab === 'email_logs' && <EmailLogsManager />}
          {activeTab === 'audit_logs' && <AuditLogsManager />}
          {activeTab === 'settings' && <SettingsManager />}
        </div>
      </main>
    </div>
  );
}
