import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Save, Image as ImageIcon, RotateCcw, 
  CheckCircle2, Layers 
} from 'lucide-react';
import { getDb } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { authenticatedFetch, BACKEND_API_URL } from '../lib/apiClient';
import CloudinaryImageUploader from './CloudinaryImageUploader';

interface HeroSlideData {
  id: string;
  category: string;
  image: string;
  badgeLabel: string;
  badgeIcon?: string;
}

const DEFAULT_SLIDES: HeroSlideData[] = [
  {
    id: 'caterer',
    category: 'Catering',
    image: '/hero/hero-caterer-clean.png',
    badgeLabel: 'Catering & Food',
    badgeIcon: 'chef'
  },
  {
    id: 'planner',
    category: 'Event Planners',
    image: '/hero/hero-planner-clean.png',
    badgeLabel: 'Event Planning',
    badgeIcon: 'calendar'
  },
  {
    id: 'dj',
    category: 'DJ & Sound',
    image: '/hero/hero-dj-clean.png',
    badgeLabel: 'DJ & Sound',
    badgeIcon: 'music'
  },
  {
    id: 'decorator',
    category: 'Decorators',
    image: '/hero/hero-decorator-clean.png',
    badgeLabel: 'Decorators',
    badgeIcon: 'palette'
  }
];

const DEFAULT_CONFIG = {
  badgeText: "India's Trusted Event Services Marketplace",
  titleLine1: "Plan less,",
  titleHighlight: "celebrate more.",
  subtitle: "Discover trusted vendors, services and experiences for your event.",
  trustPoint1: "Verified Vendors",
  trustPoint2: "Secure Booking",
  trustPoint3: "Best Prices",
  slides: DEFAULT_SLIDES
};

export default function HeroCmsManager() {
  const [badgeText, setBadgeText] = useState(DEFAULT_CONFIG.badgeText);
  const [titleLine1, setTitleLine1] = useState(DEFAULT_CONFIG.titleLine1);
  const [titleHighlight, setTitleHighlight] = useState(DEFAULT_CONFIG.titleHighlight);
  const [subtitle, setSubtitle] = useState(DEFAULT_CONFIG.subtitle);
  const [trustPoint1, setTrustPoint1] = useState(DEFAULT_CONFIG.trustPoint1);
  const [trustPoint2, setTrustPoint2] = useState(DEFAULT_CONFIG.trustPoint2);
  const [trustPoint3, setTrustPoint3] = useState(DEFAULT_CONFIG.trustPoint3);
  const [slides, setSlides] = useState<HeroSlideData[]>(DEFAULT_SLIDES);

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load existing hero settings from Firestore
  useEffect(() => {
    const db = getDb();
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'hero'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.badgeText) setBadgeText(d.badgeText);
        if (d.titleLine1) setTitleLine1(d.titleLine1);
        if (d.titleHighlight) setTitleHighlight(d.titleHighlight);
        if (d.subtitle) setSubtitle(d.subtitle);
        if (d.trustPoint1) setTrustPoint1(d.trustPoint1);
        if (d.trustPoint2) setTrustPoint2(d.trustPoint2);
        if (d.trustPoint3) setTrustPoint3(d.trustPoint3);
        if (Array.isArray(d.slides) && d.slides.length > 0) {
          setSlides(d.slides);
        }
      }
    });
    return unsub;
  }, []);

  const handleSlideChange = (index: number, field: keyof HeroSlideData, value: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    setSlides(updated);
  };

  const handleResetDefaults = () => {
    if (!window.confirm("Reset hero section copy and images to default template?")) return;
    setBadgeText(DEFAULT_CONFIG.badgeText);
    setTitleLine1(DEFAULT_CONFIG.titleLine1);
    setTitleHighlight(DEFAULT_CONFIG.titleHighlight);
    setSubtitle(DEFAULT_CONFIG.subtitle);
    setTrustPoint1(DEFAULT_CONFIG.trustPoint1);
    setTrustPoint2(DEFAULT_CONFIG.trustPoint2);
    setTrustPoint3(DEFAULT_CONFIG.trustPoint3);
    setSlides(DEFAULT_SLIDES);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      badgeText: badgeText.trim(),
      titleLine1: titleLine1.trim(),
      titleHighlight: titleHighlight.trim(),
      subtitle: subtitle.trim(),
      trustPoint1: trustPoint1.trim(),
      trustPoint2: trustPoint2.trim(),
      trustPoint3: trustPoint3.trim(),
      slides,
      updatedAt: new Date().toISOString()
    };

    let clientSaved = false;
    let backendSaved = false;
    let errorDetail = '';

    // 1. Direct Firestore write
    try {
      const db = getDb();
      if (db) {
        await setDoc(doc(db, 'settings', 'hero'), payload, { merge: true });
        clientSaved = true;
      }
    } catch (clientErr: any) {
      console.warn('[HeroCmsManager] Client Firestore save notice:', clientErr?.message);
      errorDetail = clientErr?.message || '';
    }

    // 2. Authoritative backend Admin SDK dual-write
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: 'hero', data: payload })
      });
      const data = await res.json();
      if (data.success) {
        backendSaved = true;
      }
    } catch (backendErr: any) {
      console.warn('[HeroCmsManager] Backend Admin save notice:', backendErr?.message);
    }

    setIsSaving(false);

    if (clientSaved || backendSaved) {
      setNotification({
        message: '✨ Hero Section CMS updated successfully! Changes reflect live on the website.',
        type: 'success'
      });
    } else {
      setNotification({
        message: `❌ Failed to save hero CMS: ${errorDetail || 'Check server connection and permissions'}`,
        type: 'error'
      });
    }

    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0B6B38] flex items-center justify-center font-bold">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Homepage Hero Section CMS</h2>
            <p className="text-xs text-gray-500 mt-0.5">Edit hero typography, trust badges, and PNG cutout showcases</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
        >
          <RotateCcw size={14} />
          <span>Restore Defaults</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in ${
          notification.type === 'success' ? 'bg-emerald-900 text-white' : 'bg-rose-900 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : null}
          <span>{notification.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Typography & Copy */}
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span>1. Headline & Copy</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Top Pill Badge Text
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={e => setBadgeText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#0B6B38] outline-none"
                placeholder="India's Trusted Event Services Marketplace"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Headline Line 1 (Dark Text)
              </label>
              <input
                type="text"
                value={titleLine1}
                onChange={e => setTitleLine1(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:border-[#0B6B38] outline-none"
                placeholder="Plan less,"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Headline Highlight (Green Text)
              </label>
              <input
                type="text"
                value={titleHighlight}
                onChange={e => setTitleHighlight(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#0B6B38] focus:border-[#0B6B38] outline-none"
                placeholder="celebrate more."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#0B6B38] outline-none resize-none"
                placeholder="Discover trusted vendors, services and experiences for your event."
              />
            </div>
          </div>

          {/* Trust Points */}
          <div className="pt-2">
            <label className="text-xs font-bold text-gray-700 block mb-2">
              Trust Badges (Checkmarks)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={trustPoint1}
                onChange={e => setTrustPoint1(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#0B6B38] outline-none"
                placeholder="Verified Vendors"
              />
              <input
                type="text"
                value={trustPoint2}
                onChange={e => setTrustPoint2(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#0B6B38] outline-none"
                placeholder="Secure Booking"
              />
              <input
                type="text"
                value={trustPoint3}
                onChange={e => setTrustPoint3(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#0B6B38] outline-none"
                placeholder="Best Prices"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Cutout PNG Slides (4 Showcase Characters) */}
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-[#0B6B38]" />
                <span>2. Cutout PNG Character Slides ({slides.length})</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">High-res PNG images with transparent backgrounds displayed on the right of the Hero</p>
            </div>
          </div>

          <div className="space-y-4">
            {slides.map((slide, idx) => (
              <div key={slide.id || idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#0B6B38]">
                    Slide #{idx + 1}: {slide.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">PNG Cutout</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Thumbnail Preview */}
                  <div className="md:col-span-3 flex justify-center">
                    <div className="w-28 h-28 rounded-2xl bg-white border border-gray-200 p-2 flex items-center justify-center overflow-hidden shadow-xs">
                      {slide.image ? (
                        <img src={slide.image} alt={slide.category} className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon size={24} className="text-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Upload & Fields */}
                  <div className="md:col-span-9 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Category Name
                        </label>
                        <input
                          type="text"
                          value={slide.category}
                          onChange={e => handleSlideChange(idx, 'category', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold focus:border-[#0B6B38] outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Floating Badge Label
                        </label>
                        <input
                          type="text"
                          value={slide.badgeLabel}
                          onChange={e => handleSlideChange(idx, 'badgeLabel', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold focus:border-[#0B6B38] outline-none bg-white"
                        />
                      </div>
                    </div>

                    {/* Image Uploader */}
                    <CloudinaryImageUploader
                      label={`Upload PNG Cutout for ${slide.category}`}
                      currentImageUrl={slide.image}
                      folder="parva_hero"
                      allowVideo={false}
                      onImageUploaded={(url) => handleSlideChange(idx, 'image', url)}
                    />

                    <div>
                      <input
                        type="text"
                        value={slide.image}
                        onChange={e => handleSlideChange(idx, 'image', e.target.value)}
                        placeholder="Image URL (e.g. /hero/hero-caterer.png or Cloudinary URL)"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-mono text-gray-600 focus:border-[#0B6B38] outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#0B6B38] text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-md hover:bg-[#08522b] transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} />
            <span>{isSaving ? 'Publishing...' : 'Publish Hero Section Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
