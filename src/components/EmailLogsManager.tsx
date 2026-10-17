import { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  RefreshCw, 
  Send, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Key, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { authenticatedFetch, BACKEND_API_URL } from '../lib/apiClient';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import Papa from 'papaparse';

interface EmailLogItem {
  id: string;
  eventType?: string;
  bookingId?: string;
  recipient?: string;
  subject?: string;
  status?: 'queued' | 'accepted' | 'delivered' | 'bounced' | 'failed' | 'sent';
  resendId?: string;
  providerMessageId?: string;
  sentAt?: string;
  deliveredAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
  lastAttemptAt?: string;
  retryCount?: number;
}

interface EmailSettingsState {
  isConfigured: boolean;
  maskedKey: string | null;
  senderFrom: string;
  source: string;
  lastUpdatedAt?: string;
  updatedBy?: string;
}

export default function EmailLogsManager() {
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('devanshkadam2@gmail.com');
  const [testRole, setTestRole] = useState<'customer' | 'vendor' | 'admin'>('customer');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Email Settings & Dynamic API Key State
  const [emailSettings, setEmailSettings] = useState<EmailSettingsState | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Live Render Health State
  const [healthData, setHealthData] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

  useEffect(() => {
    fetchEmailSettings();
    runHealthCheck();

    const db = getDb();
    if (!db) {
      fetchLogs();
      return;
    }

    // Real-time listener on Firestore email_events
    try {
      const q = query(collection(db, 'email_events'), limit(100));
      const unsub = onSnapshot(q, (snap) => {
        const list: EmailLogItem[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as EmailLogItem));
        if (list.length > 0) {
          list.sort((a, b) => {
            const tA = new Date(a.updatedAt || a.lastAttemptAt || a.sentAt || a.createdAt || 0).getTime();
            const tB = new Date(b.updatedAt || b.lastAttemptAt || b.sentAt || b.createdAt || 0).getTime();
            return tB - tA;
          });
          setLogs(list);
          setIsLoading(false);
        } else {
          fetchLogs();
        }
      }, (err) => {
        console.warn("Firestore email logs listener note:", err);
        fetchLogs();
      });
      return () => unsub();
    } catch {
      fetchLogs();
    }
  }, []);

  const fetchEmailSettings = async () => {
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/email-settings`);
      const data = await res.json();
      if (data.success) {
        setEmailSettings(data);
      }
    } catch (e) {
      console.warn("Could not fetch email settings:", e);
    }
  };

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/email-health`);
      const data = await res.json();
      setHealthData(data);
    } catch (e: any) {
      setHealthData({
        healthy: false,
        isConfigured: false,
        error: e.message || 'Could not reach health check endpoint'
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/email-logs`);
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Error fetching email logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    const cleanKey = newApiKey.trim();
    if (!cleanKey.startsWith('re_') || cleanKey.length < 15) {
      alert('Please enter a valid Resend API key starting with "re_" (at least 15 characters).');
      return;
    }
    setIsSavingKey(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/email-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resendApiKey: cleanKey })
      });
      const data = await res.json();
      if (data.success) {
        setNotification('🎉 Resend API Key saved and activated successfully! Transactional emails are now operational.');
        setNewApiKey('');
        setShowKeyInput(false);
        fetchEmailSettings();
      } else {
        alert(data.error || 'Failed to update Resend API key');
      }
    } catch (err: any) {
      alert('Error updating API key: ' + err.message);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setIsSendingTest(true);
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, role: testRole })
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Test email (${testRole.toUpperCase()}) dispatched successfully to ${testEmail} via Resend.`);
        fetchLogs();
      } else {
        setNotification(`Failed to send test email: ${data.error || 'Check Resend credentials'}`);
      }
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setNotification(null), 4500);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingLogId(logId);
    try {
      const res = await authenticatedFetch(`${BACKEND_API_URL}/api/admin/email-logs/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId })
      });
      const data = await res.json();
      if (data.success) {
        setNotification('Retry email dispatched successfully via Resend.');
        fetchLogs();
      } else {
        setNotification(`Retry failed: ${data.error || 'Resend API rejected dispatch'}`);
      }
    } catch (err: any) {
      setNotification(`Failed to retry email: ${err.message}`);
    } finally {
      setRetryingLogId(null);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No email logs available to export.');
      return;
    }

    const csvData = filteredLogs.map(log => ({
      'Log ID': log.id,
      'Event Type': log.eventType || '',
      'Recipient': log.recipient || '',
      'Booking ID': log.bookingId || '',
      'Status': log.status || 'unknown',
      'Resend Message ID': log.resendId || log.providerMessageId || '',
      'Sent At': log.sentAt || '',
      'Delivered At': log.deliveredAt || '',
      'Bounced At': log.bouncedAt || '',
      'Bounce Reason': log.bounceReason || '',
      'Error': log.error || '',
      'Updated At': log.updatedAt || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parva_email_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Distinct event types for dropdown
  const uniqueEventTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.eventType) set.add(l.eventType);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRecipient = log.recipient?.toLowerCase().includes(q);
        const matchBooking = log.bookingId?.toLowerCase().includes(q);
        const matchEvent = log.eventType?.toLowerCase().includes(q);
        const matchResend = (log.resendId || log.providerMessageId)?.toLowerCase().includes(q);
        if (!matchRecipient && !matchBooking && !matchEvent && !matchResend) return false;
      }

      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'delivered' && log.status !== 'delivered') return false;
        if (statusFilter === 'accepted' && log.status !== 'accepted' && log.status !== 'sent') return false;
        if (statusFilter === 'failed' && log.status !== 'failed') return false;
        if (statusFilter === 'bounced' && log.status !== 'bounced') return false;
        if (statusFilter === 'queued' && log.status !== 'queued') return false;
      }

      // Event Type
      if (eventFilter !== 'all' && log.eventType !== eventFilter) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, statusFilter, eventFilter]);

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} />
            Delivered
          </span>
        );
      case 'accepted':
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200" title="Accepted by Resend for delivery">
            <Clock size={11} />
            Accepted
          </span>
        );
      case 'bounced':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={11} />
            Bounced
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={11} />
            Failed
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <Clock size={11} />
            Queued
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-200">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Mail size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transactional Email Automation Logs</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Authoritative audit trail of booking requests, payment confirmations, and vendor notifications via Resend
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs border border-gray-200 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh Logs</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download CSV report of email logs"
          >
            <Download size={14} />
            <span>Extract CSV</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white cursor-pointer ml-3">✕</button>
        </div>
      )}

      {/* Resend API Key Environment & Management Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Key size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Resend API Key & Environment Integration</h3>
              <p className="text-xs text-gray-500 mt-0.5">Configure or rotate your Resend API credentials for live email delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {emailSettings?.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck size={14} />
                <span>Active ({emailSettings.maskedKey || 'Configured'})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle size={14} />
                <span>API Key Not Configured</span>
              </span>
            )}

            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {showKeyInput ? 'Close' : 'Update Key'}
            </button>
          </div>
        </div>

        {showKeyInput && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Paste new key: re_1234567890abcdef..."
                className="flex-1 bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-gray-900 outline-none focus:border-brand-primary"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={isSavingKey || !newApiKey.trim()}
                className="bg-brand-primary hover:bg-brand-dark disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {isSavingKey ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
                <span>Save & Activate Key</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-500 pt-1">
              <span>
                Key will be securely saved to backend Firestore and used immediately without redeploying.
              </span>
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-primary font-bold hover:underline"
              >
                <span>Get API Key from Resend Dashboard</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        )}

        <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200/60 flex flex-wrap gap-4 items-center">
          <div>
            <span className="font-bold text-gray-700">Config Source:</span>{' '}
            <span className="font-mono text-gray-600">
              {emailSettings?.source === 'firestore_settings' ? 'Admin Portal (Firestore Settings)' : emailSettings?.source === 'environment_variable' ? 'Local / Render .env Variable' : 'Unconfigured'}
            </span>
          </div>
          <div>
            <span className="font-bold text-gray-700">Sender:</span>{' '}
            <span className="font-mono text-gray-600">{emailSettings?.senderFrom || 'PARVA Celebrations <notifications@myparva.com>'}</span>
          </div>
        </div>

        {/* Live Render Diagnostics & Verification Check */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">Render Connection Status:</span>
              {healthData?.healthy ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={12} />
                  Connected & Verified Live
                </span>
              ) : healthData ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle size={12} />
                  Not Connected
                </span>
              ) : (
                <span className="text-xs text-gray-500">Checking...</span>
              )}
            </div>

            {healthData && (
              <p className="text-[11px] text-gray-600">
                {healthData.healthy ? (
                  <span>
                    ✓ {healthData.message} {healthData.latencyMs !== undefined && `(Ping: ${healthData.latencyMs}ms)`}
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold">
                    ✕ {healthData.error || 'API key missing in Render environment'} {healthData.suggestion && `— ${healthData.suggestion}`}
                  </span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={runHealthCheck}
            disabled={isCheckingHealth}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={12} className={isCheckingHealth ? 'animate-spin' : ''} />
            <span>{isCheckingHealth ? 'Testing Connection...' : 'Run Render Check'}</span>
          </button>
        </div>
      </div>

      {/* Test Email Dispatcher Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Send Test Transactional Email</h3>
          <p className="text-xs text-gray-500 mt-0.5">Verify real-time Resend delivery, templates, and sender credentials</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-2xl items-end">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Recipient Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Template Role</label>
            <select
              value={testRole}
              onChange={(e) => setTestRole(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
            >
              <option value="customer">Customer Confirmation</option>
              <option value="vendor">Vendor Booking Demand</option>
              <option value="admin">Admin Financial Alert</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleSendTest}
              disabled={isSendingTest || !testEmail}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold h-[38px] rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Send size={13} />
              <span>{isSendingTest ? 'Sending...' : 'Send Test'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by recipient, booking ID, or Resend ID..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="accepted">Accepted</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
            <option value="queued">Queued</option>
          </select>

          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:bg-white max-w-[200px] truncate"
          >
            <option value="all">All Event Types</option>
            {uniqueEventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
            Email Delivery Audit Trail ({filteredLogs.length} of {logs.length})
          </h3>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            {isLoading ? 'Loading email delivery logs...' : 'No email events match the current filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Booking Ref</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Resend ID</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => {
                  const hasError = Boolean(log.error || log.bounceReason);
                  const isRetrying = retryingLogId === log.id;

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition group">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{log.eventType}</div>
                        {hasError && (
                          <div className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={log.error || log.bounceReason}>
                            ⚠️ {log.bounceReason || log.error}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-gray-700">{log.recipient}</td>
                      <td className="p-4 font-semibold text-brand-primary">#{log.bookingId || 'N/A'}</td>
                      <td className="p-4">
                        {renderStatusBadge(log.status)}
                      </td>
                      <td className="p-4 text-gray-500">
                        {log.updatedAt || log.sentAt 
                          ? new Date(log.updatedAt || log.sentAt || '').toLocaleString('en-IN') 
                          : 'N/A'}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-gray-500 truncate max-w-[140px]">
                        {log.resendId || log.providerMessageId || 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        {(log.status === 'failed' || log.status === 'bounced') ? (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={isRetrying}
                            className="inline-flex items-center gap-1 text-brand-primary hover:underline font-bold cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw size={12} className={isRetrying ? 'animate-spin' : ''} />
                            <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
