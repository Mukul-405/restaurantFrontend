'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Boxes, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  Search, 
  Calendar, 
  IndianRupee, 
  Receipt, 
  Package, 
  FileText,
  X,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchInventory, 
  createInventoryRecord, 
  updateInventoryRecord, 
  deleteInventoryRecord, 
  InventoryRecord 
} from '../../../store/slices/inventorySlice';
import InventoryModal from '../../../components/modals/InventoryModal';
import DeleteConfirmModal from '../../../components/modals/DeleteConfirmModal';

export default function InventoryPage() {
  const dispatch = useAppDispatch();
  const { records, status, error } = useAppSelector((state) => state.inventory);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InventoryRecord | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = () => {
    dispatch(fetchInventory({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }));
  };

  useEffect(() => {
    loadData();
  }, [dispatch, startDate, endDate]);

  const handleOpenCreate = () => {
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: InventoryRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (record: InventoryRecord) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleSaveRecord = async (data: any) => {
    if (selectedRecord) {
      await dispatch(updateInventoryRecord({ id: selectedRecord.id, data })).unwrap();
    } else {
      await dispatch(createInventoryRecord(data)).unwrap();
    }
    loadData();
  };

  const handleDeleteConfirm = async (id: string | number) => {
    await dispatch(deleteInventoryRecord(id)).unwrap();
    loadData();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  // Filter records locally by search query (item name or notes)
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(r => {
      const matchNotes = r.notes?.toLowerCase().includes(query);
      const matchItems = Array.isArray(r.metaInfo) && r.metaInfo.some(item => 
        item.name?.toLowerCase().includes(query)
      );
      return matchNotes || matchItems;
    });
  }, [records, searchQuery]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalSpent = filteredRecords.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
    const totalItemsCount = filteredRecords.reduce((sum, r) => {
      const lineCount = Array.isArray(r.metaInfo) ? r.metaInfo.reduce((s, i) => s + (Number(i.quantity) || 0), 0) : 0;
      return sum + lineCount;
    }, 0);
    const avgSpend = filteredRecords.length > 0 ? totalSpent / filteredRecords.length : 0;

    return {
      totalSpent,
      totalRecords: filteredRecords.length,
      totalItemsCount,
      avgSpend,
    };
  }, [filteredRecords]);

  return (
    <div className="h-full flex flex-col space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <Boxes size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Inventory Management</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Track daily purchases, material quantities, per-item prices, and total inventory expenses.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-sans font-semibold text-sm cursor-pointer transition-all duration-200 border-none bg-primary text-white shadow-[0_4px_14px_0_var(--color-primary-light)] hover:bg-primary-hover hover:-translate-y-0.5"
        >
          <Plus size={18} />
          <span>Add Inventory</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expense */}
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expense</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            ₹{metrics.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">Sum of filtered inventory records</p>
        </div>

        {/* Total Records */}
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Entries</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Receipt size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {metrics.totalRecords}
          </div>
          <p className="text-xs text-slate-500 mt-1">Purchase logs logged</p>
        </div>

        {/* Total Items Units */}
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Units Logged</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {metrics.totalItemsCount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cumulative units purchased</p>
        </div>

        {/* Avg Spend per Log */}
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Spend / Entry</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            ₹{metrics.avgSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">Average purchase value</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface/40 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search by item name (e.g. Water, Tomato) or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 border border-white/10 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl font-sans text-sm outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Date Range Pickers */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar size={14} className="text-primary" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs [color-scheme:dark]"
              placeholder="From"
            />
          </div>
          <span className="text-slate-500 text-xs font-semibold">to</span>
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar size={14} className="text-primary" />
            <input 
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs [color-scheme:dark]"
              placeholder="To"
            />
          </div>

          {(startDate || endDate || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Records Content */}
      {status === 'loading' && records.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : status === 'failed' && records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-danger mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 text-primary hover:text-primary-hover font-medium cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
          <Boxes className="text-slate-500 mb-3 opacity-60" size={40} />
          <p className="text-slate-300 font-semibold">No inventory records found</p>
          <p className="text-xs text-slate-500 mt-1">
            {startDate || endDate || searchQuery 
              ? 'Try adjusting your filters or search query.'
              : 'Click "Add Inventory" above to record your first inventory purchase.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {filteredRecords.map((record, index) => {
            const formattedDate = record.date 
              ? new Date(record.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  weekday: 'short'
                })
              : '-';

            const itemsList = Array.isArray(record.metaInfo) ? record.metaInfo : [];

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Date & Header */}
                <div className="flex items-start gap-3.5 min-w-[200px]">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-primary shrink-0 mt-0.5">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-base">{formattedDate}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {itemsList.length} {itemsList.length === 1 ? 'Item' : 'Items'} recorded
                    </div>
                    {record.notes && (
                      <div className="text-xs text-slate-400/90 mt-2 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 inline-block max-w-sm truncate" title={record.notes}>
                        <span className="text-slate-500 font-medium mr-1">Note:</span>
                        {record.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Items Breakdown Chips */}
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  {itemsList.map((item, idx) => (
                    <div 
                      key={idx}
                      className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs hover:border-primary/30 transition-colors"
                    >
                      <Tag size={12} className="text-primary/70 shrink-0" />
                      <span className="font-semibold text-slate-200">{item.name}</span>
                      <span className="text-slate-400 font-mono">
                        ({item.quantity} × ₹{item.perItemPrice})
                      </span>
                      <span className="font-bold text-emerald-400 font-mono pl-1 border-l border-white/10">
                        ₹{item.totalPrice}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right: Total Price & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Grand Total</div>
                    <div className="text-xl font-extrabold text-emerald-400 font-mono">
                      ₹{Number(record.totalPrice).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(record)}
                      className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                      title="Edit Record"
                    >
                      <Edit2 size={17} />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(record)}
                      className="p-2 rounded-xl text-slate-400 hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <InventoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        record={selectedRecord}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        item={selectedRecord ? { id: selectedRecord.id, name: `Inventory record of ${new Date(selectedRecord.date).toLocaleDateString()}` } : null}
      />
    </div>
  );
}
