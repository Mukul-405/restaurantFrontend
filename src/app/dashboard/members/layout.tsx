import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['ADMIN']}>{children}</ProtectedRoute>;
}
