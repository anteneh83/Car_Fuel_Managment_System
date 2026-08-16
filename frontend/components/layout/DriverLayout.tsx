'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  UserCheck,
  KeyRound,
  LogOut,
  Menu,
  X,
  Fuel,
} from 'lucide-react';

export function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/driver/dashboard', icon: LayoutDashboard },
    { name: 'Log New Fuel', href: '/driver/new-transaction', icon: PlusCircle },
    { name: 'My History', href: '/driver/my-transactions', icon: History },
    { name: 'My Profile', href: '/driver/profile', icon: UserCheck },
    { name: 'Change Password', href: '/change-password', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Fuel className="h-6 w-6 text-emerald-400" />
          <span className="font-bold text-lg tracking-wide text-emerald-400">Driver Portal</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Driver Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col justify-between`}
      >
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <Fuel className="h-7 w-7 text-emerald-400 mr-3" />
            <div>
              <h1 className="font-bold text-lg text-emerald-400 tracking-wider">FFFDMS</h1>
              <p className="text-[10px] text-slate-400 tracking-tight">Driver Fuel Portal</p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
              {user?.username?.[0]?.toUpperCase() || 'D'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.username}</p>
              <p className="text-xs text-emerald-400/80 font-mono">DRIVER</p>
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
