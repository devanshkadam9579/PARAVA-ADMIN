import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Save, CreditCard, CheckCircle2, Image as ImageIcon, 
  Upload, RotateCcw, Check, Copy, AlertCircle, ExternalLink, Sparkles, Loader2, Link as LinkIcon
} from 'lucide-react';
import { getDb } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { authenticatedFetch, BACKEND_API_URL } from '../lib/apiClient';

export interface SettingsManagerProps {
  initialTab?: 'policies' | 'branding';
}

export const OFFICIAL_DEFAULT_LOGO = 'https://res.cloudinary.com/k03rmhkg/image/upload/v1792254596/parva_branding/myparva_official_logo.png';

export default function SettingsManager({ initialTab = 'policies' }: SettingsManagerProps = {}) {
  const [activeTab, setActiveTab] = useState<'policies' | 'branding'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Policies state
  const [commissionPct, setCommissionPct] = useState<number>(10);
  const [bookingFeePct, setBookingFeePct] = useState<number>(5);
  const [fixedFee, setFixedFee] = useState<number>(0);
  const [supportEmail, setSupportEmail] = useState('support@parva.com');
  const [termsVersion, setTermsVersion] = useState('1.2');
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Centralized Branding / Logo state
  const [publishedLogoUrl, setPublishedLogoUrl] = useState<string>(OFFICIAL_DEFAULT_LOGO);
  const [publishedLogoUpdatedAt, setPublishedLogoUpdatedAt] = useState<string | null>(null);
  const [publishedLogoUpdatedBy, setPublishedLogoUpdatedBy] = useState<string | null>(null);
  const [previousLogoUrl, setPreviousLogoUrl] = useState<string | null>(null);
  const [logoAltText, setLogoAltText] = useState<string>('myparva.com - Celebration Marketplace');

  // Staged / Unpublished logo state
  const [stagedLogoUrl, setStagedLogoUrl] = useState<string | null>(null);
  const [stagedAltText, setStagedAltText] = useState<string>('myparva.com - Celebration Marketplace');
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPublishingLogo, setIsPublishingLogo] = useState(false);
  const [isCopiedLogoUrl, setIsCopiedLogoUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const db = getDb();
    if (!db) return;

    // Real-time synchronization with settings/global
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.commissionPercentage !== undefined) setCommissionPct(Number(d.commissionPercentage));
        if (d.bookingFeePercentage !== undefined) setBookingFeePct(Number(d.bookingFeePercentage));
        if (d.fixedCommissionFee !== undefined) setFixedFee(Number(d.fixedCommissionFee));
        if (d.supportEmail) setSupportEmail(d.supportEmail);
        if (d.termsVersion) setTermsVersion(d.termsVersion);
        if (d.paymentsEnabled !== undefined) setPaymentsEnabled(Boolean(d.paymentsEnabled));

        // Branding
        if (d.logoUrl) setPublishedLogoUrl(d.logoUrl);
        if (d.logoUpdatedAt) setPublishedLogoUpdatedAt(d.logoUpdatedAt);
        if (d.logoUpdatedBy) setPublishedLogoUpdatedBy(d.logoUpdatedBy);
        if (d.previousLogoUrl) setPreviousLogoUrl(d.previousLogoUrl);
        if (d.logoAltText) {
          setLogoAltText(d.logoAltText);
          if (!stagedLogoUrl) setStagedAltText(d.logoAltText);
        }
      }
    }, (error) => {
      console.warn('[SettingsManager] Real-time listener note:', error.message);
    });

    return unsub;
  }, [stagedLogoUrl]);

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);

    const payload = {
      commissionPercentage: Number(commissionPct),
      bookingFeePercentage: Number(bookingFeePct),
      fixedCommissionFee: Number(fixedFee),
      supportEmail: supportEmail.trim(),
      termsVersion: termsVersion.trim(),
      paymentsEnabled: Boolean(paymentsEnabled),
      updatedAt: new Date().toISOString()
    };

    let clientSaved = false;
    let backendSaved = false;
    let errorDetail = '';

    // 1. Direct Firestore write
    try {
      const db = getDb();
      if (db) {
        await setDoc(doc(db, 'settings', 'global'), payload, { merge: true });
        clientSaved = true;
      }
    } catch (clientErr: any) {
      console.warn('[SettingsManager] Client Firestore save notice:', clientErr?.message);
      errorDetail = clientErr?.message || '';
    }

    // 2. Authoritative Backend Admin SDK dual-write / fallback
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: 'global', data: payload })
      });
      const data = await res.json();
      if (data.success) {
        backendSaved = true;
      }
    } catch (backendErr: any) {
      console.warn('[SettingsManager] Backend Admin save notice:', backendErr?.message);
    }

    setIsSaving(false);

    if (clientSaved || backendSaved) {
      setNotification({
        message: `Platform Policies & Commission (${commissionPct}%) saved and published successfully!`,
        type: 'success'
      });
    } else {
      setNotification({
        message: `Failed to save settings: ${errorDetail || 'Check server connection and permissions'}`,
        type: 'error'
      });
    }

    setTimeout(() => setNotification(null), 5000);
  };

  // Logo File Selection & Cloudinary Upload
  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. Validate file format
    const validTypes = ['image/png', 'image/webp', 'image/svg+xml', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Supported formats: PNG, WebP, SVG, JPG.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed logo size is 2MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingLogo(true);
    setUploadProgress(25);

    try {
      // Convert file to base64 for Cloudinary upload
      const base64Data: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress(50);

      // Upload via backend authorized Cloudinary endpoint
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/upload/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          folder: 'parva_branding',
          resource_type: 'image'
        })
      });

      setUploadProgress(85);
      const data = await res.json();

      if (data.success && data.url) {
        setStagedLogoUrl(data.url);
        setUploadProgress(100);
        setNotification({
          message: 'New logo uploaded to storage! Review the preview below and click "Publish Logo Live" to apply it across all applications.',
          type: 'success'
        });
      } else {
        throw new Error(data.error || 'Upload failed on storage service');
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setUploadError(err.message || 'Failed to upload logo. Please check server configuration.');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Stage directly from URL input
  const handleStageFromUrl = (urlToStage?: string) => {
    const target = (urlToStage || customLogoUrlInput).trim();
    if (!target) return;
    if (!target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('/')) {
      setUploadError('Please enter a valid image URL starting with https:// or /');
      return;
    }
    setUploadError(null);
    setStagedLogoUrl(target);
    setCustomLogoUrlInput('');
    setNotification({
      message: 'Logo staged for review! Check the preview below and click "Publish Logo Live" to apply it.',
      type: 'success'
    });
  };

  // Publish Staged Logo Live
  const handlePublishLogo = async () => {
    if (!stagedLogoUrl) return;

    setIsPublishingLogo(true);
    setUploadError(null);

    try {
      const payload = {
        logoUrl: stagedLogoUrl,
        logoAltText: stagedAltText.trim() || 'myparva.com'
      };

      // 1. Authoritative Backend endpoint
      try {
        await authenticatedFetch(`${BACKEND_API_URL}/api/admin/branding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (beErr) {
        console.warn('Backend branding sync note:', beErr);
      }

      // 2. Direct Firestore write
      const db = getDb();
      if (db) {
        await setDoc(doc(db, 'settings', 'global'), {
          logoUrl: stagedLogoUrl,
          logoAltText: stagedAltText.trim() || 'myparva.com',
          logoUpdatedAt: new Date().toISOString(),
          previousLogoUrl: publishedLogoUrl !== stagedLogoUrl ? publishedLogoUrl : previousLogoUrl
        }, { merge: true });
      }

      setPublishedLogoUrl(stagedLogoUrl);
      setPreviousLogoUrl(publishedLogoUrl !== stagedLogoUrl ? publishedLogoUrl : previousLogoUrl);
      setPublishedLogoUpdatedAt(new Date().toISOString());
      setLogoAltText(stagedAltText);
      setStagedLogoUrl(null);

      setNotification({
        message: 'Primary Logo Published Live! Customer frontend, vendor portal, and admin navigation are now updated.',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Publish Logo Error:', err);
      setUploadError(err.message || 'Failed to publish logo.');
    } finally {
      setIsPublishingLogo(false);
    }
  };

  // Rollback to Previous Logo
  const handleRollbackLogo = async () => {
    if (!previousLogoUrl) return;
    if (!window.confirm('Are you sure you want to rollback to the previous published logo?')) return;

    setIsPublishingLogo(true);
    try {
      const db = getDb();
      if (db) {
        await setDoc(doc(db, 'settings', 'global'), {
          logoUrl: previousLogoUrl,
          logoAltText: logoAltText,
          logoUpdatedAt: new Date().toISOString(),
          previousLogoUrl: publishedLogoUrl
        }, { merge: true });
      }

      try {
        await authenticatedFetch(`${BACKEND_API_URL}/api/admin/branding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logoUrl: previousLogoUrl,
            logoAltText: logoAltText
          })
        });
      } catch (_) {}

      setPreviousLogoUrl(publishedLogoUrl);
      setPublishedLogoUrl(previousLogoUrl);
      setStagedLogoUrl(null);
      setNotification({
        message: 'Rolled back to previous logo successfully!',
        type: 'success'
      });
    } catch (err: any) {
      setUploadError('Rollback failed: ' + err.message);
    } finally {
      setIsPublishingLogo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#EC003F] flex items-center justify-center font-bold">
            {activeTab === 'branding' ? <ImageIcon size={24} /> : <Settings size={24} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {activeTab === 'branding' ? 'Website Logo & Branding Manager' : 'Platform Policies & Gateway'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeTab === 'branding' 
                ? 'Update Parva primary logo live across customer website, vendor portal, and headers anytime'
                : 'Manage marketplace commissions, payment rules, and platform configuration'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl border border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'branding'
                ? 'bg-white text-[#EC003F] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ImageIcon size={14} />
            <span>Website Logo & Branding</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Policies & Fees
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in ${
          notification.type === 'success' ? 'bg-emerald-900 text-white' : 'bg-rose-900 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : null}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TAB 1: POLICIES & FEES */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs space-y-5">
          {/* Payment Gateway Switch */}
          <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-600" />
                <span>Online Payment Gateway (Cashfree) Mode</span>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {paymentsEnabled 
                  ? "Active: Users pay 5% advance fee + GST via Cashfree PG to lock date" 
                  : "Direct Mode: Users confirm booking directly without online payment requirement"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentsEnabled(!paymentsEnabled)}
              className={`px-4 py-2 rounded-xl font-black text-xs transition active:scale-95 uppercase tracking-wider cursor-pointer ${
                paymentsEnabled 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {paymentsEnabled ? '✓ ENABLED' : '✕ DISABLED (DIRECT)'}
            </button>
          </div>

          {/* Commission & Advance Booking Fee Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Platform Commission Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={50}
                  required
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Default is 10% on gross booking value</span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Advance Date-Lock Fee Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={bookingFeePct}
                  onChange={(e) => setBookingFeePct(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Advance customer pays to lock booking (default 5%)</span>
            </div>
          </div>

          {/* Fixed Fee & Support Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Fixed Service Fee (₹)</label>
              <input
                type="number"
                min={0}
                value={fixedFee}
                onChange={(e) => setFixedFee(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Additional fixed fee per booking</span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Official Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Legal Terms Version */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Legal Terms Version</label>
            <input
              type="text"
              value={termsVersion}
              onChange={(e) => setTermsVersion(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 uppercase tracking-wider mt-4 cursor-pointer"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving & Publishing Settings...' : 'SAVE & PUBLISH PLATFORM POLICIES'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: CENTRALIZED BRANDING & LOGO MANAGEMENT */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {/* Card 1: Current Published Logo */}
          <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
                  Currently Published Primary Logo
                </h3>
              </div>
              {publishedLogoUpdatedAt && (
                <span className="text-[11px] text-gray-500 font-medium">
                  Last Updated: {new Date(publishedLogoUpdatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{publishedLogoUpdatedBy ? ` by ${publishedLogoUpdatedBy}` : ''}
                </span>
              )}
            </div>

            {/* Logo Preview Boxes: Light & Dark Surfaces */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light surface */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200/80 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Light Header Surface</span>
                <div className="h-16 flex items-center justify-center py-2">
                  <img
                    src={publishedLogoUrl}
                    alt={logoAltText}
                    className="max-h-12 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/parva-logo.png';
                    }}
                  />
                </div>
                <span className="text-[11px] text-gray-500 font-mono truncate max-w-[280px]">
                  {publishedLogoUrl}
                </span>
              </div>

              {/* Dark surface */}
              <div className="bg-[#0f172a] rounded-2xl p-6 border border-gray-800 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Dark Footer / Hero Surface</span>
                <div className="h-16 flex items-center justify-center py-2">
                  <img
                    src={publishedLogoUrl}
                    alt={logoAltText}
                    className="max-h-12 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/parva-logo.png';
                    }}
                  />
                </div>
                <span className="text-[11px] text-gray-400 font-medium">
                  Alt text: "{logoAltText}"
                </span>
              </div>
            </div>

            {/* Published Logo Metadata & Rollback */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publishedLogoUrl);
                    setIsCopiedLogoUrl(true);
                    setTimeout(() => setIsCopiedLogoUrl(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  {isCopiedLogoUrl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{isCopiedLogoUrl ? 'Copied URL!' : 'Copy Asset URL'}</span>
                </button>

                <a
                  href={publishedLogoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  <ExternalLink size={13} />
                  <span>Open Full Asset</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick set official logo button */}
                {publishedLogoUrl !== OFFICIAL_DEFAULT_LOGO && (
                  <button
                    type="button"
                    onClick={() => handleStageFromUrl(OFFICIAL_DEFAULT_LOGO)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#EC003F] border border-rose-200 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>Apply Official myparva.com Logo</span>
                  </button>
                )}

                {/* Rollback button if previous logo available */}
                {previousLogoUrl && previousLogoUrl !== publishedLogoUrl && (
                  <button
                    type="button"
                    onClick={handleRollbackLogo}
                    disabled={isPublishingLogo}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Restore Previous Logo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Upload New Logo & Staged Preview */}
          <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-xs space-y-5">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Change Logo Panel</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload a new image file or paste an image URL below. You can preview changes before publishing live.
              </p>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Drop / Upload Box */}
            <div className="border-2 border-dashed border-gray-200 hover:border-[#EC003F] rounded-2xl p-6 text-center transition bg-gray-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.webp,.svg,.jpg,.jpeg,image/png,image/webp,image/svg+xml,image/jpeg"
                onChange={handleLogoFileSelect}
                className="hidden"
                id="logo-upload-input"
              />
              <label
                htmlFor="logo-upload-input"
                className="flex flex-col items-center justify-center cursor-pointer space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#EC003F] flex items-center justify-center shadow-xs">
                  {isUploadingLogo ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Upload size={22} />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-900">
                    {isUploadingLogo ? 'Uploading logo to storage...' : 'Click to select a logo file, or drag and drop'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    PNG, WebP, SVG or JPG • Recommended size: 400x100px or transparent landscape (Max 2MB)
                  </p>
                </div>
              </label>

              {/* Upload Progress Bar */}
              {isUploadingLogo && (
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EC003F] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Uploading... {uploadProgress}%</span>
                </div>
              )}
            </div>

            {/* Alternative: Paste Image URL Directly */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
              <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                <LinkIcon size={14} className="text-gray-500" />
                <span>Or Paste Image URL Directly</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/... or https://..."
                  value={customLogoUrlInput}
                  onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#EC003F]"
                />
                <button
                  type="button"
                  onClick={() => handleStageFromUrl()}
                  disabled={!customLogoUrlInput.trim()}
                  className="px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-40 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Preview & Stage
                </button>
              </div>
            </div>

            {/* Staged Logo Review Card (Shows when new logo uploaded or staged and not yet published) */}
            {stagedLogoUrl && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-600" />
                    <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider">
                      Staged Preview (Unpublished)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    Ready to Publish
                  </span>
                </div>

                {/* Staged Image Preview Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-amber-200 flex flex-col items-center justify-center h-24">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Light Surface</span>
                    <img
                      src={stagedLogoUrl}
                      alt={stagedAltText}
                      className="max-h-12 w-auto object-contain"
                    />
                  </div>
                  <div className="bg-[#0f172a] rounded-xl p-4 border border-gray-800 flex flex-col items-center justify-center h-24">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Dark Surface</span>
                    <img
                      src={stagedLogoUrl}
                      alt={stagedAltText}
                      className="max-h-12 w-auto object-contain"
                    />
                  </div>
                </div>

                {/* Alt Text Input */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Accessible Alt Text (e.g. "myparva.com - Celebration Marketplace")
                  </label>
                  <input
                    type="text"
                    value={stagedAltText}
                    onChange={(e) => setStagedAltText(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 outline-none focus:border-[#EC003F]"
                    placeholder="myparva.com - Celebration Marketplace"
                  />
                </div>

                {/* Publish & Discard Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStagedLogoUrl(null);
                      setUploadError(null);
                    }}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="button"
                    disabled={isPublishingLogo}
                    onClick={handlePublishLogo}
                    className="px-5 py-2.5 bg-[#EC003F] hover:bg-[#D40038] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    {isPublishingLogo ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Publishing Everywhere...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>PUBLISH LOGO LIVE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
