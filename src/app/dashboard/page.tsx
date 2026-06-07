'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="glass-panel p-10 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Dashboard</h1>
      <p className="text-slate-400">
        You are logged in as <strong className="text-slate-200">{user?.name}</strong> ({user?.role}).
      </p>
      {user?.role !== 'ADMIN' && (
        <p className="mt-6 p-4 bg-primary-light/50 text-primary rounded-lg inline-block font-medium">
          More features coming soon for your role.
        </p>
      )}
    </div>
  );
}
