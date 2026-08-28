import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, CheckCircle, Ban, Plus, Search } from 'lucide-react';

const BACKEND_API_URL = 'https://parava-backend-1.onrender.com';

const ALL_FRONTEND_CITIES = [
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
  const [cityList, setCityList] = useState<string[]>(ALL_FRONTEND_CITIES);
  const [blockedCities, setBlockedCities] = useState<string[]>([]);
  const [newCityName, setNewCityName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchCities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/cities`);
      const data = await res.json();
      if (data.success && Array.isArray(data.blockedCities)) {
        setBlockedCities(data.blockedCities);
      }
    } catch (e) {
      console.error("Error fetching city settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const saveBlockedCities = async (updatedBlocked: string[]) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedCities: updatedBlocked })
      });
      const data = await res.json();
      if (data.success) {
        setBlockedCities(updatedBlocked);
        setNotification('City availability status updated successfully.');
      }
    } catch (err: any) {
      setNotification(`Failed to update city status: ${err.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const toggleCityStatus = (city: string) => {
    const isCurrentlyBlocked = blockedCities.includes(city);
    const updated = isCurrentlyBlocked
      ? blockedCities.filter(c => c !== city)
      : [...blockedCities, city];
    saveBlockedCities(updated);
  };

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newCityName.trim();
    if (!formatted) return;
    if (!cityList.includes(formatted)) {
      setCityList(prev => [...prev, formatted]);
      setNotification(`Added ${formatted} to operational cities.`);
    }
    setNewCityName('');
    setTimeout(() => setNotification(null), 3000);
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
            <h2 className="text-xl font-bold text-gray-900">City Operations & Operational Availability</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage operational status for all cities listed on the customer app ({cityList.length} total)
            </p>
          </div>
        </div>

        <button
          onClick={fetchCities}
          disabled={isLoading}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs border border-gray-200 transition active:scale-95"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
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
                <Ban size={14} /> Inactive ({blockedCities.length})
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
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                    isBlocked
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs">{city}</h4>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block mt-0.5 ${
                      isBlocked ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {isBlocked ? 'Disabled on App' : 'Active & Operational'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => toggleCityStatus(city)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition active:scale-95 border ${
                      isBlocked
                        ? 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    {isBlocked ? 'Enable' : 'Disable'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Custom City Form */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 h-fit">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Add New Market / City</h3>
            <p className="text-xs text-gray-500 mt-0.5">Expand service availability to new cities</p>
          </div>

          <form onSubmit={handleAddCity} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">City Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Surat, Indore, Goa"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <Plus size={14} />
              <span>Add City to Platform</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
