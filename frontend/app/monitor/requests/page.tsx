'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MonitorLayout } from '@/components/layout/MonitorLayout';
import { api } from '@/lib/api';
import {
  ClipboardList,
  Fuel,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowRight,
  ZoomIn,
} from 'lucide-react';

export default function MonitorRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/fuel-requests/my?status=${statusFilter}`
        : '/fuel-requests/my';
      const res = await api.get(url);
      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch monitor requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  return (
    <MonitorLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              <span>My Fuel Authorization Requests (Phase 1)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track approval status from Admin before coordinating fuel filling with drivers.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === '' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === 'PENDING' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === 'APPROVED' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === 'REJECTED' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rejected
              </button>
            </div>

            <Link
              href="/monitor/new-request"
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>New Request</span>
            </Link>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs space-y-3">
              <p>No fuel requests found for this filter.</p>
              <Link
                href="/monitor/new-request"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold"
              >
                <span>Create New Request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Submission Date</th>
                    <th className="px-5 py-3.5">Driver</th>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Requested Fuel</th>
                    <th className="px-5 py-3.5">Odometer Reading</th>
                    <th className="px-5 py-3.5">Photo</th>
                    <th className="px-5 py-3.5">Status & Response</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {new Date(req.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-100">
                        {req.driverId?.fullName}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-amber-400">
                          {req.vehicleId?.plateNumber}
                        </span>
                        <div className="text-[11px] text-slate-400">{req.vehicleId?.vehicleName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-200">
                          {req.fuelQuantity} L ({req.fuelType})
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          @ {req.pricePerLiter} ETB/L ~ {req.estimatedTotalAmount} ETB
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <div className="font-bold text-slate-100">{req.odometerReading?.toLocaleString()} km</div>
                        <div className="text-[11px] text-slate-500">+{req.distanceSincePrevious} km traveled</div>
                      </td>
                      <td className="px-5 py-4">
                        {req.odometerImage?.secureUrl && (
                          <button
                            onClick={() => setZoomImage(req.odometerImage.secureUrl)}
                            className="flex items-center space-x-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 p-1 rounded"
                          >
                            <img
                              src={req.odometerImage.secureUrl}
                              alt="Odometer"
                              className="w-8 h-8 object-cover rounded"
                            />
                            <ZoomIn className="w-3 h-3 text-emerald-400" />
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            }`}
                          >
                            {req.status}
                          </span>

                          {req.status === 'REJECTED' && req.rejectionReason && (
                            <p className="text-[11px] text-rose-300 font-medium max-w-xs">
                              {req.rejectionReason}
                            </p>
                          )}
                          {req.status === 'APPROVED' && (
                            <p className="text-[10px] text-emerald-400/80">Authorized by Admin</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {req.status === 'APPROVED' ? (
                          <Link
                            href={`/monitor/complete-fuel?requestId=${req._id}`}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-500/10"
                          >
                            <Fuel className="w-3.5 h-3.5" />
                            <span>Complete Fueling</span>
                          </Link>
                        ) : req.status === 'REJECTED' ? (
                          <Link
                            href="/monitor/new-request"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                          >
                            <span>Resubmit</span>
                          </Link>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Awaiting Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Full Image Zoom Modal */}
        {zoomImage && (
          <div
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img
              src={zoomImage}
              alt="Zoomed Odometer"
              className="max-h-[85vh] max-w-full object-contain rounded-xl border border-slate-800 shadow-2xl"
            />
          </div>
        )}
      </div>
    </MonitorLayout>
  );
}
