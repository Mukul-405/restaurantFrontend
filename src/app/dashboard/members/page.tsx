'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ShieldAlert, ShieldCheck, Key } from 'lucide-react';
import { fetcher } from '../../../lib/fetcher';
import { User } from '../../../context/AuthContext';
import AddMemberModal from '../../../components/modals/AddMemberModal';
import DeleteMemberModal from '../../../components/modals/DeleteMemberModal';
import BlockMemberModal from '../../../components/modals/BlockMemberModal';
import ResetPasswordModal from '../../../components/modals/ResetPasswordModal';

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [memberToBlock, setMemberToBlock] = useState<User | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [memberToReset, setMemberToReset] = useState<User | null>(null);

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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-[1.8rem] font-bold">Team Members</h1>
        <button className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-[1px]" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add New Member</span>
        </button>
      </header>

      {error && (
        <div className="p-3 bg-danger/10 text-danger rounded-lg border border-danger/20">
          {error}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto bg-surface/60 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl relative">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr>
              <th className="p-3 sm:p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">Name</th>
              <th className="p-3 sm:p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">Phone Number</th>
              <th className="p-3 sm:p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">Role</th>
              <th className="p-3 sm:p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">Status</th>
              <th className="p-3 sm:p-4 text-left border-b border-white/10 text-slate-400 font-semibold text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-6 sm:p-10">
                  <div className="w-12 h-12 border-4 border-white/10 border-t-primary rounded-full animate-spin mx-auto"></div>
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-6 sm:p-10 text-slate-400">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="transition-colors duration-200 hover:bg-white/[0.03]">
                  <td className="p-3 sm:p-4 text-left border-b border-white/10 whitespace-nowrap">{member.name}</td>
                  <td className="p-3 sm:p-4 text-left border-b border-white/10 whitespace-nowrap">{member.phoneNumber}</td>
                  <td className="p-3 sm:p-4 text-left border-b border-white/10 whitespace-nowrap">
                    <span className="text-[10px] sm:text-xs bg-primary-light text-primary px-2 py-1 rounded font-bold uppercase">
                      {member.role}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-left border-b border-white/10 whitespace-nowrap">
                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase ${
                      member.isActive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}>
                      {member.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-left border-b border-white/10 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button 
                        className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 rounded transition-colors duration-200 hover:bg-white/10 hover:text-slate-200"
                        onClick={() => {
                          setMemberToReset(member);
                          setIsResetModalOpen(true);
                        }}
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 rounded transition-colors duration-200 hover:bg-white/10 hover:text-slate-200"
                        onClick={() => {
                          setMemberToBlock(member);
                          setIsBlockModalOpen(true);
                        }}
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

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <div className="text-center p-10 bg-surface/60 border border-white/10 rounded-2xl">
            <div className="w-10 h-10 border-4 border-white/10 border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center p-10 text-slate-400 bg-surface/60 border border-white/10 rounded-2xl">
            No members found.
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-slate-200">{member.name}</span>
                  <span className="text-slate-400 text-sm mt-1">{member.phoneNumber}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase shrink-0 ${
                  member.isActive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                }`}>
                  {member.isActive ? 'Active' : 'Blocked'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="text-[10px] sm:text-xs bg-primary-light text-primary px-2 py-1 rounded font-bold uppercase">
                  {member.role}
                </span>
                
                <div className="flex gap-1">
                  <button 
                    className="bg-transparent border-none text-slate-400 cursor-pointer p-2 rounded-lg transition-colors duration-200 hover:bg-white/10 hover:text-slate-200"
                    onClick={() => {
                      setMemberToReset(member);
                      setIsResetModalOpen(true);
                    }}
                    title="Reset Password"
                  >
                    <Key size={18} />
                  </button>
                  <button 
                    className="bg-transparent border-none text-slate-400 cursor-pointer p-2 rounded-lg transition-colors duration-200 hover:bg-white/10 hover:text-slate-200"
                    onClick={() => {
                      setMemberToBlock(member);
                      setIsBlockModalOpen(true);
                    }}
                    title={member.isActive ? "Block User" : "Unblock User"}
                  >
                    {member.isActive ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                  </button>
                  <button 
                    className="bg-transparent border-none text-slate-400 cursor-pointer p-2 rounded-lg transition-colors duration-200 hover:bg-white/10 hover:text-danger"
                    onClick={() => {
                      setMemberToDelete(member);
                      setIsDeleteModalOpen(true);
                    }}
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchMembers} 
      />

      {/* Delete Confirmation Modal */}
      <DeleteMemberModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onSuccess={fetchMembers} 
        member={memberToDelete} 
      />

      {/* Block Confirmation Modal */}
      <BlockMemberModal 
        isOpen={isBlockModalOpen} 
        onClose={() => setIsBlockModalOpen(false)} 
        onSuccess={fetchMembers} 
        member={memberToBlock} 
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)} 
        onSuccess={fetchMembers} 
        member={memberToReset} 
      />
    </div>
  );
}
