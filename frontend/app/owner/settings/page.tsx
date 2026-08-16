'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import { Settings, Shield, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await api.get('/fraud-alerts/rules');
        setRules(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  const handleRuleToggle = async (id: string, currentActive: boolean) => {
    try {
      await api.patch(`/fraud-alerts/rules/${id}`, { isActive: !currentActive });
      setRules(rules.map((r) => (r._id === id ? { ...r, isActive: !currentActive } : r)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>Fraud Engine Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure active fraud rules, thresholds, and risk score weights</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Detection Rule Scoring Policies</span>
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading rule configs...</div>
          ) : (
            <div className="space-y-3">
              {rules.map((r) => (
                <div
                  key={r._id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-100">{r.name}</span>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        +{r.score} PTS
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{r.description}</p>
                  </div>

                  <button
                    onClick={() => handleRuleToggle(r._id, r.isActive)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                      r.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {r.isActive ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
