import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance, getDb } from './lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, Grid, Tag, LogOut, Building2, Settings, Ticket, MapPin, Mail, Radio, DollarSign, ShieldCheck, Star, History, Calendar, Inbox, Image as ImageIcon, Menu, X, Sparkles
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
import HeroCmsManager from './components/HeroCmsManager';

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.search.includes('preview=admin')) {
      return true;
    }
    return null;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab) return urlTab;
    }
    return 'dashboard';
  });
  const [adminLogoUrl, setAdminLogoUrl] = useState('https://res.cloudinary.com/k03rmhkg/image/upload/v1792254596/parva_branding/myparva_official_logo.png');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsubBranding = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.logoUrl) {
          setAdminLogoUrl(d.logoUrl);
          if (typeof document !== 'undefined') {
            const icons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
            icons.forEach((el) => {
              (el as HTMLLinkElement).href = d.logoUrl;
            });
          }
        }
      }
    }, () => {});
    return unsubBranding;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.search.includes('preview=admin')) {
      setIsAdmin(true);
      return;
    }
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

  // Navigation Items with Website Logo & Branding prominently positioned at #2
  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Financials', icon: <LayoutDashboard size={18} /> },
    { id: 'branding', label: 'Website Logo & Branding', icon: <ImageIcon size={18} />, isHighlight: true, badge: 'Live Logo' },
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
    { id: 'email_logs', label: 'Email Delivery & API Keys', icon: <Mail size={18} /> },
    { id: 'audit_logs', label: 'Security Audit Logs', icon: <History size={18} /> },
    { id: 'hero', label: 'Homepage Hero CMS', icon: <Sparkles size={18} /> },
    { id: 'settings', label: 'Platform Policies', icon: <Settings size={18} /> },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col hidden md:flex h-screen sticky top-0 shrink-0">
        <div 
          onClick={() => setActiveTab('branding')}
          className="h-16 flex items-center justify-between px-6 border-b border-gray-100 cursor-pointer hover:bg-rose-50/40 transition group"
          title="Click to manage website logo and favicon"
        >
          <div className="flex items-center gap-3">
            <img 
              src={adminLogoUrl || '/parva-logo.png'} 
              alt="Parva Admin" 
              className="h-7 w-auto object-contain" 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/parva-logo.png'; }}
            />
            <span className="text-[11px] font-black tracking-widest text-[#EC003F] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
              ADMIN
            </span>
          </div>
          <span className="text-[10px] text-gray-400 group-hover:text-brand-primary font-bold">✎ Logo</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-brand-primary text-white shadow-sm' 
                  : item.isHighlight
                  ? 'bg-rose-50/60 text-[#9d174d] hover:bg-rose-100/70 border border-rose-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && activeTab !== item.id && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-[#9d174d]">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
            <LogOut size={16} /> Sign Out Console
          </button>
        </div>
      </aside>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-80 max-w-full bg-white h-full flex flex-col z-10 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
              <div className="flex items-center gap-3" onClick={() => handleNavClick('branding')}>
                <img 
                  src={adminLogoUrl || '/parva-logo.png'} 
                  alt="Parva Admin" 
                  className="h-7 w-auto object-contain" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/parva-logo.png'; }}
                />
                <span className="text-[11px] font-black tracking-widest text-[#EC003F] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                  ADMIN
                </span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                    activeTab === item.id 
                      ? 'bg-brand-primary text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-[#9d174d]">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={16} /> Sign Out Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Sticky Top Header with Instant Logo Change Button */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
              PARVA CELEBRATIONS ENTERPRISE GATEWAY
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action Button: Change Logo & Favicon */}
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${
                activeTab === 'branding'
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 text-[#9d174d] border-rose-200'
              }`}
              title="Change website logo and favicon across all portals"
            >
              <ImageIcon size={14} />
              <span>Change Logo & Favicon</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
              👑
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'branding' && <SettingsManager initialTab="branding" />}
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
          {activeTab === 'hero' && <HeroCmsManager />}
          {activeTab === 'settings' && <SettingsManager initialTab="policies" />}
        </div>
      </main>
    </div>
  );
}
