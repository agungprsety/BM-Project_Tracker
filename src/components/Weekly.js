import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Plus, Trash2, X, Camera, Calendar } from 'lucide-react';
import PhotoUpload from './PhotoUpload';
import { formatDate, formatCurrency } from '../utils';

const Weekly = React.memo(({ project, onUpdate, darkMode }) => {
  const [reports, setReports] = useState(project.weeklyReports || []);
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({
    weekNumber: '',
    date: '',
    notes: '',
    workItems: [],
    photos: []
  });

  const boqItems = project.boq || [];
  const totalContractValue = useMemo(() => 
    boqItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0),
    [boqItems]
  );

  const openModal = useCallback(() => {
    if (boqItems.length === 0) {
      alert('Please add BoQ items first!');
      return;
    }

    setNewReport({
      weekNumber: reports.length > 0 ? Math.max(...reports.map(r => r.weekNumber)) + 1 : 1,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      workItems: [{ boqItemId: '', qtyCompleted: '', description: '' }],
      photos: []
    });
    setShowModal(true);
  }, [boqItems.length, reports]);

  const addWorkItem = useCallback(() => {
    setNewReport(prev => ({
      ...prev,
      workItems: [...prev.workItems, { boqItemId: '', qtyCompleted: '', description: '' }]
    }));
  }, []);

  const updateWorkItem = useCallback((index, field, value) => {
    setNewReport(prev => {
      const updatedWorkItems = [...prev.workItems];
      updatedWorkItems[index][field] = value;
      return { ...prev, workItems: updatedWorkItems };
    });
  }, []);

  const removeWorkItem = useCallback((index) => {
    setNewReport(prev => ({
      ...prev,
      workItems: prev.workItems.filter((_, i) => i !== index)
    }));
  }, []);

  const setPhotos = useCallback((photos) => {
    setNewReport(prev => ({ ...prev, photos }));
  }, []);

  // Calculate weekly progress using BoQ items
  const calculateWeeklyProgress = useCallback(() => {
    if (totalContractValue === 0 || newReport.workItems.length === 0) return 0;

    let weeklyValue = 0;
    newReport.workItems.forEach(workItem => {
      const boqItem = boqItems.find(item => item.id === workItem.boqItemId);
      if (boqItem && workItem.qtyCompleted && parseFloat(workItem.qtyCompleted) > 0) {
        weeklyValue += parseFloat(workItem.qtyCompleted) * boqItem.unitPrice;
      }
    });

    return (weeklyValue / totalContractValue) * 100;
  }, [totalContractValue, newReport.workItems, boqItems]);

  const saveWeeklyReport = useCallback(async () => {
    if (!newReport.weekNumber || !newReport.date || newReport.workItems.length === 0) {
      alert('Please fill all required fields and add at least one work item');
      return;
    }

    // Validate all work items
    for (const workItem of newReport.workItems) {
      if (!workItem.boqItemId || !workItem.qtyCompleted || parseFloat(workItem.qtyCompleted) <= 0) {
        alert('Please select BoQ item and enter valid quantity for all work items');
        return;
      }

      const boqItem = boqItems.find(item => item.id === workItem.boqItemId);
      const completedQty = parseFloat(workItem.qtyCompleted);
      
      if (completedQty <= 0) {
        alert('Quantity completed must be greater than 0');
        return;
      }

      const totalCompleted = (boqItem.completed || 0) + completedQty;
      if (totalCompleted > boqItem.quantity) {
        alert(`Cannot complete more than planned quantity for ${boqItem.description}. Max: ${boqItem.quantity - (boqItem.completed || 0)} ${boqItem.unit}`);
        return;
      }
    }

    const weeklyProgress = calculateWeeklyProgress();
    const previousCumulative = reports.length > 0 
      ? reports[reports.length - 1].cumulativeProgress 
      : 0;
    const cumulativeProgress = previousCumulative + weeklyProgress;

    // Update BoQ completed quantities
    const updatedBoq = [...boqItems];
    newReport.workItems.forEach(workItem => {
      const boqItem = updatedBoq.find(item => item.id === workItem.boqItemId);
      if (boqItem) {
        boqItem.completed = (boqItem.completed || 0) + parseFloat(workItem.qtyCompleted);
      }
    });

    // Add project ID and week number to photos
    const photosWithMetadata = newReport.photos.map(photo => ({
      ...photo,
      projectId: project.id,
      weekNumber: parseInt(newReport.weekNumber),
      date: newReport.date
    }));

    // Update project photos
    const updatedPhotos = [...(project.photos || []), ...photosWithMetadata];

    const report = {
      id: Date.now().toString(),
      weekNumber: parseInt(newReport.weekNumber),
      date: newReport.date,
      notes: newReport.notes,
      workItems: newReport.workItems.map(item => ({
        ...item,
        qtyCompleted: parseFloat(item.qtyCompleted)
      })),
      photos: photosWithMetadata,
      weeklyProgress: weeklyProgress,
      cumulativeProgress: cumulativeProgress,
      createdAt: new Date().toISOString()
    };

    const updatedReports = [...reports, report].sort((a, b) => a.weekNumber - b.weekNumber);
    
    const updatedProject = {
      ...project,
      weeklyReports: updatedReports,
      boq: updatedBoq,
      photos: updatedPhotos,
      updatedAt: new Date().toISOString()
    };

    await window.storage.set('project:' + updatedProject.id, JSON.stringify(updatedProject));
    setReports(updatedReports);
    setShowModal(false);
    if (onUpdate) onUpdate();
  }, [newReport, boqItems, calculateWeeklyProgress, reports, project, onUpdate]);

  const deleteWeeklyReport = useCallback(async (reportId) => {
    if (!window.confirm('Delete this weekly report? This will also delete associated photos and recalculate all progress.')) return;

    const reportToDelete = reports.find(r => r.id === reportId);
    if (!reportToDelete) return;

    // Subtract the deleted report's progress from the BoQ
    const updatedBoq = [...boqItems];
    reportToDelete.workItems.forEach(workItem => {
      const boqItem = updatedBoq.find(item => item.id === workItem.boqItemId);
      if (boqItem) {
        boqItem.completed = (boqItem.completed || 0) - parseFloat(workItem.qtyCompleted);
      }
    });

    // Remove photos from this report
    const remainingPhotos = project.photos?.filter(photo => 
      !reportToDelete.photos?.some(reportPhoto => reportPhoto.id === photo.id)
    ) || [];

    const remainingReports = reports.filter(r => r.id !== reportId);
    
    // Recalculate progress for subsequent reports
    let cumulativeProgress = 0;
    const recalculatedReports = remainingReports.map((report, index) => {
      if (index > 0) {
        cumulativeProgress = recalculatedReports[index - 1].cumulativeProgress;
      } else {
        cumulativeProgress = 0;
      }
      let weeklyValue = 0;
      report.workItems.forEach(workItem => {
        const boqItem = updatedBoq.find(item => item.id === workItem.boqItemId);
        if (boqItem) {
          weeklyValue += workItem.qtyCompleted * boqItem.unitPrice;
        }
      });
      
      const weeklyProgress = (weeklyValue / totalContractValue) * 100;
      cumulativeProgress += weeklyProgress;
      
      return {
        ...report,
        weeklyProgress: weeklyProgress,
        cumulativeProgress: cumulativeProgress
      };
    });

    const updatedProject = {
      ...project,
      weeklyReports: recalculatedReports,
      boq: updatedBoq,
      photos: remainingPhotos,
      updatedAt: new Date().toISOString()
    };

    await window.storage.set('project:' + updatedProject.id, JSON.stringify(updatedProject));
    setReports(recalculatedReports);
    if (onUpdate) onUpdate();
  }, [reports, boqItems, totalContractValue, project, onUpdate]);

  const handleWeekNumberChange = useCallback((e) => 
    setNewReport(prev => ({ ...prev, weekNumber: e.target.value })), []);
  
  const handleDateChange = useCallback((e) => 
    setNewReport(prev => ({ ...prev, date: e.target.value })), []);
  
  const handleNotesChange = useCallback((e) => 
    setNewReport(prev => ({ ...prev, notes: e.target.value })), []);
  
  const handleWorkItemBoqChange = useCallback((index, e) => 
    updateWorkItem(index, 'boqItemId', e.target.value), [updateWorkItem]);
  
  const handleWorkItemQtyChange = useCallback((index, e) => 
    updateWorkItem(index, 'qtyCompleted', e.target.value), [updateWorkItem]);
  
  const handleWorkItemDescChange = useCallback((index, e) => 
    updateWorkItem(index, 'description', e.target.value), [updateWorkItem]);

  const closeModal = useCallback(() => setShowModal(false), []);

  const bgClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  const inputClass = darkMode 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
    : 'border-gray-300 text-gray-700 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500';
  const tableHeaderClass = darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500';
  const tableRowClass = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`rounded-xl shadow-lg p-6 mb-6 ${bgClass}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">Weekly Reports</h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Progress is automatically calculated from completed BoQ items
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
        >
          <Plus size={18} /> Add Week
        </button>
      </div>

      {reports.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className={darkMode ? 'text-gray-500 mb-4' : 'text-gray-400 mb-4'}>
            <Calendar size={48} className="mx-auto" />
          </div>
          <h4 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No Weekly Reports Yet</h4>
          <p className={darkMode ? 'text-gray-500 mb-4' : 'text-gray-500 mb-4'}>Add your first weekly report to track progress over time</p>
          <button
            onClick={openModal}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Report
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={tableHeaderClass}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Week</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Work Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Photos</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Completed Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Weekly Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Cumulative Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${borderClass}`}>
              {reports.map(report => (
                <tr key={report.id} className={tableRowClass}>
                  <td className="px-4 py-3 font-bold">Week {report.weekNumber}</td>
                  <td className="px-4 py-3">{formatDate(report.date)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {report.workItems.length} item(s)
                      {report.workItems.length > 0 && (
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          {report.workItems.slice(0, 2).map((workItem, idx) => {
                            const boqItem = boqItems.find(item => item.id === workItem.boqItemId);
                            return boqItem ? (
                              <div key={idx} className="truncate">
                                {boqItem.description}
                              </div>
                            ) : null;
                          })}
                          {report.workItems.length > 2 && (
                            <div className="text-blue-600">+{report.workItems.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {report.photos?.length || 0} photo(s)
                      {report.photos && report.photos.length > 0 && (
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          Click to view
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {report.workItems.map((workItem, idx) => {
                      const boqItem = boqItems.find(item => item.id === workItem.boqItemId);
                      return boqItem ? (
                        <div key={idx} className="text-sm mb-1">
                          {workItem.qtyCompleted.toLocaleString()} {boqItem.unit}
                        </div>
                      ) : null;
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${report.weeklyProgress > 0 ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')}`}>
                        +{report.weeklyProgress.toFixed(2)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-blue-600">{report.cumulativeProgress.toFixed(2)}%</div>
                      <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, report.cumulativeProgress)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {report.notes ? (
                      <div className="max-w-xs truncate" title={report.notes}>
                        {report.notes}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteWeeklyReport(report.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete report"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Weekly Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Weekly Report</h3>
              <button
                onClick={closeModal}
                className={darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Week Number *</label>
                <input
                  type="number"
                  value={newReport.weekNumber}
                  onChange={handleWeekNumberChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${inputClass}`}
                  min="1"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date *</label>
                <input
                  type="date"
                  value={newReport.date}
                  onChange={handleDateChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${inputClass}`}
                />
              </div>
            </div>

            {/* Work Items Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Work Completed This Week *</label>
                <button
                  onClick={addWorkItem}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} /> Add Work Item
                </button>
              </div>

              {newReport.workItems.length === 0 ? (
                <div className={`text-center py-6 rounded-lg border-2 border-dashed ${darkMode ? 'bg-gray-700/50 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
                  <p>No work items added yet</p>
                  <p className="text-sm mt-1">Add at least one work item to calculate progress</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newReport.workItems.map((workItem, index) => {
                    const selectedBoqItem = boqItems.find(item => item.id === workItem.boqItemId);
                    const remainingQty = selectedBoqItem ? selectedBoqItem.quantity - (selectedBoqItem.completed || 0) : 0;
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>BoQ Item *</label>
                            <select
                              value={workItem.boqItemId}
                              onChange={(e) => handleWorkItemBoqChange(index, e)}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-blue-500 ${inputClass}`}
                            >
                              <option value="">Select BoQ Item</option>
                              {boqItems.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.description} - {item.quantity} {item.unit} @ {formatCurrency(item.unitPrice)}
                                  {item.completed !== undefined && (
                                    ` (Completed: ${item.completed || 0}/${item.quantity} ${item.unit})`
                                  )}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quantity Completed *</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={workItem.qtyCompleted}
                                onChange={(e) => handleWorkItemQtyChange(index, e)}
                                className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-blue-500 ${inputClass}`}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                max={remainingQty}
                              />
                              <span className={`text-sm self-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {selectedBoqItem ? selectedBoqItem.unit : ''}
                              </span>
                            </div>
                            {selectedBoqItem && (
                              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Max: {remainingQty.toFixed(2)} {selectedBoqItem.unit} remaining
                              </div>
                            )}
                          </div>
                          <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Work Description</label>
                            <input
                              type="text"
                              value={workItem.description}
                              onChange={(e) => handleWorkItemDescChange(index, e)}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-blue-500 ${inputClass}`}
                              placeholder="Describe the work done"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removeWorkItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        </div>
                        {selectedBoqItem && workItem.qtyCompleted && parseFloat(workItem.qtyCompleted) > 0 && (
                          <div className={`text-xs p-2 rounded mt-2 ${darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
                            <div className="font-medium">
                              Calculation: ({workItem.qtyCompleted} {selectedBoqItem.unit} × {formatCurrency(selectedBoqItem.unitPrice)}) = {formatCurrency(parseFloat(workItem.qtyCompleted) * selectedBoqItem.unitPrice)}
                            </div>
                            <div className="text-xs mt-1">
                              This contributes {(parseFloat(workItem.qtyCompleted) * selectedBoqItem.unitPrice / totalContractValue * 100).toFixed(2)}% to total progress
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Photo Upload Section */}
            <div className="mb-6">
              <PhotoUpload 
                photos={newReport.photos} 
                setPhotos={setPhotos}
                darkMode={darkMode}
              />
            </div>

            {/* Progress Calculation Preview */}
            {newReport.workItems.length > 0 && (
              <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-blue-700 text-blue-200' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-700'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium mb-1">Progress Calculation Preview</div>
                    <div className="text-xs">
                      Formula: Σ(Completed Qty × Unit Price) / Total Contract Value × 100
                    </div>
                    <div className="text-xs mt-1">
                      Total Contract Value: {formatCurrency(totalContractValue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{calculateWeeklyProgress().toFixed(2)}%</div>
                    <div className="text-xs">Weekly Progress</div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes (Optional)</label>
              <textarea
                value={newReport.notes}
                onChange={handleNotesChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${inputClass}`}
                rows="3"
                placeholder="Add any notes about this week's work..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={saveWeeklyReport}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
              >
                Save Weekly Report
              </button>
              <button
                onClick={closeModal}
                className={`px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                  darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Weekly.displayName = 'Weekly';

export default Weekly;
