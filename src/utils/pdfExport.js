import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, formatLength } from '../utils';

export const exportSummaryPDF = (projects, getProgress) => {
  const doc = new jsPDF('landscape');
  
  // Title
  doc.setFontSize(18);
  doc.text('SigiMarga - Project Summary', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 22);
  
  const tableColumn = ["Project", "Work Type", "Length", "Contractor", "Start Date", "End Date", "Value", "Progress"];
  const tableRows = [];

  // Sort projects by progress descending like in the summary view
  const sortedProjects = [...projects].sort((a, b) => getProgress(b) - getProgress(a));

  sortedProjects.forEach(p => {
    const projectData = [
      p.name,
      p.workType?.replace('-', ' ') || '',
      formatLength(p.length),
      p.contractor,
      formatDate(p.startDate),
      formatDate(p.endDate),
      formatCurrency(p.contractPrice),
      `${getProgress(p).toFixed(1)}%`
    ];
    tableRows.push(projectData);
  });

  autoTable(doc, {
    startY: 28,
    head: [tableColumn],
    body: tableRows,
    headStyles: { fillStyle: 'f', fillColor: [59, 130, 246] }, // blue-600
    alternateRowStyles: { fillColor: [243, 244, 246] }, // gray-100
  });
  
  doc.save(`project-summary-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportProjectDetailPDF = (project, totalValue, completedValue, progress, sCurveImage) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text(project.name, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Project ID: ${project.id}`, 14, 28);
  doc.text(`Exported on: ${new Date().toLocaleString('id-ID')}`, 14, 33);

  // Info Section
  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Project Information', 14, 48);
  
  doc.setFontSize(10);
  const infoLeft = [
    `Contractor: ${project.contractor}`,
    `Supervisor: ${project.supervisor}`,
    `Work Type: ${project.workType?.replace('-', ' ') || '-'}`,
    `Road Hierarchy: ${project.roadHierarchy || '-'}`
  ];
  
  const infoRight = [
    `Start Date: ${formatDate(project.startDate)}`,
    `End Date: ${formatDate(project.endDate)}`,
    `Total Length: ${formatLength(project.length)}`,
    `Average Width: ${project.averageWidth || 0} m`
  ];

  infoLeft.forEach((text, i) => doc.text(text, 14, 58 + (i * 6)));
  infoRight.forEach((text, i) => doc.text(text, 110, 58 + (i * 6)));

  // Financial Summary
  doc.setFontSize(12);
  doc.text('Financial & Progress Summary', 14, 90);
  
  doc.setFontSize(10);
  doc.text(`Total Contract Value: ${formatCurrency(totalValue)}`, 14, 100);
  doc.text(`Completed Value: ${formatCurrency(completedValue)}`, 14, 106);
  doc.text(`Overall Progress: ${progress.toFixed(2)}%`, 110, 100);
  doc.text(`Remaining Value: ${formatCurrency(totalValue - completedValue)}`, 110, 106);

  let currentY = 120;

  // Add S-Curve Image if provided
  if (sCurveImage) {
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Progress S-Curve', 14, currentY);
    doc.addImage(sCurveImage, 'PNG', 14, currentY + 5, 180, 90);
    currentY += 105;
  }

  // BoQ Table
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Bill of Quantities (BoQ)', 14, currentY);
  
  const boqColumns = ["Description", "Quantity", "Unit", "Unit Price", "Total", "Completed %"];
  const boqRows = (project.boq || []).map(item => [
    item.description,
    item.quantity,
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.quantity * item.unitPrice),
    `${((item.completed || 0) / item.quantity * 100).toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [boqColumns],
    body: boqRows,
    headStyles: { fillColor: [30, 58, 138] },
  });

  // Weekly Reports
  let finalY = doc.lastAutoTable.finalY || currentY + 5;
  
  // Check if we need a new page for Weekly Reports
  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 15;
  }

  doc.setFontSize(14);
  doc.text('Weekly Progress Reports', 14, finalY);
  
  const reportColumns = ["Week", "Date", "Weekly Progress", "Cumulative Progress", "Notes"];
  const reportRows = (project.weeklyReports || []).map(r => [
    `Week ${r.weekNumber}`,
    formatDate(r.date),
    `+${r.weeklyProgress.toFixed(2)}%`,
    `${r.cumulativeProgress.toFixed(2)}%`,
    r.notes || '-'
  ]);

  autoTable(doc, {
    startY: finalY + 5,
    head: [reportColumns],
    body: reportRows,
    headStyles: { fillColor: [16, 185, 129] }, // emerald-600
  });

  doc.save(`Project-Report-${project.name.replace(/\s+/g, '-')}.pdf`);
};

export const exportBoQPDF = (project, totalValue, completedValue) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`BoQ: ${project.name}`, 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Total Value: ${formatCurrency(totalValue)}`, 14, 30);
  doc.text(`Completed Value: ${formatCurrency(completedValue)}`, 14, 36);

  const boqColumns = ["Description", "Quantity", "Unit", "Unit Price", "Total", "Completed %"];
  const boqRows = (project.boq || []).map(item => [
    item.description,
    item.quantity,
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.quantity * item.unitPrice),
    `${((item.completed || 0) / item.quantity * 100).toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: 45,
    head: [boqColumns],
    body: boqRows,
    headStyles: { fillColor: [30, 58, 138] },
  });

  doc.save(`BoQ-${project.name.replace(/\s+/g, '-')}.pdf`);
};

export const exportReportsPDF = (project) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`Weekly Reports: ${project.name}`, 14, 20);

  const reportColumns = ["Week", "Date", "Weekly Progress", "Cumulative Progress", "Notes"];
  const reportRows = (project.weeklyReports || []).map(r => [
    `Week ${r.weekNumber}`,
    formatDate(r.date),
    `+${r.weeklyProgress.toFixed(2)}%`,
    `${r.cumulativeProgress.toFixed(2)}%`,
    r.notes || '-'
  ]);

  autoTable(doc, {
    startY: 30,
    head: [reportColumns],
    body: reportRows,
    headStyles: { fillColor: [16, 185, 129] },
  });

  doc.save(`Weekly-Reports-${project.name.replace(/\s+/g, '-')}.pdf`);
};

export const exportSCurvePDF = (project, sCurveImage) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`S-Curve Progress: ${project.name}`, 14, 20);

  if (sCurveImage) {
    doc.addImage(sCurveImage, 'PNG', 14, 30, 180, 90);
    
    // Add a summary table below
    const reports = [...(project.weeklyReports || [])].sort((a, b) => a.weekNumber - b.weekNumber);
    const tableRows = reports.map(r => [`Week ${r.weekNumber}`, formatDate(r.date), `${r.cumulativeProgress.toFixed(2)}%`]);
    
    autoTable(doc, {
      startY: 130,
      head: [["Week", "Date", "Cumulative Progress"]],
      body: tableRows,
    });
  } else {
    doc.text("No S-Curve data available", 14, 30);
  }

  doc.save(`S-Curve-${project.name.replace(/\s+/g, '-')}.pdf`);
};