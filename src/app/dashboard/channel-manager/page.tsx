/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchCMInventory, fetchCMRates, fetchCMReservations, pushCMInventory, pushCMRates } from '../../../lib/cmApi';
import { getRoomTypes } from '../../../lib/roomsApi';
import { Calendar as CalendarIcon, RefreshCw, Home, IndianRupee, Users, Upload, Download, Plus, Trash2, CheckSquare, Square, Info } from 'lucide-react';

const RestrictionsEditor = ({ restrictions, onChange }: { restrictions: any, onChange: (newRest: any) => void }) => {
  const update = (field: string, value: any) => onChange({ ...restrictions, [field]: value });
  return (
    <div className="flex flex-col gap-4 mt-2 p-4 md:p-5 bg-black/40 rounded-2xl border border-white/10 relative">
      <div className="absolute -top-3 left-6 px-3 py-0.5 bg-[#202128] text-[10px] uppercase font-extrabold tracking-widest text-primary rounded-md border border-white/10 shadow-lg">
        Booking Rules
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer select-none group">
          <div className="pt-0.5">
            <input type="checkbox" checked={restrictions.stopSell} onChange={e => update('stopSell', e.target.checked)} className="w-4 h-4 accent-red-500 cursor-pointer" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">Stop Sell</span>
            <span className="text-[10px] text-slate-400 mt-1 leading-snug">Disable and block all new bookings.</span>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer select-none group">
          <div className="pt-0.5">
            <input type="checkbox" checked={restrictions.closeOnArrival} onChange={e => update('closeOnArrival', e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">Close on Arrival</span>
            <span className="text-[10px] text-slate-400 mt-1 leading-snug">Guests cannot check-in on this date.</span>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer select-none group">
          <div className="pt-0.5">
            <input type="checkbox" checked={restrictions.closeOnDeparture} onChange={e => update('closeOnDeparture', e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">Close on Departure</span>
            <span className="text-[10px] text-slate-400 mt-1 leading-snug">Guests cannot check-out on this date.</span>
          </div>
        </label>
      </div>
      <div className="h-px w-full bg-white/5 my-1"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5 focus-within:border-primary/50 transition-colors">
          <span className="text-xs font-bold text-white">Min. Stay (Nights)</span>
          <span className="text-[10px] text-slate-400 mb-2 leading-snug">Required length of stay.</span>
          <input type="number" placeholder="e.g. 2" value={restrictions.minimumStay} onChange={e => update('minimumStay', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-primary text-xs font-mono" />
        </div>
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5 focus-within:border-primary/50 transition-colors">
          <span className="text-xs font-bold text-white">Max. Stay (Nights)</span>
          <span className="text-[10px] text-slate-400 mb-2 leading-snug">Maximum length of stay.</span>
          <input type="number" placeholder="e.g. 14" value={restrictions.maximumStay} onChange={e => update('maximumStay', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-primary text-xs font-mono" />
        </div>
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5 focus-within:border-primary/50 transition-colors">
          <span className="text-xs font-bold text-white">Min. Adv. Booking</span>
          <span className="text-[10px] text-slate-400 mb-2 leading-snug">How many days in advance.</span>
          <input type="number" placeholder="e.g. 1" value={restrictions.minimumAdvanceReservation} onChange={e => update('minimumAdvanceReservation', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-primary text-xs font-mono" />
        </div>
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5 focus-within:border-primary/50 transition-colors">
          <span className="text-xs font-bold text-white">Max. Adv. Booking</span>
          <span className="text-[10px] text-slate-400 mb-2 leading-snug">How far in the future.</span>
          <input type="number" placeholder="e.g. 30" value={restrictions.maximumAdvanceReservation} onChange={e => update('maximumAdvanceReservation', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-primary text-xs font-mono" />
        </div>
      </div>
    </div>
  );
};

export default function ChannelManagerPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'rates' | 'reservations' | 'inventoryRestrictions' | 'rateRestrictions'>('inventory');
  const [syncMode, setSyncMode] = useState<'fetch' | 'push'>('fetch');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultRestrictions = { stopSell: false, minimumStay: '', maximumStay: '', closeOnArrival: false, closeOnDeparture: false, minimumAdvanceReservation: '', maximumAdvanceReservation: '' };

  const [pushInventoryData, setPushInventoryData] = useState<Array<{ roomCode: string, available: number | '' }>>([{ roomCode: '', available: '' }]);
  const [pushRatesData, setPushRatesData] = useState<Array<{ roomCode: string, rateplanCode: string, rate: number | '' }>>([{ roomCode: '', rateplanCode: '', rate: '' }]);
  const [pushInvRestData, setPushInvRestData] = useState<Array<{ roomCode: string, restrictions: any }>>([{ roomCode: '', restrictions: { ...defaultRestrictions } }]);
  const [pushRateRestData, setPushRateRestData] = useState<Array<{ roomCode: string, rateplanCode: string, restrictions: any }>>([{ roomCode: '', rateplanCode: '', restrictions: { ...defaultRestrictions } }]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  const CHANNELS = [
    { code: 'agoda', label: 'Agoda' },
    { code: 'airbnb', label: 'Airbnb' },
    { code: 'booking.com', label: 'Booking.com' },
    { code: 'cleartrip', label: 'Cleartrip' },
    { code: 'ctrip', label: 'CTrip' },
    { code: 'easemytrip', label: 'Ease My Trip' },
    { code: 'expedia', label: 'Expedia' },
    { code: 'simplotel', label: 'Simplotel' },
    { code: 'tiket', label: 'Tiket' },
    { code: 'traveloka', label: 'Traveloka' },
    { code: 'gommt', label: 'MakeMyTrip / Goibibo' },
  ];

  const toggleChannel = (code: string) => {
    setSelectedChannels(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const getRatePlans = (roomCode: string) => {
    const room = roomTypes.find(rt => rt.roomCode === roomCode);
    if (!room || !room.rateplanCodes) return [];
    if (typeof room.rateplanCodes === 'string') {
      try {
        const parsed = JSON.parse(room.rateplanCodes);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    if (Array.isArray(room.rateplanCodes)) return room.rateplanCodes;
    return [];
  };

  useEffect(() => {
    getRoomTypes().then(setRoomTypes).catch(console.error);
  }, []);

  const todayStr = new Date().toLocaleDateString('en-CA');

  const handleFetch = async () => {
    setError(null);
    if (!startDate || !endDate) {
      setError('Please select both start date and end date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('End date must be the same as or after the start date.');
      return;
    }

    setIsFetching(true);
    setFetchedData(null);
    try {
      let data;
      if (activeTab === 'inventory') {
        data = await fetchCMInventory(startDate, endDate);
      } else if (activeTab === 'rates') {
        data = await fetchCMRates(startDate, endDate);
      } else if (activeTab === 'reservations') {
        data = await fetchCMReservations(startDate, endDate);
      }
      setFetchedData(data);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch ${activeTab} data.`);
    } finally {
      setIsFetching(false);
    }
  };

  const handlePush = async () => {
    setError(null);
    if (!startDate || !endDate) return setError('Please select both start date and end date to push.');
    if (new Date(startDate) > new Date(endDate)) return setError('End date must be the same as or after the start date.');

    const isRest = activeTab.includes('Restrictions');
    if (isRest && selectedChannels.length === 0) return setError('Please select at least one target channel.');

    const parseRest = (r: any) => ({
      stopSell: r.stopSell,
      minimumStay: r.minimumStay !== '' ? Number(r.minimumStay) : null,
      maximumStay: r.maximumStay !== '' ? Number(r.maximumStay) : null,
      closeOnArrival: r.closeOnArrival,
      closeOnDeparture: r.closeOnDeparture,
      minimumAdvanceReservation: r.minimumAdvanceReservation !== '' ? Number(r.minimumAdvanceReservation) : null,
      maximumAdvanceReservation: r.maximumAdvanceReservation !== '' ? Number(r.maximumAdvanceReservation) : null,
    });

    let payload: any;
    let pushFn: Function;
    let alertMsg: string;

    if (activeTab === 'inventory') {
      const valid = pushInventoryData.filter(r => r.roomCode.trim() && r.available !== '');
      if (!valid.length) return setError('Please add at least one valid room for inventory push.');
      payload = [{ startDate, endDate, rooms: valid.map(r => ({ roomCode: r.roomCode, available: Number(r.available) })) }];
      pushFn = pushCMInventory; alertMsg = 'Inventory';
    } else if (activeTab === 'rates') {
      const valid = pushRatesData.filter(r => r.roomCode.trim() && r.rateplanCode.trim() && r.rate !== '');
      if (!valid.length) return setError('Please add at least one valid rate for rate push.');
      payload = [{ startDate, endDate, rates: valid.map(r => ({ roomCode: r.roomCode, rateplanCode: r.rateplanCode, rate: Number(r.rate) })) }];
      pushFn = pushCMRates; alertMsg = 'Rates';
    } else if (activeTab === 'inventoryRestrictions') {
      const valid = pushInvRestData.filter(r => r.roomCode.trim());
      if (!valid.length) return setError('Please add at least one valid room for restrictions push.');
      payload = [{ startDate, endDate, rooms: valid.map(r => ({ roomCode: r.roomCode, restrictions: parseRest(r.restrictions) })) }];
      pushFn = pushCMInventory; alertMsg = 'Inventory Restrictions';
    } else if (activeTab === 'rateRestrictions') {
      const valid = pushRateRestData.filter(r => r.roomCode.trim() && r.rateplanCode.trim());
      if (!valid.length) return setError('Please add at least one valid rate for restrictions push.');
      payload = [{ startDate, endDate, rates: valid.map(r => ({ roomCode: r.roomCode, rateplanCode: r.rateplanCode, restrictions: parseRest(r.restrictions) })) }];
      pushFn = pushCMRates; alertMsg = 'Rate Restrictions';
    } else return;

    setIsPushing(true);
    try {
      await pushFn(payload, isRest ? selectedChannels : undefined);
      alert(`${alertMsg} pushed successfully to Aiosell!`);
    } catch (err) {
      console.error(err);
      setError(`Failed to push ${activeTab} data. Make sure credentials are set.`);
    } finally {
      setIsPushing(false);
    }
  };

  const handleTabChange = (tab: 'inventory' | 'rates' | 'reservations' | 'inventoryRestrictions' | 'rateRestrictions') => {
    setActiveTab(tab);
    setFetchedData(null);
    setError(null);
  };

  const handleSyncModeChange = (mode: 'fetch' | 'push') => {
    setSyncMode(mode);
    setFetchedData(null);
    setError(null);
    if (mode === 'push' && activeTab === 'reservations') {
      setActiveTab('inventory');
    }
    if (mode === 'fetch' && (activeTab === 'inventoryRestrictions' || activeTab === 'rateRestrictions')) {
      setActiveTab('inventory');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Room Status</h1>
        <p className="text-slate-400 text-sm">Sync and fetch data for your property&apos;s room status.</p>
      </div>

      <div className="flex bg-black/20 p-1.5 rounded-xl w-full md:w-fit mb-6 border border-white/5">
        <button onClick={() => handleSyncModeChange('fetch')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${syncMode === 'fetch' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
          <div className="flex justify-center items-center gap-2"><Download size={16} /> Fetch Data</div>
        </button>
        <button onClick={() => handleSyncModeChange('push')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${syncMode === 'push' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
          <div className="flex justify-center items-center gap-2"><Upload size={16} /> Push Data</div>
        </button>
      </div>

      <div className={`grid grid-cols-2 gap-2 mb-8 md:mb-10 bg-surface/40 backdrop-blur-xl p-2 rounded-2xl border border-white/5 shadow-2xl w-full ${syncMode === 'push' ? 'md:grid-cols-4' : 'md:grid-cols-3'} md:w-fit`}>
        <button
          onClick={() => handleTabChange('inventory')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-bold transition-all duration-300 rounded-xl md:rounded-full ${activeTab === 'inventory'
            ? 'bg-gradient-to-r from-[#c58356] to-[#b06f44] text-white shadow-[0_0_20px_rgba(197,131,86,0.4)]'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
        >
          <Home size={16} />
          <span>Inventory</span>
        </button>
        <button
          onClick={() => handleTabChange('rates')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-bold transition-all duration-300 rounded-xl md:rounded-full ${activeTab === 'rates'
            ? 'bg-gradient-to-r from-[#c58356] to-[#b06f44] text-white shadow-[0_0_20px_rgba(197,131,86,0.4)]'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
        >
          <IndianRupee size={16} />
          <span>Rates</span>
        </button>
        {syncMode === 'fetch' && (
          <button
            onClick={() => handleTabChange('reservations')}
            className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-bold transition-all duration-300 rounded-xl md:rounded-full ${activeTab === 'reservations'
              ? 'bg-gradient-to-r from-[#c58356] to-[#b06f44] text-white shadow-[0_0_20px_rgba(197,131,86,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
          >
            <Users size={16} />
            <span>Bookings</span>
          </button>
        )}
        {syncMode === 'push' && (
          <>
            <button
              onClick={() => handleTabChange('inventoryRestrictions')}
              className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-bold transition-all duration-300 rounded-xl md:rounded-full ${activeTab === 'inventoryRestrictions'
                ? 'bg-gradient-to-r from-[#c58356] to-[#b06f44] text-white shadow-[0_0_20px_rgba(197,131,86,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
              <Info size={16} />
              <span>Inventory Restrictions</span>
            </button>
            <button
              onClick={() => handleTabChange('rateRestrictions')}
              className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-bold transition-all duration-300 rounded-xl md:rounded-full ${activeTab === 'rateRestrictions'
                ? 'bg-gradient-to-r from-[#c58356] to-[#b06f44] text-white shadow-[0_0_20px_rgba(197,131,86,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
              <Info size={16} />
              <span>Rate Restrictions</span>
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:flex md:flex-row items-end md:items-center gap-4 mb-4 bg-surface/40 backdrop-blur-xl p-4 md:p-4 rounded-2xl md:rounded-3xl border border-white/5 shadow-2xl">
          <div className="col-span-2 sm:col-span-1 md:w-auto w-full flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs uppercase font-bold tracking-wider ml-1 md:hidden">Start Date</label>
            <div className="relative w-full">
              <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                min={todayStr}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && new Date(e.target.value) > new Date(endDate)) {
                    setEndDate(e.target.value);
                  }
                }}
                onClick={(e) => {
                  try { e.currentTarget.showPicker() } catch (err) { }
                }}
                className="pl-10 pr-4 py-2.5 md:py-2 bg-black/20 border border-white/10 rounded-xl text-slate-200 outline-none focus:border-primary text-sm font-medium w-full md:w-44 cursor-pointer"
              />
            </div>
          </div>

          <div className="hidden md:block text-slate-500 font-semibold">to</div>

          <div className="col-span-2 sm:col-span-1 md:w-auto w-full flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs uppercase font-bold tracking-wider ml-1 md:hidden">End Date</label>
            <div className="relative w-full">
              <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => {
                  try { e.currentTarget.showPicker() } catch (err) { }
                }}
                className="pl-10 pr-4 py-2.5 md:py-2 bg-black/20 border border-white/10 rounded-xl text-slate-200 outline-none focus:border-primary text-sm font-medium w-full md:w-44 cursor-pointer"
              />
            </div>
          </div>

          <div className="col-span-2 md:w-auto w-full flex flex-col md:flex-row gap-3 md:gap-2 mt-2 md:mt-0">
            {syncMode === 'fetch' ? (
              <button
                onClick={handleFetch}
                disabled={isFetching}
                className="w-full md:w-auto px-6 py-3 md:py-2 rounded-xl bg-primary/20 text-primary font-bold border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50 capitalize inline-flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {isFetching ? 'Fetching...' : `Fetch ${activeTab === 'inventoryRestrictions' ? 'Inventory Restrictions' : activeTab === 'rateRestrictions' ? 'Rate Restrictions' : activeTab}`}
              </button>
            ) : (
              <button
                onClick={handlePush}
                disabled={isPushing}
                className="w-full md:w-auto px-6 py-3 md:py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 capitalize inline-flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                {isPushing ? 'Pushing...' : `Push ${activeTab === 'inventoryRestrictions' ? 'Inventory Restrictions' : activeTab === 'rateRestrictions' ? 'Rate Restrictions' : activeTab}`}
              </button>
            )}
          </div>
        </div>

        {syncMode === 'push' && activeTab === 'inventory' && (
          <div className="bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 md:p-6 shadow-2xl mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">Inventory Details</h3>
              <button onClick={() => setPushInventoryData([...pushInventoryData, { roomCode: '', available: '' }])} className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Plus size={14} /> Add Room
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {pushInventoryData.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex gap-2 md:gap-3 items-center">
                    <select
                      value={item.roomCode}
                      onChange={(e) => {
                        const newData = [...pushInventoryData];
                        newData[idx].roomCode = e.target.value;
                        setPushInventoryData(newData);
                      }}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-primary text-sm min-w-[100px] cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Select Room</option>
                      {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.roomCode}>{rt.name} ({rt.roomCode})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Available"
                      value={item.available}
                      onChange={(e) => {
                        const newData = [...pushInventoryData];
                        newData[idx].available = e.target.value === '' ? '' : Number(e.target.value);
                        setPushInventoryData(newData);
                      }}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-primary text-sm min-w-0"
                    />
                    {pushInventoryData.length > 1 && (
                      <button onClick={() => setPushInventoryData(pushInventoryData.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors shrink-0">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {syncMode === 'push' && activeTab === 'rates' && (
          <div className="bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 md:p-6 shadow-2xl mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">Rate Details</h3>
              <button onClick={() => setPushRatesData([...pushRatesData, { roomCode: '', rateplanCode: '', rate: '' }])} className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Plus size={14} /> Add Rate
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {pushRatesData.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex gap-2 md:gap-3 items-center overflow-x-auto">
                    <select
                      value={item.roomCode}
                      onChange={(e) => {
                        const newData = [...pushRatesData];
                        newData[idx].roomCode = e.target.value;
                        newData[idx].rateplanCode = '';
                        setPushRatesData(newData);
                      }}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-primary text-sm min-w-[100px] cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Select Room</option>
                      {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.roomCode}>{rt.name} ({rt.roomCode})</option>
                      ))}
                    </select>
                    <select
                      value={item.rateplanCode}
                      onChange={(e) => {
                        const newData = [...pushRatesData];
                        newData[idx].rateplanCode = e.target.value;
                        const plans = getRatePlans(item.roomCode);
                        const rp = plans.find((r: any) => r.code === e.target.value);
                        if (rp && (newData[idx].rate === '' || newData[idx].rate === 0)) {
                          newData[idx].rate = rp.price;
                        }
                        setPushRatesData(newData);
                      }}
                      disabled={!item.roomCode}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-primary text-sm min-w-[100px] cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="" disabled>Select Rateplan</option>
                      {item.roomCode && getRatePlans(item.roomCode).map((rp: any) => (
                        <option key={rp.code} value={rp.code}>{rp.code}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Rate (₹)"
                      value={item.rate}
                      onChange={(e) => {
                        const newData = [...pushRatesData];
                        newData[idx].rate = e.target.value === '' ? '' : Number(e.target.value);
                        setPushRatesData(newData);
                      }}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-primary text-sm min-w-[90px]"
                    />
                    {pushRatesData.length > 1 && (
                      <button onClick={() => setPushRatesData(pushRatesData.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors shrink-0">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {syncMode === 'push' && activeTab === 'inventoryRestrictions' && (
          <div className="bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 md:p-6 shadow-2xl mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">Inventory Restrictions</h3>
              <button onClick={() => setPushInvRestData([...pushInvRestData, { roomCode: '', restrictions: { ...defaultRestrictions } }])} className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Plus size={14} /> Add Room
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-black/20 border border-white/5 rounded-xl">
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><CheckSquare size={16} className="text-primary" /> Target Channels</h4>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.code}
                    onClick={() => toggleChannel(ch.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedChannels.includes(ch.code) ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {pushInvRestData.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex gap-2 md:gap-3 items-center">
                    <select
                      value={item.roomCode}
                      onChange={(e) => {
                        const newData = [...pushInvRestData];
                        newData[idx].roomCode = e.target.value;
                        setPushInvRestData(newData);
                      }}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-primary text-sm cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Select Room</option>
                      {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.roomCode}>{rt.name} ({rt.roomCode})</option>
                      ))}
                    </select>
                    {pushInvRestData.length > 1 && (
                      <button onClick={() => setPushInvRestData(pushInvRestData.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors shrink-0">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <RestrictionsEditor 
                    restrictions={item.restrictions} 
                    onChange={(newRest) => { 
                      const nd = [...pushInvRestData]; 
                      nd[idx].restrictions = newRest; 
                      setPushInvRestData(nd); 
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {syncMode === 'push' && activeTab === 'rateRestrictions' && (
          <div className="bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 md:p-6 shadow-2xl mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">Rate Restrictions</h3>
              <button onClick={() => setPushRateRestData([...pushRateRestData, { roomCode: '', rateplanCode: '', restrictions: { ...defaultRestrictions } }])} className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Plus size={14} /> Add Rate
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-black/20 border border-white/5 rounded-xl">
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><CheckSquare size={16} className="text-primary" /> Target Channels</h4>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.code}
                    onClick={() => toggleChannel(ch.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedChannels.includes(ch.code) ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {pushRateRestData.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex gap-2 md:gap-3 items-center overflow-x-auto">
                    <select
                      value={item.roomCode}
                      onChange={(e) => {
                        const newData = [...pushRateRestData];
                        newData[idx].roomCode = e.target.value;
                        newData[idx].rateplanCode = '';
                        setPushRateRestData(newData);
                      }}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-primary text-sm min-w-[100px] cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Select Room</option>
                      {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.roomCode}>{rt.name} ({rt.roomCode})</option>
                      ))}
                    </select>
                    <select
                      value={item.rateplanCode}
                      onChange={(e) => {
                        const newData = [...pushRateRestData];
                        newData[idx].rateplanCode = e.target.value;
                        setPushRateRestData(newData);
                      }}
                      disabled={!item.roomCode}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-primary text-sm min-w-[100px] cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="" disabled>Select Rateplan</option>
                      {item.roomCode && getRatePlans(item.roomCode).map((rp: any) => (
                        <option key={rp.code} value={rp.code}>{rp.code}</option>
                      ))}
                    </select>
                    {pushRateRestData.length > 1 && (
                      <button onClick={() => setPushRateRestData(pushRateRestData.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors shrink-0">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <RestrictionsEditor 
                    restrictions={item.restrictions} 
                    onChange={(newRest) => { 
                      const nd = [...pushRateRestData]; 
                      nd[idx].restrictions = newRest; 
                      setPushRateRestData(nd); 
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {fetchedData && syncMode === 'fetch' ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-surface/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-x-auto w-full">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                {activeTab === 'inventory' && (
                  <>
                    <thead>
                      <tr className="bg-black/20 text-slate-400 uppercase text-xs tracking-wider border-b border-white/5">
                        <th className="p-4 font-semibold">Room Code</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold text-right">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {fetchedData?.updates?.flatMap((update: any, idx1: number) =>
                        update.rooms?.map((inv: any, idx2: number) => (
                          <tr key={`${idx1}-${idx2}`} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4 font-bold text-white">{inv.roomCode}</td>
                            <td className="p-4 text-slate-300">{update.startDate}</td>
                            <td className="p-4 text-right">
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold inline-block">
                                {inv.available} left
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </>
                )}

                {activeTab === 'rates' && (
                  <>
                    <thead>
                      <tr className="bg-black/20 text-slate-400 uppercase text-xs tracking-wider border-b border-white/5">
                        <th className="p-4 font-semibold">Room Code</th>
                        <th className="p-4 font-semibold">Rate Plan</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {fetchedData?.updates?.flatMap((update: any, idx1: number) =>
                        update.rates?.map((rate: any, idx2: number) => (
                          <tr key={`${idx1}-${idx2}`} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4 font-bold text-white">{rate.roomCode}</td>
                            <td className="p-4 text-slate-300">{rate.rateplanCode}</td>
                            <td className="p-4 text-slate-300">{update.startDate}</td>
                            <td className="p-4 text-slate-300 font-medium text-right">₹{rate.rate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </>
                )}

                {activeTab === 'reservations' && (
                  <>
                    <thead>
                      <tr className="bg-black/20 text-slate-400 uppercase text-xs tracking-wider border-b border-white/5">
                        <th className="p-4 font-semibold">Booking ID</th>
                        <th className="p-4 font-semibold">Channel</th>
                        <th className="p-4 font-semibold">Guest</th>
                        <th className="p-4 font-semibold">Check-in / out</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Rooms</th>
                        <th className="p-4 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Array.isArray(fetchedData) && fetchedData.map((res: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 font-bold text-white">{res.bookingId}</td>
                          <td className="p-4 text-slate-300">
                            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md text-xs font-semibold">
                              {res.channel}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300">
                            <div className="font-semibold text-white">{res.guest?.firstName} {res.guest?.lastName}</div>
                            <div className="text-xs text-slate-400">{res.guest?.phone}</div>
                          </td>
                          <td className="p-4 text-slate-300">
                            <div className="text-white">{res.checkin}</div>
                            <div className="text-xs text-slate-400">to {res.checkout}</div>
                          </td>
                          <td className="p-4 text-slate-300">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${res.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                              {res.status || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300 text-sm">
                            {res.rooms?.map((r: any, i: number) => (
                              <div key={i}>{r.roomCode} <span className="text-xs text-slate-500">({r.rateplanCode})</span></div>
                            ))}
                          </td>
                          <td className="p-4 text-slate-300 font-medium text-right">₹{res.amount?.amountAfterTax || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
              {activeTab === 'inventory' && fetchedData?.updates?.flatMap((update: any, idx1: number) =>
                update.rooms?.map((inv: any, idx2: number) => (
                  <div key={`${idx1}-${idx2}`} className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold text-white text-lg">{inv.roomCode}</div>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                        {inv.available} left
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <CalendarIcon size={14} />
                      <span>{update.startDate}</span>
                    </div>
                  </div>
                ))
              )}

              {activeTab === 'rates' && fetchedData?.updates?.flatMap((update: any, idx1: number) =>
                update.rates?.map((rate: any, idx2: number) => (
                  <div key={`${idx1}-${idx2}`} className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-lg">{rate.roomCode}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5 px-2 py-0.5 bg-black/20 rounded border border-white/5 w-fit">{rate.rateplanCode}</span>
                      </div>
                      <div className="font-bold text-primary text-xl">₹{rate.rate}</div>
                    </div>
                    <div className="h-px w-full bg-white/5"></div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <CalendarIcon size={14} />
                      <span>{update.startDate}</span>
                    </div>
                  </div>
                ))
              )}

              {activeTab === 'reservations' && Array.isArray(fetchedData) && fetchedData.map((res: any, idx: number) => (
                <div key={idx} className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-lg">{res.guest?.firstName} {res.guest?.lastName}</div>
                      <div className="text-slate-400 text-sm mb-2">{res.guest?.phone}</div>
                      <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-block">
                        {res.channel}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="font-bold text-white text-xl">₹{res.amount?.amountAfterTax || 0}</div>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${res.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                        {res.status || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Dates</span>
                      <span className="text-sm text-slate-300 font-medium">{res.checkin} &rarr; {res.checkout}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Rooms</span>
                      <div className="text-sm text-slate-300 text-right">
                        {res.rooms?.map((r: any, i: number) => (
                          <div key={i}>{r.roomCode} <span className="text-slate-500 text-xs">({r.rateplanCode})</span></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    ID: {res.bookingId}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-10 md:p-16 text-center border-2 border-dashed border-white/10 rounded-3xl text-slate-400 bg-surface/30 backdrop-blur-sm">
            <div className="mb-4 inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/5 text-slate-500">
              <RefreshCw size={28} className="md:w-8 md:h-8" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 capitalize">{syncMode === 'fetch' ? 'Sync' : 'Update'} {activeTab}</h3>
            <p className="text-sm md:text-base">Select a date range and tap {syncMode} to {syncMode === 'fetch' ? 'see' : 'update'} live room status {activeTab}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
