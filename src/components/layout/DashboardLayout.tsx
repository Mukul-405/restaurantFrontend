'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, LogOut, Menu as MenuIcon, X, Coffee, ShoppingCart, BarChart, Bed, RefreshCw, Utensils, Printer, CalendarDays, Building } from 'lucide-react';
import { useAuth, hasPermission, Permission } from '../../context/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

const NAV_ITEMS: { href: string; label: string; icon: React.ElementType; permission: Permission }[] = [
  { href: '/dashboard/members', label: 'Members', icon: Users, permission: 'MANAGE_MEMBERS' },
  { href: '/dashboard/menu', label: 'Menu', icon: Utensils, permission: 'MANAGE_MENU' },
  { href: '/dashboard/analysis', label: 'Analysis', icon: BarChart, permission: 'VIEW_ANALYSIS' },
  { href: '/dashboard/kots', label: 'Print KOTs', icon: Printer, permission: 'PRINT_KOTS' },
  { href: '/dashboard/room-manage', label: 'Manage Rooms', icon: Building, permission: 'MANAGE_ROOMS' },
  { href: '/dashboard/book-room', label: 'Reservation', icon: CalendarDays, permission: 'MANAGE_RESERVATIONS' },
  { href: '/dashboard/channel-manager', label: 'Room Status', icon: RefreshCw, permission: 'VIEW_ROOM_STATUS' },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, permission: 'MANAGE_ORDERS' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-200">
        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`fixed inset-y-0 left-0 w-[260px] bg-surface/95 md:bg-surface/60 border-r border-white/10 flex flex-col transition-transform duration-300 z-50 backdrop-blur-xl md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-[70px] px-6 flex justify-between items-center border-b border-white/10">
            <span className="text-2xl font-bold text-primary">Admin Panel</span>
            <button className="md:hidden text-slate-400 hover:text-slate-200 p-1" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 p-4 flex flex-col gap-2">
            {NAV_ITEMS.filter(item => hasPermission(user, item.permission)).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-white/5 hover:text-slate-200 ${pathname === href ? 'bg-primary-light text-primary' : 'text-slate-400'
                  }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="h-[70px] bg-surface/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <button className="md:hidden text-slate-400 hover:text-slate-200 p-1 flex-shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
                <MenuIcon size={24} />
              </button>
              <div className="flex items-center gap-2 md:gap-4 truncate">
                <span className="font-semibold truncate hidden sm:inline">Hello, {user?.name || 'User'}</span>
                <span className="font-semibold truncate sm:hidden">{user?.name || 'User'}</span>
                <span className="text-[10px] sm:text-xs bg-primary-light text-primary px-2 py-1 rounded font-bold uppercase shrink-0">
                  {user?.role || 'Guest'}
                </span>
              </div>
            </div>
            <button className="inline-flex items-center justify-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-sans font-semibold text-xs md:text-sm cursor-pointer transition-all duration-200 bg-transparent border border-white/10 text-slate-200 hover:bg-white/5 shrink-0" onClick={logout}>
              <LogOut size={16} className="hidden sm:block" />
              <span>Logout</span>
            </button>
          </header>

          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
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
