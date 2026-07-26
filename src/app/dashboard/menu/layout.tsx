import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requirePermissions={['MANAGE_MENU']}>{children}</ProtectedRoute>;
}
