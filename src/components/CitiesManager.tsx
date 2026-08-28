import { useState, useEffect } from 'react';
import { getDb } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { MapPin, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function CitiesManager() {
  const [cities, setCities] = useState<any[]>([]);
  const [newCityName, setNewCityName] = useState('');

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'cities'), (snap) => {
      setCities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    const cityId = newCityName.trim();
    
    try {
      const db = getDb();
      await setDoc(doc(db, 'cities', cityId), {
        name: cityId,
        active: true
      });
      setNewCityName('');
    } catch (e) {
      console.error(e);
      alert('Error adding city');
    }
  };

  const handleToggle = async (city: any) => {
    try {
      const db = getDb();
      await setDoc(doc(db, 'cities', city.id), {
        ...city,
        active: !city.active
      });
    } catch (e) {
      console.error(e);
      alert('Error toggling city status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete city "${id}"?`)) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'cities', id));
    } catch (e) {
      console.error(e);
      alert('Error deleting city');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
          <MapPin size={24} className="text-brand-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-brand-text tracking-tight">Active Cities</h1>
          <p className="text-sm text-brand-text-secondary mt-1">Manage locations where PARVA is operational.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-brand-primary/5 border border-brand-border">
        <form onSubmit={handleAdd} className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Enter new city name (e.g. Kolhapur)..."
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm outline-none focus:border-brand-primary transition-colors"
          />
          <button
            type="submit"
            className="bg-brand-primary text-white px-8 py-4 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-brand-primary-dark transition-colors shadow-lg shadow-brand-primary/20"
          >
            <Plus size={18} /> Add City
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cities.map((city) => (
            <div key={city.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${city.active ? 'bg-brand-success' : 'bg-red-400'}`} />
                <div>
                  <h3 className="font-bold text-gray-800">{city.name}</h3>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {city.active ? 'Live on App' : 'Blocked'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(city)}
                  className={`p-2 rounded-xl transition-colors ${city.active ? 'text-brand-success hover:bg-brand-success/10' : 'text-gray-400 hover:bg-gray-200'}`}
                  title={city.active ? 'Deactivate' : 'Activate'}
                >
                  {city.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => handleDelete(city.id)}
                  className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete City"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {cities.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-400 text-sm">
              No cities added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
