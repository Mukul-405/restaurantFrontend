import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requirePermissions={['VIEW_ANALYSIS']}>{children}</ProtectedRoute>;
}
