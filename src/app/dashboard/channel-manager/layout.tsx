import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function ChannelManagerLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requirePermissions={['VIEW_ROOM_STATUS']}>{children}</ProtectedRoute>;
}
