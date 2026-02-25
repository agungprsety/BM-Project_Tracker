import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WeeklyReport, BoQItem } from '@/types';
import { getCompletedByItem } from '@/lib/utils';
import Card from '@/components/ui/Card';

interface SCurveProps {
  project: {
    startDate: string;
    endDate: string;
    weeklyReports?: WeeklyReport[];
    boq?: BoQItem[];
  };
  darkMode?: boolean;
}

// Sigmoid (logistic) function for realistic S-curve shape:
// slow start → acceleration → tapering at the end
const calculateSCurveProgress = (t: number): number => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const k = 10; // steepness: higher = sharper transition
  const f = (x: number) => 1 / (1 + Math.exp(-k * (x - 0.5)));
  const f0 = f(0);
  const f1 = f(1);
  return (f(t) - f0) / (f1 - f0);
};

export default function SCurve({ project, darkMode = false }: SCurveProps) {
  const chartData = useMemo(() => {
    if (!project.startDate || !project.endDate) return [];

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const plannedData: { date: string; planned: number; actual: number | null }[] = [];

    const totalBoQValue = project.boq?.reduce((s, i) => s + i.quantity * i.unitPrice, 0) || 0;

    for (let i = 0; i <= Math.min(totalDays, 365); i += 7) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);

      const t = i / totalDays; // time fraction 0..1
      const plannedValue = calculateSCurveProgress(t) * totalBoQValue;

      plannedData.push({
        date: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        planned: Math.round(plannedValue),
        actual: null,
      });
    }

    if (project.weeklyReports && project.weeklyReports.length > 0 && project.boq) {
      // Sort reports by week number for cumulative calculation
      const sortedReports = [...project.weeklyReports].sort((a, b) => a.weekNumber - b.weekNumber);

      // Build cumulative progress per report
      for (let r = 0; r < sortedReports.length; r++) {
        const report = sortedReports[r];
        const reportsUpToNow = sortedReports.slice(0, r + 1);
        const cumulativeMap = getCompletedByItem(reportsUpToNow);

        const actualValue = project.boq.reduce((s, item) => {
          const completedQty = Math.min(cumulativeMap[item.id] || 0, item.quantity);
          return s + completedQty * item.unitPrice;
        }, 0);

        const reportDate = new Date(report.startDate);
        const idx = plannedData.findIndex((_, i) => {
          const d = new Date(start);
          d.setDate(d.getDate() + i * 7);
          return d >= reportDate;
        });

        if (idx >= 0 && idx < plannedData.length) {
          plannedData[idx] = {
            ...plannedData[idx],
            actual: Math.round(actualValue),
          };
        }
      }
    }

    return plannedData;
  }, [project.startDate, project.endDate, project.weeklyReports, project.boq]);

  return (
    <Card darkMode={darkMode}>
      <h3 className="text-xl font-bold mb-4">S-Curve Analysis</h3>

      {chartData.length === 0 ? (
        <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Add weekly reports to see S-Curve progress analysis.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
            <Tooltip
              formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
              contentStyle={darkMode ? { backgroundColor: '#1f2937', border: 'none' } : {}}
            />
            <Legend />
            <Line type="monotone" dataKey="planned" name="Planned" stroke="#3b82f6" strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
