import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatDate } from '../utils';

const SCurve = React.memo(({ project, darkMode }) => {
  const reports = useMemo(() => project.weeklyReports || [], [project.weeklyReports]);
  const data = useMemo(() => 
    [...reports]
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(report => ({
        week: `W${report.weekNumber}`,
        'Weekly Progress': report.weeklyProgress,
        'Cumulative Progress': report.cumulativeProgress,
        date: report.date
      })),
    [reports]
  );

  if (reports.length === 0) {
    return (
      <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <h3 className="text-xl font-bold mb-4">S-Curve Progress Chart</h3>
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <BarChart3 size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <p>Add weekly reports to see the S-curve</p>
        </div>
      </div>
    );
  }

  const latestProgress = reports.length > 0 ? reports[reports.length - 1].cumulativeProgress : 0;

  return (
    <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">S-Curve Progress Chart</h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Current Progress: <span className="font-bold text-blue-600">{latestProgress.toFixed(1)}%</span>
          </p>
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {reports.length} week(s) tracked
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Week', 
                position: 'insideBottom', 
                offset: -5,
                style: { fontSize: 12, fill: darkMode ? '#9CA3AF' : '#374151' }
              }}
              stroke={darkMode ? "#9CA3AF" : "#374151"}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Progress (%)', 
                angle: -90, 
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: 12, fill: darkMode ? '#9CA3AF' : '#374151' }
              }}
              stroke={darkMode ? "#9CA3AF" : "#374151"}
            />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(2)}%`, 'Progress']}
              labelFormatter={(label, items) => {
                const item = items[0]?.payload;
                return `Week ${label.slice(1)} - ${formatDate(item?.date)}`;
              }}
              contentStyle={{ 
                borderRadius: '8px',
                border: 'none',
                backgroundColor: darkMode ? '#1F2937' : 'white',
                color: darkMode ? 'white' : '#374151',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Cumulative Progress" 
              name="Cumulative Progress"
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Weekly Progress" 
              name="Weekly Progress"
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

SCurve.displayName = 'SCurve';

export default SCurve;
