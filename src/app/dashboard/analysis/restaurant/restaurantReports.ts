import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { printHtml } from '../../../../utils/printReceipt';
import { escapeHtml } from '../../../../utils/escapeHtml';
import { RevenueAnalysis, OrderItemAnalysis, DailyBillSummaryResult } from '../../../../lib/analysis';

export const generateRevenuePDF = (rev: RevenueAnalysis | null, dateRange: { start: string; end: string }) => {
  if (!rev) return null;
  const doc = new jsPDF();
        const cash = rev.paymentModes?.CASH || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const card = rev.paymentModes?.CARD || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const upi = rev.paymentModes?.UPI || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const roomTransfer = rev.paymentModes?.ROOM_TRANSFER || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };

    const totalOrders = rev.totalOrders || 0;
    const dineInCount = totalOrders - roomTransfer.count;
    const dineInBase = rev.totalBaseAmount - roomTransfer.baseAmount;
    const dineInTax = rev.totalGstAmount - roomTransfer.gstAmount;
    const dineInTotal = rev.totalFinalDiscountedAmount - roomTransfer.totalAmount;

    const totalPaymentsBase = cash.baseAmount + card.baseAmount + upi.baseAmount;
    const totalPaymentsTax = cash.gstAmount + card.gstAmount + upi.gstAmount;
    const totalPaymentsTotal = cash.totalAmount + card.totalAmount + upi.totalAmount;
    const totalPaymentsCount = cash.count + card.count + upi.count;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Sales & Revenue Summary Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    let currentY = 40;

    // 1. Overall Sales Summary
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Sales Summary', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['Metric', 'Amount (INR)']],
      body: [
        ['Total Orders Completed', totalOrders.toString()],
        ['Total Discount', `INR ${Number(rev.totalDiscountAmount || 0).toFixed(2)}`],
        ['Net Sales (Base Amount)', `INR ${Number(rev.totalBaseAmount || 0).toFixed(2)}`],
        ['Total Tax (5% GST)', `INR ${Number(rev.totalGstAmount || 0).toFixed(2)}`],
        ['Total Settled Sales', `INR ${Number(rev.totalFinalDiscountedAmount || 0).toFixed(2)}`],
      ],
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 2. Order Type Breakdown
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('2. Order Type Breakdown', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['Order Type', 'Base Amount (INR)', 'CGST (2.5%)', 'SGST (2.5%)', 'Total Amount (INR)']],
      body: [
        [
          `DINE IN (${dineInCount})`,
          Number(dineInBase).toFixed(2),
          Number(dineInTax / 2).toFixed(2),
          Number(dineInTax / 2).toFixed(2),
          Number(dineInTotal).toFixed(2)
        ],
        [
          `ROOM SERVICE (${roomTransfer.count})`,
          Number(roomTransfer.baseAmount).toFixed(2),
          Number(roomTransfer.gstAmount / 2).toFixed(2),
          Number(roomTransfer.gstAmount / 2).toFixed(2),
          Number(roomTransfer.totalAmount).toFixed(2)
        ]
      ],
      foot: [
        [
          `Total (${totalOrders})`,
          Number(rev.totalBaseAmount).toFixed(2),
          Number(rev.totalGstAmount / 2).toFixed(2),
          Number(rev.totalGstAmount / 2).toFixed(2),
          Number(rev.totalFinalDiscountedAmount).toFixed(2)
        ]
      ],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 3. Payment Mode Collection Breakdown
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('3. Payment Mode Collection Summary', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['Payment Mode', 'Count', 'Base Amount (INR)', 'CGST (2.5%)', 'SGST (2.5%)', 'Total Amount (INR)']],
      body: [
        [
          'CASH',
          cash.count.toString(),
          Number(cash.baseAmount).toFixed(2),
          Number(cash.gstAmount / 2).toFixed(2),
          Number(cash.gstAmount / 2).toFixed(2),
          Number(cash.totalAmount).toFixed(2)
        ],
        [
          'CARD',
          card.count.toString(),
          Number(card.baseAmount).toFixed(2),
          Number(card.gstAmount / 2).toFixed(2),
          Number(card.gstAmount / 2).toFixed(2),
          Number(card.totalAmount).toFixed(2)
        ],
        [
          'UPI',
          upi.count.toString(),
          Number(upi.baseAmount).toFixed(2),
          Number(upi.gstAmount / 2).toFixed(2),
          Number(upi.gstAmount / 2).toFixed(2),
          Number(upi.totalAmount).toFixed(2)
        ],
      ],
      foot: [
        [
          'Total Direct Payments',
          totalPaymentsCount.toString(),
          Number(totalPaymentsBase).toFixed(2),
          Number(totalPaymentsTax / 2).toFixed(2),
          Number(totalPaymentsTax / 2).toFixed(2),
          Number(totalPaymentsTotal).toFixed(2)
        ]
      ],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 4. Room Transfers (Unsettled / Settled at Checkout)
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('4. Transferred to Room (To Be Settled at Hotel Checkout)', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Category', 'Count', 'Base Amount (INR)', 'CGST (2.5%)', 'SGST (2.5%)', 'Total Amount (INR)']],
      body: [
        [
          'ROOM TRANSFER',
          roomTransfer.count.toString(),
          Number(roomTransfer.baseAmount).toFixed(2),
          Number(roomTransfer.gstAmount / 2).toFixed(2),
          Number(roomTransfer.gstAmount / 2).toFixed(2),
          Number(roomTransfer.totalAmount).toFixed(2)
        ]
      ],
    });

    return doc;
  };

export const downloadRevenueReport = (rev: RevenueAnalysis | null, dateRange: { start: string; end: string }) => {
  const doc = generateRevenuePDF(rev, dateRange);
  if (doc) doc.save(`revenue-${dateRange.start}-to-${dateRange.end}.pdf`);
};

export const printRevenueReport = (rev: RevenueAnalysis | null, dateRange: { start: string; end: string }) => {
  if (!rev) return;
    const cash = rev.paymentModes?.CASH || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const card = rev.paymentModes?.CARD || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const upi = rev.paymentModes?.UPI || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    const roomTransfer = rev.paymentModes?.ROOM_TRANSFER || { count: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0 };

    const totalOrders = rev.totalOrders || 0;
    const dineInCount = totalOrders - roomTransfer.count;
    const dineInBase = rev.totalBaseAmount - roomTransfer.baseAmount;
    const dineInTax = rev.totalGstAmount - roomTransfer.gstAmount;
    const dineInTotal = rev.totalFinalDiscountedAmount - roomTransfer.totalAmount;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales & Revenue Summary Report</title>
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
            <h1 class="title">Sunrise Resorts - Sales & Revenue Summary Report</h1>
            <p class="subtitle">Period: ${dateRange.start} to ${dateRange.end} | Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section-title">1. Overall Sales Summary</div>
          <table>
            <thead><tr><th>Metric</th><th class="text-right">Amount (INR)</th></tr></thead>
            <tbody>
              <tr><td>Total Orders Completed</td><td class="text-right font-bold">${totalOrders}</td></tr>
              <tr><td>Total Discount</td><td class="text-right font-bold">INR ${Number(rev.totalDiscountAmount || 0).toFixed(2)}</td></tr>
              <tr><td>Net Sales (Base Amount)</td><td class="text-right font-bold">INR ${Number(rev.totalBaseAmount || 0).toFixed(2)}</td></tr>
              <tr><td>Total Tax (5% GST)</td><td class="text-right font-bold">INR ${Number(rev.totalGstAmount || 0).toFixed(2)}</td></tr>
              <tr><td class="font-bold">Total Settled Sales</td><td class="text-right font-bold">INR ${Number(rev.totalFinalDiscountedAmount || 0).toFixed(2)}</td></tr>
            </tbody>
          </table>

          <div class="section-title">2. Order Type Breakdown</div>
          <table>
            <thead>
              <tr><th>Order Type</th><th class="text-right">Base Amount</th><th class="text-right">CGST (2.5%)</th><th class="text-right">SGST (2.5%)</th><th class="text-right">Total Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>DINE IN (${dineInCount})</td><td class="text-right">${dineInBase.toFixed(2)}</td><td class="text-right">${(dineInTax / 2).toFixed(2)}</td><td class="text-right">${(dineInTax / 2).toFixed(2)}</td><td class="text-right font-bold">${dineInTotal.toFixed(2)}</td></tr>
              <tr><td>ROOM SERVICE (${roomTransfer.count})</td><td class="text-right">${roomTransfer.baseAmount.toFixed(2)}</td><td class="text-right">${(roomTransfer.gstAmount / 2).toFixed(2)}</td><td class="text-right">${(roomTransfer.gstAmount / 2).toFixed(2)}</td><td class="text-right font-bold">${roomTransfer.totalAmount.toFixed(2)}</td></tr>
            </tbody>
            <tfoot>
              <tr><td>Total (${totalOrders})</td><td class="text-right">${rev.totalBaseAmount.toFixed(2)}</td><td class="text-right">${(rev.totalGstAmount / 2).toFixed(2)}</td><td class="text-right">${(rev.totalGstAmount / 2).toFixed(2)}</td><td class="text-right">${rev.totalFinalDiscountedAmount.toFixed(2)}</td></tr>
            </tfoot>
          </table>

          <div class="section-title">3. Payment Mode Collections</div>
          <table>
            <thead>
              <tr><th>Payment Mode</th><th class="text-right">Count</th><th class="text-right">Base Amount</th><th class="text-right">CGST (2.5%)</th><th class="text-right">SGST (2.5%)</th><th class="text-right">Total Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>CASH</td><td class="text-right">${cash.count}</td><td class="text-right">${cash.baseAmount.toFixed(2)}</td><td class="text-right">${(cash.gstAmount / 2).toFixed(2)}</td><td class="text-right">${(cash.gstAmount / 2).toFixed(2)}</td><td class="text-right font-bold">${cash.totalAmount.toFixed(2)}</td></tr>
              <tr><td>CARD</td><td class="text-right">${card.count}</td><td class="text-right">${card.baseAmount.toFixed(2)}</td><td class="text-right">${(card.gstAmount / 2).toFixed(2)}</td><td class="text-right">${(card.gstAmount / 2).toFixed(2)}</td><td class="text-right font-bold">${card.totalAmount.toFixed(2)}</td></tr>
              <tr><td>UPI</td><td class="text-right">${upi.count}</td><td class="text-right">${upi.baseAmount.toFixed(2)}</td><td class="text-right">${(upi.gstAmount / 2).toFixed(2)}</td><td class="text-right">${(upi.gstAmount / 2).toFixed(2)}</td><td class="text-right font-bold">${upi.totalAmount.toFixed(2)}</td></tr>
              <tr><td>ROOM TRANSFER</td><td class="text-right">${roomTransfer.count}</td><td class="text-right">${roomTransfer.baseAmount.toFixed(2)}</td><td class="text-right">${(roomTransfer.gstAmount / 2).toFixed(2)}</td><td class="text-right">${(roomTransfer.gstAmount / 2).toFixed(2)}</td><td class="text-right font-bold">${roomTransfer.totalAmount.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    printHtml(html);
  };

export const generateOrderItemPDF = (oi: OrderItemAnalysis | null, dateRange: { start: string; end: string }) => {
  if (!oi) return null;
  const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Restaurant Order Items Analysis Report (Excl. GST)', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    let currentY = 42;

    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Executive Summary (Excl. GST)', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['Metric', 'Value']],
      body: [
        ['Total Items Sold (Qty)', oi.totalItemsSold.toString()],
        ['Total Unique Dishes Ordered', oi.totalUniqueItems.toString()],
        ['Total Base Amount (Excl. GST)', `INR ${Number(oi.totalAmountExcludingGst || 0).toFixed(2)}`],
      ],
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('2. Ordered Items Breakdown', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['#', 'Item Name', 'Qty Sold', 'Unit Price (Excl. GST)', 'Total Base Amount (INR)']],
      body: oi.items.map((item, idx) => [
        (idx + 1).toString(),
        item.name,
        item.totalQuantity.toString(),
        `INR ${Number(item.price || 0).toFixed(2)}`,
        `INR ${Number(item.totalAmount || 0).toFixed(2)}`,
      ]),
      foot: [
        [
          'Total',
          `${oi.totalUniqueItems} Unique Items`,
          oi.totalItemsSold.toString(),
          '-',
          `INR ${Number(oi.totalAmountExcludingGst || 0).toFixed(2)}`,
        ],
      ],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    });

    return doc;
  };

export const downloadOrderItemReport = (oi: OrderItemAnalysis | null, dateRange: { start: string; end: string }) => {
  const doc = generateOrderItemPDF(oi, dateRange);
  if (doc) doc.save(`order-items-${dateRange.start}-to-${dateRange.end}.pdf`);
};

export const printOrderItemReport = (oi: OrderItemAnalysis | null, dateRange: { start: string; end: string }) => {
  if (!oi) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Restaurant Order Items Analysis Report (Excl. GST)</title>
          <style>
            @page { margin: 12mm 10mm; size: A4 portrait; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
            .subtitle { color: #64748b; font-size: 11px; margin: 0; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
            .card-title { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
            .card-val { font-size: 16px; font-weight: 800; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; break-inside: avoid; }
            th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
            td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            tfoot tr td { font-weight: 800; background: #f8fafc; border-top: 1.5px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Sunrise Resorts - Restaurant Order Items Report (Excl. GST)</h1>
            <p class="subtitle">Period: ${dateRange.start} to ${dateRange.end} | Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="grid">
            <div class="card"><div class="card-title">Total Items Sold</div><div class="card-val">${oi.totalItemsSold} pcs</div></div>
            <div class="card"><div class="card-title">Unique Dishes Ordered</div><div class="card-val">${oi.totalUniqueItems} dishes</div></div>
            <div class="card"><div class="card-title">Total Base Amount (Excl. GST)</div><div class="card-val">INR ${Number(oi.totalAmountExcludingGst || 0).toFixed(2)}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 40px;">#</th>
                <th>Item Name</th>
                <th class="text-center">Qty Sold</th>
                <th class="text-right">Unit Price (Excl. GST)</th>
                <th class="text-right">Total Base Amount</th>
              </tr>
            </thead>
            <tbody>
              ${oi.items.map((item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td class="font-bold">${escapeHtml(item.name)}</td>
                  <td class="text-center">${item.totalQuantity} pcs</td>
                  <td class="text-right">INR ${Number(item.price || 0).toFixed(2)}</td>
                  <td class="text-right font-bold">INR ${Number(item.totalAmount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total (${oi.totalUniqueItems} Unique Dishes)</td>
                <td class="text-center">${oi.totalItemsSold} pcs</td>
                <td class="text-right">-</td>
                <td class="text-right">INR ${Number(oi.totalAmountExcludingGst || 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    printHtml(html);
  };

export const generateDailyBillPDF = (filteredDailyBills: DailyBillSummaryResult | null, dateRange: { start: string; end: string }) => {
  if (!filteredDailyBills || filteredDailyBills.days.length === 0) return null;
  const doc = new jsPDF();
  const res = filteredDailyBills;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(res.monthTitle || 'Bill Summary', 105, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end} | Generated: ${new Date().toLocaleString()}`, 105, 24, { align: 'center' });

    const tableBody: any[] = [];

    res.days.forEach(day => {
      let currentSerNo = 1;
      // Day header row
      tableBody.push([
        { content: day.dateHeaderStr, colSpan: 10, styles: { fillColor: [226, 232, 240], fontStyle: 'bold', textColor: [15, 23, 42] } }
      ]);

      day.orders.forEach(order => {
        const isCancelled = order.status === 'CANCELLED';
        const disc = Number(order.discountAmount || 0);
        tableBody.push([
          String(currentSerNo++).padStart(2, '0'),
          order.billNo,
          order.dateStr,
          isCancelled ? 'cancel' : Number(order.baseAmount).toFixed(2),
          isCancelled ? '-' : (disc > 0 ? Number(disc).toFixed(2) : '-'),
          isCancelled ? '-' : Number(order.taxableAmount).toFixed(2),
          isCancelled ? '-' : Number(order.sgstAmount).toFixed(2),
          isCancelled ? '-' : Number(order.cgstAmount).toFixed(2),
          isCancelled ? '-' : Number(order.totalAmount).toFixed(2),
          order.remarks || (isCancelled ? 'Cancelled' : (order.paymentMode || '-'))
        ]);
      });

      // Day subtotal
      tableBody.push([
        { content: `Day Total (${day.dateStr})`, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: Number(day.totalBaseAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: day.totalDiscountAmount > 0 ? Number(day.totalDiscountAmount).toFixed(2) : '-', styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: Number(day.totalTaxableAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: Number(day.totalSgstAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: Number(day.totalCgstAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: Number(day.totalAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
        { content: `${day.completedOrders} Orders`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }
      ]);
    });

    autoTable(doc, {
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 16 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { cellWidth: 26 },
      },
      head: [['Ser No', 'Bill No', 'Date', 'Base Amt', 'Discount', 'Taxable Amt', 'SGST 2.5%', 'CGST 2.5%', 'Total Amount', 'Remarks']],
      body: tableBody,
      foot: [
        [
          { content: 'Grand Total', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
          { content: Number(res.totalBaseAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: Number(res.totalDiscountAmount || 0).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: Number(res.totalTaxableAmount || 0).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: Number(res.totalSgstAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: Number(res.totalCgstAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: Number(res.grandTotalAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] } },
          { content: `${res.completedOrders} Completed`, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } }
        ]
      ]
    });

    return doc;
  };

export const downloadDailyBillReport = (filteredDailyBills: DailyBillSummaryResult | null, dateRange: { start: string; end: string }) => {
  const doc = generateDailyBillPDF(filteredDailyBills, dateRange);
  if (doc) doc.save(`daily-bills-${dateRange.start}-to-${dateRange.end}.pdf`);
};

export const printDailyBillReport = (filteredDailyBills: DailyBillSummaryResult | null, dateRange?: { start: string; end: string }) => {
  if (!filteredDailyBills || filteredDailyBills.days.length === 0) return;
  const res = filteredDailyBills;
  const startStr = dateRange?.start || res.startDate || '';
  const endStr = dateRange?.end || res.endDate || '';
    let currentSerNo = 1;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(res.monthTitle || 'Bill Summary')}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 10mm 12mm 10mm;
            }
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
              font-size: 16px;
              font-weight: bold;
              font-style: italic;
              text-decoration: underline;
              margin-bottom: 4px;
            }
            .sub-title {
              text-align: center;
              font-size: 11px;
              color: #444;
              margin-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            th, td {
              border: 1px solid #333;
              padding: 4px 6px;
            }
            th {
              background-color: #f1f5f9;
              font-weight: bold;
              text-align: center;
              font-size: 11px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .day-header-cell {
              background-color: #e2e8f0;
              font-weight: bold;
              font-size: 12px;
              padding: 5px 8px;
              page-break-after: avoid;
              break-after: avoid;
            }
            .subtotal-cell {
              background-color: #f8fafc;
              font-weight: bold;
            }
            .grand-total-cell {
              background-color: #cbd5e1;
              font-weight: 900;
              font-size: 12px;
              border-top: 2px solid #000;
            }
            .cancelled-text {
              font-style: italic;
              color: #444;
            }
          </style>
        </head>
        <body>
          <div class="header-title">${escapeHtml(res.monthTitle || 'Bill Summary')}</div>
          <div class="sub-title">Period: ${startStr} to ${endStr} &bull; Generated: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">Ser No</th>
                <th style="width: 65px;">Bill No</th>
                <th style="width: 85px;">Date</th>
                <th class="text-right">Base Amt</th>
                <th class="text-right" style="width: 65px;">Discount</th>
                <th class="text-right" style="width: 75px;">Taxable Amt</th>
                <th class="text-right" style="width: 65px;">SGST 2.5%</th>
                <th class="text-right" style="width: 65px;">CGST 2.5%</th>
                <th class="text-right">Total Amount</th>
                <th style="width: 90px;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${res.days.map(day => {
      let daySerNo = 1;
      return `
                <tr>
                  <td colspan="10" class="day-header-cell">${escapeHtml(day.dateHeaderStr)}</td>
                </tr>
                ${day.orders.map(order => {
        const isCancelled = order.status === 'CANCELLED';
        const disc = Number(order.discountAmount || 0);
        const ser = String(daySerNo++).padStart(2, '0');
        return `
                    <tr>
                      <td class="text-center">${ser}.</td>
                      <td class="text-center" style="font-weight: 600;">${escapeHtml(order.billNo)}</td>
                      <td class="text-center">${escapeHtml(order.dateStr)}</td>
                      <td class="text-right">${isCancelled ? '<span class="cancelled-text">cancel</span>' : Number(order.baseAmount).toFixed(2)}</td>
                      <td class="text-right" style="color: #be123c;">${isCancelled ? '-' : (disc > 0 ? Number(disc).toFixed(2) : '-')}</td>
                      <td class="text-right">${isCancelled ? '-' : Number(order.taxableAmount).toFixed(2)}</td>
                      <td class="text-right">${isCancelled ? '-' : Number(order.sgstAmount).toFixed(2)}</td>
                      <td class="text-right">${isCancelled ? '-' : Number(order.cgstAmount).toFixed(2)}</td>
                      <td class="text-right" style="font-weight: ${isCancelled ? 'normal' : 'bold'};">${isCancelled ? '-' : Number(order.totalAmount).toFixed(2)}</td>
                      <td>${escapeHtml(order.remarks || (isCancelled ? 'Cancelled' : ''))}</td>
                    </tr>
                  `;
      }).join('')}
                <tr>
                  <td colspan="3" class="subtotal-cell text-right">Day Total (${escapeHtml(day.dateStr)}):</td>
                  <td class="subtotal-cell text-right">${Number(day.totalBaseAmount).toFixed(2)}</td>
                  <td class="subtotal-cell text-right" style="color: #be123c;">${day.totalDiscountAmount > 0 ? Number(day.totalDiscountAmount).toFixed(2) : '-'}</td>
                  <td class="subtotal-cell text-right">${Number(day.totalTaxableAmount || 0).toFixed(2)}</td>
                  <td class="subtotal-cell text-right">${Number(day.totalSgstAmount).toFixed(2)}</td>
                  <td class="subtotal-cell text-right">${Number(day.totalCgstAmount).toFixed(2)}</td>
                  <td class="subtotal-cell text-right">${Number(day.totalAmount).toFixed(2)}</td>
                  <td class="subtotal-cell">${day.completedOrders} Completed</td>
                </tr>
              `;
    }).join('')}
              <tr>
                <td colspan="3" class="grand-total-cell text-right">Grand Total:</td>
                <td class="grand-total-cell text-right">${Number(res.totalBaseAmount).toFixed(2)}</td>
                <td class="grand-total-cell text-right" style="color: #be123c;">${Number(res.totalDiscountAmount || 0).toFixed(2)}</td>
                <td class="grand-total-cell text-right">${Number(res.totalTaxableAmount || 0).toFixed(2)}</td>
                <td class="grand-total-cell text-right">${Number(res.totalSgstAmount).toFixed(2)}</td>
                <td class="grand-total-cell text-right">${Number(res.totalCgstAmount).toFixed(2)}</td>
                <td class="grand-total-cell text-right">${Number(res.grandTotalAmount).toFixed(2)}</td>
                <td class="grand-total-cell">${res.completedOrders} Orders</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    printHtml(html);
  };

