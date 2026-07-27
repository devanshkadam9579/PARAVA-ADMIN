import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { CreditCard, Save } from 'lucide-react';

export default function SettingsManager() {
  const [settings, setSettings] = useState<any>({ paymentsEnabled: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });
    return unsub;
  }, []);

  const handleTogglePayments = () => {
    setSettings((prev: any) => ({ ...prev, paymentsEnabled: !prev.paymentsEnabled }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = getDb();
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
      alert('Global settings saved successfully!');
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Global Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure platform-wide rules and behaviors.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Financial Controls</h3>
        
        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${settings.paymentsEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              <CreditCard size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">Razorpay Payments Gateway</p>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                If disabled, the frontend will bypass the payment screen and treat all bookings as free or pay-later.
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleTogglePayments}
            className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${settings.paymentsEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform ${settings.paymentsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
          <button 
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
