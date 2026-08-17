'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  Truck,
  Users,
  Fuel,
  ClipboardCheck,
  AlertTriangle,
  FileBarChart,
  Bell,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const [notifRes, sumRes] = await Promise.all([
          api.get('/notifications?unreadOnly=true'),
          api.get('/dashboard/summary'),
        ]);
        setUnreadAlerts(notifRes.data.unreadCount || 0);
        setPendingRequests(sumRes.data.data?.pendingRequests || 0);
      } catch {
        // ignore
      }
    };
    fetchCounters();
    const interval = setInterval(fetchCounters, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Fuel Requests', href: '/owner/requests', icon: ClipboardCheck, badge: pendingRequests, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { name: 'Fuel Transactions', href: '/owner/transactions', icon: Fuel },
    { name: 'Vehicles', href: '/owner/vehicles', icon: Truck },
    { name: 'Drivers', href: '/owner/drivers', icon: Users },
    { name: 'Fraud Alerts', href: '/owner/fraud-alerts', icon: AlertTriangle, badge: unreadAlerts, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { name: 'Reports', href: '/owner/reports', icon: FileBarChart },
    { name: 'Notifications', href: '/owner/notifications', icon: Bell, badge: unreadAlerts, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { name: 'Audit Logs', href: '/owner/audit-logs', icon: History },
    { name: 'Settings', href: '/owner/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-6 w-6 text-amber-500" />
          <span className="font-bold text-lg tracking-wide text-amber-400">FFFDMS</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col justify-between`}
      >
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <ShieldAlert className="h-7 w-7 text-amber-500 mr-3" />
            <div>
              <h1 className="font-bold text-lg text-amber-400 tracking-wider">FFFDMS</h1>
              <p className="text-[10px] text-slate-400 tracking-tight">Fleet Fuel Fraud Detection</p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className={`px-2 py-0.5 text-xs border rounded-full font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-amber-400/80 font-mono">ADMIN / OWNER</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900/50 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-950 min-h-screen p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
