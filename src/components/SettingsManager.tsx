import React, { useState, useEffect } from 'react';
import { Settings, Save, CreditCard } from 'lucide-react';
import { getDb } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SettingsManager() {
  const [commissionPct, setCommissionPct] = useState<number>(10);
  const [fixedFee, setFixedFee] = useState<number>(0);
  const [supportEmail, setSupportEmail] = useState('support@parva.com');

  const [termsVersion, setTermsVersion] = useState('1.2');
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const db = getDb();
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          const d = snap.data();
          if (d.commissionPercentage !== undefined) setCommissionPct(Number(d.commissionPercentage));
          if (d.fixedCommissionFee !== undefined) setFixedFee(Number(d.fixedCommissionFee));
          if (d.supportEmail) setSupportEmail(d.supportEmail);
          if (d.termsVersion) setTermsVersion(d.termsVersion);
          if (d.paymentsEnabled !== undefined) setPaymentsEnabled(d.paymentsEnabled);
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'global'), {
        commissionPercentage: commissionPct,
        fixedCommissionFee: fixedFee,
        supportEmail,
        termsVersion,
        paymentsEnabled,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setNotification('✨ Settings, Commission & Payment Mode saved successfully!');
    } catch (err: any) {
      setNotification(`❌ Failed: ${err.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Platform Policies, Commission & Payment Gateway</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure marketplace rules, commission rates, and Razorpay gateway mode</p>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {notification}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs space-y-5">
        {/* Payment Gateway Switch */}
        <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-600" />
              <span>Online Payment Gateway (Razorpay) Mode</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {paymentsEnabled 
                ? "Active: Users pay advance connection/booking fee via Razorpay" 
                : "Direct Mode: Users confirm booking directly without online payment requirement"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentsEnabled(!paymentsEnabled)}
            className={`px-4 py-2 rounded-xl font-black text-xs transition active:scale-95 uppercase tracking-wider ${
              paymentsEnabled 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {paymentsEnabled ? '✓ Enabled' : '✕ Disabled (Direct)'}
          </button>
        </div>

        {/* Commission Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Platform Commission Rate (%)</label>
            <input
              type="number"
              min={0}
              max={50}
              value={commissionPct}
              onChange={(e) => setCommissionPct(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">Default is 10% on gross booking value</span>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Fixed Service Fee (₹)</label>
            <input
              type="number"
              min={0}
              value={fixedFee}
              onChange={(e) => setFixedFee(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">Additional fixed fee per booking</span>
          </div>
        </div>

        {/* Support & Legal */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Official Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Legal Terms Version</label>
            <input
              type="text"
              value={termsVersion}
              onChange={(e) => setTermsVersion(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 uppercase tracking-wider mt-4"
        >
          <Save size={16} />
          <span>{isSaving ? 'Saving Settings...' : 'Save & Publish Platform Settings'}</span>
        </button>
      </form>
    </div>
  );
}
