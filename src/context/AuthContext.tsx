'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetcher } from '../lib/fetcher';
import { getRefreshToken, setAccessToken, setRefreshToken } from '../lib/token';

export type UserRole = 'ADMIN' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN_STAFF' | 'RECEPTIONIST';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
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
      logout();
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  useEffect(() => {
    const hydrateAuth = async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // Since accessToken is in memory and starts null, api request to /auth/me will fail with 401 initially.
          // The interceptor will catch it, use the refresh token to get a new access token, and retry the request.
          const data = await fetcher.getCurrentUser();
          setUser(data.user);
        } catch (error) {
          console.error('Auth hydration failed:', error);
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
          if (pathname?.startsWith('/dashboard')) {
            router.push('/login');
          }
        }
      } else {
        if (pathname?.startsWith('/dashboard')) {
          router.push('/login');
        }
      }
      setIsLoading(false);
    };

    hydrateAuth();
  }, [pathname, router]);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(userData);
    if (userData.role === 'ADMIN') {
      router.push('/dashboard/members');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await fetcher.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
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
