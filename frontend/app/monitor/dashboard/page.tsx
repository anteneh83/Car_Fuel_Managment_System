'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MonitorLayout } from '@/components/layout/MonitorLayout';
import { api } from '@/lib/api';
import {
  ClipboardPlus,
  Fuel,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';

export default function MonitorDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, reqRes] = await Promise.all([
          api.get('/dashboard/monitor-summary'),
          api.get('/fuel-requests/my?limit=5'),
        ]);
        setStats(sumRes.data.data);
        setRecentRequests(reqRes.data.data || []);
      } catch (err) {
        console.error('Failed to load monitor dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <MonitorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>Monitor Fuel Operations Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Coordinate pre-fuel requests, upload odometer evidence, and submit post-fueling transactions.
          </p>
        </div>

        {/* Quick Action Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <ClipboardPlus className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-100">Step 1: Request Fuel Authorization</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Submit driver, vehicle, and mandatory odometer photo to Admin before fueling.
              </p>
            </div>
            <Link
              href="/monitor/new-request"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all w-fit"
            >
              <span>Create Phase 1 Request</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <Fuel className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-100">Step 2: Log Completed Fueling</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Record actual liters filled, receipt number, and price for an Admin-approved request.
              </p>
            </div>
            <Link
              href="/monitor/complete-fuel"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-all w-fit"
            >
              <span>Submit Phase 2 Completion</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Pending Requests</p>
              <h3 className="text-xl font-bold text-amber-400 mt-1">{stats?.pendingRequests || 0}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Waiting for Admin review</p>
            </div>
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Approved Requests</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">{stats?.approvedRequests || 0}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Ready for fuel filling</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Transactions</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{stats?.totalTransactions || 0}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Completed fuel logs</p>
            </div>
            <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300">
              <Fuel className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Monthly Fuel Volume</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{stats?.thisMonthFuel || 0} L</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">~ {stats?.thisMonthCost || 0} ETB</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Fuel Requests */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Recent Fuel Requests & Admin Status</span>
            </h2>
            <Link
              href="/monitor/requests"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading requests...</div>
          ) : recentRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No fuel requests submitted yet. Click "Create Phase 1 Request" to start.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 text-xs">
              {recentRequests.map((req) => (
                <div key={req._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300 font-mono">
                      {req.fuelQuantity}L
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100">{req.driverId?.fullName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="font-mono text-amber-400 font-semibold">{req.vehicleId?.plateNumber}</span>
                        <span className="text-slate-400">({req.vehicleId?.vehicleName})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Odometer: <span className="font-mono font-medium text-slate-300">{req.odometerReading?.toLocaleString()} km</span> | Fuel: {req.fuelQuantity}L {req.fuelType} @ {req.pricePerLiter} ETB/L
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {req.status}
                    </span>

                    {req.status === 'APPROVED' && (
                      <Link
                        href={`/monitor/complete-fuel?requestId=${req._id}`}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                      >
                        Complete Fueling
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MonitorLayout>
  );
}
