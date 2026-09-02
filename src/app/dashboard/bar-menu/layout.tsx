import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function BarMenuLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requirePermissions={['MANAGE_BAR_MENU']}>{children}</ProtectedRoute>;
}
