'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MonitorLayout } from '@/components/layout/MonitorLayout';
import { api } from '@/lib/api';
import {
  ClipboardPlus,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  Truck,
  User,
  Calculator,
  ArrowRight,
} from 'lucide-react';

export default function NewFuelRequestPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [formData, setFormData] = useState({
    driverId: '',
    vehicleId: '',
    fuelType: 'DIESEL',
    fuelQuantity: '',
    pricePerLiter: '72.50',
    odometerReading: '',
  });

  const [odometerFile, setOdometerFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected vehicle info
  const selectedVehicle = vehicles.find((v) => v._id === formData.vehicleId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [drvRes, vehRes] = await Promise.all([
          api.get('/drivers?status=ACTIVE'),
          api.get('/vehicles/active'),
        ]);
        setDrivers(drvRes.data.data || []);
        setVehicles(vehRes.data.data || []);
      } catch (err) {
        console.error('Failed to load form dependencies:', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchData();
  }, []);

  // When driver changes, auto-select their assigned vehicle if any
  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d) => d._id === driverId);
    setFormData((prev) => ({
      ...prev,
      driverId,
      vehicleId: driver?.assignedVehicleId?._id || driver?.assignedVehicleId || prev.vehicleId,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Odometer image must be under 5MB');
        return;
      }
      setOdometerFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Calculations for live preview
  const enteredOdo = parseFloat(formData.odometerReading) || 0;
  const prevOdo = selectedVehicle?.currentOdometer || 0;
  const distance = enteredOdo > prevOdo ? enteredOdo - prevOdo : 0;
  const fuelQty = parseFloat(formData.fuelQuantity) || 0;
  const price = parseFloat(formData.pricePerLiter) || 0;
  const estTotal = fuelQty * price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!odometerFile) {
      setError('Odometer image photo is mandatory. Please capture or upload a clear photo of the dashboard.');
      return;
    }

    if (enteredOdo < prevOdo) {
      setError(`Entered odometer (${enteredOdo} km) cannot be less than previous stored reading (${prevOdo} km).`);
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('driverId', formData.driverId);
      data.append('vehicleId', formData.vehicleId);
      data.append('fuelType', formData.fuelType);
      data.append('fuelQuantity', formData.fuelQuantity);
      data.append('pricePerLiter', formData.pricePerLiter);
      data.append('odometerReading', formData.odometerReading);
      data.append('odometerImage', odometerFile);

      const res = await api.post('/fuel-requests', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMsg('Fuel request submitted successfully! Admin notification sent for review.');
      setTimeout(() => {
        router.push('/monitor/requests');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit fuel request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MonitorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ClipboardPlus className="w-6 h-6 text-emerald-400" />
            <span>Phase 1 — Pre-Fueling Authorization Request</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit vehicle odometer evidence and requested liters to the Admin for approval prior to fueling.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Driver & Vehicle Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Driver</span>
              </label>
              <select
                required
                value={formData.driverId}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">Choose managed driver...</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.fullName} ({d.licenseNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Fleet Vehicle</span>
              </label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">Choose vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} — {v.vehicleName} (Prev: {v.currentOdometer?.toLocaleString()} km)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fuel Quantity, Type, Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="DIESEL">DIESEL</option>
                <option value="PETROL">PETROL</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Requested Liters (L)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="e.g. 45"
                value={formData.fuelQuantity}
                onChange={(e) => setFormData({ ...formData, fuelQuantity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Price / Liter (ETB)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="72.50"
                value={formData.pricePerLiter}
                onChange={(e) => setFormData({ ...formData, pricePerLiter: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Odometer Reading & Mandatory Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-4 border-t border-slate-800">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Current Vehicle Odometer Reading (km)
              </label>
              <input
                type="number"
                min={prevOdo}
                required
                placeholder={prevOdo ? `e.g. ${prevOdo + 100}` : 'e.g. 45300'}
                value={formData.odometerReading}
                onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
              {selectedVehicle && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Last known reading: <span className="font-mono text-slate-300 font-medium">{prevOdo.toLocaleString()} km</span>.
                  {distance > 0 && <span className="text-emerald-400 font-medium ml-1">({distance} km traveled)</span>}
                </p>
              )}

              {/* Preliminary Math Preview */}
              <div className="mt-4 p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center space-x-1.5 text-slate-300 font-semibold text-[11px]">
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preliminary Estimate</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Estimated Total Amount:</span>
                  <span className="font-mono font-bold text-slate-200">{estTotal.toFixed(2)} ETB</span>
                </div>
                {selectedVehicle?.averageFuelConsumption && distance > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Expected Consumption:</span>
                    <span className="font-mono text-slate-200">
                      {(distance / selectedVehicle.averageFuelConsumption).toFixed(1)} L (@ {selectedVehicle.averageFuelConsumption} km/L)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mandatory Image Upload */}
            <div>
              <label className="block font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Odometer Photo Evidence</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  MANDATORY
                </span>
              </label>

              <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-950/50 flex flex-col items-center justify-center min-h-[170px]">
                <input
                  type="file"
                  accept="image/*"
                  required
                  capture="environment"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                {imagePreview ? (
                  <div className="relative w-full h-36">
                    <img
                      src={imagePreview}
                      alt="Odometer Preview"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono">
                      Photo Attached
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-300">Click to capture or upload photo</p>
                    <p className="text-[10px] text-slate-500 mt-1">Digits on odometer must be clearly visible</p>
                  </>
                )}
              </div>
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
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting to Admin...</span>
              ) : (
                <>
                  <span>Submit Phase 1 Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MonitorLayout>
  );
}
