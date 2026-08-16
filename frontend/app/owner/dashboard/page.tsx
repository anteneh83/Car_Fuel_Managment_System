'use client';

import React, { useEffect, useState } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import {
  DollarSign,
  Fuel,
  Receipt,
  Truck,
  Users,
  AlertOctagon,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export default function OwnerDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [fuelCostChart, setFuelCostChart] = useState<any[]>([]);
  const [vehicleUsageChart, setVehicleUsageChart] = useState<any[]>([]);
  const [driverUsageChart, setDriverUsageChart] = useState<any[]>([]);
  const [riskDistChart, setRiskDistChart] = useState<any[]>([]);
  const [consumptionTrend, setConsumptionTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, costRes, vehRes, drvRes, riskRes, trendRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/fuel-cost'),
          api.get('/dashboard/vehicle-usage'),
          api.get('/dashboard/driver-usage'),
          api.get('/dashboard/risk-distribution'),
          api.get('/dashboard/consumption-trend'),
        ]);

        setSummary(sumRes.data.data);
        setFuelCostChart(
          costRes.data.data.map((item: any) => ({
            name: `${item._id.month}/${item._id.year}`,
            cost: item.totalCost,
            liters: item.totalLiters,
          }))
        );
        setVehicleUsageChart(
          vehRes.data.data.slice(0, 5).map((item: any) => ({
            name: item.plateNumber,
            cost: item.totalCost,
            liters: item.totalLiters,
          }))
        );
        setDriverUsageChart(
          drvRes.data.data.slice(0, 5).map((item: any) => ({
            name: item.driverName,
            cost: item.totalCost,
            liters: item.totalLiters,
          }))
        );
        setRiskDistChart(
          riskRes.data.data.map((item: any) => ({
            name: item._id,
            value: item.count,
          }))
        );
        setConsumptionTrend(
          trendRes.data.data.map((item: any) => ({
            name: `${item._id.month}/${item._id.year}`,
            expected: Math.round(item.expectedFuel),
            claimed: Math.round(item.claimedFuel),
          }))
        );
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const RISK_COLORS: Record<string, string> = {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#F97316',
    CRITICAL: '#EF4444',
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Loading Owner Fleet Dashboard...</p>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Fleet Operations & Fraud Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time telemetry and suspicious fueling pattern metrics</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Fuel Cost</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">${summary?.totalFuelCost?.toLocaleString() || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Liters Fuel</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{summary?.totalLiters?.toLocaleString() || 0} L</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <Fuel className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Active Fleet / Drivers</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{summary?.activeVehicles || 0} / {summary?.activeDrivers || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Critical / High Risk</p>
              <h3 className="text-xl font-bold text-rose-400 mt-1">
                {summary?.criticalTransactions || 0} / {summary?.highRiskTransactions || 0}
              </h3>
            </div>
            <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Fuel Cost Trend */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Monthly Fuel Expenditure Trend ($)</span>
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fuelCostChart}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                  <Area type="monotone" dataKey="cost" stroke="#F59E0B" fillOpacity={1} fill="url(#costGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Level Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Transaction Fraud Risk Profile</span>
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expected vs Claimed Fuel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Expected vs Claimed Fuel (Liters)</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumptionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="expected" fill="#10B981" name="Expected Fuel" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="claimed" fill="#EF4444" name="Claimed Fuel" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Vehicle Consumption */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Top Vehicle Fuel Usage (Liters)</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleUsageChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94A3B8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="liters" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
