'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      await refreshUser();
      setTimeout(() => {
        if (user?.role === 'OWNER') router.push('/owner/dashboard');
        else router.push('/driver/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-3">
            <KeyRound className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Security Password Change</h1>
          <p className="text-xs text-slate-400 mt-1">
            {user?.mustChangePassword
              ? 'You are required to change your temporary password on first login.'
              : 'Update your account password below.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center font-medium flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Password changed! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">New Password (Min 8 chars)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
