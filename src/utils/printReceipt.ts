import { Order } from '../store/slices/orderSlice';

export const printReceipt = (order: Order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print receipts.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - Order #${order.id}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
            display: flex;
            justify-content: center;
          }
          .receipt {
            width: 80mm;
            background: #fff;
            padding: 18mm 30mm; /* Significantly more space from the left and right edges */
            box-sizing: border-box;
            color: #000;
            line-height: 1.3;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1, h2, h3, p { margin: 0; padding: 0; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          
          .store-name { font-size: 22px; margin-bottom: 4px; font-weight: 900; letter-spacing: 1px; }
          .store-subtitle { font-size: 11px; color: #333; margin-bottom: 2px; }
          .tax-invoice { font-size: 14px; font-weight: bold; margin: 15px 0 10px 0; letter-spacing: 2px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; }
          
          .info-grid { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
          .info-label { color: #555; }
          .info-value { font-weight: bold; }
          
          .divider-dashed { border-bottom: 1px dashed #000; margin: 12px 0; }
          .divider-solid { border-bottom: 1px solid #000; margin: 12px 0; }
          .divider-thick { border-bottom: 2px solid #000; margin: 12px 0; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 12px; }
          th { border-bottom: 1px solid #000; padding-bottom: 6px; text-transform: uppercase; font-size: 10px; color: #555; }
          td { padding: 6px 0; vertical-align: top; border-bottom: 1px dotted #ccc; }
          tr:last-child td { border-bottom: none; }
          
          .w-qty { width: 15%; text-align: center; }
          .w-price { width: 20%; text-align: right; }
          .w-total { width: 25%; text-align: right; font-weight: bold; }
          .item-name { padding-right: 5px; font-weight: bold; }
          
          .totals-container { margin-top: 15px; font-size: 12px; }
          .flex-between { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .grand-total { font-size: 18px; font-weight: 900; display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 8px; }
          
          .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #444; }
          
          @media print {
            body { 
              background: #fff; 
              padding: 0; 
              display: block; 
            }
            .receipt { 
              width: 100%; 
              padding: 16mm 30mm; /* Keep large padding for the actual print */
              box-shadow: none; 
              margin: 0 auto;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="text-center">
            <h1 class="store-name" style="font-size: 18px;">SUNRISE RESORTS</h1>
          <p class="store-subtitle" style="margin-top: 4px; font-weight: bold;">Ph: 7891200010</p>
          <p class="store-subtitle" style="font-weight: bold;">GSTIN: 08AFAFS7077J1ZI</p>
            
            <div class="tax-invoice uppercase">Tax Invoice</div>
          </div>
          
          <div>
            <div class="info-grid">
              <span class="info-label">Order No:</span>
              <span class="info-value">#${String(order.id).padStart(5, '0')}</span>
            </div>
            <div class="info-grid">
              <span class="info-label">Date:</span>
              <span class="info-value">${new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            ${order.tableNumber ? `
            <div class="info-grid">
              <span class="info-label">Table:</span>
              <span class="info-value">T-${order.tableNumber}</span>
            </div>` : ''}
            ${order.phoneNumber ? `
            <div class="info-grid">
              <span class="info-label">Customer:</span>
              <span class="info-value">${order.phoneNumber}</span>
            </div>` : ''}
            <div class="info-grid">
              <span class="info-label">Waiter:</span>
              <span class="info-value uppercase">${order.user?.name || '-'}</span>
            </div>
          </div>
          
          <div class="divider-solid"></div>
          
          <table>
            <thead>
              <tr>
                <th class="text-left">Item</th>
                <th class="w-qty">Qty</th>
                <th class="w-price">Price</th>
                <th class="w-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td class="item-name">${item.name}</td>
                  <td class="w-qty">${item.quantity}</td>
                  <td class="w-price">${Number(item.price).toFixed(2)}</td>
                  <td class="w-total">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals-container">
            <div class="flex-between">
              <span class="info-label">Subtotal</span>
              <span class="font-bold">Rs. ${Number(order.baseAmount).toFixed(2)}</span>
            </div>
            <div class="flex-between">
              <span class="info-label">GST (5%)</span>
              <span class="font-bold">Rs. ${Number(order.gstAmount).toFixed(2)}</span>
            </div>
            ${Number(order.discountAmount) > 0 ? `
            <div class="flex-between" style="color: #666;">
              <span class="info-label">Discount</span>
              <span class="font-bold">- Rs. ${Number(order.discountAmount).toFixed(2)}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="grand-total">
            <span>TOTAL</span>
            <span>Rs. ${Number(order.finalDiscountedAmount).toFixed(2)}</span>
          </div>
          
          <div class="footer">
            <p class="font-bold" style="font-size: 13px; margin-bottom: 4px;">Thank you for your visit!</p>
            <p>Please come again.</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
