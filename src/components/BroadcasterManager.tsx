import React, { useState } from 'react';
import { Radio, Send } from 'lucide-react';
import CloudinaryImageUploader from './CloudinaryImageUploader';

const BACKEND_API_URL = 'https://parava-backend-1.onrender.com';

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
      const res = await fetch(`${BACKEND_API_URL}/api/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          imageUrl: imageUrl.trim() || null,
          actionText: actionText.trim() || 'Explore Now'
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedback('Live notification broadcasted successfully to all active user devices.');
        setTitle('');
        setMessage('');
        setImageUrl('');
      } else {
        setFeedback(`Failed to broadcast: ${data.error}`);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex items-center justify-between">
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
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Broadcast Form */}
      <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xs max-w-2xl">
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
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 uppercase tracking-wider mt-4"
          >
            <Send size={15} />
            <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Live Notification to All Users'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
