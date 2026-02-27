import type { Project } from '@/types';
import { calculateProgress, calculateBoQTotal, calculateTimeProgress, getScheduleStatus, getDaysSinceLastReport, getReportStaleness, getDeadlineInfo } from './utils';

export function exportDashboardCsv(projects: Project[]) {
    const headers = [
        'Project ID',
        'Project Name',
        'Contractor',
        'Supervisory Consultant',
        'District',
        'Sub-district',
        'Work Type',
        'Road Class',
        'Maintenance Type',
        'Start Date',
        'End Date',
        'Length (m)',
        'Avg Width (m)',
        'Contract Value (Rp)',
        'Completed Value (Rp)',
        'Physical Progress (%)',
        'Time Elapsed (%)',
        'Schedule Status',
        'Days Since Last Report',
        'Report Staleness',
        'Deadline Status'
    ];

    const rows = projects.map((p) => {
        const progress = calculateProgress(p.boq || [], p.weeklyReports || []);
        const time = calculateTimeProgress(p.startDate, p.endDate);
        const status = getScheduleStatus(progress, time);
        const value = calculateBoQTotal(p.boq || []);

        // Calculate completed value
        let completedValue = 0;
        if (p.boq && p.weeklyReports) {
            const completedMap: Record<string, number> = {};
            for (const report of p.weeklyReports) {
                if (!report.itemProgress) continue;
                for (const ip of report.itemProgress) {
                    completedMap[ip.boqItemId] = (completedMap[ip.boqItemId] || 0) + ip.quantity;
                }
            }
            completedValue = p.boq.reduce((total, item) => {
                const completedQty = completedMap[item.id || ''] || 0;
                return total + completedQty * (item.unitPrice || 0);
            }, 0);
        }

        const daysSinceReport = getDaysSinceLastReport(p.weeklyReports || []);
        const staleness = getReportStaleness(daysSinceReport, progress);
        const deadline = getDeadlineInfo(p.startDate, p.endDate);

        return [
            p.id,
            p.name,
            p.contractor,
            p.supervisor,
            p.district || '',
            p.subDistrict || '',
            p.workType || '',
            p.roadHierarchy || '',
            p.maintenanceType || '',
            p.startDate,
            p.endDate,
            p.length || 0,
            p.averageWidth || 0,
            value,
            completedValue,
            progress.toFixed(2),
            time.toFixed(2),
            status,
            daysSinceReport === Infinity ? 'No Reports' : daysSinceReport,
            staleness,
            deadline.label
        ];
    });

    // Escape CSV values
    const escape = (val: string | number) => {
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csv = [
        headers.map(escape).join(','),
        ...rows.map((row) => row.map(escape).join(',')),
    ].join('\n');

    // Trigger download with \uFEFF for Excel UTF-8 BOM
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SigiMarga_Projects_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
