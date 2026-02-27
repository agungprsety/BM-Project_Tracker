import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project, BoQItem, WeeklyReport } from '@/types';
import { formatCurrency, formatDate, formatLength, formatArea, calculateBoQTotal, getCompletedByItem, calculateProgress, getDeadlineInfo, getDaysSinceLastReport, getReportStaleness } from '@/lib/utils';

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
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Title
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE PROJECT REPORT', 14, 20);

    // Subtitle
    if (subtitle) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 200, 200);
        doc.text(subtitle, 14, 28);
    }

    // Date
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 38);

    // Brand
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('SIGIMARGA', pageWidth - 14, 22, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('CONFIDENTIAL INTERNAL', pageWidth - 14, 30, { align: 'right' });

    return 55; // y position after header
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
        doc.text('SigiMarga — Confidential', 14, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(title.toUpperCase(), 14, y);

    doc.setDrawColor(220, 220, 220); // Very light subtle line
    doc.setLineWidth(0.5);
    doc.line(14, y + 3, doc.internal.pageSize.getWidth() - 14, y + 3);

    return y + 12;
}

function addInfoRow(doc: jsPDF, label: string, value: string, x: number, y: number, labelWidth = 50): number {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.medium);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(value || '-', x + labelWidth, y);
    return y + 7;
}

function addProgressBar(doc: jsPDF, x: number, y: number, width: number, progress: number, progressStatus: string) {
    const barHeight = 8;
    // Background
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(x, y, width, barHeight, 4, 4, 'F');

    // Fill
    const fillWidth = Math.min(width, (progress / 100) * width);
    if (fillWidth > 0) {
        const color = progressStatus === 'delayed' ? COLORS.amber
            : progressStatus === 'at-risk' ? COLORS.amber
                : COLORS.primary;
        doc.setFillColor(...color);
        doc.roundedRect(x, y, fillWidth, barHeight, 4, 4, 'F');
    }

    // Label inside bar if wide enough, else outside
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    if (fillWidth > 20) {
        doc.setTextColor(...COLORS.white);
        doc.text(`${progress.toFixed(1)}%`, x + fillWidth - 2, y + 6, { align: 'right' });
    } else {
        doc.setTextColor(...COLORS.dark);
        doc.text(`${progress.toFixed(1)}%`, x + fillWidth + 2, y + 6);
    }

    // Ends markers
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text('0%', x, y + barHeight + 4);
    doc.text('100%', x + width, y + barHeight + 4, { align: 'right' });

    return y + barHeight + 10;
}

function drawScorecard(doc: jsPDF, x: number, y: number, width: number, title: string, mainValue: string, subValue: string, badgeText: string, badgeColor: number[]) {
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(252, 252, 253);
    doc.roundedRect(x, y, width, 25, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.medium);
    doc.text(title.toUpperCase(), x + 4, y + 6);

    // Badge
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(x + width - 24, y + 3, 20, 5, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.text(badgeText.toUpperCase(), x + width - 14, y + 6.5, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.dark);
    doc.text(mainValue, x + 4, y + 16);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text(subValue, x + 4, y + 21);
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

    // Core Calculations
    const totalValue = calculateBoQTotal(boq);
    const completedMap = getCompletedByItem(weeklyReports);
    const progress = calculateProgress(boq, weeklyReports);
    const completedValue = boq.reduce((s, i) => {
        const cq = Math.min(completedMap[i.id] || 0, i.quantity);
        return s + cq * i.unitPrice;
    }, 0);

    // Schedule & Status Calculations
    const contractSpan = (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24);
    const timeElapsedPct = contractSpan > 0 ? Math.max(0, Math.min(100, (elapsedDays / contractSpan) * 100)) : 0;

    const isDelayed = progress < timeElapsedPct - 10;
    const isAtRisk = progress < timeElapsedPct - 5 && progress >= timeElapsedPct - 10;
    const progressStatus = isDelayed ? 'delayed' : isAtRisk ? 'at-risk' : progress > timeElapsedPct + 5 ? 'ahead' : 'on-track';
    const progressColor = isDelayed ? COLORS.amber : isAtRisk ? COLORS.amber : COLORS.primary;

    const deadlineInfo = getDeadlineInfo(project.startDate, project.endDate);
    const daysSinceReport = getDaysSinceLastReport(weeklyReports);
    const staleness = getReportStaleness(daysSinceReport, progress);

    const area = (project.length || 0) * (project.averageWidth || 0);

    let y = addHeader(doc, project.name, `Project ID: ${project.id}`);

    // ── EXECUTIVE SCORECARDS ───────────────────────
    const cardW = (pageWidth - 28 - 6) / 3;

    // Card 1: Schedule Health
    drawScorecard(
        doc, 14, y, cardW,
        'Overall Health',
        progressStatus.toUpperCase(),
        `Deviation: ${(progress - timeElapsedPct).toFixed(1)}%`,
        progressStatus,
        progressColor
    );

    // Card 2: Financial Burn
    drawScorecard(
        doc, 14 + cardW + 3, y, cardW,
        'Financial Burn',
        `${((completedValue / totalValue) * 100 || 0).toFixed(1)}% Billed`,
        `Rp ${(completedValue / 1000000).toFixed(1)}M of Rp ${(totalValue / 1000000).toFixed(1)}M`,
        'AUDIT',
        COLORS.medium
    );

    // Card 3: Compliance
    drawScorecard(
        doc, 14 + (cardW * 2) + 6, y, cardW,
        'Report Compliance',
        staleness === 'fresh' ? 'COMPLIANT' : 'NON-COMPLIANT',
        daysSinceReport === Infinity ? 'No reports logged' : `Last update: ${daysSinceReport} days ago`,
        staleness.toUpperCase(),
        staleness === 'critical' ? COLORS.amber : staleness === 'stale' ? COLORS.amber : COLORS.green
    );

    y += 35;

    // ── PROGRESS BAR ───────────────────────
    y = addSectionTitle(doc, 'Progress Overview', y);
    y = addProgressBar(doc, 14, y, pageWidth - 28, progress, progressStatus);

    // Add time elapsed marker above the bar
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.medium);
    const timeX = 14 + ((timeElapsedPct / 100) * (pageWidth - 28));
    if (timeX > 14 && timeX < pageWidth - 14) {
        doc.text('Time Elapsed', timeX, y - 20, { align: 'center' });
        doc.setDrawColor(200, 200, 200);
        doc.line(timeX, y - 18, timeX, y - 10);
    }

    y += 4;

    // ── PROJECT METADATA ───────────────────────
    y = addSectionTitle(doc, 'Project Specifications', y);

    const col1x = 14;
    const col2x = pageWidth / 2 + 4;
    let y1 = y;
    let y2 = y;

    y1 = addInfoRow(doc, 'Contractor', project.contractor, col1x, y1);
    y1 = addInfoRow(doc, 'Supervisor', project.supervisor, col1x, y1);
    y1 = addInfoRow(doc, 'Work Type', project.workType?.replace('-', ' ') || '-', col1x, y1);
    y1 = addInfoRow(doc, 'Road Class', project.roadHierarchy || '-', col1x, y1);
    y1 = addInfoRow(doc, 'District', project.district || '-', col1x, y1);

    y2 = addInfoRow(doc, 'Schedule', `${formatDate(project.startDate)} to ${formatDate(project.endDate)}`, col2x, y2);
    y2 = addInfoRow(doc, 'Deadline', deadlineInfo.label, col2x, y2);
    y2 = addInfoRow(doc, 'Length', formatLength(project.length), col2x, y2);
    y2 = addInfoRow(doc, 'Width', project.averageWidth ? `${project.averageWidth} m` : '-', col2x, y2);
    y2 = addInfoRow(doc, 'Area', formatArea(area), col2x, y2);

    y = Math.max(y1, y2) + 8;

    // ── BoQ Table ──────────────────────────
    if (boq.length > 0) {
        y = addSectionTitle(doc, 'Financial Allocation & BoQ', y);

        const boqData = boq.map((item) => [
            item.description,
            item.quantity.toLocaleString('id-ID') + ' ' + item.unit,
            `Rp ${item.unitPrice.toLocaleString('id-ID')}`,
            `Rp ${(item.quantity * item.unitPrice).toLocaleString('id-ID')}`,
        ]);

        boqData.push(['CONTRACT TOTAL', '', '', formatCurrency(totalValue)]);

        autoTable(doc, {
            startY: y,
            head: [['Description', 'Volume', 'Unit Rate', 'Total Amount']],
            body: boqData,
            theme: 'plain',
            headStyles: {
                textColor: COLORS.medium,
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: { top: 4, bottom: 4 },
                lineColor: [220, 220, 220],
                lineWidth: { bottom: 0.5 },
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: { top: 4, bottom: 4 },
                textColor: COLORS.dark,
                lineColor: [240, 240, 240],
                lineWidth: { bottom: 0.1 },
            },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right', fontStyle: 'bold' },
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
                if (data.row.index === boqData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [252, 252, 253];
                }
            },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // ── Weekly Logs ─────────────────────
    if (weeklyReports.length > 0) {
        if (y > 220) {
            doc.addPage();
            y = 20;
        }

        y = addSectionTitle(doc, 'Recent Activity Logs', y);

        const weeklyData = weeklyReports
            .sort((a, b) => b.weekNumber - a.weekNumber) // Latest first for executive summaries
            .slice(0, 10) // Show only last 10 weeks
            .map((report) => {
                const weekValue = report.itemProgress?.reduce((s, ip) => {
                    const item = boq.find((b) => b.id === ip.boqItemId);
                    return s + (item ? ip.quantity * item.unitPrice : 0);
                }, 0) || 0;
                const weekPct = totalValue > 0 ? (weekValue / totalValue) * 100 : 0;

                return [
                    `W${report.weekNumber}`,
                    `${formatDate(report.endDate)}`,
                    report.workDescription || 'No description provided',
                    `+${weekPct.toFixed(1)}%`,
                ];
            });

        autoTable(doc, {
            startY: y,
            head: [['Week', 'Date', 'Executive Summary', 'Growth']],
            body: weeklyData,
            theme: 'plain',
            headStyles: {
                textColor: COLORS.medium,
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: { top: 4, bottom: 4 },
                lineColor: [220, 220, 220],
                lineWidth: { bottom: 0.5 },
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: { top: 4, bottom: 4 },
                textColor: COLORS.dark,
                lineColor: [240, 240, 240],
                lineWidth: { bottom: 0.1 },
            },
            columnStyles: {
                0: { cellWidth: 15, fontStyle: 'bold' },
                1: { cellWidth: 25 },
                3: { cellWidth: 20, halign: 'right', textColor: COLORS.primary },
            },
            margin: { left: 14, right: 14 },
        });
    }

    addFooter(doc);
    doc.save(`${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Executive_Report.pdf`);
}
