import React, { useState, useEffect } from 'react';
import { Radio, Send, Download, Clock, Image as ImageIcon } from 'lucide-react';
import CloudinaryImageUploader from './CloudinaryImageUploader';
import { authenticatedFetch } from '../lib/apiClient';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import Papa from 'papaparse';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export default function BroadcasterManager() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'offer' | 'slot' | 'system' | 'update'>('offer');
  const [imageUrl, setImageUrl] = useState('');
  const [actionText, setActionText] = useState('Explore Now');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'broadcast_notifications'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
      setBroadcasts(list);
    });
    return unsub;
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsBroadcasting(true);
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    const cleanActionText = actionText.trim() || 'Explore Now';
    const cleanImageUrl = imageUrl.trim() || null;

    try {
      // 1. Direct Firestore write
      const db = getDb();
      if (db) {
        await addDoc(collection(db, 'broadcast_notifications'), {
          title: cleanTitle,
          message: cleanMessage,
          type,
          imageUrl: cleanImageUrl,
          actionText: cleanActionText,
          createdAt: serverTimestamp(),
          createdDateString: new Date().toISOString()
        });
      }

      // 2. Dual-call backend API
      try {
        await authenticatedFetch(`${BACKEND_API_URL}/api/admin/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            message: cleanMessage,
            type,
            imageUrl: cleanImageUrl,
            actionText: cleanActionText
          })
        });
      } catch (beErr) {
        console.warn("Backend broadcast push note:", beErr);
      }

      setFeedback('Live notification broadcasted successfully to all active user devices.');
      setTitle('');
      setMessage('');
      setImageUrl('');
    } catch (err: any) {
      setFeedback(`Error broadcasting: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleExportCSV = () => {
    if (broadcasts.length === 0) {
      alert('No broadcast history available to export.');
      return;
    }

    const csvData = broadcasts.map(b => ({
      'Broadcast ID': b.id,
      'Title': b.title || '',
      'Message': b.message || '',
      'Type': b.type || 'offer',
      'Action Button': b.actionText || '',
      'Banner Image': b.imageUrl || '',
      'Timestamp': b.createdDateString || (b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : '')
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_broadcast_notifications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Radio size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Broadcast Push & In-App Pop-up Alerts</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Send real-time alerts, announcements, and promotional banners with media to all active user screens
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
          title="Download CSV report of broadcast history"
        >
          <Download size={14} />
          <span>Extract CSV</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Compose Live Broadcast</h3>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Notification Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Grand Kolhapur Offer: Flat 20% OFF on Halls"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Notification Message / Details *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Book your wedding or reception hall this weekend and unlock complimentary stage decoration. Limited slots available."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Notification Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
                >
                  <option value="offer">Special Offer / Promotion</option>
                  <option value="slot">Calendar Booking Alert</option>
                  <option value="system">System / Maintenance Notice</option>
                  <option value="update">New Feature Announcement</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Action Button Label</label>
                <input
                  type="text"
                  placeholder="e.g. Explore Now, View Offer"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
                />
              </div>
            </div>

            {/* Cloudinary Photo / Video Uploader */}
            <div className="pt-2">
              <CloudinaryImageUploader
                label="Attach Photo or Video Banner (Camera / Gallery)"
                currentImageUrl={imageUrl}
                onImageUploaded={(url) => setImageUrl(url)}
              />
            </div>

            <button
              type="submit"
              disabled={isBroadcasting || !title.trim() || !message.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 uppercase tracking-wider mt-4 cursor-pointer"
            >
              <Send size={15} />
              <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Live Notification to All Users'}</span>
            </button>
          </form>
        </div>

        {/* Broadcast History */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Recent Broadcasts Log ({broadcasts.length})</h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Live Sync</span>
            </div>

            {broadcasts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">No notifications broadcasted yet.</div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {broadcasts.slice(0, 10).map((b) => (
                  <div key={b.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-brand-primary bg-brand-primary-light px-2 py-0.5 rounded-md">
                        {b.type || 'offer'}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {b.createdDateString ? new Date(b.createdDateString).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-gray-900">{b.title}</h4>
                    <p className="text-[11px] text-gray-600 line-clamp-2">{b.message}</p>
                    {b.imageUrl && (
                      <div className="flex items-center gap-1 text-[10px] text-brand-primary font-bold pt-1">
                        <ImageIcon size={11} /> <span>Media banner attached</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 mt-4 font-medium">
            📡 Notifications appear dynamically across logged-in customer devices and vendor apps.
          </div>
        </div>
      </div>
    </div>
  );
}
