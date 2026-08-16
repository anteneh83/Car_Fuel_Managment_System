'use client';

import React, { useState, useEffect } from 'react';
import { DriverLayout } from '@/components/layout/DriverLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Fuel, Truck, PlusCircle, History, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const res = await api.get('/dashboard/driver-summary');
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDriverData();
  }, []);

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-slate-100">Welcome, {user?.username}!</h1>
          <p className="text-xs text-slate-400 mt-1">Driver Telemetry & Fuel Submission Portal</p>
          
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-4 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Assigned Vehicle:</span>
              <span className="text-emerald-400 font-bold">{data?.vehicle?.plateNumber || 'Unassigned'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Current Odometer:</span>
              <span className="text-slate-200 font-bold">{data?.vehicle?.currentOdometer?.toLocaleString() || 0} km</span>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <Link
          href="/driver/new-transaction"
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-lg shadow-emerald-500/10"
        >
          <PlusCircle className="w-6 h-6" />
          <span>Log New Fuel Purchase</span>
        </Link>

        {/* Driver Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400">Total Refuels Logged</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{data?.totalTransactions || 0}</h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400">Total Fuel Logged (L)</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{data?.totalFuelLiters || 0} L</h3>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Fuel Log Submissions</span>
            </h3>
            <Link href="/driver/my-transactions" className="text-xs text-emerald-400 hover:underline">
              View All
            </Link>
          </div>

          {data?.recentTransactions?.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No fuel receipts logged yet.</p>
          ) : (
            <div className="space-y-2">
              {data?.recentTransactions?.map((t: any) => (
                <div
                  key={t._id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200">{t.fuelStationName}</span>
                    <span className="text-slate-500 block font-mono text-[10px]">
                      {new Date(t.fuelDate).toLocaleDateString()} • Receipt: {t.receiptNumber}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-emerald-400 font-bold">{t.fuelQuantity} L</span>
                    <span className="text-slate-400 block text-[11px]">${t.totalAmount}</span>
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
