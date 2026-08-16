'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DriverLayout } from '@/components/layout/DriverLayout';
import { api } from '@/lib/api';
import { PlusCircle, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NewTransactionPage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fuelStationName: '',
    fuelType: 'DIESEL',
    fuelQuantity: '',
    pricePerLiter: '72.50',
    odometerReading: '',
    receiptNumber: '',
    fuelDate: new Date().toISOString().split('T')[0],
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchVehicleInfo = async () => {
      try {
        const res = await api.get('/dashboard/driver-summary');
        setVehicle(res.data.data.vehicle);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicleInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vehicle) {
      setError('You must have an assigned vehicle to submit fuel records.');
      return;
    }
    if (!receiptFile) {
      setError('Fuel receipt image upload is mandatory.');
      return;
    }
    if (parseFloat(formData.odometerReading) <= vehicle.currentOdometer) {
      setError(`New odometer reading (${formData.odometerReading}) must be greater than current vehicle odometer (${vehicle.currentOdometer} km).`);
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('vehicleId', vehicle._id);
      data.append('fuelStationName', formData.fuelStationName);
      data.append('fuelType', formData.fuelType);
      data.append('fuelQuantity', formData.fuelQuantity);
      data.append('pricePerLiter', formData.pricePerLiter);
      data.append('odometerReading', formData.odometerReading);
      data.append('receiptNumber', formData.receiptNumber);
      data.append('fuelDate', formData.fuelDate);
      data.append('receiptImage', receiptFile);

      await api.post('/fuel-transactions', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/driver/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit fuel transaction.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-emerald-400" />
            <span>Log Fuel Purchase</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Submit fuel receipt and odometer telemetry for audit validation</p>
        </div>

        {/* Assigned Vehicle Header Banner */}
        {vehicle ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">ASSIGNED VEHICLE:</span>
              <span className="text-emerald-400 font-bold text-sm">{vehicle.plateNumber} ({vehicle.vehicleName})</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">PREVIOUS ODOMETER:</span>
              <span className="text-slate-100 font-mono font-bold">{vehicle.currentOdometer?.toLocaleString()} km</span>
            </div>
          </div>
        ) : (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>No vehicle assigned to your driver account. Contact owner to assign a fleet vehicle before submitting logs.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Fuel transaction submitted & processed by fraud engine! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Fuel Station Name</label>
              <input
                type="text"
                required
                placeholder="e.g. NOC Bole"
                value={formData.fuelStationName}
                onChange={(e) => setFormData({ ...formData, fuelStationName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Receipt Number</label>
              <input
                type="text"
                required
                placeholder="e.g. RCP-9988"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100"
              >
                <option value="DIESEL">DIESEL</option>
                <option value="PETROL">PETROL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Fuel Quantity (Liters)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 45.00"
                value={formData.fuelQuantity}
                onChange={(e) => setFormData({ ...formData, fuelQuantity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Price / Liter ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.pricePerLiter}
                onChange={(e) => setFormData({ ...formData, pricePerLiter: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Odometer (km)</label>
              <input
                type="number"
                required
                placeholder={`Must be > ${vehicle?.currentOdometer || 0}`}
                value={formData.odometerReading}
                onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Fueling Date</label>
              <input
                type="date"
                required
                value={formData.fuelDate}
                onChange={(e) => setFormData({ ...formData, fuelDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100"
              />
            </div>
          </div>

          {/* Cloudinary Receipt Upload Drag & Drop Box */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Upload Receipt Image (Cloudinary Integration)
            </label>
            <div className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="hidden"
                id="receiptUpload"
              />
              <label htmlFor="receiptUpload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="text-xs font-medium text-slate-300">
                  {receiptFile ? receiptFile.name : 'Click to upload or drag receipt photo'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">JPEG, PNG, WEBP up to 5MB</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || success || !vehicle}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all disabled:opacity-50 mt-4"
          >
            {submitting ? 'Processing Telemetry & Receipt...' : 'Submit Fuel Transaction'}
          </button>
        </form>
      </div>
    </DriverLayout>
  );
}
