'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-200">
        <aside className="w-[260px] bg-surface/60 border-r border-white/10 flex flex-col transition-transform duration-300 z-10 backdrop-blur-xl">
          <div className="p-6 text-2xl font-bold text-primary border-b border-white/10">
            Admin Panel
          </div>
          <nav className="flex-1 p-4 flex flex-col gap-2">
            {user?.role === 'ADMIN' && (
              <Link 
                href="/dashboard/members" 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-white/5 hover:text-slate-200 ${
                  pathname === '/dashboard/members' ? 'bg-primary-light text-primary' : 'text-slate-400'
                }`}
              >
                <Users size={20} />
                <span>Members</span>
              </Link>
            )}
            {/* Future links here */}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-[70px] bg-surface/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <span className="font-semibold">Hello, {user?.name || 'User'}</span>
              <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded font-bold uppercase">
                {user?.role || 'Guest'}
              </span>
            </div>
            <button className="btn btn-outline py-2 px-4 text-sm" onClick={logout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </header>

          <div className="flex-1 p-6 overflow-y-auto">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
