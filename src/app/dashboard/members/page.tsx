'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { fetcher } from '../../../lib/fetcher';
import { User } from '../../../context/AuthContext';

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', role: 'WAITER', password: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await fetcher.getUsers();
      setMembers(data);
    } catch (err: any) {
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.phoneNumber || !formData.role) {
      setFormError('Name, Phone Number, and Role are required.');
      return;
    }
    try {
      setFormLoading(true);
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password;
      await fetcher.createUser(payload);
      setIsAddModalOpen(false);
      setFormData({ name: '', phoneNumber: '', role: 'WAITER', password: '' });
      fetchMembers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create member');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleBlockStatus = async (user: User) => {
    try {
      if (user.isActive) {
        await fetcher.blockUser(user.id);
      } else {
        await fetcher.unblockUser(user.id);
      }
      fetchMembers();
    } catch (err: any) {
      alert('Failed to update block status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    try {
      setFormLoading(true);
      await fetcher.deleteUser(memberToDelete.id);
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err: any) {
      alert('Failed to delete member');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <h1 className="text-[1.8rem] font-bold">Team Members</h1>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add New Member</span>
        </button>
      </header>

      {error && (
        <div className="p-3 bg-danger/10 text-danger rounded-lg border border-danger/20">
          {error}
        </div>
      )}

      <div className="w-full overflow-x-auto bg-surface/60 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-sm uppercase tracking-wide">Name</th>
              <th className="p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-sm uppercase tracking-wide">Phone Number</th>
              <th className="p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-sm uppercase tracking-wide">Role</th>
              <th className="p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-sm uppercase tracking-wide">Status</th>
              <th className="p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-sm uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-10">
                  <div className="w-12 h-12 border-4 border-white/10 border-t-primary rounded-full animate-spin mx-auto"></div>
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-10 text-slate-400">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="transition-colors duration-200 hover:bg-white/[0.03]">
                  <td className="p-4 text-left border-b border-white/10">{member.name}</td>
                  <td className="p-4 text-left border-b border-white/10">{member.phoneNumber}</td>
                  <td className="p-4 text-left border-b border-white/10">
                    <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded font-bold uppercase">
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4 text-left border-b border-white/10">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                      member.isActive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}>
                      {member.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="p-4 text-left border-b border-white/10">
                    <div className="flex gap-2">
                      <button 
                        className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 rounded transition-colors duration-200 hover:bg-white/10 hover:text-slate-200"
                        onClick={() => toggleBlockStatus(member)}
                        title={member.isActive ? "Block User" : "Unblock User"}
                      >
                        {member.isActive ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                      </button>
                      <button 
                        className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 rounded transition-colors duration-200 hover:bg-white/10 hover:text-danger"
                        onClick={() => {
                          setMemberToDelete(member);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-[500px] p-8 bg-surface border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add New Member</h2>
                <button className="bg-transparent border-none text-slate-400 hover:text-slate-200 cursor-pointer p-1" onClick={() => setIsAddModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="mb-4 flex flex-col">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="mb-4 flex flex-col">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                  <input 
                    type="text" 
                    className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                  />
                </div>
                <div className="mb-4 flex flex-col">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                  <select 
                    className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base outline-none appearance-none [&>option]:bg-surface [&>option]:text-slate-200"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="WAITER">WAITER</option>
                    <option value="CASHIER">CASHIER</option>
                    <option value="KITCHEN_STAFF">KITCHEN_STAFF</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                  </select>
                </div>
                <div className="mb-4 flex flex-col">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Password (Optional)</label>
                  <input 
                    type="password" 
                    className="w-full bg-black/20 border border-white/10 text-slate-200 px-4 py-3 rounded-lg font-sans text-base transition-all duration-300 outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-light)]" 
                    placeholder="Auto-generated if empty"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
                
                {formError && <div className="text-danger text-sm mt-4 text-center">{formError}</div>}

                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-transparent border border-white/10 text-slate-200 hover:bg-white/5" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]" disabled={formLoading}>
                    {formLoading ? 'Saving...' : 'Save Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-[500px] p-8 bg-surface border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Confirm Deletion</h2>
                <button className="bg-transparent border-none text-slate-400 hover:text-slate-200 cursor-pointer p-1" onClick={() => setIsDeleteModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="flex gap-4 items-start text-slate-400">
                <AlertCircle size={24} className="text-danger shrink-0" />
                <p>
                  Are you sure you want to delete <strong className="text-slate-200">{memberToDelete?.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-transparent border border-white/10 text-slate-200 hover:bg-white/5" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-danger text-white hover:bg-danger-hover" onClick={handleDeleteConfirm} disabled={formLoading}>
                  {formLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
