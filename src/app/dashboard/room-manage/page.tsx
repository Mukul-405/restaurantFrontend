'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchRoomTypes, fetchAvailability, createRoomType, updateRoomType, deleteRoomType, addRoomToType, deleteRoomFromType } from '../../../store/slices/roomTypesSlice';
import { Plus, Edit2, Trash2, IndianRupee, Users as UsersIcon, Home, Calculator, User } from 'lucide-react';
import toast from 'react-hot-toast';
import RoomTypeModal from '../../../components/modals/RoomTypeModal';
import GenericDeleteModal from '../../../components/modals/GenericDeleteModal';
import CalculatePriceModal from '../../../components/modals/CalculatePriceModal';
import AddRoomModal from '../../../components/modals/AddRoomModal';
import GuestDetailsModal from '../../../components/modals/GuestDetailsModal';

export default function RoomManagePage() {
  const dispatch = useAppDispatch();
  const { roomTypes } = useAppSelector(state => state.roomTypes);

  const [activeTab, setActiveTab] = useState<'types' | 'rooms'>('types');
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [roomFilter, setRoomFilter] = useState<'all' | number>('all');


  const [rtModalOpen, setRtModalOpen] = useState(false);
  const [editingRt, setEditingRt] = useState<any>(null);

  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'roomType' | 'room', id: number | null, name: string, roomNumber?: string }>({ type: 'roomType', id: null, name: '' });

  const [calcPriceModalOpen, setCalcPriceModalOpen] = useState(false);
  const [selectedRtForCalc, setSelectedRtForCalc] = useState<any>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const todayStr = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    dispatch(fetchRoomTypes());
  }, [dispatch]);

  const handleFetch = async () => {
    setFetchError('');
    if (!startDate || !endDate) {
      setFetchError('Please select both start date and end date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFetchError('End date must be same or after start date.');
      return;
    }
    setIsFetching(true);
    try {
      await dispatch(fetchAvailability({ startDate, endDate })).unwrap();
    } catch (err) {
      console.error(err);
      setFetchError('Failed to fetch availability.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveRt = async (data: any) => {
    if (editingRt) {
      await dispatch(updateRoomType({ id: editingRt.id, data })).unwrap();
    } else {
      await dispatch(createRoomType(data)).unwrap();
    }
  };

  const handleSaveRoom = async (roomTypeId: number, roomNumber: string) => {
    try {
      await dispatch(addRoomToType({ id: roomTypeId, roomData: { roomNumber, status: 'no status' } })).unwrap();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteRoom = (roomTypeId: number, roomNumber: string) => {
    setDeleteTarget({ type: 'room', id: roomTypeId, name: `Room ${roomNumber}`, roomNumber });
    setDeleteModalOpen(true);
  };

  const handleDeleteRt = (id: number, name: string) => {
    setDeleteTarget({ type: 'roomType', id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget.id) return;
    try {
      if (deleteTarget.type === 'roomType') {
        await dispatch(deleteRoomType(deleteTarget.id)).unwrap();
      } else if (deleteTarget.type === 'room' && deleteTarget.roomNumber) {
        await dispatch(deleteRoomFromType({ id: deleteTarget.id, roomNumber: deleteTarget.roomNumber })).unwrap();
      }
      setDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete ${deleteTarget.type}`);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Room Management</h1>
          <p className="text-slate-400 text-sm">Configure your room types and manage individual room inventory seamlessly.</p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'types') {
              setEditingRt(null);
              setRtModalOpen(true);
            } else {
              setAddRoomModalOpen(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 w-fit"
        >
          <Plus size={18} />
          <span>{activeTab === 'types' ? 'Add Room Type' : 'Add Room'}</span>
        </button>
      </div>

      {activeTab === 'types' && (
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-4 bg-surface/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="date"
                min={todayStr}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => {
                  try { e.currentTarget.showPicker() } catch (err) { }
                }}
                className="bg-black/20 border border-white/10 px-4 py-2 rounded-xl text-slate-200 outline-none focus:border-primary text-sm font-medium w-full md:w-40 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-slate-500 font-semibold">to</span>
              <input
                type="date"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => {
                  try { e.currentTarget.showPicker() } catch (err) { }
                }}
                className="bg-black/20 border border-white/10 px-4 py-2 rounded-xl text-slate-200 outline-none focus:border-primary text-sm font-medium w-full md:w-40 cursor-pointer"
              />
            </div>
            <button
              onClick={handleFetch}
              disabled={isFetching}
              className="w-full md:w-auto px-6 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isFetching ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching...
                </>
              ) : (
                'Fetch Availability'
              )}
            </button>
          </div>
          {fetchError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 w-fit">
              <p className="text-sm font-medium">{fetchError}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-10 items-center bg-surface/40 backdrop-blur-xl p-2.5 rounded-2xl border border-white/5 shadow-2xl w-fit">
        <button
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-full ${activeTab === 'types'
              ? 'bg-gradient-to-r from-[#c58356] to-[#b06f44] text-white shadow-[0_0_20px_rgba(197,131,86,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
        >
          <Home size={16} />
          Room Type
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-full ${activeTab === 'rooms'
              ? 'bg-gradient-to-r from-[#c58356] to-[#b06f44] text-white shadow-[0_0_20px_rgba(197,131,86,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
        >
          <UsersIcon size={16} />
          Room
        </button>

      </div>

      <div>
        {activeTab === 'types' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {roomTypes.map(rt => (
              <div key={rt.id} className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/20 transition-all overflow-hidden group">
                <div className="p-5 border-b border-white/5 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-primary blur-2xl group-hover:opacity-20 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-3 relative gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl font-black text-white tracking-tight break-words leading-tight">{rt.name}</h3>
                      <div className="mt-2 flex items-center gap-2 max-w-full">
                        <span className="text-xs font-mono font-bold bg-white/10 text-slate-300 px-2.5 py-1 rounded-md tracking-wider break-all inline-block whitespace-normal">{rt.roomCode}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${rt.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rt.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {rt.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-1 relative">{rt.description || 'No description provided.'}</p>
                </div>

                <div className="p-5 bg-black/10 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <IndianRupee size={14} /> <span className="text-[11px] uppercase font-bold tracking-wider">Prices</span>
                      </div>
                      <div className="text-sm text-white font-medium">
                        ₹{rt.basePrice || 0} <span className="text-slate-500 text-xs font-normal">Base</span>
                      </div>
                      <div className="text-sm text-white font-medium">
                        ₹{rt.extraPersonAmount || 0} <span className="text-slate-500 text-xs font-normal">Extra</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <UsersIcon size={14} /> <span className="text-[11px] uppercase font-bold tracking-wider">Capacity</span>
                      </div>
                      <div className="text-sm text-white font-medium">
                        {rt.maxAdults} <span className="text-slate-500 text-xs font-normal">Adults</span>
                      </div>
                      <div className="text-sm text-white font-medium">
                        {rt.maxChildren} <span className="text-slate-500 text-xs font-normal">Children</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2 mt-2 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Home size={14} /> <span className="text-[11px] uppercase font-bold tracking-wider">Rooms</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-white font-bold">{rt.totalRooms}</span> <span className="text-slate-500 text-xs">Total</span>
                          <span className="mx-2 text-white/20">&bull;</span>
                          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{rt.availableRooms || 0}</span> <span className="text-emerald-500/70 text-xs">Available</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/20 flex items-center gap-2 border-t border-white/5">
                  <button onClick={() => { setSelectedRtForCalc(rt); setCalcPriceModalOpen(true); }} className="flex-[1.2] inline-flex justify-center items-center gap-2 px-3 py-2 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300 rounded-xl transition-colors border border-blue-500/20">
                    <Calculator size={14} /> Calc Price
                  </button>
                  <button onClick={() => { setEditingRt(rt); setRtModalOpen(true); }} className="flex-[0.9] inline-flex justify-center items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white rounded-xl transition-colors border border-white/10">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDeleteRt(rt.id, rt.name)} className="flex-[0.9] inline-flex justify-center items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors border border-rose-500/20">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
            
            {roomTypes.length === 0 && (
              <div className="col-span-full p-16 text-center border-2 border-dashed border-white/10 rounded-3xl text-slate-400 bg-surface/30 backdrop-blur-sm">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-slate-500"><Home size={32} /></div>
                <h3 className="text-xl font-bold text-white mb-2">No Room Types Found</h3>
                <p>Get started by clicking the "Add Room Type" button above.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 bg-surface/30 p-4 rounded-2xl border border-white/5">
              <div className="text-slate-400 text-sm font-medium">
                Total Rooms: <span className="text-white font-bold">{roomTypes.reduce((acc, rt) => acc + (rt.rooms?.length || 0), 0)}</span>
              </div>
              <select
                className="bg-surface/50 border border-white/10 px-4 py-2 rounded-xl text-slate-200 outline-none focus:border-primary text-sm min-w-[200px]"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All Room Types</option>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {roomTypes
                .filter(rt => roomFilter === 'all' || rt.id === roomFilter)
                .flatMap(rt => 
                  (rt.rooms || []).map((room: any, idx: number) => (
                    <div key={`${rt.id}-${room.roomNumber}-${idx}`} className="bg-surface/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/20 transition-all">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Room</span>
                            <h3 className="text-2xl font-black text-white tracking-tight">{room.roomNumber}</h3>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            room.status === 'checked in' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${room.status === 'checked in' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                            {room.status === 'checked in' ? 'Checked In' : 'Available'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg w-fit">
                          <Home size={12} className="text-slate-400" /> 
                          <span className="font-medium">{rt.name}</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-2">
                        {room.status === 'checked in' && room.userRoomBookingId ? (
                          <button 
                            onClick={() => { setSelectedBookingId(Number(room.userRoomBookingId)); setGuestModalOpen(true); }} 
                            className="flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 hover:text-sky-300 rounded-xl transition-colors border border-sky-500/20"
                          >
                            <User size={14} /> View Guest
                          </button>
                        ) : (
                          <div className="flex-1 text-[11px] text-slate-500 italic">Vacant</div>
                        )}
                        
                        <button 
                          onClick={() => handleDeleteRoom(rt.id, room.roomNumber)} 
                          title="Delete Room"
                          className="p-2 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors border border-rose-500/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                ))
              )}
            </div>
            
            {roomTypes
              .filter(rt => roomFilter === 'all' || rt.id === roomFilter)
              .every(rt => !rt.rooms || rt.rooms.length === 0) && (
              <div className="p-16 text-center border-2 border-dashed border-white/10 rounded-3xl text-slate-400 bg-surface/30 backdrop-blur-sm">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-slate-500"><UsersIcon size={32} /></div>
                <h3 className="text-xl font-bold text-white mb-2">No Rooms Found</h3>
                <p>Click "Add Room" to create a new room for a room type.</p>
              </div>
            )}
          </div>
        )}


      </div>

      <RoomTypeModal isOpen={rtModalOpen} onClose={() => setRtModalOpen(false)} onSave={handleSaveRt} initialData={editingRt} />
      <AddRoomModal isOpen={addRoomModalOpen} onClose={() => setAddRoomModalOpen(false)} onSave={handleSaveRoom} roomTypes={roomTypes} />
      <GuestDetailsModal isOpen={guestModalOpen} onClose={() => setGuestModalOpen(false)} bookingId={selectedBookingId} onRefresh={() => dispatch(fetchRoomTypes())} />
      <CalculatePriceModal isOpen={calcPriceModalOpen} onClose={() => setCalcPriceModalOpen(false)} roomType={selectedRtForCalc} />
      <GenericDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={deleteTarget.type === 'room' ? 'Delete Room?' : 'Delete Room Type?'}
        message={<span>Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong>? This action cannot be undone.</span>}
      />
    </div>
  );
}
