'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import { Users, UserPlus, Search, Copy, Check, ShieldAlert } from 'lucide-react';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    licenseNumber: '',
    assignedVehicleId: '',
  });
  const [error, setError] = useState('');

  const fetchDriversAndVehicles = async () => {
    try {
      const [drvRes, vehRes] = await Promise.all([
        api.get(`/drivers?search=${search}`),
        api.get('/vehicles/active'),
      ]);
      setDrivers(drvRes.data.data);
      setVehicles(vehRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriversAndVehicles();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/drivers', formData);
      setShowModal(false);
      setCreatedCreds(res.data.data);
      setShowCredsModal(true);
      setFormData({ fullName: '', phoneNumber: '', licenseNumber: '', assignedVehicleId: '' });
      fetchDriversAndVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create driver');
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/drivers/${id}/status`, { status: newStatus });
      fetchDriversAndVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  const copyCredentials = () => {
    if (!createdCreds) return;
    const text = `FFFDMS Driver Login Credentials\nUsername: ${createdCreds.credentials.username}\nTemporary Password: ${createdCreds.credentials.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              <span>Fleet Drivers</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage personnel, vehicle assignments, and credentials</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Driver</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by name, phone, or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </div>

        {/* Driver List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading driver roster...</div>
          ) : drivers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No drivers found in system.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Full Name</th>
                    <th className="px-5 py-3.5">Username</th>
                    <th className="px-5 py-3.5">Phone Number</th>
                    <th className="px-5 py-3.5">License Number</th>
                    <th className="px-5 py-3.5">Assigned Vehicle</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {drivers.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-100">{d.fullName}</td>
                      <td className="px-5 py-4 font-mono text-xs text-amber-400/90">{d.userId?.username || '—'}</td>
                      <td className="px-5 py-4 text-slate-400">{d.phoneNumber}</td>
                      <td className="px-5 py-4 font-mono text-xs">{d.licenseNumber}</td>
                      <td className="px-5 py-4">
                        {d.assignedVehicleId ? (
                          <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded text-slate-200">
                            {d.assignedVehicleId.plateNumber} ({d.assignedVehicleId.vehicleName})
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-bold border ${
                            d.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleStatusToggle(d._id, d.status)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            d.status === 'ACTIVE'
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                          }`}
                        >
                          {d.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Driver Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-bold text-slate-100 mb-4">Register New Driver Account</h2>

              {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{error}</div>}

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe Kebede"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+251911..."
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Driver License Number</label>
                  <input
                    type="text"
                    required
                    placeholder="DL-998877"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Assign Fleet Vehicle</label>
                  <select
                    value={formData.assignedVehicleId}
                    onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                  >
                    <option value="">Select vehicle assignment...</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.plateNumber} - {v.vehicleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                  >
                    Generate Credentials
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Credentials Popup Modal */}
        {showCredsModal && createdCreds && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <ShieldAlert className="w-7 h-7 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-100">Driver Account Credentials</h2>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs mb-4">
                <div>
                  <span className="text-slate-500 block text-[10px]">DRIVER NAME:</span>
                  <span className="text-slate-200 font-bold">{createdCreds.driver?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">USERNAME:</span>
                  <span className="text-amber-400 font-bold text-sm">{createdCreds.credentials?.username}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TEMPORARY PASSWORD:</span>
                  <span className="text-rose-400 font-bold text-sm bg-rose-500/10 px-2 py-1 rounded inline-block">
                    {createdCreds.credentials?.tempPassword}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-amber-400/90 mb-5 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                ⚠️ Write down or copy these credentials now. The driver must change this password upon first login.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={copyCredentials}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
                </button>
                <button
                  onClick={() => setShowCredsModal(false)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
