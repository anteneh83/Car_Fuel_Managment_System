'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MonitorLayout } from '@/components/layout/MonitorLayout';
import { api } from '@/lib/api';
import {
  Fuel,
  Upload,
  AlertCircle,
  CheckCircle2,
  Receipt,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

function CompleteFuelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get('requestId') || '';

  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState(initialRequestId);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [formData, setFormData] = useState({
    fuelStationName: 'NOC Bole',
    fuelType: 'DIESEL',
    fuelQuantity: '',
    pricePerLiter: '72.50',
    odometerReading: '',
    receiptNumber: '',
    fuelDate: new Date().toISOString().slice(0, 16),
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultTx, setResultTx] = useState<any | null>(null);

  // Fetch approved requests
  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await api.get('/fuel-requests/my?status=APPROVED');
        const list = res.data.data || [];
        setApprovedRequests(list);

        if (initialRequestId) {
          const req = list.find((r: any) => r._id === initialRequestId);
          if (req) {
            setFormData((prev) => ({
              ...prev,
              fuelType: req.fuelType,
              fuelQuantity: req.fuelQuantity?.toString() || '',
              pricePerLiter: req.pricePerLiter?.toString() || '72.50',
              odometerReading: req.odometerReading?.toString() || '',
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load approved requests:', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchApproved();
  }, [initialRequestId]);

  const handleRequestSelect = (reqId: string) => {
    setSelectedRequestId(reqId);
    const req = approvedRequests.find((r) => r._id === reqId);
    if (req) {
      setFormData((prev) => ({
        ...prev,
        fuelType: req.fuelType,
        fuelQuantity: req.fuelQuantity?.toString() || '',
        pricePerLiter: req.pricePerLiter?.toString() || '72.50',
        odometerReading: req.odometerReading?.toString() || '',
      }));
    }
  };

  const selectedRequest = approvedRequests.find((r) => r._id === selectedRequestId);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRequestId) {
      setError('Please select an approved fuel request');
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('fuelRequestId', selectedRequestId);
      data.append('fuelStationName', formData.fuelStationName);
      data.append('fuelType', formData.fuelType);
      data.append('fuelQuantity', formData.fuelQuantity);
      data.append('pricePerLiter', formData.pricePerLiter);
      data.append('odometerReading', formData.odometerReading);
      data.append('receiptNumber', formData.receiptNumber);
      data.append('fuelDate', new Date(formData.fuelDate).toISOString());
      if (receiptFile) {
        data.append('receiptImage', receiptFile);
      }

      const res = await api.post('/fuel-transactions', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResultTx(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit fuel transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MonitorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Fuel className="w-6 h-6 text-blue-400" />
            <span>Phase 2 — Post-Fueling Transaction Completion</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Log actual fuel pumped, station receipt details, and trigger the backend fraud analysis engine.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transaction Result Modal / Box */}
        {resultTx && (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-bold text-slate-100">Fuel Transaction Logged Successfully</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-4 rounded-xl font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">TOTAL COST:</span>
                <span className="font-bold text-slate-100">{resultTx.totalAmount} ETB</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">LITERS FILLED:</span>
                <span className="font-bold text-emerald-400">{resultTx.fuelQuantity} L</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">VARIANCE:</span>
                <span className={`font-bold ${resultTx.variancePercentage > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {resultTx.variancePercentage}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">FRAUD RISK:</span>
                <span className={`font-bold ${resultTx.riskLevel === 'CRITICAL' ? 'text-rose-400' : resultTx.riskLevel === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {resultTx.riskLevel} ({resultTx.riskScore} pts)
                </span>
              </div>
            </div>

            {resultTx.fraudReasons && resultTx.fraudReasons.length > 0 && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1">
                <p className="font-bold text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Fraud Detection Rule Warnings:</span>
                </p>
                <ul className="list-disc list-inside text-rose-300 text-[11px]">
                  {resultTx.fraudReasons.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => router.push('/monitor/transactions')}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                View in Transaction History
              </button>
            </div>
          </div>
        )}

        {!resultTx && (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Approved Request Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Select Approved Fuel Authorization Request *
              </label>
              {loadingInitial ? (
                <div className="text-slate-500 text-xs py-2">Loading authorized requests...</div>
              ) : approvedRequests.length === 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl">
                  ⚠️ You have no currently approved fuel requests. Please submit a Phase 1 Request and wait for Admin approval first.
                </div>
              ) : (
                <select
                  required
                  value={selectedRequestId}
                  onChange={(e) => handleRequestSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Choose approved request...</option>
                  {approvedRequests.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.driverId?.fullName} — {r.vehicleId?.plateNumber} ({r.fuelQuantity}L requested on {new Date(r.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Request Summary Card */}
            {selectedRequest && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">DRIVER:</span>
                  <span className="text-slate-200 font-bold">{selectedRequest.driverId?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">VEHICLE:</span>
                  <span className="text-amber-400 font-bold">{selectedRequest.vehicleId?.plateNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">REQUESTED:</span>
                  <span className="text-emerald-400 font-bold">{selectedRequest.fuelQuantity} L</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">PREV ODOMETER:</span>
                  <span className="text-slate-200 font-bold">{selectedRequest.previousOdometer?.toLocaleString()} km</span>
                </div>
              </div>
            )}

            {/* Station and Receipt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Fuel Station Name & Location</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NOC Bole / Total Megenagna"
                  value={formData.fuelStationName}
                  onChange={(e) => setFormData({ ...formData, fuelStationName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-400" />
                  <span>Official Receipt Number</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RCP-00892"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Actual Quantities and Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Fuel Type</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="DIESEL">DIESEL</option>
                  <option value="PETROL">PETROL</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Actual Fuel Pumped (Liters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  placeholder="e.g. 45.5"
                  value={formData.fuelQuantity}
                  onChange={(e) => setFormData({ ...formData, fuelQuantity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-bold text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Actual Price / Liter (ETB)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="72.50"
                  value={formData.pricePerLiter}
                  onChange={(e) => setFormData({ ...formData, pricePerLiter: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Odometer & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Current Odometer Reading (km)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 45300"
                  value={formData.odometerReading}
                  onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Fuel Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.fuelDate}
                  onChange={(e) => setFormData({ ...formData, fuelDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Receipt Image (Optional) */}
            <div className="text-xs pt-4 border-t border-slate-800">
              <label className="block font-medium text-slate-300 mb-1.5">
                Physical Receipt Photo (Optional)
              </label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-950/50 flex flex-col items-center justify-center min-h-[120px]">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleReceiptChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {receiptPreview ? (
                  <div className="relative w-full h-28">
                    <img src={receiptPreview} alt="Receipt Preview" className="w-full h-full object-contain rounded-lg" />
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-500 mb-1.5" />
                    <p className="text-xs text-slate-300">Attach receipt photo or PDF</p>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || approvedRequests.length === 0}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Executing Fraud Engine...</span>
                ) : (
                  <>
                    <span>Submit & Run Calculations</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </MonitorLayout>
  );
}

export default function CompleteFuelPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-xs">Loading page...</div>}>
      <CompleteFuelContent />
    </Suspense>
  );
}
