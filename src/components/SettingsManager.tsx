import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { CreditCard, Save, Percent } from 'lucide-react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export default function SettingsManager() {
  const [settings, setSettings] = useState<any>({ 
    paymentsEnabled: true,
    bookingFeePercentage: 5
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          ...data,
          paymentsEnabled: data.paymentsEnabled ?? data.paymentEnabled ?? true,
          bookingFeePercentage: data.bookingFeePercentage ?? 5
        });
      }
    });
    return unsub;
  }, []);

  const saveSettingsToStore = async (updated: any) => {
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'global'), updated, { merge: true });
    } catch (e: any) {
      console.warn("Client SDK save settings failed, attempting backend Admin SDK fallback:", e?.message || e);
      try {
        await fetch(`${BACKEND_API_URL}/api/admin/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docId: 'global', data: updated })
        });
      } catch (backendErr: any) {
        console.error("Backend settings fallback error:", backendErr);
      }
    }
  };

  const handleTogglePayments = async () => {
    const nextState = !settings.paymentsEnabled;
    const updated = {
      ...settings,
      paymentsEnabled: nextState,
      paymentEnabled: nextState
    };
    setSettings(updated);
    await saveSettingsToStore(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        paymentsEnabled: !!settings.paymentsEnabled,
        paymentEnabled: !!settings.paymentsEnabled,
        bookingFeePercentage: Number(settings.bookingFeePercentage) || 5
      };
      await saveSettingsToStore(payload);
      alert('Global settings saved successfully!');
    } catch (e: any) {
      alert(`Failed to save settings: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Global Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure platform-wide financial rules and payment behaviors.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-2xl space-y-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financial & Commission Controls</h3>
        
        {/* Razorpay Gateway Toggle */}
        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${settings.paymentsEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              <CreditCard size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">Razorpay Payments Gateway</p>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                {settings.paymentsEnabled 
                  ? 'Payments are ENABLED. Users will complete Razorpay checkout for booking advance fees.' 
                  : 'Payments are DISABLED. Frontend will bypass payment and grant instant free bookings.'}
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleTogglePayments}
            className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors cursor-pointer ${settings.paymentsEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform ${settings.paymentsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Booking Advance Charge Percentage Control */}
        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <Percent size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-base">Booking Advance Charge (%)</p>
                <p className="text-xs text-gray-500">
                  Percentage of cumulative service total collected as booking deposit on Razorpay.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm font-extrabold text-lg text-brand-primary">
              <span>{settings.bookingFeePercentage || 5}%</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-4">
            <input 
              type="range"
              min="1"
              max="50"
              step="1"
              value={settings.bookingFeePercentage || 5}
              onChange={e => setSettings({ ...settings, bookingFeePercentage: Number(e.target.value) })}
              className="w-full accent-brand-primary cursor-pointer h-2 bg-gray-200 rounded-lg"
            />
            <input 
              type="number"
              min="1"
              max="100"
              value={settings.bookingFeePercentage || 5}
              onChange={e => setSettings({ ...settings, bookingFeePercentage: Number(e.target.value) })}
              className="w-20 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold text-center outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="button"
            onClick={handleSave} 
            disabled={saving}
            className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-brand-primary-dark transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Global Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
