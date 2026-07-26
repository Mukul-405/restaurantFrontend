import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function RoomManageLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requirePermissions={['MANAGE_ROOMS']}>{children}</ProtectedRoute>;
}
