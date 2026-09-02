'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetcher } from '../lib/fetcher';
import { setAccessToken } from '../lib/token';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN_STAFF' | 'RECEPTIONIST';

// One value per sidebar section — mirrors the backend Permission enum.
export type Permission =
  | 'MANAGE_MEMBERS'
  | 'MANAGE_MENU'
  | 'MANAGE_BAR_MENU'
  | 'MANAGE_INVENTORY'
  | 'VIEW_ANALYSIS'
  | 'PRINT_KOTS'
  | 'MANAGE_ROOMS'
  | 'MANAGE_RESERVATIONS'
  | 'VIEW_ROOM_STATUS'
  | 'MANAGE_ORDERS';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
}

// SUPERADMIN passes every check, same rule as the backend's `hasPermission`.
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  if (user.role === 'SUPERADMIN') return true;
  return user.permissions.includes(permission);
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleLogoutEvent = () => {
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [router]);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        // We no longer check for a refresh token in localStorage since it's an HTTP-Only cookie.
        // We just attempt to get the current user. If the cookie is present and valid, the API
        // will return the user or the interceptor will refresh the access token automatically.
        const data = await fetcher.getCurrentUser();
        setUser(data.user);
      } catch (error) {
        console.error('Auth hydration failed:', error);
        setAccessToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };

    hydrateAuth();
  }, []);

  const login = (accessToken: string, userData: User) => {
    setAccessToken(accessToken);
    setUser(userData);
    // Which sections a role gets access to now varies per-user, not per-role,
    // so land on the generic dashboard and let the sidebar guide them.
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await fetcher.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
