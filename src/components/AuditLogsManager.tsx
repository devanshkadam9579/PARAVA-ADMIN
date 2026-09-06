import { ShieldCheck } from 'lucide-react';

export default function AuditLogsManager() {
  const auditLogs = [
    { id: 'log_1', action: 'VENDOR_APPROVED', target: 'Royal Caterers Kolhapur', admin: 'devansh@parva.com', time: '10 mins ago' },
    { id: 'log_2', action: 'SETTINGS_UPDATED', target: 'Platform Fee (5%)', admin: 'devansh@parva.com', time: '1 hour ago' },
    { id: 'log_3', action: 'COUPON_CREATED', target: 'FESTIVE2000', admin: 'devansh@parva.com', time: '3 hours ago' },
    { id: 'log_4', action: 'CITY_ADDED', target: 'Bangalore Metro Hub', admin: 'devansh@parva.com', time: '1 day ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Security & Administrative Audit Logs</h1>
        <p className="text-xs text-gray-500 mt-0.5">Immutable audit trail of administrator actions, policy changes, and verification approvals</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="divide-y divide-gray-100">
          {auditLogs.map(log => (
            <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-primary-light text-brand-primary flex items-center justify-center font-bold">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <span className="font-extrabold text-gray-900">{log.action}</span>
                  <p className="text-gray-500">{log.target} by {log.admin}</p>
                </div>
              </div>
              <span className="text-gray-400 font-bold text-[11px]">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
