import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project, BoQItem, WeeklyReport } from '@/types';
import { formatCurrency, formatDate, formatLength, formatArea, calculateBoQTotal, getCompletedByItem, calculateProgress } from '@/lib/utils';

// ── Shared helpers ────────────────────────────────────────────

const COLORS = {
    primary: [37, 99, 235] as [number, number, number],     // blue-600
    dark: [17, 24, 39] as [number, number, number],          // gray-900
    medium: [75, 85, 99] as [number, number, number],        // gray-600
    light: [243, 244, 246] as [number, number, number],      // gray-100
    green: [22, 163, 74] as [number, number, number],        // green-600
    amber: [217, 119, 6] as [number, number, number],        // amber-600
    white: [255, 255, 255] as [number, number, number],
};

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Blue header bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 18);

    // Subtitle
    if (subtitle) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 14, 28);
    }

    // Date
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 36);

    // Brand
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BM Progress Tracker', pageWidth - 14, 18, { align: 'right' });

    return 48; // y position after header
}

function addFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setDrawColor(...COLORS.light);
        doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.medium);
        doc.setFont('helvetica', 'normal');
        doc.text('BM Progress Tracker — Confidential', 14, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(title, 14, y);

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(14, y + 2, 80, y + 2);

    return y + 10;
}

function addInfoRow(doc: jsPDF, label: string, value: string, x: number, y: number, labelWidth = 40): number {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.medium);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(value || '-', x + labelWidth, y);
    return y + 6;
}

function addProgressBar(doc: jsPDF, x: number, y: number, width: number, progress: number) {
    const barHeight = 6;
    // Background
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(x, y, width, barHeight, 2, 2, 'F');
    // Fill
    const fillWidth = Math.min(width, (progress / 100) * width);
    if (fillWidth > 0) {
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(x, y, fillWidth, barHeight, 2, 2, 'F');
    }
    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(`${progress.toFixed(1)}%`, x + width + 4, y + 5);
    return y + barHeight + 6;
}

// ── All Projects Summary ──────────────────────────────────────

export function exportAllProjectsSummary(projects: Project[]) {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = addHeader(doc, 'All Projects Summary Report', `${projects.length} projects`);

    // Summary stats
    const totalValue = projects.reduce((s, p) => s + calculateBoQTotal(p.boq || []), 0);
    const avgProgress = projects.length > 0
        ? projects.reduce((s, p) => s + calculateProgress(p.boq || [], p.weeklyReports || []), 0) / projects.length
        : 0;
    const totalLength = projects.reduce((s, p) => s + (p.length || 0), 0);

    y = addSectionTitle(doc, 'Summary Statistics', y);

    // Stats grid
    const statsData = [
        ['Total Projects', String(projects.length)],
        ['Total Contract Value', formatCurrency(totalValue)],
        ['Average Progress', `${avgProgress.toFixed(1)}%`],
        ['Total Road Length', formatLength(totalLength)],
    ];

    doc.setFontSize(9);
    statsData.forEach(([label, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const sx = 14 + col * 90;
        const sy = y + row * 12;

        doc.setFillColor(...COLORS.light);
        doc.roundedRect(sx, sy, 82, 10, 2, 2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.medium);
        doc.text(label, sx + 3, sy + 7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(value, sx + 79, sy + 7, { align: 'right' });
    });

    y += Math.ceil(statsData.length / 2) * 12 + 8;

    // Projects table
    y = addSectionTitle(doc, 'Projects Overview', y);

    const tableData = projects.map((p, i) => {
        const progress = calculateProgress(p.boq || [], p.weeklyReports || []);
        const value = calculateBoQTotal(p.boq || []);
        return [
            String(i + 1),
            p.name,
            p.contractor,
            p.workType?.replace('-', ' ') || '-',
            `${progress.toFixed(1)}%`,
            formatCurrency(value),
            formatLength(p.length),
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['#', 'Project Name', 'Contractor', 'Type', 'Progress', 'Contract Value', 'Length']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.white,
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 3,
        },
        bodyStyles: {
            fontSize: 8,
            cellPadding: 2.5,
            textColor: COLORS.dark,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 40 },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
        },
        margin: { left: 14, right: 14 },
    });

    addFooter(doc);
    doc.save('All_Projects_Summary.pdf');
}

// ── Individual Project Detail ─────────────────────────────────

export function exportProjectDetail(project: Project) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const boq = project.boq || [];
    const weeklyReports = project.weeklyReports || [];
    const totalValue = calculateBoQTotal(boq);
    const completedMap = getCompletedByItem(weeklyReports);
    const progress = calculateProgress(boq, weeklyReports);
    const completedValue = boq.reduce((s, i) => {
        const cq = Math.min(completedMap[i.id] || 0, i.quantity);
        return s + cq * i.unitPrice;
    }, 0);
    const area = (project.length || 0) * (project.averageWidth || 0);

    let y = addHeader(doc, project.name, `Project Detail Report`);

    // ── Project Info ───────────────────────
    y = addSectionTitle(doc, 'Project Information', y);

    const col1x = 14;
    const col2x = 110;
    let y1 = y;
    let y2 = y;

    y1 = addInfoRow(doc, 'Contractor:', project.contractor, col1x, y1);
    y1 = addInfoRow(doc, 'Supervisor:', project.supervisor, col1x, y1);
    y1 = addInfoRow(doc, 'Work Type:', project.workType?.replace('-', ' ') || '-', col1x, y1);
    y1 = addInfoRow(doc, 'Road Hierarchy:', project.roadHierarchy || '-', col1x, y1);
    y1 = addInfoRow(doc, 'Maintenance:', project.maintenanceType || '-', col1x, y1);

    y2 = addInfoRow(doc, 'Start Date:', formatDate(project.startDate), col2x, y2);
    y2 = addInfoRow(doc, 'End Date:', formatDate(project.endDate), col2x, y2);
    y2 = addInfoRow(doc, 'Length:', formatLength(project.length), col2x, y2);
    y2 = addInfoRow(doc, 'Avg. Width:', project.averageWidth ? `${project.averageWidth} m` : '-', col2x, y2);
    y2 = addInfoRow(doc, 'Area:', formatArea(area), col2x, y2);
    if (project.district) y2 = addInfoRow(doc, 'District:', project.district, col2x, y2);
    if (project.subDistrict) y2 = addInfoRow(doc, 'Sub-district:', project.subDistrict, col2x, y2);

    y = Math.max(y1, y2) + 4;

    // ── Financial Summary ──────────────────
    y = addSectionTitle(doc, 'Financial Summary', y);

    const finData = [
        ['Total Contract Value', formatCurrency(totalValue), COLORS.primary],
        ['Completed Value', formatCurrency(completedValue), COLORS.green],
        ['Remaining Value', formatCurrency(totalValue - completedValue), COLORS.amber],
    ] as const;

    finData.forEach(([label, value, color]) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(14, y, 4, 8, 1, 1, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.medium);
        doc.text(label, 22, y + 5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(value, pageWidth - 14, y + 5, { align: 'right' });
        y += 10;
    });

    y += 2;

    // Progress bar
    y = addProgressBar(doc, 14, y, pageWidth - 58, progress);
    y += 4;

    // ── BoQ Table ──────────────────────────
    if (boq.length > 0) {
        y = addSectionTitle(doc, 'Bill of Quantities (BoQ)', y);

        const boqData = boq.map((item, i) => [
            item.itemNumber,
            item.description,
            item.unit,
            item.quantity.toLocaleString('id-ID'),
            `Rp ${item.unitPrice.toLocaleString('id-ID')}`,
            `Rp ${(item.quantity * item.unitPrice).toLocaleString('id-ID')}`,
        ]);

        // Total row
        boqData.push(['', '', '', '', 'TOTAL', formatCurrency(totalValue)]);

        autoTable(doc, {
            startY: y,
            head: [['Item #', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
            body: boqData,
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.primary,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3,
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 2.5,
                textColor: COLORS.dark,
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            columnStyles: {
                0: { cellWidth: 18 },
                1: { cellWidth: 55 },
                2: { cellWidth: 15, halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
                // Bold the total row
                if (data.row.index === boqData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = COLORS.light;
                }
            },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Cumulative Progress ────────────────
    if (boq.length > 0 && weeklyReports.length > 0) {
        // Check if we need a new page
        if (y > 220) {
            doc.addPage();
            y = 20;
        }

        y = addSectionTitle(doc, 'Cumulative Progress per Item', y);

        const progressData = boq.map((item) => {
            const completed = completedMap[item.id] || 0;
            const pct = item.quantity > 0 ? Math.min(100, (completed / item.quantity) * 100) : 0;
            return [
                item.itemNumber,
                item.description,
                `${completed.toLocaleString('id-ID')} / ${item.quantity.toLocaleString('id-ID')}`,
                item.unit,
                `${pct.toFixed(1)}%`,
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Item #', 'Description', 'Completed / Contract', 'Unit', 'Progress']],
            body: progressData,
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.primary,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3,
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 2.5,
                textColor: COLORS.dark,
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            columnStyles: {
                0: { cellWidth: 18 },
                1: { cellWidth: 60 },
                2: { halign: 'right' },
                3: { cellWidth: 15, halign: 'center' },
                4: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Weekly Reports ─────────────────────
    if (weeklyReports.length > 0) {
        if (y > 220) {
            doc.addPage();
            y = 20;
        }

        y = addSectionTitle(doc, 'Weekly Reports', y);

        const weeklyData = weeklyReports
            .sort((a, b) => a.weekNumber - b.weekNumber)
            .map((report) => {
                const weekValue = report.itemProgress?.reduce((s, ip) => {
                    const item = boq.find((b) => b.id === ip.boqItemId);
                    return s + (item ? ip.quantity * item.unitPrice : 0);
                }, 0) || 0;
                const weekPct = totalValue > 0 ? (weekValue / totalValue) * 100 : 0;

                const itemDetails = report.itemProgress
                    ?.map((ip) => {
                        const item = boq.find((b) => b.id === ip.boqItemId);
                        return item ? `${item.itemNumber}: ${ip.quantity} ${item.unit}` : '';
                    })
                    .filter(Boolean)
                    .join(', ') || '-';

                return [
                    `Week ${report.weekNumber}`,
                    `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`,
                    report.workDescription || '-',
                    itemDetails,
                    `+${weekPct.toFixed(1)}%`,
                ];
            });

        autoTable(doc, {
            startY: y,
            head: [['Week', 'Period', 'Description', 'Item Progress', '+%']],
            body: weeklyData,
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.primary,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3,
            },
            bodyStyles: {
                fontSize: 7,
                cellPadding: 2.5,
                textColor: COLORS.dark,
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            columnStyles: {
                0: { cellWidth: 18 },
                1: { cellWidth: 35 },
                2: { cellWidth: 35 },
                4: { cellWidth: 14, halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });
    }

    addFooter(doc);
    doc.save(`${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`);
}
