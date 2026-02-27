import { useState } from 'react';
import type { WeeklyReport, BoQItem, ItemProgress } from '@/types';
import { generateId, formatDate, getCompletedByItem } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface WeeklyProps {
  projectId: string;
  reports: WeeklyReport[];
  boq: BoQItem[];
  onUpdate: (reports: WeeklyReport[]) => void;
  contractStartDate: string;
  contractEndDate: string;
  darkMode?: boolean;
  readonly?: boolean;
}

export default function Weekly({ projectId, reports = [], boq = [], onUpdate, contractStartDate, contractEndDate, darkMode = false, readonly = false }: WeeklyProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [newReport, setNewReport] = useState({
    weekNumber: '',
    startDate: '',
    endDate: '',
    workDescription: '',
  });
  const [newItemProgress, setNewItemProgress] = useState<Record<string, string>>({});

  // Cumulative completed quantities across all reports
  const cumulativeMap = getCompletedByItem(reports);

  const handleAddReport = () => {
    const validationErrors: string[] = [];

    if (!newReport.weekNumber || !newReport.startDate || !newReport.endDate) {
      validationErrors.push('Week identifier and period duration are required for record initialization.');
    }

    // Validate dates within contract range
    if (newReport.startDate && contractStartDate && newReport.startDate < contractStartDate) {
      validationErrors.push(`Work initialization date precedes contractual start (${formatDate(contractStartDate)}).`);
    }
    if (newReport.endDate && contractEndDate && newReport.endDate > contractEndDate) {
      validationErrors.push(`Work completion date exceeds contractual limit (${formatDate(contractEndDate)}).`);
    }
    if (newReport.startDate && newReport.endDate && newReport.startDate > newReport.endDate) {
      validationErrors.push('Temporal logic error: Start date cannot exceed end date.');
    }

    // Build itemProgress and validate quantities
    const itemProgress: ItemProgress[] = [];
    for (const item of boq) {
      const inputQty = Number(newItemProgress[item.id] || 0);
      if (inputQty <= 0) continue;

      const cumCompleted = cumulativeMap[item.id] || 0;
      const remaining = Math.max(0, item.quantity - cumCompleted);

      if (inputQty > remaining) {
        validationErrors.push(
          `${item.itemNumber}: quantity ${inputQty} exceeds remaining ${remaining} ${item.unit}.`
        );
      }

      itemProgress.push({ boqItemId: item.id, quantity: Math.min(inputQty, remaining) });
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const report: WeeklyReport = {
      id: generateId(),
      weekNumber: Number(newReport.weekNumber),
      startDate: newReport.startDate,
      endDate: newReport.endDate,
      workDescription: newReport.workDescription,
      itemProgress,
      photos: [],
      createdAt: new Date().toISOString(),
    };

    onUpdate([...reports, report]);
    setNewReport({ weekNumber: '', startDate: '', endDate: '', workDescription: '' });
    setNewItemProgress({});
    setErrors([]);
    setIsAdding(false);
  };

  const handleDeleteReport = (id: string) => {
    onUpdate(reports.filter((r) => r.id !== id));
  };

  /** Overall progress value calculated from cumulative weights */
  const totalContractValue = boq.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const completedValue = boq.reduce((s, i) => {
    const completedQty = Math.min(cumulativeMap[i.id] || 0, i.quantity);
    return s + completedQty * i.unitPrice;
  }, 0);
  const overallProgress = totalContractValue > 0 ? (completedValue / totalContractValue) * 100 : 0;

  return (
    <Card darkMode={darkMode}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold">Weekly Reports</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {reports.length} weeks • Overall Progress: {overallProgress.toFixed(1)}%
          </p>
        </div>
        {!readonly && (
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={boq.length === 0}>
            Add Report
          </Button>
        )}
      </div>

      {boq.length === 0 && (
        <p className={`text-center py-4 text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
          Add BoQ items first before creating weekly reports.
        </p>
      )}

      {reports.length === 0 && !isAdding ? (
        <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No weekly reports yet. Add reports to track per-item progress.
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            // Compute this report's contribution
            const weekValue = report.itemProgress?.reduce((s, ip) => {
              const item = boq.find((b) => b.id === ip.boqItemId);
              return s + (item ? ip.quantity * item.unitPrice : 0);
            }, 0) || 0;
            const weekPercent = totalContractValue > 0 ? (weekValue / totalContractValue) * 100 : 0;

            return (
              <div
                key={report.id}
                className={`rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Week {report.weekNumber}</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(report.startDate)} - {formatDate(report.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${weekPercent > 0 ? 'bg-blue-100 text-blue-700' : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500')
                        }`}>
                        +{weekPercent.toFixed(1)}%
                      </span>
                      {!readonly && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  {report.workDescription && (
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {report.workDescription}
                    </p>
                  )}
                </div>

                {/* Expanded: show per-item quantities for this report */}
                {isExpanded && report.itemProgress && report.itemProgress.length > 0 && (
                  <div className={`px-4 pb-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[400px] text-xs mt-3">
                        <thead>
                          <tr className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                            <th className="text-left py-1">BoQ Item</th>
                            <th className="text-right py-1">This Week</th>
                            <th className="text-right py-1">Contract Qty</th>
                            <th className="text-right py-1">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.itemProgress.map((ip) => {
                            const item = boq.find((b) => b.id === ip.boqItemId);
                            if (!item) return null;
                            return (
                              <tr key={ip.boqItemId} className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                <td className="py-1">{item.itemNumber} - {item.description}</td>
                                <td className="py-1 text-right font-medium">{ip.quantity}</td>
                                <td className="py-1 text-right">{item.quantity}</td>
                                <td className="py-1 text-right">{item.unit}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cumulative Progress Summary */}
      {
        boq.length > 0 && reports.length > 0 && (
          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h4 className="font-semibold mb-3 text-sm">Cumulative Progress per BoQ Item</h4>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    <th className="text-left py-1">Item</th>
                    <th className="text-right py-1">Completed</th>
                    <th className="text-right py-1">Contract Qty</th>
                    <th className="text-right py-1">Unit</th>
                    <th className="text-right py-1">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {boq.map((item) => {
                    const completed = cumulativeMap[item.id] || 0;
                    const pct = item.quantity > 0 ? Math.min(100, (completed / item.quantity) * 100) : 0;
                    return (
                      <tr key={item.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className="py-1.5">{item.itemNumber} - {item.description}</td>
                        <td className="py-1.5 text-right font-medium">{completed.toLocaleString('id-ID')}</td>
                        <td className="py-1.5 text-right">{item.quantity.toLocaleString('id-ID')}</td>
                        <td className="py-1.5 text-right">{item.unit}</td>
                        <td className="py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className={`w-16 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-1.5`}>
                              <div
                                className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-medium ${pct >= 100 ? 'text-green-500' : ''}`}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* Add Report Form */}
      {isAdding && !readonly && (
        <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <h4 className="font-semibold mb-3">Add Weekly Report</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input
              type="number"
              placeholder="Week #"
              value={newReport.weekNumber}
              onChange={(e) => setNewReport({ ...newReport, weekNumber: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Start Date"
              value={newReport.startDate}
              onChange={(e) => setNewReport({ ...newReport, startDate: e.target.value })}
              min={contractStartDate}
              max={contractEndDate}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={newReport.endDate}
              onChange={(e) => setNewReport({ ...newReport, endDate: e.target.value })}
              min={newReport.startDate || contractStartDate}
              max={contractEndDate}
            />
          </div>
          <Input
            placeholder="Work description"
            value={newReport.workDescription}
            onChange={(e) => setNewReport({ ...newReport, workDescription: e.target.value })}
            className="mt-3"
          />

          {/* Per-item progress quantities for this week */}
          <div className="mt-4">
            <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Progress This Week (quantities completed)
            </h5>
            <div className={`rounded-lg border overflow-x-auto ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className={darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-500'}>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                    <th className="px-3 py-2 text-right">This Week</th>
                  </tr>
                </thead>
                <tbody>
                  {boq.map((item) => {
                    const cumCompleted = cumulativeMap[item.id] || 0;
                    const remaining = Math.max(0, item.quantity - cumCompleted);
                    return (
                      <tr key={item.id} className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.itemNumber} - {item.description}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.quantity} {item.unit} total
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={remaining === 0 ? 'text-green-500 font-medium' : ''}>
                            {remaining.toLocaleString('id-ID')} {item.unit}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            value={newItemProgress[item.id] || ''}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(remaining, Number(e.target.value) || 0));
                              setNewItemProgress((prev) => ({
                                ...prev,
                                [item.id]: val > 0 ? String(val) : '',
                              }));
                            }}
                            placeholder="0"
                            className={`w-24 px-2 py-1 border rounded text-right text-sm ${darkMode ? 'bg-gray-700 border-gray-500' : 'border-gray-300'} ${remaining === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            min="0"
                            max={remaining}
                            step="any"
                            disabled={remaining === 0}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAddReport}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => { setIsAdding(false); setErrors([]); }}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
