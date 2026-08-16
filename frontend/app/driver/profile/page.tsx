'use client';

import React, { useState, useEffect } from 'react';
import { DriverLayout } from '@/components/layout/DriverLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, Shield, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setProfile(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <DriverLayout>
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            <span>Driver Profile Account</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Your registered personnel details and fleet assignment</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          {loading ? (
            <div className="text-center text-slate-500 text-sm">Loading profile...</div>
          ) : (
            <>
              <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{profile?.driver?.fullName || user?.username}</h3>
                  <p className="text-xs text-slate-400 font-mono">ROLE: {profile?.role}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-500">USERNAME:</span>
                  <span className="text-slate-200">{profile?.username}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-500">PHONE NUMBER:</span>
                  <span className="text-slate-200">{profile?.driver?.phoneNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-500">LICENSE NUMBER:</span>
                  <span className="text-slate-200">{profile?.driver?.licenseNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">ASSIGNED VEHICLE:</span>
                  <span className="text-emerald-400 font-bold">
                    {profile?.driver?.assignedVehicleId?.plateNumber || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Link
                  href="/change-password"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
                >
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Update Account Password</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </DriverLayout>
  );
}
