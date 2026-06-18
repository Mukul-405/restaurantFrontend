import { Order } from '../store/slices/orderSlice';

export const printReceipt = (order: Order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print receipts.');
    return;
  }

  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Format Date (e.g., 2026-05-03)
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toISOString().split('T')[0];
  
  // Format Time (e.g., 06:28:16 PM)
  const formattedTime = orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

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
            padding: 10mm; 
            box-sizing: border-box;
            color: #000;
            line-height: 1.25;
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          
          .store-logo-box {
            background: #000;
            color: #fff;
            display: inline-block;
            padding: 4px 12px;
            font-weight: 900;
            font-size: 22px;
            margin-bottom: 6px;
            border-radius: 2px;
            letter-spacing: 1px;
          }
          
          .store-name { font-size: 22px; font-weight: 900; margin: 4px 0; letter-spacing: 0.5px; }
          .store-address { font-size: 13px; margin: 0; }
          .store-meta { font-size: 13px; font-weight: bold; margin: 0; }
          
          .divider { border-bottom: 1px solid #000; margin: 8px 0; }
          .divider-thick { border-bottom: 2px solid #000; margin: 8px 0; }
          
          .flex-between { display: flex; justify-content: space-between; align-items: flex-start; }
          .meta-right { text-align: right; }
          
          .table-guest { margin: 10px 0; font-weight: bold; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 5px; font-weight: bold; font-size: 13px; }
          th { border-bottom: 2px solid #000; padding-bottom: 4px; text-align: right; }
          th.text-left { text-align: left; }
          td { padding: 4px 0; vertical-align: top; text-align: right; }
          td.text-left { text-align: left; }
          
          .w-qty { width: 15%; text-align: center; }
          .w-rate { width: 22%; }
          .w-amount { width: 25%; }
          
          .item-name { width: 38%; text-align: left; padding-right: 5px; }
          
          .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 5px; font-weight: bold; font-size: 13px; }
          .totals-table { width: 70%; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          
          .total-row-main { display: flex; justify-content: space-between; align-items: flex-start; font-size: 16px; font-weight: 900; margin: 4px 0; }
          
          .footer-msg { text-align: center; font-weight: 900; font-size: 14px; margin-top: 15px; }
          .cashier { font-size: 13px; margin-top: 20px; font-weight: normal; display: flex; align-items: center; }
          
          @media print {
            body { 
              background: #fff; 
              padding: 0; 
              display: block; 
            }
            .receipt { 
              width: 100%; 
              padding: 6mm;
              box-shadow: none; 
              margin: 0 auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="text-center">
            <div class="store-logo-box">Sunrise</div>
            <div class="store-name">Sunrise Resorts</div>
            <div class="store-address">Tanot Road, Ramgarh Bypass,</div>
            <div class="store-address">Ramgarh Jaisalmer Rajasthan</div>
            <div class="store-address">345022</div>
            <div class="store-address">sunriseresorts28@gmail.com</div>
            <div class="store-meta" style="margin-top: 4px;">Phone No : +917891200010</div>
            <div class="store-meta">GSTIN : 08AFAFS7077J1ZI</div>
            <div class="store-meta">FSSAI: 12224028000711</div>
          </div>
          
          <div class="divider-thick"></div>
          
          <div class="flex-between font-bold" style="margin-bottom: 4px;">
            <div style="font-size: 15px;">Receipt :</div>
            <div class="meta-right">Date : ${formattedDate}</div>
          </div>
          <div class="flex-between font-bold">
            <div style="font-size: 15px;">KOT: A1-${order.id}</div>
            <div class="meta-right">Time: ${formattedTime}</div>
          </div>
          
          <div class="table-guest">
            <div>Table No:</div>
            <div style="font-size: 15px;">${order.tableNumber ? `TABLE-${order.tableNumber}` : 'WALK-IN'}</div>
            <div style="margin-top: 4px; font-size: 15px;">Guest : ${order.phoneNumber || 'CASH'}</div>
          </div>
          
          <div class="divider-thick" style="margin-bottom: 0;"></div>
          <table>
            <thead>
              <tr>
                <th class="text-left">Item</th>
                <th class="w-qty" style="text-align: center;">Qty</th>
                <th class="w-rate">Rate</th>
                <th class="w-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td class="text-left item-name">${item.name}</td>
                  <td class="w-qty" style="text-align: center;">${item.quantity}</td>
                  <td class="w-rate">${Number(item.price).toFixed(2)}</td>
                  <td class="w-amount">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div class="font-bold">Total Qty: <span style="margin-left: 20px;">${totalQty}</span></div>
          
          <div class="totals-wrapper">
            <div class="totals-table">
              <div class="totals-row">
                <span>Sub Total :</span>
                <span>${Number(order.baseAmount).toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Total Tax:</span>
                <span>${Number(order.gstAmount).toFixed(2)}</span>
              </div>
              ${Number(order.discountAmount) > 0 ? `
              <div class="totals-row">
                <span>Discount :</span>
                <span>-${Number(order.discountAmount).toFixed(2)}</span>
              </div>` : ''}
              
              <div class="total-row-main" style="margin-top: 8px;">
                <span>Total :</span>
                <div style="text-align: right;">
                  <div>${Number(order.finalDiscountedAmount).toFixed(2)}</div>
                  <div style="font-size: 14px;">Rs</div>
                </div>
              </div>
              
              <div class="total-row-main" style="margin-top: 8px;">
                <span>Due :</span>
                <div style="text-align: right;">
                  <div>${Number(order.finalDiscountedAmount).toFixed(2)}</div>
                  <div style="font-size: 14px;">Rs</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="divider-thick" style="margin-top: 15px;"></div>
          
          <div class="footer-msg">
            <div>Thank You For Your Visit.</div>
            <div style="margin-top: 2px;">Have A Nice Day!</div>
          </div>
          
          <div class="cashier">
            <span style="font-size: 24px; line-height: 10px; margin-right: 4px; position: relative; top: -4px;">.</span>
            Cashier: ${order.user?.name || 'Admin'}
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
