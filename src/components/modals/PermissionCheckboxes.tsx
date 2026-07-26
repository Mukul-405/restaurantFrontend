import React from 'react';
import { Permission } from '../../context/AuthContext';

// Labels mirror the sidebar section names so what an admin ticks here
// matches what the member will see.
const PERMISSION_LABELS: { value: Permission; label: string }[] = [
  { value: 'MANAGE_MEMBERS', label: 'Can Manage Members' },
  { value: 'MANAGE_MENU', label: 'Can Manage Menu' },
  { value: 'VIEW_ANALYSIS', label: 'Can View Analysis' },
  { value: 'PRINT_KOTS', label: 'Can Print KOTs' },
  { value: 'MANAGE_ROOMS', label: 'Can Manage Rooms' },
  { value: 'MANAGE_RESERVATIONS', label: 'Can Manage Reservations' },
  { value: 'VIEW_ROOM_STATUS', label: 'Can View Room Status' },
  { value: 'MANAGE_ORDERS', label: 'Can Manage Orders' },
];

interface PermissionCheckboxesProps {
  value: Permission[];
  onChange: (next: Permission[]) => void;
}

export default function PermissionCheckboxes({ value, onChange }: PermissionCheckboxesProps) {
  const toggle = (perm: Permission) => {
    onChange(value.includes(perm) ? value.filter(p => p !== perm) : [...value, perm]);
  };

  return (
    <div className="mb-4 flex flex-col">
      <label className="block text-sm font-medium text-slate-400 mb-2">Permissions</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/20 border border-white/10 rounded-lg p-4">
        {PERMISSION_LABELS.map(({ value: perm, label }) => (
          <label key={perm} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary w-4 h-4"
              checked={value.includes(perm)}
              onChange={() => toggle(perm)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
