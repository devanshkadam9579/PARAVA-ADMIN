import React, { useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { getDb } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import CloudinaryImageUploader from './CloudinaryImageUploader';

export default function BroadcasterManager() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'offer' | 'slot' | 'system' | 'update'>('offer');
  const [imageUrl, setImageUrl] = useState('');
  const [actionText, setActionText] = useState('Explore Now');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsBroadcasting(true);
    try {
      const db = getDb();
      await addDoc(collection(db, 'broadcast_notifications'), {
        title: title.trim(),
        message: message.trim(),
        type,
        imageUrl: imageUrl.trim() || null,
        actionText: actionText.trim() || 'Explore Now',
        createdAt: serverTimestamp()
      });

      setFeedback('🚀 Live notification broadcasted successfully to all users!');
      setTitle('');
      setMessage('');
      setImageUrl('');
    } catch (err: any) {
      setFeedback(`❌ Failed to broadcast: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Broadcast Push & Live Pop-up Alerts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Send instant real-time banners & offers with photos/videos to all active user devices</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Broadcast Form */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs max-w-2xl">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Notification Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. 🎉 Grand Kolhapur Offer: Flat 20% OFF on Halls!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Notification Message / Description *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Book your wedding or reception hall this weekend and unlock free stage flower decoration worth ₹20,000. Limited slots available!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Notification Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
              >
                <option value="offer">🎉 Exclusive Offer / Discount</option>
                <option value="slot">📅 Calendar Slot Alert</option>
                <option value="system">🛡️ System / Security Update</option>
                <option value="update">✨ New Feature Announcement</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Action Button Text</label>
              <input
                type="text"
                placeholder="e.g. View Offer / Book Slot"
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
              >
              </input>
            </div>
          </div>

          {/* Cloudinary Photo / Video Uploader for Push Alert */}
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
            className="w-full bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 uppercase tracking-wider mt-4"
          >
            <Send size={16} />
            <span>{isBroadcasting ? 'Broadcasting to All Phones...' : '🚀 Broadcast Live Pop-up to All Users'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
