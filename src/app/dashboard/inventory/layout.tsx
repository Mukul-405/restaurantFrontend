import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requirePermissions={['MANAGE_INVENTORY']}>{children}</ProtectedRoute>;
}
