'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import { History, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs');
        setLogs(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-amber-500" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Append-only security log for compliance, user activity, and system changes</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading security logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No audit records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Action Code</th>
                    <th className="px-5 py-3.5">Target Entity</th>
                    <th className="px-5 py-3.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {logs.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 text-slate-400">{new Date(l.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-4 text-amber-400 font-bold">{l.userId?.username || 'System'}</td>
                      <td className="px-5 py-4 text-slate-400">{l.userRole}</td>
                      <td className="px-5 py-4 text-slate-100 font-bold">{l.action}</td>
                      <td className="px-5 py-4 text-slate-400">{l.entityType}</td>
                      <td className="px-5 py-4 text-slate-500">{l.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
