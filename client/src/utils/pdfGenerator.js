import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format currency in PDF
const fmtLKR = (num) => `Rs. ${Number(num || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pdfGenerator = {
  // 1. GENERATE POS BILL / RECEIPT PDF
  generateBillPDF: (sale) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 160] // Standard 80mm thermal receipt format
    });

    // Pharmacy Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 120, 80);
    doc.text('LANKA CARE PHARMACY', 40, 9, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Reg No: PH-84920 | Tel: 011-2925840', 40, 13, { align: 'center' });
    doc.text('142, Kandy Road, Kadawatha, Sri Lanka', 40, 16.5, { align: 'center' });

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, 19, 76, 19);

    // Bill Meta
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(`INVOICE: ${sale.invoice_no}`, 5, 23);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(sale.created_at || Date.now()).toLocaleString('en-GB')}`, 5, 27);
    doc.text(`Patient: ${sale.customer_name || 'Walk-in Customer'}`, 5, 31);
    if (sale.doctor_name) {
      doc.text(`Doctor: ${sale.doctor_name}`, 5, 35);
    }
    doc.text(`Payment: ${sale.payment_method}`, 5, sale.doctor_name ? 39 : 35);

    const startTableY = sale.doctor_name ? 42 : 38;

    // Items Table
    const tableRows = (sale.items || []).map((it) => [
      `${it.medicine_name}\n${it.batch_no ? `B:${it.batch_no}` : ''}`,
      it.quantity,
      Number(it.unit_price).toFixed(2),
      Number(it.subtotal).toFixed(2)
    ]);

    autoTable(doc, {
      startY: startTableY,
      margin: { left: 4, right: 4 },
      theme: 'plain',
      styles: {
        fontSize: 7,
        cellPadding: 1,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [240, 245, 240],
        textColor: [20, 20, 20],
        fontStyle: 'bold'
      },
      head: [['Item (Batch)', 'Qty', 'Price', 'Total']],
      body: tableRows,
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 14, halign: 'right' },
        3: { cellWidth: 16, halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 3;

    // Totals block
    doc.setDrawColor(200, 200, 200);
    doc.line(4, finalY, 76, finalY);

    let currY = finalY + 4;
    doc.setFontSize(7.5);
    doc.text('Subtotal:', 40, currY);
    doc.text(fmtLKR(sale.subtotal), 76, currY, { align: 'right' });

    if (sale.discount_amount > 0) {
      currY += 3.5;
      doc.setTextColor(200, 0, 0);
      doc.text(`Discount (${sale.discount_percent}%):`, 40, currY);
      doc.text(`-${fmtLKR(sale.discount_amount)}`, 76, currY, { align: 'right' });
      doc.setTextColor(40, 40, 40);
    }

    currY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 120, 80);
    doc.text('NET TOTAL:', 40, currY);
    doc.text(fmtLKR(sale.total_amount), 76, currY, { align: 'right' });

    currY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Tendered:', 40, currY);
    doc.text(fmtLKR(sale.paid_amount), 76, currY, { align: 'right' });

    currY += 3.5;
    doc.text('Change:', 40, currY);
    doc.text(fmtLKR(sale.change_amount), 76, currY, { align: 'right' });

    // Footer blessing
    currY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 120, 80);
    doc.text('Thank You! Get Well Soon!', 40, currY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text('Goods once sold cannot be returned without bill.', 40, currY + 3.5, { align: 'center' });

    // Save PDF
    doc.save(`${sale.invoice_no}.pdf`);
  },

  // 2. GENERATE SALES & PROFIT REPORT PDF
  generateSalesReportPDF: (summary, salesList, startDate, endDate) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header banner
    doc.setFillColor(16, 140, 90);
    doc.rect(0, 0, 210, 26, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('LANKA CARE PHARMACY & HEALTHCARE', 14, 11);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Official Sales Performance & Profit Report (${startDate} to ${endDate})`, 14, 18);

    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 196, 18, { align: 'right' });

    // Summary KPI Block
    let y = 34;
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Financial Executive Summary', 14, y);

    const kpiData = [
      ['Total Completed Bills', `${summary?.totalBills || 0} Bills`, 'Gross Revenue', fmtLKR(summary?.grossSales)],
      ['Discounts Deducted', fmtLKR(summary?.totalDiscounts), 'Net Revenue (Sales)', fmtLKR(summary?.netSales)],
      ['Wholesale Drug Cost (COGS)', fmtLKR(summary?.totalCost), 'Gross Profit Earned', fmtLKR(summary?.grossProfit)],
      ['Profit Margin', `${summary?.profitMargin || 0}%`, 'Report Status', 'Audit Verified']
    ];

    autoTable(doc, {
      startY: y + 2,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: [240, 245, 240] },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      body: kpiData
    });

    // Top Selling Drugs Table
    y = doc.lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. Top-Selling Medicines in Selected Period', 14, y);

    const topRows = (summary?.topMedicines || []).map((m, idx) => [
      idx + 1,
      m.medicine_name,
      m.total_qty_sold,
      fmtLKR(m.total_revenue),
      fmtLKR(m.profit)
    ]);

    autoTable(doc, {
      startY: y + 2,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [16, 140, 90], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      head: [['#', 'Medicine Name', 'Units Sold', 'Total Revenue', 'Profit Earned']],
      body: topRows.length ? topRows : [['-', 'No medicines recorded in range', '-', '-', '-']],
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { halign: 'center', fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Recent Invoices Table
    y = doc.lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. Detailed Invoices Log', 14, y);

    const invRows = (salesList || []).slice(0, 20).map((s) => [
      s.invoice_no,
      new Date(s.created_at).toLocaleDateString('en-GB'),
      s.customer_name || 'Walk-in',
      s.payment_method,
      fmtLKR(s.total_amount)
    ]);

    autoTable(doc, {
      startY: y + 2,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [50, 70, 90], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      head: [['Invoice No', 'Date', 'Customer', 'Payment Method', 'Net Total']],
      body: invRows.length ? invRows : [['-', 'No invoices in range', '-', '-', '-']],
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`LankaCare Pharmacy Management System • Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Sales-Report-${startDate}-to-${endDate}.pdf`);
  },

  // 3. GENERATE INVENTORY STOCK REPORT PDF
  generateInventoryPDF: (medicines) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Banner
    doc.setFillColor(16, 140, 90);
    doc.rect(0, 0, 297, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('LANKA CARE PHARMACY - CURRENT STOCK & EXPIRY AUDIT REPORT', 14, 11);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total ${medicines.length} registered pharmaceutical items • Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 18);

    const rows = medicines.map((m, idx) => {
      const isOut = m.stock_quantity <= 0;
      const isLow = m.stock_quantity > 0 && m.stock_quantity <= m.min_stock_alert;
      const isExpired = m.days_to_expiry <= 0;
      const isExpiring = !isExpired && m.days_to_expiry <= 60;

      let status = 'In Stock';
      if (isOut) status = 'OUT OF STOCK';
      else if (isExpired) status = 'EXPIRED!';
      else if (isExpiring) status = `Expiring (${m.days_to_expiry}d)`;
      else if (isLow) status = `Low Stock (${m.stock_quantity})`;

      return [
        idx + 1,
        m.name,
        m.generic_name || '-',
        m.category_name || '-',
        m.batch_no,
        m.rack_location || '-',
        m.stock_quantity,
        m.min_stock_alert,
        fmtLKR(m.cost_price),
        fmtLKR(m.selling_price),
        m.expiry_date,
        status
      ];
    });

    autoTable(doc, {
      startY: 28,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [20, 30, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      head: [['#', 'Brand Name', 'Generic', 'Category', 'Batch', 'Shelf', 'Stock', 'Min', 'Cost', 'Sell', 'Expiry', 'Status']],
      body: rows,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        6: { halign: 'center', fontStyle: 'bold' },
        7: { halign: 'center' },
        8: { halign: 'right' },
        9: { halign: 'right', fontStyle: 'bold' },
        10: { halign: 'center' },
        11: { fontStyle: 'bold' }
      }
    });

    doc.save(`Pharmacy-Inventory-Audit-${new Date().toISOString().split('T')[0]}.pdf`);
  }
};
