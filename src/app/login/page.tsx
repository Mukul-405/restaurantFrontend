'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetcher } from '../../lib/fetcher';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phoneNumber.length < 4) {
      setError('Phone number must be at least 4 characters long.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const data = await fetcher.login({ phoneNumber, password });
      login(data.accessToken, data.refreshToken, data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or account is inactive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,var(--color-primary-light)_0%,transparent_60%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none" />
      <motion.div
        className="w-full max-w-[420px] p-10 z-10 text-center bg-surface/60 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-bold mb-2 text-slate-200">Welcome Back</h1>
        <p className="text-slate-400 mb-8">Enter your details to access the admin panel.</p>

        <form className="flex flex-col gap-5 text-left" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-400 mb-2" htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              type="text"
              className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]"
              placeholder="e.g., 9876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-400 mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-danger text-sm mt-4 text-center bg-danger/10 p-2.5 rounded-lg border border-danger/20"
            >
              {error}
            </motion.div>
          )}

          <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px] mt-3 w-full !py-3.5" disabled={loading}>
            {loading ? (
              <div className="w-12 h-12 border-4 border-white/10 border-t-primary rounded-full animate-spin !w-5 !h-5 border-2" />
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
