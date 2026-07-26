'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Printer, RefreshCw, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchKots, updateOrder, Kot } from '../../../store/slices/orderSlice';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmPrintModal } from '../../../components/modals/ConfirmPrintModal';
import { escapeHtml } from '../../../utils/escapeHtml';

const PAGE_SIZE = 20;

export default function KOTPage() {
  const dispatch = useAppDispatch();
  const { kots, kotMeta, kotStatus } = useAppSelector((state) => state.order);
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: number | null }>({ isOpen: false, orderId: null });

  const status = kotStatus;

  const fetchKotsData = (page = currentPage) => {
    dispatch(fetchKots({ page, limit: PAGE_SIZE }));
  };

  useEffect(() => {
    dispatch(fetchKots({ page: 1, limit: PAGE_SIZE }));
  }, [dispatch]);

  const handlePrintKOT = async (order: Kot) => {
    try {
      setPrintingId(order.id);
      
      const itemsToPrint = order.kotHistory || [];
      if (itemsToPrint.length === 0) return;

      // Generate a temporary iframe to print the KOT
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const itemsHtml = itemsToPrint.map((item: any) => `
        <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 8px;">
          <span>${escapeHtml(item.name)}</span>
          <strong>x${escapeHtml(item.qty)}</strong>
        </div>
      `).join('');

      const printContent = `
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
            <title>Print KOT</title>
            <style>
              body { font-family: monospace; padding: 10px; width: 300px; color: #000; }
              .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
              .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
              h2 { margin: 0 0 5px 0; font-size: 24px; }
              p { margin: 2px 0; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>KOT</h2>
              <p>Order #${order.id} | Table: ${escapeHtml(order.tableNumber) || '-'}</p>
              <p>Waiter: ${escapeHtml(order.user?.name) || '-'}</p>
              <p>Time: ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="items">
              ${itemsHtml}
            </div>
            <div class="footer">
              <p>*** END OF KOT ***</p>
            </div>
          </body>
        </html>
      `;

      if (iframe.contentDocument) {
        const doc = iframe.contentDocument;
        doc.open();
        doc.write(printContent);
        doc.close();
      }
      
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      // Open the custom confirm modal instead of window.confirm
      setConfirmModal({ isOpen: true, orderId: order.id });
    } catch (err) {
      console.error('Failed to clear KOT status', err);
      toast.error('Failed to print KOT.');
    } finally {
      setPrintingId(null);
    }
  };

  const handleConfirmResult = async (didPrint: boolean) => {
    if (didPrint && confirmModal.orderId) {
      try {
        await dispatch(updateOrder({
          id: confirmModal.orderId,
          data: { kotHistory: [] }
        })).unwrap();
        // Clearing the last KOT on a page would leave it empty, so step back one.
        const nextPage = kots.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(nextPage);
        fetchKotsData(nextPage);
      } catch (err) {
        console.error('Failed to clear KOT status', err);
      }
    }
    setConfirmModal({ isOpen: false, orderId: null });
  };

  if (status === 'loading' && kots.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Server already filters to orders with a non-empty KOT queue.
  const ordersWithKOTs = kots;

  // Total spans every page; item count is only what this page holds.
  const totalPendingOrders = kotMeta.total;
  let totalPendingItems = 0;

  ordersWithKOTs.forEach(order => {
    order.kotHistory?.forEach(item => {
      totalPendingItems += item.qty;
    });
  });

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Kitchen Order Tickets</h1>
          <p className="text-sm text-slate-400">Manage and print pending items for the kitchen.</p>
        </div>
        <button
          onClick={() => fetchKotsData()}
          disabled={status === 'loading'}
          className="p-2 bg-surface/50 border border-white/10 rounded-lg text-slate-200 hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={18} className={status === 'loading' ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <div className="bg-surface/50 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 text-sm font-medium mb-1">Orders with Pending KOTs</span>
          <span className="text-3xl font-bold text-slate-100">{totalPendingOrders}</span>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_0_var(--color-primary-light)]">
          <span className="text-slate-300 text-sm font-medium mb-1">Pending Items (this page)</span>
          <span className="text-3xl font-bold text-yellow-400">{totalPendingItems}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
        {ordersWithKOTs.length === 0 ? (
          <div className="bg-surface/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400">
            <Printer size={48} className="mb-4 opacity-50" />
            <p>No active KOTs found. All orders have been printed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ordersWithKOTs.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface/30 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors flex flex-col"
              >
                <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">Order #{order.id}</h3>
                    <p className="text-sm text-slate-400">Table: <span className="text-white font-bold">{order.tableNumber || '-'}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Waiter</p>
                    <p className="text-sm font-medium text-slate-200">{order.user?.name || '-'}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                  <div className="p-3 rounded-xl border bg-primary/10 border-primary/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-slate-300">
                        <Clock size={14} className="text-yellow-500" />
                        PENDING ITEMS
                      </span>
                      
                      <button
                        onClick={() => handlePrintKOT(order)}
                        disabled={printingId === order.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-white hover:bg-primary-hover shadow-[0_2px_10px_0_var(--color-primary-light)]"
                      >
                        {printingId === order.id ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                        Print & Clear
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      {order.kotHistory!.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-300">{item.name}</span>
                          <span className="text-slate-200 font-bold">x{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {kotMeta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10 shrink-0">
          <span className="text-sm text-slate-400">
            Showing page <span className="font-semibold text-slate-200">{kotMeta.page}</span> of <span className="font-semibold text-slate-200">{kotMeta.totalPages}</span> ({kotMeta.total} total KOTs)
          </span>
          <div className="flex gap-2">
            <button
              disabled={kotMeta.page <= 1}
              onClick={() => {
                const newPage = kotMeta.page - 1;
                setCurrentPage(newPage);
                fetchKotsData(newPage);
              }}
              className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={kotMeta.page >= kotMeta.totalPages}
              onClick={() => {
                const newPage = kotMeta.page + 1;
                setCurrentPage(newPage);
                fetchKotsData(newPage);
              }}
              className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-sm text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmPrintModal
        isOpen={confirmModal.isOpen}
        onConfirm={handleConfirmResult}
      />
    </div>
  );
}
