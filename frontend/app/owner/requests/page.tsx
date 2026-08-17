'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  XCircle,
  ZoomIn,
  Eye,
  X,
  AlertCircle,
  Truck,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function AdminFuelRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/fuel-requests?status=${statusFilter}` : '/fuel-requests';
      const res = await api.get(url);
      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch fuel requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to APPROVE this pre-fuel request? The monitor will be authorized to proceed with fueling.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.patch(`/fuel-requests/${id}/approve`);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve fuel request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.patch(`/fuel-requests/${selectedRequest._id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject fuel request');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-amber-500" />
              <span>Pre-Fueling Authorization Requests (Phase 1)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Verify odometer photo evidence, compare entered digits, and authorize or reject fueling before transactions take place.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === '' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Requests
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'PENDING' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Review
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
        </div>

        {/* Requests Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading fuel requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              No fuel requests found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Submission Date</th>
                    <th className="px-5 py-3.5">Driver</th>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Fuel Info</th>
                    <th className="px-5 py-3.5">Entered Odometer</th>
                    <th className="px-5 py-3.5">Odometer Photo</th>
                    <th className="px-5 py-3.5">Submitted By</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">
                        {new Date(req.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-100">
                        {req.driverId?.fullName || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-semibold text-amber-400">
                          {req.vehicleId?.plateNumber || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">{req.vehicleId?.vehicleName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-200">
                          {req.fuelQuantity} L ({req.fuelType})
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          @ {req.pricePerLiter} ETB/L ~ {req.estimatedTotalAmount} ETB
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">
                        <div className="font-bold text-slate-100">{req.odometerReading?.toLocaleString()} km</div>
                        <div className="text-[11px] text-slate-500">
                          Prev: {req.previousOdometer?.toLocaleString()} km (+{req.distanceSincePrevious} km)
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {req.odometerImage?.secureUrl ? (
                          <button
                            onClick={() => setZoomImage(req.odometerImage.secureUrl)}
                            className="group relative flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg p-1.5 transition-all"
                          >
                            <img
                              src={req.odometerImage.secureUrl}
                              alt="Odometer Evidence"
                              className="w-10 h-10 object-cover rounded"
                            />
                            <ZoomIn className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                          </button>
                        ) : (
                          <span className="text-rose-400 text-xs italic">Missing</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">
                        {req.monitorId?.fullName || req.monitorId?.username || 'Monitor'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-bold border ${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 ml-auto border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inspect Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-amber-500" />
                    <span>Review Fuel Request #{selectedRequest._id.slice(-6)}</span>
                  </h2>
                  <p className="text-xs text-slate-400">Submitted by Monitor on {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left column: Data Details */}
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                    <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Fleet Assignment</h3>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Assigned Driver:</span>
                      <span className="font-semibold text-slate-200">{selectedRequest.driverId?.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Driver Phone / License:</span>
                      <span className="font-mono text-slate-300">{selectedRequest.driverId?.phoneNumber} / {selectedRequest.driverId?.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Assigned Vehicle:</span>
                      <span className="font-bold text-amber-400 font-mono">{selectedRequest.vehicleId?.plateNumber}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Vehicle Make / Model:</span>
                      <span className="text-slate-200">{selectedRequest.vehicleId?.vehicleName} ({selectedRequest.vehicleId?.brand})</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                    <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Requested Fuel Details</h3>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Fuel Type:</span>
                      <span className="font-bold text-slate-200">{selectedRequest.fuelType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Requested Volume:</span>
                      <span className="font-bold text-emerald-400 text-sm">{selectedRequest.fuelQuantity} Liters</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Price / Liter:</span>
                      <span className="font-mono text-slate-200">{selectedRequest.pricePerLiter} ETB</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Estimated Total:</span>
                      <span className="font-mono font-bold text-slate-100">{selectedRequest.estimatedTotalAmount} ETB</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                    <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Odometer & Preliminary Analysis</h3>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Previous Vehicle Odometer:</span>
                      <span className="font-mono text-slate-300">{selectedRequest.previousOdometer?.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Entered Current Odometer:</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">{selectedRequest.odometerReading?.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Distance Traveled:</span>
                      <span className="font-mono text-slate-200">{selectedRequest.distanceSincePrevious} km</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Estimated Variance:</span>
                      <span className={`font-bold font-mono ${selectedRequest.estimatedVariance > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedRequest.estimatedVariance}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right column: Image Verification Preview */}
                <div className="flex flex-col">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Odometer Photographic Evidence</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">Mandatory Evidence</span>
                    </div>

                    {selectedRequest.odometerImage?.secureUrl ? (
                      <div className="relative group flex-1 bg-black/50 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center min-h-[220px]">
                        <img
                          src={selectedRequest.odometerImage.secureUrl}
                          alt="Odometer Evidence"
                          className="max-h-72 w-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                          onClick={() => setZoomImage(selectedRequest.odometerImage.secureUrl)}
                        />
                        <div
                          onClick={() => setZoomImage(selectedRequest.odometerImage.secureUrl)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white font-medium text-xs space-x-2"
                        >
                          <ZoomIn className="w-5 h-5" />
                          <span>Click to Zoom Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-rose-400 text-xs">
                        No odometer image was captured with this submission.
                      </div>
                    )}

                    <div className="mt-3 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-300">Verification Rule:</p>
                      <p>
                        Verify that the physical digits in the image match <span className="font-mono text-amber-400 font-bold">{selectedRequest.odometerReading?.toLocaleString()} km</span>. If digits do not match or photo is unreadable, reject the request.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status or Actions */}
              {selectedRequest.status === 'PENDING' ? (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Request</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    disabled={actionLoading}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Fueling</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">REQUEST STATUS:</span>
                    <span className={`font-bold ${selectedRequest.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedRequest.status}
                    </span>
                    {selectedRequest.rejectionReason && (
                      <p className="text-rose-300 mt-1">Reason: {selectedRequest.rejectionReason}</p>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] text-right font-mono">
                    {selectedRequest.approvedAt && `Approved at ${new Date(selectedRequest.approvedAt).toLocaleString()}`}
                    {selectedRequest.rejectedAt && `Rejected at ${new Date(selectedRequest.rejectedAt).toLocaleString()}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reject Reason Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-base font-bold text-rose-400 mb-2 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>Specify Rejection Reason</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                The monitor will receive this reason to notify the driver or recapture the odometer reading.
              </p>

              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Entered odometer reading does not match the uploaded odometer image."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500/50"
              />

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Image Zoom Modal */}
        {zoomImage && (
          <div
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <img
                src={zoomImage}
                alt="Zoomed Odometer"
                className="max-h-[85vh] max-w-full object-contain rounded-xl border border-slate-800 shadow-2xl"
              />
              <p className="text-slate-400 text-xs mt-3 font-mono">Click anywhere to close zoom view</p>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
