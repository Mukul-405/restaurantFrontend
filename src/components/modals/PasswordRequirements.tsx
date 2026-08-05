import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { id: 'lowercase', label: 'At least 1 lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'At least 1 uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'At least 1 number (0-9)', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least 1 special character (!@#$%...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const isPasswordValid = (password: string): boolean => {
  return PASSWORD_RULES.every((rule) => rule.test(password));
};

export const getPasswordError = (password: string): string | null => {
  if (!password) return 'Password is required.';
  if (password.length < 12) return 'Password must be at least 12 characters long.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter (a-z).';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A-Z).';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number (0-9).';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
  return null;
};

interface PasswordRequirementsProps {
  password: string;
}

export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <div className="mt-2.5 p-3.5 bg-black/30 border border-white/10 rounded-xl space-y-2 text-xs">
      <div className="text-slate-400 font-medium mb-1.5 flex items-center justify-between">
        <span>Password Requirements:</span>
        <span className="text-[11px] text-slate-500 font-mono">{password.length}/12+</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PASSWORD_RULES.map((rule) => {
          const isMet = rule.test(password);
          return (
            <div
              key={rule.id}
              className={`flex items-center gap-2 transition-colors duration-200 ${
                isMet ? 'text-emerald-400 font-medium' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-all ${
                  isMet ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' : 'bg-white/5 border border-white/10 text-slate-500'
                }`}
              >
                {isMet ? <Check size={11} strokeWidth={3} /> : <X size={10} />}
              </div>
              <span className="text-[11px]">{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
