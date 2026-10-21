import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BookingAnalysis, HotelRevenueAnalysis, HotelDailyBillSummaryResult } from '../../../../lib/analysis';
import { printHtml } from '../../../../utils/printReceipt';
import { escapeHtml } from '../../../../utils/escapeHtml';

export const generateBookingPDF = (booking: BookingAnalysis | null, dateRange: { start: string; end: string }) => {
  if (!booking) return null;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`Hotel Bookings & Occupancy Report`, 14, 22);
  doc.setFontSize(10);
  doc.text(`Filtered by Check-Out Date | Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['Metric', 'Value']],
    body: [
      ['Total Room Revenue', `INR ${booking.totalRoomRevenue.toFixed(2)}`],
      ['Total Bookings', booking.totalBookings.toString()],
      ['Rooms Sold (Occupancy)', booking.totalRoomsSold.toString()],
    ],
  });
  return doc;
};

export const downloadBookingReport = (booking: BookingAnalysis | null, dateRange: { start: string; end: string }) => {
  const doc = generateBookingPDF(booking, dateRange);
  if (doc) doc.save(`bookings-${dateRange.start}-to-${dateRange.end}.pdf`);
};

export const printBookingReport = (b: BookingAnalysis | null, dateRange: { start: string; end: string }) => {
  if (!b) return;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hotel Bookings & Occupancy Report</title>
        <style>
          @page { margin: 12mm 10mm; size: A4 portrait; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
          .subtitle { color: #64748b; font-size: 12px; margin: 0; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
          .card-title { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
          .card-val { font-size: 18px; font-weight: 800; color: #0f172a; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Sunrise Resorts - Hotel Bookings & Occupancy Report</h1>
          <p class="subtitle">Filtered by Check-Out Date | Period: ${dateRange.start} to ${dateRange.end} | Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div class="grid">
          <div class="card"><div class="card-title">Total Room Revenue</div><div class="card-val">INR ${Number(b.totalRoomRevenue || 0).toFixed(2)}</div></div>
          <div class="card"><div class="card-title">Total Bookings</div><div class="card-val">${b.totalBookings || 0}</div></div>
          <div class="card"><div class="card-title">Rooms Sold (Occupancy)</div><div class="card-val">${b.totalRoomsSold || 0}</div></div>
        </div>
      </body>
    </html>
  `;
  printHtml(html);
};

export const generateHotelRevenuePDF = (rev: HotelRevenueAnalysis | null, dateRange: { start: string; end: string }) => {
  if (!rev) return null;
  const doc = new jsPDF();

  const cash = rev.paymentModes?.CASH || { count: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0, commission: 0, roomDiscountAmount: 0, finalAmount: 0 };
  const card = rev.paymentModes?.CARD || { count: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0, commission: 0, roomDiscountAmount: 0, finalAmount: 0 };
  const upi = rev.paymentModes?.UPI || { count: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0, commission: 0, roomDiscountAmount: 0, finalAmount: 0 };

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text('Hotel Revenue Summary Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Filtered by Check-Out Date | Period: ${dateRange.start} to ${dateRange.end}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

  let currentY = 42;

  // 1. Overall Summary
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('1. Revenue Summary', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    head: [['Metric', 'Amount (INR)']],
    body: [
      ['Total Checked-Out Bookings', rev.totalBookings.toString()],
      ['Base Amount (Total - Tax)', `INR ${Number(rev.baseAmount || 0).toFixed(2)}`],
      ['Tax Amount', `INR ${Number(rev.taxAmount || 0).toFixed(2)}`],
      ['Total Amount (Base + Tax)', `INR ${Number(rev.totalAmount || 0).toFixed(2)}`],
      ['Room Discount', `INR ${Number(rev.roomDiscountAmount || 0).toFixed(2)}`],
      ['Commission Deducted', `INR ${Number(rev.commission || 0).toFixed(2)}`],
      ['TCS Tax', `INR ${Number(rev.tcs || 0).toFixed(2)}`],
      ['TDS Tax', `INR ${Number(rev.tds || 0).toFixed(2)}`],
      ['Final Settled Amount', `INR ${Number(rev.finalAmount || 0).toFixed(2)}`],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 2. Payment Mode Collection Breakdown
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('2. Payment Mode Collection Breakdown', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 },
    head: [['Payment Mode', 'Count', 'Base Amt', 'Tax Amt', 'Total (Base+Tax)', 'Discount & Comm', 'TDS & TCS', 'Final Amt']],
    body: [
      [
        'CASH',
        cash.count.toString(),
        Number(cash.baseAmount).toFixed(2),
        Number(cash.taxAmount).toFixed(2),
        Number(cash.totalAmount).toFixed(2),
        Number(cash.roomDiscountAmount + cash.commission).toFixed(2),
        Number((cash.tds || 0) + (cash.tcs || 0)).toFixed(2),
        Number(cash.finalAmount).toFixed(2),
      ],
      [
        'CARD',
        card.count.toString(),
        Number(card.baseAmount).toFixed(2),
        Number(card.taxAmount).toFixed(2),
        Number(card.totalAmount).toFixed(2),
        Number(card.roomDiscountAmount + card.commission).toFixed(2),
        Number((card.tds || 0) + (card.tcs || 0)).toFixed(2),
        Number(card.finalAmount).toFixed(2),
      ],
      [
        'UPI',
        upi.count.toString(),
        Number(upi.baseAmount).toFixed(2),
        Number(upi.taxAmount).toFixed(2),
        Number(upi.totalAmount).toFixed(2),
        Number(upi.roomDiscountAmount + upi.commission).toFixed(2),
        Number((upi.tds || 0) + (upi.tcs || 0)).toFixed(2),
        Number(upi.finalAmount).toFixed(2),
      ],
    ],
    foot: [
      [
        'Total',
        rev.totalBookings.toString(),
        Number(rev.baseAmount).toFixed(2),
        Number(rev.taxAmount).toFixed(2),
        Number(rev.totalAmount).toFixed(2),
        Number(rev.roomDiscountAmount + rev.commission).toFixed(2),
        Number((rev.tds || 0) + (rev.tcs || 0)).toFixed(2),
        Number(rev.finalAmount).toFixed(2),
      ],
    ],
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
  });

  return doc;
};

export const downloadHotelRevenueReport = (rev: HotelRevenueAnalysis | null, dateRange: { start: string; end: string }) => {
  const doc = generateHotelRevenuePDF(rev, dateRange);
  if (doc) doc.save(`hotel-revenue-${dateRange.start}-to-${dateRange.end}.pdf`);
};

export const printHotelRevenueReport = (rev: HotelRevenueAnalysis | null, dateRange: { start: string; end: string }) => {
  if (!rev) return;
  const cash = rev.paymentModes?.CASH || { count: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0, commission: 0, roomDiscountAmount: 0, finalAmount: 0 };
  const card = rev.paymentModes?.CARD || { count: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0, commission: 0, roomDiscountAmount: 0, finalAmount: 0 };
  const upi = rev.paymentModes?.UPI || { count: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0, commission: 0, roomDiscountAmount: 0, finalAmount: 0 };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hotel Revenue Summary Report</title>
        <style>
          @page { margin: 12mm 10mm; size: A4 portrait; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
          .subtitle { color: #64748b; font-size: 11px; margin: 0; }
          .section-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 16px 0 6px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
          td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          tfoot tr td { font-weight: 800; background: #f8fafc; border-top: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Sunrise Resorts - Hotel Revenue Summary Report</h1>
          <p class="subtitle">Filtered by Check-Out Date | Period: ${dateRange.start} to ${dateRange.end} | Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="section-title">1. Overall Revenue Summary</div>
        <table>
          <thead><tr><th>Metric</th><th class="text-right">Amount (INR)</th></tr></thead>
          <tbody>
            <tr><td>Total Checked-Out Bookings</td><td class="text-right font-bold">${rev.totalBookings}</td></tr>
            <tr><td>Base Amount (Total - Tax)</td><td class="text-right font-bold">INR ${Number(rev.baseAmount || 0).toFixed(2)}</td></tr>
            <tr><td>Tax Amount</td><td class="text-right font-bold">INR ${Number(rev.taxAmount || 0).toFixed(2)}</td></tr>
            <tr><td>Total Gross Amount (Base + Tax)</td><td class="text-right font-bold">INR ${Number(rev.totalAmount || 0).toFixed(2)}</td></tr>
            <tr><td>Room Discount</td><td class="text-right font-bold">INR ${Number(rev.roomDiscountAmount || 0).toFixed(2)}</td></tr>
            <tr><td>Commission Deducted</td><td class="text-right font-bold">INR ${Number(rev.commission || 0).toFixed(2)}</td></tr>
            <tr><td>TCS Tax</td><td class="text-right font-bold">INR ${Number(rev.tcs || 0).toFixed(2)}</td></tr>
            <tr><td>TDS Tax</td><td class="text-right font-bold">INR ${Number(rev.tds || 0).toFixed(2)}</td></tr>
            <tr><td class="font-bold">Final Settled Amount</td><td class="text-right font-bold">INR ${Number(rev.finalAmount || 0).toFixed(2)}</td></tr>
          </tbody>
        </table>

        <div class="section-title">2. Payment Mode Collection Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Payment Mode</th>
              <th class="text-right">Count</th>
              <th class="text-right">Base Amt</th>
              <th class="text-right">Tax Amt</th>
              <th class="text-right">Total (Base+Tax)</th>
              <th class="text-right">Discount & Comm</th>
              <th class="text-right">TDS & TCS</th>
              <th class="text-right">Final Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CASH</td>
              <td class="text-right">${cash.count}</td>
              <td class="text-right">INR ${Number(cash.baseAmount).toFixed(2)}</td>
              <td class="text-right">INR ${Number(cash.taxAmount).toFixed(2)}</td>
              <td class="text-right font-bold">INR ${Number(cash.totalAmount).toFixed(2)}</td>
              <td class="text-right">INR ${Number(cash.roomDiscountAmount + cash.commission).toFixed(2)}</td>
              <td class="text-right">INR ${Number((cash.tds || 0) + (cash.tcs || 0)).toFixed(2)}</td>
              <td class="text-right font-bold">INR ${Number(cash.finalAmount).toFixed(2)}</td>
            </tr>
            <tr>
              <td>CARD</td>
              <td class="text-right">${card.count}</td>
              <td class="text-right">INR ${Number(card.baseAmount).toFixed(2)}</td>
              <td class="text-right">INR ${Number(card.taxAmount).toFixed(2)}</td>
              <td class="text-right font-bold">INR ${Number(card.totalAmount).toFixed(2)}</td>
              <td class="text-right">INR ${Number(card.roomDiscountAmount + card.commission).toFixed(2)}</td>
              <td class="text-right">INR ${Number((card.tds || 0) + (card.tcs || 0)).toFixed(2)}</td>
              <td class="text-right font-bold">INR ${Number(card.finalAmount).toFixed(2)}</td>
            </tr>
            <tr>
              <td>UPI</td>
              <td class="text-right">${upi.count}</td>
              <td class="text-right">INR ${Number(upi.baseAmount).toFixed(2)}</td>
              <td class="text-right">INR ${Number(upi.taxAmount).toFixed(2)}</td>
              <td class="text-right font-bold">INR ${Number(upi.totalAmount).toFixed(2)}</td>
              <td class="text-right">INR ${Number(upi.roomDiscountAmount + upi.commission).toFixed(2)}</td>
              <td class="text-right">INR ${Number((upi.tds || 0) + (upi.tcs || 0)).toFixed(2)}</td>
              <td class="text-right font-bold">INR ${Number(upi.finalAmount).toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td class="text-right">${rev.totalBookings}</td>
              <td class="text-right">INR ${Number(rev.baseAmount).toFixed(2)}</td>
              <td class="text-right">INR ${Number(rev.taxAmount).toFixed(2)}</td>
              <td class="text-right font-bold">INR ${Number(rev.totalAmount).toFixed(2)}</td>
              <td class="text-right">INR ${Number(rev.roomDiscountAmount + rev.commission).toFixed(2)}</td>
              <td class="text-right">INR ${Number((rev.tds || 0) + (rev.tcs || 0)).toFixed(2)}</td>
              <td class="text-right font-bold">INR ${Number(rev.finalAmount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;
  printHtml(html);
};

export const generateHotelDailyBillPDF = (
  filteredHotelBills: HotelDailyBillSummaryResult | null,
  dateRange: { start: string; end: string }
) => {
  if (!filteredHotelBills || filteredHotelBills.days.length === 0) return null;
  const doc = new jsPDF({ orientation: "landscape" });
  const res = filteredHotelBills;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(res.monthTitle ? `Hotel Bill Summary (Checked-Out Bookings) - ${res.monthTitle}` : "Hotel Bill Summary (Checked-Out Bookings)", 148, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Filtered by Check-Out Date | Period: ${dateRange.start} to ${dateRange.end} | Generated: ${new Date().toLocaleString()}`,
    148,
    22,
    { align: "center" }
  );

  const tableBody: any[] = [];

  res.days.forEach((day) => {
    let currentSerNo = 1;
    // Day header row
    tableBody.push([
      {
        content: `${day.dateHeaderStr} (${day.totalBookings} Checked-Out Bookings | Final Settled: INR ${day.totalFinalAmount.toFixed(2)})`,
        colSpan: 13,
        styles: { fillColor: [245, 158, 11], fontStyle: "bold", textColor: [255, 255, 255] },
      },
    ]);

    day.bookings.forEach((b) => {
      tableBody.push([
        String(currentSerNo++).padStart(2, "0"),
        b.bookingId,
        b.guestName,
        b.channel || "Direct",
        b.dateStr,
        Number(b.baseAmount).toFixed(2),
        Number(b.taxAmount).toFixed(2),
        Number(b.totalAmount).toFixed(2),
        Number(b.roomDiscountAmount || 0).toFixed(2),
        Number(b.commission).toFixed(2),
        Number(b.tcs || 0).toFixed(2),
        Number(b.tds || 0).toFixed(2),
        Number(b.finalAmount).toFixed(2),
      ]);
    });

    // Day Subtotal Row
    tableBody.push([
      {
        content: `Subtotal (${day.dateStr}):`,
        colSpan: 5,
        styles: { fillColor: [254, 243, 199], fontStyle: "bold", textColor: [15, 23, 42], halign: "right" },
      },
      { content: Number(day.totalBaseAmount).toFixed(2), styles: { fillColor: [254, 243, 199], fontStyle: "bold", halign: "right" } },
      { content: Number(day.totalTaxAmount).toFixed(2), styles: { fillColor: [254, 243, 199], fontStyle: "bold", halign: "right" } },
      { content: Number(day.totalAmount).toFixed(2), styles: { fillColor: [254, 243, 199], fontStyle: "bold", halign: "right" } },
      { content: Number(day.totalDiscountAmount).toFixed(2), styles: { fillColor: [254, 243, 199], fontStyle: "bold", halign: "right" } },
      { content: Number(day.totalCommission).toFixed(2), styles: { fillColor: [254, 243, 199], fontStyle: "bold", halign: "right" } },
      { content: Number(day.totalTcs).toFixed(2), styles: { fillColor: [254, 243, 199], fontStyle: "bold", halign: "right" } },
      { content: Number(day.totalTds).toFixed(2), styles: { fillColor: [254, 243, 199], fontStyle: "bold", halign: "right" } },
      { content: Number(day.totalFinalAmount).toFixed(2), styles: { fillColor: [254, 243, 199], fontStyle: "bold", halign: "right" } },
    ]);
  });

  autoTable(doc, {
    startY: 28,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    head: [
      [
        "#",
        "Booking ID",
        "Guest Name",
        "Channel",
        "Check-Out",
        "Base Amt",
        "Tax Amt",
        "Total (Base+Tax)",
        "Discount",
        "Commission",
        "TCS",
        "TDS",
        "Final Settled",
      ],
    ],
    body: tableBody,
    foot: [
      [
        {
          content: `Grand Total (${res.totalBookings} Checked-Out Bookings):`,
          colSpan: 5,
          styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" },
        },
        { content: Number(res.totalBaseAmount).toFixed(2), styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" } },
        { content: Number(res.totalTaxAmount).toFixed(2), styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" } },
        { content: Number(res.totalAmount).toFixed(2), styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" } },
        { content: Number(res.totalDiscountAmount).toFixed(2), styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" } },
        { content: Number(res.totalCommission).toFixed(2), styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" } },
        { content: Number(res.totalTcs).toFixed(2), styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" } },
        { content: Number(res.totalTds).toFixed(2), styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "right" } },
        { content: Number(res.grandTotalFinalAmount).toFixed(2), styles: { fillColor: [15, 23, 42], textColor: [16, 185, 129], fontStyle: "bold", halign: "right" } },
      ],
    ],
  });

  return doc;
};

export const downloadHotelDailyBillReport = (
  filteredHotelBills: HotelDailyBillSummaryResult | null,
  dateRange: { start: string; end: string }
) => {
  const doc = generateHotelDailyBillPDF(filteredHotelBills, dateRange);
  if (doc) doc.save(`hotel-daily-bills-${dateRange.start}-to-${dateRange.end}.pdf`);
};

export const printHotelDailyBillReport = (
  filteredHotelBills: HotelDailyBillSummaryResult | null,
  dateRange?: { start: string; end: string }
) => {
  if (!filteredHotelBills || filteredHotelBills.days.length === 0) return;
  const res = filteredHotelBills;
  const startStr = dateRange?.start || res.startDate || "";
  const endStr = dateRange?.end || res.endDate || "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(res.monthTitle ? `Hotel Bill Summary - ${res.monthTitle}` : "Hotel Bill Summary")}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-title {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .sub-title {
            text-align: center;
            font-size: 10px;
            margin-bottom: 10px;
            color: #444;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          th, td {
            border: 1px solid #999;
            padding: 3px 5px;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8.5px;
          }
          .day-header {
            background-color: #fef3c7;
            font-weight: bold;
            font-size: 10px;
          }
          .day-subtotal {
            background-color: #f8fafc;
            font-weight: bold;
          }
          .grand-total {
            background-color: #1e293b;
            color: #fff;
            font-weight: bold;
            font-size: 10px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .channel-pill {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 1px 3px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header-title">Sunrise Resorts - Hotel Bill Summary (Checked-Out Bookings)</div>
        <div class="sub-title">Filtered by Check-Out Date | Period: ${startStr} to ${endStr} &bull; Generated: ${new Date().toLocaleString()}</div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25px;">#</th>
              <th class="text-center">Booking ID</th>
              <th>Guest Name</th>
              <th class="text-center">Channel</th>
              <th class="text-center">Check-Out</th>
              <th class="text-right">Base Amt</th>
              <th class="text-right">Tax Amt</th>
              <th class="text-right">Total (Base+Tax)</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Commission</th>
              <th class="text-right">TCS</th>
              <th class="text-right">TDS</th>
              <th class="text-right">Final Settled</th>
            </tr>
          </thead>
          <tbody>
            ${res.days
              .map((day) => {
                let ser = 1;
                const rows = day.bookings
                  .map((b) => {
                    return `
                      <tr>
                        <td class="text-center">${String(ser++).padStart(2, "0")}</td>
                        <td class="text-center font-bold">${escapeHtml(b.bookingId)}</td>
                        <td>${escapeHtml(b.guestName)}</td>
                        <td class="text-center"><span class="channel-pill">${escapeHtml(b.channel || "Direct")}</span></td>
                        <td class="text-center">${escapeHtml(b.dateStr)}</td>
                        <td class="text-right">${b.baseAmount.toFixed(2)}</td>
                        <td class="text-right">${b.taxAmount.toFixed(2)}</td>
                        <td class="text-right">${b.totalAmount.toFixed(2)}</td>
                        <td class="text-right">${b.roomDiscountAmount > 0 ? b.roomDiscountAmount.toFixed(2) : "-"}</td>
                        <td class="text-right">${b.commission > 0 ? b.commission.toFixed(2) : "-"}</td>
                        <td class="text-right">${b.tcs > 0 ? b.tcs.toFixed(2) : "-"}</td>
                        <td class="text-right">${b.tds > 0 ? b.tds.toFixed(2) : "-"}</td>
                        <td class="text-right font-bold">${b.finalAmount.toFixed(2)}</td>
                      </tr>
                    `;
                  })
                  .join("");

                const subtotal = `
                  <tr class="day-subtotal">
                    <td colspan="5" class="text-right font-bold">Subtotal (${escapeHtml(day.dateStr)}):</td>
                    <td class="text-right font-bold">${day.totalBaseAmount.toFixed(2)}</td>
                    <td class="text-right font-bold">${day.totalTaxAmount.toFixed(2)}</td>
                    <td class="text-right font-bold">${day.totalAmount.toFixed(2)}</td>
                    <td class="text-right font-bold">${day.totalDiscountAmount > 0 ? day.totalDiscountAmount.toFixed(2) : "-"}</td>
                    <td class="text-right font-bold">${day.totalCommission > 0 ? day.totalCommission.toFixed(2) : "-"}</td>
                    <td class="text-right font-bold">${day.totalTcs > 0 ? day.totalTcs.toFixed(2) : "-"}</td>
                    <td class="text-right font-bold">${day.totalTds > 0 ? day.totalTds.toFixed(2) : "-"}</td>
                    <td class="text-right font-bold">${day.totalFinalAmount.toFixed(2)}</td>
                  </tr>
                `;

                return `
                  <tr class="day-header">
                    <td colspan="13">${escapeHtml(day.dateHeaderStr)} (${day.totalBookings} Checked-Out Bookings &bull; Final Settled: INR ${day.totalFinalAmount.toFixed(2)})</td>
                  </tr>
                  ${rows}
                  ${subtotal}
                `;
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr class="grand-total">
              <td colspan="5" class="text-right">Grand Total:</td>
              <td class="text-right">${res.totalBaseAmount.toFixed(2)}</td>
              <td class="text-right">${res.totalTaxAmount.toFixed(2)}</td>
              <td class="text-right">${res.totalAmount.toFixed(2)}</td>
              <td class="text-right">${res.totalDiscountAmount.toFixed(2)}</td>
              <td class="text-right">${res.totalCommission.toFixed(2)}</td>
              <td class="text-right">${res.totalTcs.toFixed(2)}</td>
              <td class="text-right">${res.totalTds.toFixed(2)}</td>
              <td class="text-right" style="color: #4ade80;">${res.grandTotalFinalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;
  printHtml(html);
};
