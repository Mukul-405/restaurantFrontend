import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Hotel,
  FileSpreadsheet,
  Calendar,
  Tag,
  Percent,
  Sparkles,
  Globe,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { DateRangeFilter } from '../../common/DateRangeFilter';
import { StatCard } from '../../common/StatCard';
import { getLocalDateString } from '../../common/dateUtils';
import {
  getHotelDailyBillSummary,
  HotelDailyBillSummaryResult,
  HotelDailyBillItem,
  HotelDayGroupSummary,
} from '../../../../../lib/analysis';
import {
  downloadHotelDailyBillReport,
  printHotelDailyBillReport,
} from '../hotelReports';

export const HotelDailyBillSummarySection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    end: getLocalDateString(new Date()),
  });
  const [data, setData] = useState<HotelDailyBillSummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const fetchData = async (overrideStart?: string, overrideEnd?: string) => {
    const start = overrideStart ?? dateRange.start;
    const end = overrideEnd ?? dateRange.end;
    if (!start || !end) return;

    const startD = new Date(start);
    const endD = new Date(end);
    if (endD.getTime() - startD.getTime() > 365 * 24 * 60 * 60 * 1000) {
      setError('Date range cannot exceed 1 year. Please select a smaller range.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await getHotelDailyBillSummary(start, end);
      setData(result);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch hotel daily bill summary';
      setError(msg);
      console.error('Failed to fetch hotel daily bill summary', err);
    } finally {
      setLoading(false);
    }
  };

  const setPresetDateRange = (type: 'today' | 'yesterday' | '7days' | 'month') => {
    setError(null);
    const today = new Date();
    const end = getLocalDateString(today);
    let start = end;

    if (type === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      start = getLocalDateString(y);
      setDateRange({ start, end: start });
      fetchData(start, start);
      return;
    } else if (type === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = getLocalDateString(d);
    } else if (type === 'month') {
      const d = new Date();
      d.setDate(1);
      start = getLocalDateString(d);
    }

    setDateRange({ start, end });
    fetchData(start, end);
  };

  const filteredHotelBills = useMemo(() => {
    if (!data) return null;
    const res = data;
    const search = searchQuery.trim().toLowerCase();

    const days = res.days
      .map((day) => {
        const bookings = day.bookings.filter((b) => {
          if (channelFilter !== 'ALL' && b.channel !== channelFilter) {
            return false;
          }
          if (paymentFilter !== 'ALL' && b.paymentMode !== paymentFilter) {
            return false;
          }
          if (search) {
            const matchBookingId = b.bookingId.toLowerCase().includes(search);
            const matchGuest = b.guestName.toLowerCase().includes(search);
            const matchPhone = b.guestPhone.toLowerCase().includes(search);
            const matchChannel = b.channel.toLowerCase().includes(search);
            if (!matchBookingId && !matchGuest && !matchPhone && !matchChannel) {
              return false;
            }
          }
          return true;
        });

        let totalBase = 0;
        let totalTax = 0;
        let totalAmt = 0;
        let totalDisc = 0;
        let totalComm = 0;
        let totalTcs = 0;
        let totalTds = 0;
        let totalFinal = 0;

        bookings.forEach((b) => {
          totalBase = Number((totalBase + b.baseAmount).toFixed(2));
          totalTax = Number((totalTax + b.taxAmount).toFixed(2));
          totalAmt = Number((totalAmt + b.totalAmount).toFixed(2));
          totalDisc = Number((totalDisc + b.roomDiscountAmount).toFixed(2));
          totalComm = Number((totalComm + b.commission).toFixed(2));
          totalTcs = Number((totalTcs + b.tcs).toFixed(2));
          totalTds = Number((totalTds + b.tds).toFixed(2));
          totalFinal = Number((totalFinal + b.finalAmount).toFixed(2));
        });

        return {
          ...day,
          totalBookings: bookings.length,
          checkedOutBookings: bookings.length,
          cancelledBookings: 0,
          totalBaseAmount: totalBase,
          totalTaxAmount: totalTax,
          totalAmount: totalAmt,
          totalDiscountAmount: totalDisc,
          totalCommission: totalComm,
          totalTcs,
          totalTds,
          totalFinalAmount: totalFinal,
          bookings,
        };
      })
      .filter((day) => day.bookings.length > 0);

    let grandBase = 0;
    let grandTax = 0;
    let grandAmt = 0;
    let grandDisc = 0;
    let grandComm = 0;
    let grandTcs = 0;
    let grandTds = 0;
    let grandFinal = 0;
    let totalCount = 0;

    days.forEach((d) => {
      grandBase = Number((grandBase + d.totalBaseAmount).toFixed(2));
      grandTax = Number((grandTax + d.totalTaxAmount).toFixed(2));
      grandAmt = Number((grandAmt + d.totalAmount).toFixed(2));
      grandDisc = Number((grandDisc + d.totalDiscountAmount).toFixed(2));
      grandComm = Number((grandComm + d.totalCommission).toFixed(2));
      grandTcs = Number((grandTcs + d.totalTcs).toFixed(2));
      grandTds = Number((grandTds + d.totalTds).toFixed(2));
      grandFinal = Number((grandFinal + d.totalFinalAmount).toFixed(2));
      totalCount += d.totalBookings;
    });

    return {
      ...res,
      totalBookings: totalCount,
      checkedOutBookings: totalCount,
      cancelledBookings: 0,
      totalBaseAmount: grandBase,
      totalTaxAmount: grandTax,
      totalAmount: grandAmt,
      totalDiscountAmount: grandDisc,
      totalCommission: grandComm,
      totalTcs: grandTcs,
      totalTds: grandTds,
      grandTotalFinalAmount: grandFinal,
      days,
    };
  }, [data, searchQuery, channelFilter, paymentFilter]);

  const formatINR = (val?: number) =>
    `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="space-y-4 sm:space-y-6">
      <DateRangeFilter
        title="Hotel Bill Summary (Checked-Out Bookings & Deductions Breakdown)"
        icon={FileSpreadsheet}
        iconColor="text-amber-400"
        dateNote="Check-Out Date"
        color={{
          bgLight: 'bg-amber-500/20',
          text: 'text-amber-400',
          bgHover: 'bg-amber-500/30',
          border: 'border-amber-500/50',
        }}
        startDate={dateRange.start}
        setStartDate={(v: string) => {
          setDateRange((prev) => ({ ...prev, start: v }));
          setError(null);
        }}
        endDate={dateRange.end}
        setEndDate={(v: string) => {
          setDateRange((prev) => ({ ...prev, end: v }));
          setError(null);
        }}
        onGenerate={() => fetchData()}
        loading={loading}
        setDateRangeType={setPresetDateRange}
        error={error}
        onDownload={() => downloadHotelDailyBillReport(filteredHotelBills, dateRange)}
        onPrint={() => printHotelDailyBillReport(filteredHotelBills, dateRange)}
        hasData={!!filteredHotelBills && filteredHotelBills.totalBookings > 0}
      />

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredHotelBills ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
            <StatCard
              title="Checked-Out Bookings"
              value={`${filteredHotelBills.totalBookings}`}
              icon={Hotel}
              color="bg-purple-500"
            />
            <StatCard
              title="Total Base Amount"
              value={formatINR(filteredHotelBills.totalBaseAmount)}
              icon={Receipt}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Tax Amount"
              value={formatINR(filteredHotelBills.totalTaxAmount)}
              icon={Receipt}
              color="bg-orange-500"
            />
            <StatCard
              title="Total Gross (Base+Tax)"
              value={formatINR(filteredHotelBills.totalAmount)}
              icon={IndianRupee}
              color="bg-amber-500"
            />
            <StatCard
              title="Grand Final Settled"
              value={formatINR(filteredHotelBills.grandTotalFinalAmount)}
              icon={Sparkles}
              color="bg-emerald-500"
              highlight
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <StatCard
              title="Room Discount"
              value={formatINR(filteredHotelBills.totalDiscountAmount)}
              icon={Tag}
              color="bg-rose-500"
            />
            <StatCard
              title="OTA Commission"
              value={formatINR(filteredHotelBills.totalCommission)}
              icon={Percent}
              color="bg-violet-500"
            />
            <StatCard
              title="TCS Tax"
              value={formatINR(filteredHotelBills.totalTcs)}
              icon={ShieldCheck}
              color="bg-yellow-500"
            />
            <StatCard
              title="TDS Tax"
              value={formatINR(filteredHotelBills.totalTds)}
              icon={FileText}
              color="bg-teal-500"
            />
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-surface/30 p-3.5 sm:p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sm:gap-4 shadow-md">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by Booking ID, guest name, phone, channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface/60 border border-white/10 text-white pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Checked-Out Indicator Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Checked-Out Only</span>
              </div>

              {/* Channel Filter */}
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-black/40 border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-amber-500 font-medium cursor-pointer"
              >
                <option value="ALL">All Channels</option>
                {data?.channels?.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>

              {/* Payment Mode Filter */}
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-black/40 border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-amber-500 font-medium cursor-pointer"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View - Designed to Fit 100% Screen Width Without Horizontal Scroll */}
          <div className="hidden md:block bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="max-h-[640px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs text-left text-slate-300 table-auto relative">
                <thead className="text-[11px] text-slate-400 uppercase bg-black/85 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
                  <tr>
                    <th scope="col" className="px-2 py-3 w-8 text-center">#</th>
                    <th scope="col" className="px-2.5 py-3">Booking / Date</th>
                    <th scope="col" className="px-2.5 py-3">Guest Name</th>
                    <th scope="col" className="px-2.5 py-3 text-center">Channel / Mode</th>
                    <th scope="col" className="px-2 py-3 text-right">Base Amt</th>
                    <th scope="col" className="px-2 py-3 text-right">Tax Amt</th>
                    <th scope="col" className="px-2 py-3 text-right">Total</th>
                    <th scope="col" className="px-2 py-3 text-right text-rose-400">Discount</th>
                    <th scope="col" className="px-2 py-3 text-right text-purple-400">Comm</th>
                    <th scope="col" className="px-2 py-3 text-right text-yellow-400">TCS</th>
                    <th scope="col" className="px-2 py-3 text-right text-teal-400">TDS</th>
                    <th scope="col" className="px-2.5 py-3 text-right text-emerald-400 font-bold">Final Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {filteredHotelBills.days.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-slate-500 font-sans">
                        {searchQuery ? 'No checked-out bookings match your search filter.' : 'No checked-out bookings found in this date range.'}
                      </td>
                    </tr>
                  ) : (
                    filteredHotelBills.days.map((day) => {
                      let rowSerNo = 1;
                      return (
                        <React.Fragment key={day.dateKey}>
                          {/* Day Group Header */}
                          <tr className="bg-slate-800/90 border-y border-white/10 font-sans sticky z-10">
                            <td colSpan={12} className="px-3 py-2 font-bold text-white text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <Calendar size={13} className="text-amber-400 shrink-0" />
                                  <span className="text-xs font-bold text-amber-300">{day.dateHeaderStr}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-normal">
                                    {day.totalBookings} Bookings
                                  </span>
                                </div>
                                <div className="text-[10px] font-medium text-slate-300 flex items-center gap-2.5 flex-wrap">
                                  <span>Base: <strong className="text-white font-mono">₹{day.totalBaseAmount.toFixed(2)}</strong></span>
                                  <span>Tax: <strong className="text-orange-300 font-mono">₹{day.totalTaxAmount.toFixed(2)}</strong></span>
                                  <span>Gross: <strong className="text-amber-300 font-mono">₹{day.totalAmount.toFixed(2)}</strong></span>
                                  {day.totalDiscountAmount > 0 && (
                                    <span>Discount: <strong className="text-rose-400 font-mono">-₹{day.totalDiscountAmount.toFixed(2)}</strong></span>
                                  )}
                                  {day.totalCommission > 0 && (
                                    <span>Comm: <strong className="text-purple-300 font-mono">-₹{day.totalCommission.toFixed(2)}</strong></span>
                                  )}
                                  {day.totalTcs > 0 && (
                                    <span>TCS: <strong className="text-yellow-300 font-mono">-₹{day.totalTcs.toFixed(2)}</strong></span>
                                  )}
                                  {day.totalTds > 0 && (
                                    <span>TDS: <strong className="text-teal-300 font-mono">-₹{day.totalTds.toFixed(2)}</strong></span>
                                  )}
                                  <span>Final: <strong className="text-emerald-400 font-mono">₹{day.totalFinalAmount.toFixed(2)}</strong></span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Individual booking rows */}
                          {day.bookings.map((b) => {
                            const disc = Number(b.roomDiscountAmount || 0);
                            const comm = Number(b.commission || 0);
                            const tcsVal = Number(b.tcs || 0);
                            const tdsVal = Number(b.tds || 0);
                            const ser = String(rowSerNo++).padStart(2, '0');

                            return (
                              <tr
                                key={`hotel-bill-${b.id}`}
                                className="hover:bg-white/5 transition-colors"
                              >
                                <td className="px-2 py-2 text-center text-slate-500 font-semibold">{ser}.</td>
                                <td className="px-2.5 py-2">
                                  <div className="font-bold text-white tracking-wide">{b.bookingId}</div>
                                  <div className="text-[10px] text-slate-400 font-sans">{b.dateStr}</div>
                                </td>
                                <td className="px-2.5 py-2 font-sans font-medium text-slate-200">
                                  <div>{b.guestName}</div>
                                  {b.guestPhone && (
                                    <div className="text-[10px] text-slate-400 font-mono">{b.guestPhone}</div>
                                  )}
                                </td>
                                <td className="px-2.5 py-2 text-center font-sans">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                      <Globe size={9} />
                                      {b.channel || 'Direct'}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-400">
                                      {b.paymentMode || 'PAID'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-right font-medium text-slate-200">
                                  ₹{b.baseAmount.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-right font-medium text-orange-300">
                                  ₹{b.taxAmount.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-right font-bold text-amber-300">
                                  ₹{b.totalAmount.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-right font-medium text-rose-400">
                                  {disc > 0 ? `₹${disc.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-2 py-2 text-right font-medium text-purple-300">
                                  {comm > 0 ? `₹${comm.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-2 py-2 text-right font-medium text-yellow-300">
                                  {tcsVal > 0 ? `₹${tcsVal.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-2 py-2 text-right font-medium text-teal-300">
                                  {tdsVal > 0 ? `₹${tdsVal.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-2.5 py-2 text-right font-bold text-emerald-400">
                                  ₹{b.finalAmount.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Day Subtotal Row */}
                          <tr className="bg-black/40 border-t border-white/10 font-bold font-mono text-xs">
                            <td colSpan={4} className="px-2.5 py-2 text-right text-slate-400 font-sans text-xs">
                              Subtotal ({day.dateStr}):
                            </td>
                            <td className="px-2 py-2 text-right text-slate-200">₹{day.totalBaseAmount.toFixed(2)}</td>
                            <td className="px-2 py-2 text-right text-orange-300">₹{day.totalTaxAmount.toFixed(2)}</td>
                            <td className="px-2 py-2 text-right text-amber-300">₹{day.totalAmount.toFixed(2)}</td>
                            <td className="px-2 py-2 text-right text-rose-400">
                              {day.totalDiscountAmount > 0 ? `₹${day.totalDiscountAmount.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-2 py-2 text-right text-purple-300">
                              {day.totalCommission > 0 ? `₹${day.totalCommission.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-2 py-2 text-right text-yellow-300">
                              {day.totalTcs > 0 ? `₹${day.totalTcs.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-2 py-2 text-right text-teal-300">
                              {day.totalTds > 0 ? `₹${day.totalTds.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-2.5 py-2 text-right text-emerald-400 font-black">
                              ₹{day.totalFinalAmount.toFixed(2)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                {filteredHotelBills.days.length > 0 && (
                  <tfoot className="bg-black/90 backdrop-blur-md border-t-2 border-amber-500/40 text-white sticky bottom-0 z-20 font-mono text-xs font-bold">
                    <tr>
                      <td colSpan={4} className="px-2.5 py-3 text-right font-sans text-xs uppercase tracking-wider text-amber-400">
                        GRAND TOTAL ({filteredHotelBills.checkedOutBookings} Bookings):
                      </td>
                      <td className="px-2 py-3 text-right text-white">₹{filteredHotelBills.totalBaseAmount.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right text-orange-300">₹{filteredHotelBills.totalTaxAmount.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right text-amber-300">₹{filteredHotelBills.totalAmount.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right text-rose-400">
                        {filteredHotelBills.totalDiscountAmount > 0 ? `₹${filteredHotelBills.totalDiscountAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-2 py-3 text-right text-purple-300">
                        ₹{filteredHotelBills.totalCommission.toFixed(2)}
                      </td>
                      <td className="px-2 py-3 text-right text-yellow-300">
                        ₹{filteredHotelBills.totalTcs.toFixed(2)}
                      </td>
                      <td className="px-2 py-3 text-right text-teal-300">
                        ₹{filteredHotelBills.totalTds.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-3 text-right text-emerald-400 text-sm font-black">
                        ₹{filteredHotelBills.grandTotalFinalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Mobile Grouped Cards View (md:hidden) */}
          <div className="block md:hidden space-y-4">
            {filteredHotelBills.days.length === 0 ? (
              <div className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 p-8 text-center text-slate-500 text-sm">
                {searchQuery ? 'No checked-out bookings match your search filter.' : 'No checked-out bookings found in this date range.'}
              </div>
            ) : (
              filteredHotelBills.days.map((day) => (
                <div
                  key={`mob-hotel-day-${day.dateKey}`}
                  className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg space-y-2"
                >
                  <div className="bg-slate-800/90 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{day.dateHeaderStr}</h4>
                      <p className="text-[11px] text-slate-400">{day.totalBookings} Checked-Out Bookings</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold font-mono text-sm block">
                        ₹{day.totalFinalAmount.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">Gross: ₹{day.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {day.bookings.map((b) => {
                      const disc = Number(b.roomDiscountAmount || 0);
                      const comm = Number(b.commission || 0);
                      const tcsVal = Number(b.tcs || 0);
                      const tdsVal = Number(b.tds || 0);

                      return (
                        <div
                          key={`mob-hotel-b-${b.id}`}
                          className="p-3 rounded-xl border transition-colors bg-black/30 border-white/5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white">{b.bookingId}</span>
                              <span className="text-[10px] text-slate-400">&bull; {b.guestName}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {b.channel || 'Direct'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono py-1.5 border-y border-white/5 text-center">
                            <div>
                              <span className="text-[9px] text-slate-500 font-sans block">Base</span>
                              <span className="text-slate-300">₹{b.baseAmount.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-sans block">Tax</span>
                              <span className="text-orange-300">₹{b.taxAmount.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-sans block">Gross</span>
                              <span className="text-amber-300">₹{b.totalAmount.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-sans block">Commission</span>
                              <span className="text-purple-300">{comm > 0 ? `₹${comm.toFixed(2)}` : '-'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-sans block">TCS Tax</span>
                              <span className="text-yellow-300">{tcsVal > 0 ? `₹${tcsVal.toFixed(2)}` : '-'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-sans block">TDS Tax</span>
                              <span className="text-teal-300">{tdsVal > 0 ? `₹${tdsVal.toFixed(2)}` : '-'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <div className="text-[10px] text-slate-400 font-sans">
                              Mode: <span className="text-slate-200 font-medium">{b.paymentMode || 'PAID'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 uppercase font-sans block">Final Settled</span>
                              <span className="text-emerald-400 font-bold font-mono text-sm">₹{b.finalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default HotelDailyBillSummarySection;
