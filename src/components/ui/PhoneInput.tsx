import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export default function PhoneInput({ value, onChange, className = '', placeholder = 'Phone number' }: PhoneInputProps) {
  return (
    <div className={`flex items-center bg-black/20 border border-white/10 rounded-lg overflow-hidden focus-within:border-primary relative ${className}`}>
      <input 
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9\s-+]/g, ''))} // only allow numbers, spaces, hyphens, and +
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-2 text-slate-200 outline-none text-sm w-full min-w-0"
      />
    </div>
  );
}
