'use client';

import React, { useEffect } from 'react';
import { useAuth, hasPermission, Permission } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Any one of these permissions is enough — SUPERADMIN always passes.
  requirePermissions?: Permission[];
}

export default function ProtectedRoute({ children, requirePermissions }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const allowed = !requirePermissions || requirePermissions.some(p => hasPermission(user, p));

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!allowed) {
        // Redirect to a default dashboard if they don't have access to this specific route
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router, allowed]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || !allowed) {
    return null;
  }

  return <>{children}</>;
}
