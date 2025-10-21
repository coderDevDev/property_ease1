import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Payment {
  id: string;
  due_date: string;
  amount: number;
  payment_status: string;
  payment_type: string;
  paid_date?: string;
  late_fee?: number;
}

interface PaymentScheduleData {
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  payments: Payment[];
}

export const generatePaymentSchedulePDF = (data: PaymentScheduleData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT SCHEDULE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
  
  // Tenant & Property Info
  let yPosition = 40;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TENANT INFORMATION', 20, yPosition);
  yPosition += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tenant: ${data.tenantName}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Property: ${data.propertyName}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Unit: ${data.unitNumber}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Lease Period: ${new Date(data.leaseStart).toLocaleDateString()} - ${new Date(data.leaseEnd).toLocaleDateString()}`, 25, yPosition);
  yPosition += 12;

  // Summary Box
  doc.setFillColor(240, 248, 255);
  doc.rect(20, yPosition, 170, 25, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.rect(20, yPosition, 170, 25, 'S');
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary', 25, yPosition);
  yPosition += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const totalPayments = data.payments.length;
  const totalAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);
  const paidPayments = data.payments.filter(p => p.payment_status === 'paid').length;
  const paidAmount = data.payments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  doc.text(`Total Payments: ${totalPayments} | Monthly Rent: ₱${data.monthlyRent.toLocaleString()}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Paid: ${paidPayments}/${totalPayments} | Total Amount: ₱${totalAmount.toLocaleString()}`, 25, yPosition);
  
  yPosition += 15;

  // Payment Table
  const tableData = data.payments.map((payment, index) => {
    const dueDate = new Date(payment.due_date);
    const status = payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1);
    const paidDate = payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : '-';
    const lateFee = payment.late_fee || 0;
    const total = payment.amount + lateFee;
    
    return [
      `${index + 1}`,
      dueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      dueDate.toLocaleDateString(),
      `₱${payment.amount.toLocaleString()}`,
      lateFee > 0 ? `₱${lateFee.toLocaleString()}` : '-',
      `₱${total.toLocaleString()}`,
      status,
      paidDate
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Month', 'Due Date', 'Amount', 'Late Fee', 'Total', 'Status', 'Paid Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 25, halign: 'center' }
    },
    didParseCell: function(data) {
      // Color code status
      if (data.column.index === 6 && data.cell.section === 'body') {
        const status = data.cell.text[0].toLowerCase();
        if (status === 'paid') {
          data.cell.styles.textColor = [34, 197, 94]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'pending') {
          data.cell.styles.textColor = [234, 179, 8]; // Yellow/Orange
        } else if (status === 'overdue') {
          data.cell.styles.textColor = [239, 68, 68]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
      
      // Highlight late fees
      if (data.column.index === 4 && data.cell.section === 'body' && data.cell.text[0] !== '-') {
        data.cell.styles.textColor = [239, 68, 68]; // Red
      }
    }
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
  
  // Payment Instructions
  let instructionsY = finalY + 15;
  
  // Check if new page needed
  if (instructionsY > 250) {
    doc.addPage();
    instructionsY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT INSTRUCTIONS', 20, instructionsY);
  instructionsY += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const instructions = [
    'Payments are due on the 5th of each month.',
    'A late fee of ₱500 or 5% (whichever is higher) applies after 3 days.',
    'Payment can be made via:',
    '  • Online: Xendit payment gateway (GCash, Maya, Credit/Debit Card)',
    '  • Bank Transfer: [Bank details to be provided]',
    '  • Cash: At property management office',
    'Please keep all payment receipts for your records.',
    'For payment issues, contact the property manager.'
  ];

  instructions.forEach(instruction => {
    if (instructionsY > 270) {
      doc.addPage();
      instructionsY = 20;
    }
    doc.text(instruction, 25, instructionsY);
    instructionsY += 5;
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This payment schedule is subject to the terms of your lease agreement.', 105, 285, { align: 'center' });

  // Save PDF
  doc.save(`Payment-Schedule-${data.propertyName}-${data.unitNumber}.pdf`);
};
