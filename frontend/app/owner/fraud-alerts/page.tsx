'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import { AlertOctagon, ShieldAlert, CheckCircle, Search } from 'lucide-react';

export default function FraudAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/fraud-alerts');
        setAlerts(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            <span>Fraud Exception Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">High-risk and critical anomalies flagged by the detection rules engine</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Evaluating exception alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No unresolved high-risk fraud alerts in queue.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {alerts.map((a) => (
                <div key={a._id} className="p-5 hover:bg-slate-800/20 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                        a.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {a.riskLevel} (SCORE: {a.riskScore})
                      </span>
                      <span className="font-mono text-xs text-amber-400 font-bold">{a.vehicleId?.plateNumber}</span>
                      <span className="text-slate-400 text-xs">• {a.driverId?.fullName}</span>
                    </div>

                    <p className="text-sm font-medium text-slate-200">
                      Fueling at <span className="text-slate-100 font-semibold">{a.fuelStationName}</span> — Claimed {a.fuelQuantity} L (Expected {a.expectedFuel} L)
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {a.fraudReasons?.map((r: string, idx: number) => (
                        <span key={idx} className="bg-slate-950 text-rose-300 text-[11px] px-2 py-0.5 rounded border border-rose-900/30">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-slate-500">{new Date(a.fuelDate).toLocaleDateString()}</span>
                    <a
                      href="/owner/transactions"
                      className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      Investigate Alert
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
