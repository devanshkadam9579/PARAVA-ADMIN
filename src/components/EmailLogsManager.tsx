import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send } from 'lucide-react';

const BACKEND_API_URL = 'https://parava-backend-1.onrender.com';

export default function EmailLogsManager() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('devanshkadam2@gmail.com');
  const [testRole, setTestRole] = useState<'customer' | 'vendor' | 'admin'>('customer');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/email-logs`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Error fetching email logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSendTest = async () => {
    if (!testEmail) return;
    setIsSendingTest(true);
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, role: testRole })
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Test email dispatched successfully to ${testEmail} via Resend.`);
        fetchLogs();
      } else {
        setNotification(`Failed to send test email: ${data.error || 'Check Resend logs'}`);
      }
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setNotification(null), 4500);
    }
  };

  const handleRetry = async (logId: string) => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/email-logs/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId })
      });
      const data = await res.json();
      if (data.success) {
        setNotification('Retry email dispatched successfully.');
        fetchLogs();
      }
    } catch (err: any) {
      setNotification(`Failed to retry email: ${err.message}`);
    }
    setTimeout(() => setNotification(null), 3500);
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
              Live audit trail of official booking confirmations, PDF receipts, and vendor notifications via Resend
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs border border-gray-200 transition active:scale-95"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {notification}
        </div>
      )}

      {/* Test Email Dispatcher Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Send Test Transactional Email</h3>
          <p className="text-xs text-gray-500 mt-0.5">Test real-time Resend API delivery to customers or vendors</p>
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
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold h-[38px] rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Send size={13} />
              <span>{isSendingTest ? 'Sending...' : 'Send Test'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
            Email Delivery Audit Trail ({logs.length})
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            {isLoading ? 'Loading email delivery logs...' : 'No email events logged yet. New confirmations will appear here live.'}
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
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-4 font-bold text-gray-900">{log.eventType}</td>
                    <td className="p-4 font-mono text-gray-700">{log.recipient}</td>
                    <td className="p-4 font-semibold text-brand-primary">#{log.bookingId || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        log.status === 'sent'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : log.status === 'failed'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {log.sentAt ? new Date(log.sentAt).toLocaleString('en-IN') : 'N/A'}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-gray-400 truncate max-w-[140px]">
                      {log.providerMessageId || 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          className="text-brand-primary hover:underline font-bold"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
