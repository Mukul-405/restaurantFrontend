import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BookingAnalysis } from '../../../../lib/analysis';
import { printHtml } from '../../../../utils/printReceipt';

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
