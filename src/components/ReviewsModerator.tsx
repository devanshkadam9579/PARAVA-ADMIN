import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { Star, Eye, EyeOff } from 'lucide-react';

export default function ReviewsModerator() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, 'reviews'), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setReviews(list);
    });
    return unsub;
  }, []);

  const handleToggleHide = async (reviewId: string, currentHidden: boolean) => {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'reviews', reviewId), {
        hidden: !currentHidden,
        moderatedAt: new Date().toISOString()
      });
    } catch (e: any) {
      alert('Moderation update failed: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Reviews Moderation</h1>
        <p className="text-xs text-gray-500 mt-0.5">Moderate customer reviews and feedback submitted on completed celebration bookings</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-2">
          <Star size={36} className="mx-auto text-amber-400" />
          <h4 className="font-extrabold text-sm text-gray-900">No customer reviews submitted yet</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{r.rating} / 5</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHide(r.id, r.hidden)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  {r.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{r.hidden ? 'Restore' : 'Hide'}</span>
                </button>
              </div>

              <p className="text-xs text-gray-700 italic">"{r.comment}"</p>
              <p className="text-[11px] text-gray-400">By {r.customerName || 'Client'} • {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
