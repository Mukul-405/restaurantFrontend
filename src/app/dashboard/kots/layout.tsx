import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function KotsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requirePermissions={['PRINT_KOTS']}>{children}</ProtectedRoute>;
}
