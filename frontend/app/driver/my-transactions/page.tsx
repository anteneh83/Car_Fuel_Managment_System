'use client';

import React, { useState, useEffect } from 'react';
import { DriverLayout } from '@/components/layout/DriverLayout';
import { api } from '@/lib/api';
import { History, Search } from 'lucide-react';

export default function MyTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTransactions = async () => {
      try {
        const res = await api.get('/fuel-transactions/my');
        setTransactions(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMyTransactions();
  }, []);

  return (
    <DriverLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>My Fuel Submission History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Review all your submitted fuel receipts and status</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading submission log...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">You haven't submitted any fuel transactions yet.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {transactions.map((t) => (
                <div key={t._id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-100">{t.fuelStationName}</span>
                      <span className="font-mono text-xs text-slate-400">• Receipt: {t.receiptNumber}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Fueling Date: {new Date(t.fuelDate).toLocaleDateString()} • Vehicle: {t.vehicleId?.plateNumber}
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-emerald-400 font-bold text-sm block">{t.fuelQuantity} L</span>
                    <span className="text-slate-400 text-xs">${t.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
}
