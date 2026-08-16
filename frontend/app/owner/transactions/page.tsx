'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import { Fuel, Search, Filter, AlertTriangle, Eye, CheckCircle } from 'lucide-react';

export default function AllTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const fetchTransactions = async () => {
    try {
      const res = await api.get(
        `/fuel-transactions?search=${search}&riskLevel=${riskFilter}`
      );
      setTransactions(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, riskFilter]);

  const handleReviewAction = async (id: string, action: 'review' | 'investigate' | 'resolve') => {
    try {
      await api.patch(`/fuel-transactions/${id}/${action}`, { notes });
      setSelectedTx(null);
      setNotes('');
      fetchTransactions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Fuel className="w-6 h-6 text-amber-500" />
              <span>Fuel Transactions Audit</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Review all vehicle fueling logs and system fraud risk scores</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search station or receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 w-full sm:w-48"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No transaction records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Driver</th>
                    <th className="px-5 py-3.5">Station</th>
                    <th className="px-5 py-3.5">Liters / Cost</th>
                    <th className="px-5 py-3.5">Variance</th>
                    <th className="px-5 py-3.5">Risk Level</th>
                    <th className="px-5 py-3.5">Review Status</th>
                    <th className="px-5 py-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs">{new Date(t.fuelDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4 font-medium text-slate-100">{t.vehicleId?.plateNumber}</td>
                      <td className="px-5 py-4">{t.driverId?.fullName}</td>
                      <td className="px-5 py-4 text-slate-400">{t.fuelStationName}</td>
                      <td className="px-5 py-4 font-mono text-xs">
                        {t.fuelQuantity} L / ${t.totalAmount}
                      </td>
                      <td className={`px-5 py-4 font-mono text-xs font-bold ${t.variancePercentage > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {t.variancePercentage}%
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-bold border ${
                            t.riskLevel === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : t.riskLevel === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : t.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {t.riskLevel} ({t.riskScore})
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-400">{t.reviewStatus}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedTx(t)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <h2 className="text-lg font-bold text-slate-100">Fuel Transaction Audit Analysis</h2>
                <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-200 font-bold">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div className="bg-slate-950 p-3.5 rounded-xl space-y-2">
                  <p className="text-slate-400">Driver: <span className="text-slate-200 font-semibold">{selectedTx.driverId?.fullName}</span></p>
                  <p className="text-slate-400">Vehicle: <span className="text-slate-200 font-semibold">{selectedTx.vehicleId?.plateNumber}</span></p>
                  <p className="text-slate-400">Station: <span className="text-slate-200 font-semibold">{selectedTx.fuelStationName}</span></p>
                  <p className="text-slate-400">Receipt #: <span className="text-amber-400 font-mono font-bold">{selectedTx.receiptNumber}</span></p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl space-y-2">
                  <p className="text-slate-400">Claimed Fuel: <span className="text-slate-200 font-semibold">{selectedTx.fuelQuantity} L</span></p>
                  <p className="text-slate-400">Expected Fuel: <span className="text-slate-200 font-semibold">{selectedTx.expectedFuel} L</span></p>
                  <p className="text-slate-400">Variance: <span className="text-rose-400 font-bold">{selectedTx.variancePercentage}%</span></p>
                  <p className="text-slate-400">Total Price: <span className="text-emerald-400 font-bold">${selectedTx.totalAmount}</span></p>
                </div>
              </div>

              {/* Fraud Reasons */}
              {selectedTx.fraudReasons?.length > 0 && (
                <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Triggered Fraud Indicators</span>
                  </h4>
                  <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
                    {selectedTx.fraudReasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cloudinary Receipt Preview */}
              {selectedTx.receiptImage?.secureUrl && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">Cloudinary Uploaded Receipt</h4>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-center">
                    <img
                      src={selectedTx.receiptImage.secureUrl}
                      alt="Fuel Receipt"
                      className="max-h-60 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Review Actions */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <textarea
                  placeholder="Owner investigation notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                  rows={2}
                />

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleReviewAction(selectedTx._id, 'review')}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleReviewAction(selectedTx._id, 'investigate')}
                    className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/30"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => handleReviewAction(selectedTx._id, 'resolve')}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl"
                  >
                    Resolve Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
