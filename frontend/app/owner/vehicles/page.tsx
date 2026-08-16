'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import { Truck, Plus, Search, Archive, Edit, CheckCircle } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    vehicleName: '',
    brand: '',
    model: '',
    manufacturingYear: new Date().getFullYear(),
    fuelType: 'DIESEL',
    tankCapacity: 80,
    averageFuelConsumption: 10,
    currentOdometer: 0,
  });
  const [error, setError] = useState('');

  const fetchVehicles = async () => {
    try {
      const res = await api.get(`/vehicles?search=${search}`);
      setVehicles(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/vehicles', formData);
      setShowModal(false);
      setFormData({
        plateNumber: '',
        vehicleName: '',
        brand: '',
        model: '',
        manufacturingYear: new Date().getFullYear(),
        fuelType: 'DIESEL',
        tankCapacity: 80,
        averageFuelConsumption: 10,
        currentOdometer: 0,
      });
      fetchVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create vehicle');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/vehicles/${id}/status`, { status });
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-500" />
              <span>Fleet Vehicles</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage corporate vehicles and fuel baseline metrics</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by plate, name, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        {/* Vehicle Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading vehicle records...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No vehicles found. Add your first fleet vehicle!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Plate Number</th>
                    <th className="px-5 py-3.5">Vehicle Name</th>
                    <th className="px-5 py-3.5">Make & Model</th>
                    <th className="px-5 py-3.5">Fuel Type</th>
                    <th className="px-5 py-3.5">Tank Capacity</th>
                    <th className="px-5 py-3.5">Avg Consumption</th>
                    <th className="px-5 py-3.5">Odometer</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {vehicles.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">{v.plateNumber}</td>
                      <td className="px-5 py-4 font-medium text-slate-100">{v.vehicleName}</td>
                      <td className="px-5 py-4">{v.brand} {v.model} ({v.manufacturingYear})</td>
                      <td className="px-5 py-4 font-mono text-xs">{v.fuelType}</td>
                      <td className="px-5 py-4">{v.tankCapacity} L</td>
                      <td className="px-5 py-4">{v.averageFuelConsumption} km/L</td>
                      <td className="px-5 py-4 font-mono">{v.currentOdometer?.toLocaleString()} km</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-bold border ${
                            v.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {v.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(v._id, 'ARCHIVED')}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Archive Vehicle"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(v._id, 'ACTIVE')}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                            title="Activate Vehicle"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <h2 className="text-lg font-bold text-slate-100 mb-4">Register New Fleet Vehicle</h2>

              {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{error}</div>}

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Plate Number</label>
                    <input
                      type="text"
                      required
                      placeholder="AA-12345"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Vehicle Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Toyota Hilux #1"
                      value={formData.vehicleName}
                      onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Brand</label>
                    <input
                      type="text"
                      required
                      placeholder="Toyota"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Model</label>
                    <input
                      type="text"
                      required
                      placeholder="Hilux"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Year</label>
                    <input
                      type="number"
                      required
                      value={formData.manufacturingYear}
                      onChange={(e) => setFormData({ ...formData, manufacturingYear: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Fuel Type</label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    >
                      <option value="DIESEL">DIESEL</option>
                      <option value="PETROL">PETROL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Tank Capacity (L)</label>
                    <input
                      type="number"
                      required
                      value={formData.tankCapacity}
                      onChange={(e) => setFormData({ ...formData, tankCapacity: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Avg Cons. (km/L)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.averageFuelConsumption}
                      onChange={(e) => setFormData({ ...formData, averageFuelConsumption: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Current Odometer (km)</label>
                  <input
                    type="number"
                    required
                    value={formData.currentOdometer}
                    onChange={(e) => setFormData({ ...formData, currentOdometer: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                  >
                    Save Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
