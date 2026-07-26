import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function BookRoomLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requirePermissions={['MANAGE_RESERVATIONS']}>{children}</ProtectedRoute>;
}
