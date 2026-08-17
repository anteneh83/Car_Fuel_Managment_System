'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MonitorLayout } from '@/components/layout/MonitorLayout';
import { api } from '@/lib/api';
import {
  History,
  Fuel,
  Search,
  Plus,
  AlertTriangle,
  Receipt,
  FileText,
} from 'lucide-react';

export default function MonitorTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fuel-transactions/my?search=${search}`);
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch monitor transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search]);

  return (
    <MonitorLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-400" />
              <span>Completed Fuel Transactions History</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Audit log of completed Phase 2 fuel transactions, variance analysis, and fraud risk scores.
            </p>
          </div>

          <Link
            href="/monitor/complete-fuel"
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Complete New Fueling</span>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by receipt or station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs">
              No completed fuel transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Fuel Date</th>
                    <th className="px-5 py-3.5">Driver</th>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Station & Receipt</th>
                    <th className="px-5 py-3.5">Fuel Pumped</th>
                    <th className="px-5 py-3.5">Variance</th>
                    <th className="px-5 py-3.5">Fraud Risk</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {new Date(tx.fuelDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-100">
                        {tx.driverId?.fullName}
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <span className="font-bold text-amber-400">{tx.vehicleId?.plateNumber}</span>
                        <div className="text-[11px] text-slate-500">{tx.vehicleId?.vehicleName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-200">{tx.fuelStationName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">RCP: {tx.receiptNumber}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-emerald-400">{tx.fuelQuantity} L</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tx.totalAmount?.toLocaleString()} ETB</div>
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <span
                          className={`font-bold ${
                            tx.variancePercentage > 30
                              ? 'text-rose-400'
                              : tx.variancePercentage >= 15
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {tx.variancePercentage}%
                        </span>
                        <div className="text-[10px] text-slate-500">
                          Exp: {tx.expectedFuel}L ({tx.distanceTraveled}km)
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            tx.riskLevel === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : tx.riskLevel === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : tx.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {tx.riskLevel} ({tx.riskScore} pts)
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                            tx.status === 'NORMAL'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : tx.status === 'WARNING'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MonitorLayout>
  );
}
