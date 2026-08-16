'use client';

import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { api } from '@/lib/api';
import { Bell, CheckCircle } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Bell className="w-6 h-6 text-amber-500" />
              <span>In-App Alert Center</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Notifications and critical fraud event triggers</p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading notification center...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No notifications found.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 flex items-start space-x-3 transition-colors ${
                    n.isRead ? 'bg-slate-900/50 text-slate-400' : 'bg-amber-500/5 text-slate-100'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-200">{n.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
