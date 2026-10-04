import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, CheckCircle, Ban, Plus, Search, Trash2, Download } from 'lucide-react';
import { authenticatedFetch, BACKEND_API_URL } from '../lib/apiClient';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import Papa from 'papaparse';

const DEFAULT_OPERATIONAL_CITIES = [
  'Kolhapur',
  'Pune',
  'Nagpur',
  'Nashik',
  'Mumbai',
  'Delhi NCR',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'Ahmedabad',
  'Lucknow',
  'Satara',
  'Sangli'
];

export default function CitiesManager() {
  const [cityList, setCityList] = useState<string[]>(DEFAULT_OPERATIONAL_CITIES);
  const [blockedCities, setBlockedCities] = useState<string[]>([]);
  const [newCityName, setNewCityName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const db = getDb();
    if (!db) return;

    // Listen to settings/cities for real-time reactivity
    const unsub = onSnapshot(doc(db, 'settings', 'cities'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.operationalCities) && data.operationalCities.length > 0) {
          setCityList(data.operationalCities);
        }
        if (Array.isArray(data.blockedCities)) {
          setBlockedCities(data.blockedCities);
        }
      }
    }, (err) => {
      console.warn("Firestore cities onSnapshot note:", err);
      fetchCities();
    });

    return () => unsub();
  }, []);

  const fetchCities = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/cities`);
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.operationalCities) && data.operationalCities.length > 0) {
          setCityList(data.operationalCities);
        }
        if (Array.isArray(data.blockedCities)) {
          setBlockedCities(data.blockedCities);
        }
      }
    } catch (e) {
      console.error("Error fetching city settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCitiesState = async (updatedOperational: string[], updatedBlocked: string[]) => {
    setIsSaving(true);
    try {
      // 1. Direct Firestore write
      const db = getDb();
      if (db) {
        await setDoc(doc(db, 'settings', 'cities'), {
          operationalCities: updatedOperational,
          blockedCities: updatedBlocked,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 2. Dual-write to backend Admin API
      try {
        await authenticatedFetch(`${BACKEND_API_URL}/api/admin/cities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            operationalCities: updatedOperational,
            blockedCities: updatedBlocked 
          })
        });
      } catch (beErr) {
        console.warn("Backend cities save note:", beErr);
      }

      setCityList(updatedOperational);
      setBlockedCities(updatedBlocked);
      setNotification('City availability and operational market saved successfully.');
    } catch (err: any) {
      setNotification(`Failed to update city status: ${err.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const toggleCityStatus = (city: string) => {
    const isCurrentlyBlocked = blockedCities.includes(city);
    const updatedBlocked = isCurrentlyBlocked
      ? blockedCities.filter(c => c !== city)
      : [...blockedCities, city];
    saveCitiesState(cityList, updatedBlocked);
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newCityName.trim();
    if (!formatted) return;

    if (!cityList.some(c => c.toLowerCase() === formatted.toLowerCase())) {
      const updatedOperational = [...cityList, formatted];
      await saveCitiesState(updatedOperational, blockedCities);
      setNotification(`Added "${formatted}" to operational platform cities.`);
    } else {
      setNotification(`City "${formatted}" already exists.`);
    }
    setNewCityName('');
  };

  const handleRemoveCity = async (cityToRemove: string) => {
    if (!window.confirm(`Remove "${cityToRemove}" completely from operational platform cities?`)) return;
    const updatedOperational = cityList.filter(c => c !== cityToRemove);
    const updatedBlocked = blockedCities.filter(c => c !== cityToRemove);
    await saveCitiesState(updatedOperational, updatedBlocked);
    setNotification(`Removed "${cityToRemove}" from platform.`);
  };

  const handleExportCSV = () => {
    if (cityList.length === 0) {
      alert('No cities available to export.');
      return;
    }

    const csvData = cityList.map(c => ({
      'City Name': c,
      'Market Status': blockedCities.includes(c) ? 'DISABLED' : 'ACTIVE',
      'Operational': 'Yes'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_operational_cities_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCities = cityList.filter(c =>
    c.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <MapPin size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">City Operations & Operational Markets</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Authoritative City Roster synchronized with Customer Explorer & Vendor App ({cityList.length} total)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCities}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs border border-gray-200 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download CSV report of operational cities"
          >
            <Download size={14} />
            <span>Extract CSV</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {notification}
        </div>
      )}

      {/* City Controls and Add Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search operational city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
              />
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle size={14} /> Active ({cityList.length - blockedCities.length})
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <Ban size={14} /> Disabled ({blockedCities.length})
              </span>
            </div>
          </div>

          {/* Cities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {filteredCities.map((city) => {
              const isBlocked = blockedCities.includes(city);
              return (
                <div
                  key={city}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isBlocked
                      ? 'bg-rose-50/50 border-rose-100 text-rose-900'
                      : 'bg-gray-50 border-gray-200/70 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCityStatus(city)}
                      disabled={isSaving}
                      className="cursor-pointer"
                      title={isBlocked ? "Enable city" : "Disable city"}
                    >
                      {isBlocked ? (
                        <Ban size={16} className="text-rose-500" />
                      ) : (
                        <CheckCircle size={16} className="text-emerald-600" />
                      )}
                    </button>
                    <span className="font-bold text-xs">{city}</span>
                  </div>

                  <button
                    onClick={() => handleRemoveCity(city)}
                    disabled={isSaving}
                    className="text-gray-400 hover:text-rose-600 transition p-1 cursor-pointer"
                    title="Remove from platform"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add City Column */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-2">Add Operational Territory</h3>
            <p className="text-xs text-gray-500 mb-4">
              Add new cities to expand Parva platform coverage. Changes immediately reflect across Customer & Vendor apps.
            </p>

            <form onSubmit={handleAddCity} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">City Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surat, Solapur"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:bg-white focus:border-brand-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving || !newCityName.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isSaving ? 'Saving...' : 'Add City'}</span>
              </button>
            </form>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60 mt-4 text-[11px] text-amber-800 leading-relaxed font-medium">
            💡 <strong>Note:</strong> Disabling a city hides it from customer location selectors without breaking active bookings.
          </div>
        </div>
      </div>
    </div>
  );
}
