import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface LeaseData {
  // Tenant Info
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  
  // Owner Info
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  
  // Property Info
  propertyName: string;
  propertyAddress: string;
  propertyCity: string;
  propertyType: string;
  unitNumber: string;
  
  // Lease Terms
  leaseStart: string;
  leaseEnd: string;
  leaseDuration: number; // in months
  monthlyRent: number;
  securityDeposit: number;
  paymentDueDay: number;
  
  // Terms & Conditions
  terms: string[];
  
  // Optional
  amenities?: string[];
  specialConditions?: string;
}

export const generateLeaseAgreementPDF = (leaseData: LeaseData) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RESIDENTIAL LEASE AGREEMENT', 105, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Parties Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIES TO THE AGREEMENT', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('LANDLORD (Property Owner):', 20, yPosition);
  yPosition += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${leaseData.ownerName}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Email: ${leaseData.ownerEmail}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Phone: ${leaseData.ownerPhone}`, 25, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TENANT:', 20, yPosition);
  yPosition += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${leaseData.tenantName}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Email: ${leaseData.tenantEmail}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Phone: ${leaseData.tenantPhone}`, 25, yPosition);
  yPosition += 12;

  // Property Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPERTY DETAILS', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Property Name: ${leaseData.propertyName}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Unit Number: ${leaseData.unitNumber}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Address: ${leaseData.propertyAddress}`, 25, yPosition);
  yPosition += 5;
  doc.text(`City: ${leaseData.propertyCity}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Property Type: ${leaseData.propertyType}`, 25, yPosition);
  yPosition += 12;

  // Lease Terms
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LEASE TERMS', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Lease Start Date: ${new Date(leaseData.leaseStart).toLocaleDateString()}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Lease End Date: ${new Date(leaseData.leaseEnd).toLocaleDateString()}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Duration: ${leaseData.leaseDuration} months`, 25, yPosition);
  yPosition += 5;
  doc.text(`Monthly Rent: P${leaseData.monthlyRent.toLocaleString()}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Security Deposit: P${leaseData.securityDeposit.toLocaleString()}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Payment Due: ${leaseData.paymentDueDay}th of each month`, 25, yPosition);
  yPosition += 5;
  doc.text(`Total Rent for Full Term: P${(leaseData.monthlyRent * leaseData.leaseDuration).toLocaleString()}`, 25, yPosition);
  yPosition += 12;

  // Amenities (if available)
  if (leaseData.amenities && leaseData.amenities.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AMENITIES INCLUDED', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(leaseData.amenities.join(', '), 25, yPosition, { maxWidth: 160 });
    yPosition += 12;
  }

  // Check if new page needed
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Terms & Conditions
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS AND CONDITIONS', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  leaseData.terms.forEach((term, index) => {
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    const lines = doc.splitTextToSize(`${index + 1}. ${term}`, 160);
    doc.text(lines, 25, yPosition);
    yPosition += lines.length * 5 + 3;
  });

  yPosition += 10;

  // Special Conditions
  if (leaseData.specialConditions) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SPECIAL CONDITIONS', 20, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const specialLines = doc.splitTextToSize(leaseData.specialConditions, 160);
    doc.text(specialLines, 25, yPosition);
    yPosition += specialLines.length * 5 + 10;
  }

  // Signatures
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', 20, yPosition);
  yPosition += 15;

  // Landlord Signature
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('LANDLORD:', 25, yPosition);
  yPosition += 15;
  doc.line(25, yPosition, 95, yPosition); // Signature line
  yPosition += 5;
  doc.text(`${leaseData.ownerName}`, 25, yPosition);
  yPosition += 5;
  doc.text('Date: _______________', 25, yPosition);

  yPosition -= 25;

  // Tenant Signature
  doc.text('TENANT:', 115, yPosition);
  yPosition += 15;
  doc.line(115, yPosition, 185, yPosition); // Signature line
  yPosition += 5;
  doc.text(`${leaseData.tenantName}`, 115, yPosition);
  yPosition += 5;
  doc.text('Date: _______________', 115, yPosition);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a legally binding agreement. Both parties should keep a copy for their records.', 105, 285, { align: 'center' });

  // Save PDF
  doc.save(`Lease-Agreement-${leaseData.propertyName}-${leaseData.unitNumber}.pdf`);
};
