import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, BarChart as BarChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ========== UTILITIES ==========
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const calculateProjectProgress = (project) => {
  if (!project?.weeklyReports?.length) return 0;
  return project.weeklyReports[project.weeklyReports.length - 1].cumulativeProgress || 0;
};

const calculateWeekProgress = (workItems, project) => {
  const boq = project.boq || [];
  const totalValue = Number(project.contractPrice) || boq.reduce((s, i) => s + i.total, 0);
  
  if (totalValue === 0) return 0;

  let weekProgress = 0;
  workItems.forEach(wi => {
    const boqItem = boq.find(b => b.id === wi.boqItemId);
    if (boqItem && wi.qtyCompleted) {
      const itemValue = Number(wi.qtyCompleted) * boqItem.unitPrice;
      weekProgress += (itemValue / totalValue) * 100;
    }
  });

  return weekProgress;
};

const updateBoqWithWorkItems = (boq, workItems) => {
  const updatedBoq = [...boq];
  updatedBoq.forEach(b => b.completed = 0);
  
  workItems.forEach(wi => {
    const boqItem = updatedBoq.find(b => b.id === wi.boqItemId);
    if (boqItem && wi.qtyCompleted) {
      boqItem.completed = (boqItem.completed || 0) + Number(wi.qtyCompleted);
    }
  });
  
  return updatedBoq;
};

const handleDeleteReport = async (reportId, project, reports, setReports, onUpdate) => {
  if (!window.confirm('Delete this weekly report? Progress will be recalculated.')) return;
  
  const remainingReports = reports.filter(r => r.id !== reportId);
  const updatedBoq = [...project.boq];
  updatedBoq.forEach(b => b.completed = 0);
  
  let cumulative = 0;
  remainingReports.forEach(r => {
    r.workItems.forEach(wi => {
      const boqItem = updatedBoq.find(b => b.id === wi.boqItemId);
      if (boqItem && wi.qtyCompleted) {
        boqItem.completed = (boqItem.completed || 0) + Number(wi.qtyCompleted);
      }
    });
    const weekProgress = calculateWeekProgress(r.workItems, { ...project, boq: updatedBoq });
    cumulative += weekProgress;
    r.cumulativeProgress = cumulative;
    r.weekProgress = weekProgress;
  });

  await storageService.set(`project:${project.id}`, {
    ...project,
    weeklyReports: remainingReports,
    boq: updatedBoq
  });
  
  setReports(remainingReports);
  onUpdate();
};

// ========== STORAGE SERVICE ==========
const storageService = {
  list: async (prefix) => {
    try {
      return await window.storage.list(prefix);
    } catch (error) {
      console.error('Storage list error:', error);
      throw error;
    }
  },
  
  get: async (key) => {
    try {
      const result = await window.storage.get(key);
      return result ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  set: async (key, value) => {
    try {
      await window.storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  },
  
  delete: async (key) => {
    try {
      await window.storage.delete(key);
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }
};

// ========== COMPONENTS ==========

const Nav = ({ view, setView }) => (
  <div className="bg-blue-600 text-white p-4 mb-6">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <h1 className="text-2xl font-bold">BM Progress Tracker</h1>
      <div className="flex gap-4">
        <button 
          onClick={() => setView('summary')} 
          className={`px-4 py-2 rounded ${view === 'summary' ? 'bg-blue-800' : 'bg-blue-500 hover:bg-blue-700'}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setView('add')} 
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          <Plus size={18} className="inline mr-2" />
          New Project
        </button>
      </div>
    </div>
  </div>
);

const ProjectForm = ({ existing, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    existing || {
      name: '',
      contractor: '',
      supervisor: '',
      contractPrice: '',
      workType: 'flexible-pavement',
      roadHierarchy: 'JAS',
      maintenanceType: 'reconstruction',
      startDate: '',
      endDate: '',
      boq: [],
      weeklyReports: []
    }
  );

  const handleSubmit = async () => {
    const requiredFields = ['name', 'contractor', 'supervisor', 'contractPrice', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    const projectToSave = {
      ...formData,
      id: existing?.id || Date.now().toString(),
      contractPrice: Number(formData.contractPrice)
    };

    await onSave(projectToSave);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formFields = [
    { label: 'Name', field: 'name', type: 'text', required: true },
    { label: 'Contractor', field: 'contractor', type: 'text', required: true },
    { label: 'Supervisor', field: 'supervisor', type: 'text', required: true },
    { label: 'Price (IDR)', field: 'contractPrice', type: 'number', required: true },
    { 
      label: 'Work Type', 
      field: 'workType', 
      type: 'select',
      options: [
        { value: 'rigid-pavement', label: 'Rigid Pavement' },
        { value: 'flexible-pavement', label: 'Flexible Pavement' },
        { value: 'combination', label: 'Combination' },
        { value: 'other', label: 'Other' }
      ]
    },
    { 
      label: 'Road Hierarchy', 
      field: 'roadHierarchy', 
      type: 'select',
      options: [
        { value: 'JAS', label: 'JAS' },
        { value: 'JKS', label: 'JKS' },
        { value: 'JLS', label: 'JLS' },
        { value: 'Jling-S', label: 'Jling-S' },
        { value: 'J-ling Kota', label: 'J-ling Kota' }
      ]
    },
    { 
      label: 'Maintenance', 
      field: 'maintenanceType', 
      type: 'select',
      options: [
        { value: 'reconstruction', label: 'Reconstruction' },
        { value: 'rehabilitation', label: 'Rehabilitation' },
        { value: 'periodic-rehabilitation', label: 'Periodic Rehabilitation' },
        { value: 'routine-maintenance', label: 'Routine Maintenance' }
      ]
    },
    { label: 'Start Date', field: 'startDate', type: 'date', required: true },
    { label: 'End Date', field: 'endDate', type: 'date', required: true }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">{existing ? 'Edit' : 'New'} Project</h2>
      <div className="grid grid-cols-2 gap-4">
        {formFields.map(({ label, field, type, options, required }) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {type === 'select' ? (
              <select
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required={required}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          <Save size={18} />
          Save Project
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const SummaryView = ({ projects, onViewDetail }) => {
  const stats = useMemo(() => {
    const totalValue = projects.reduce((sum, p) => sum + Number(p.contractPrice || 0), 0);
    const avgProgress = projects.length > 0 
      ? projects.reduce((sum, p) => sum + calculateProjectProgress(p), 0) / projects.length 
      : 0;
    
    return { totalValue, avgProgress };
  }, [projects]);

  const chartData = useMemo(() => 
    projects.map(p => ({
      name: p.name.length > 15 ? `${p.name.substring(0, 15)}...` : p.name,
      progress: calculateProjectProgress(p)
    })),
    [projects]
  );

  const ProjectRow = React.memo(({ project, onViewDetail }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm font-medium">{project.name}</td>
      <td className="px-6 py-4 text-sm">{project.contractor}</td>
      <td className="px-6 py-4 text-sm">{project.supervisor}</td>
      <td className="px-6 py-4 text-sm">{formatCurrency(project.contractPrice)}</td>
      <td className="px-6 py-4 text-sm">
        <ProgressBar progress={calculateProjectProgress(project)} />
      </td>
      <td className="px-6 py-4 text-sm">
        <button 
          onClick={() => onViewDetail(project)}
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          View Details
        </button>
      </td>
    </tr>
  ));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard 
          title="Total Projects" 
          value={projects.length} 
          icon={<BarChartIcon />}
        />
        <StatCard 
          title="Total Value" 
          value={formatCurrency(stats.totalValue)}
        />
        <StatCard 
          title="Avg Progress" 
          value={`${stats.avgProgress.toFixed(1)}%`}
          icon={<LineChartIcon />}
        />
      </div>

      {projects.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Progress Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                <Bar dataKey="progress" fill="#3b82f6" name="Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">All Projects ({projects.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contractor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No projects found. Create your first project!
                  </td>
                </tr>
              ) : (
                projects.map(project => (
                  <ProjectRow key={project.id} project={project} onViewDetail={onViewDetail} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProgressBar = ({ progress }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px] overflow-hidden">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
    <span className="font-medium min-w-[60px]">{progress.toFixed(2)}%</span>
  </div>
);

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      {icon && <div className="text-blue-500">{icon}</div>}
    </div>
  </div>
);

const BoQSection = ({ project, onUpdate }) => {
  const [items, setItems] = useState(project.boq || []);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: '',
    unit: '',
    unitPrice: ''
  });

  const totalValue = useMemo(() => 
    items.reduce((sum, item) => sum + (item.total || 0), 0),
    [items]
  );

  const handleAddItem = useCallback(() => {
    if (!newItem.description || !newItem.quantity || !newItem.unit || !newItem.unitPrice) {
      alert('Please fill all fields');
      return;
    }

    const item = {
      id: Date.now().toString(),
      ...newItem,
      quantity: Number(newItem.quantity),
      unitPrice: Number(newItem.unitPrice),
      total: Number(newItem.quantity) * Number(newItem.unitPrice),
      completed: 0
    };

    const updatedItems = [...items, item];
    setItems(updatedItems);
    saveBoQ(updatedItems);
    setNewItem({ description: '', quantity: '', unit: '', unitPrice: '' });
  }, [newItem, items]);

  const handleDeleteItem = useCallback((id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveBoQ(updatedItems);
  }, [items]);

  const saveBoQ = async (boqItems) => {
    await storageService.set(`project:${project.id}`, { ...project, boq: boqItems });
    onUpdate();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Bill of Quantities (BoQ)</h3>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input
          type="text"
          placeholder="Description"
          value={newItem.description}
          onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
          className="px-3 py-2 border rounded-md text-sm"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={newItem.quantity}
          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
          className="px-3 py-2 border rounded-md text-sm"
        />
        <input
          type="text"
          placeholder="Unit"
          value={newItem.unit}
          onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
          className="px-3 py-2 border rounded-md text-sm"
        />
        <input
          type="number"
          placeholder="Unit Price"
          value={newItem.unitPrice}
          onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: e.target.value }))}
          className="px-3 py-2 border rounded-md text-sm"
        />
        <button
          onClick={handleAddItem}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Add Item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Qty</th>
              <th className="px-3 py-2 text-left">Unit</th>
              <th className="px-3 py-2 text-left">Unit Price</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Completed</th>
              <th className="px-3 py-2 text-left">Progress</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-3 py-8 text-center text-gray-500">
                  No BoQ items added yet
                </td>
              </tr>
            ) : (
              items.map(item => (
                <BoQRow key={item.id} item={item} onDelete={handleDeleteItem} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total BoQ Value:</span>
            <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const BoQRow = React.memo(({ item, onDelete }) => {
  const progress = item.quantity > 0 ? ((item.completed || 0) / item.quantity * 100) : 0;
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2">{item.description}</td>
      <td className="px-3 py-2">{item.quantity}</td>
      <td className="px-3 py-2">{item.unit}</td>
      <td className="px-3 py-2">{formatCurrency(item.unitPrice)}</td>
      <td className="px-3 py-2 font-medium">{formatCurrency(item.total)}</td>
      <td className="px-3 py-2">{item.completed || 0} {item.unit}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span>{progress.toFixed(1)}%</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-600 hover:text-red-800 p-1"
          title="Delete item"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
});

const WeeklyReportsSection = ({ project, onUpdate }) => {
  const [reports, setReports] = useState(project.weeklyReports || []);
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({
    weekNumber: reports.length + 1,
    date: '',
    notes: '',
    workItems: []
  });

  const handleAddWorkItem = useCallback(() => {
    if (!project.boq || project.boq.length === 0) {
      alert('Please add BoQ items first');
      return;
    }
    setNewReport(prev => ({
      ...prev,
      workItems: [...prev.workItems, { boqItemId: '', qtyCompleted: '' }]
    }));
  }, [project.boq]);

  const handleSaveReport = useCallback(async () => {
    if (!newReport.weekNumber || !newReport.date || newReport.workItems.length === 0) {
      alert('Please fill required fields and add at least one work item');
      return;
    }

    const weekProgress = calculateWeekProgress(newReport.workItems, project);
    const prevCumulative = reports.length > 0 
      ? reports[reports.length - 1].cumulativeProgress 
      : 0;
    const cumulativeProgress = prevCumulative + weekProgress;

    const updatedBoq = updateBoqWithWorkItems(project.boq, newReport.workItems);

    const report = {
      id: Date.now().toString(),
      weekNumber: Number(newReport.weekNumber),
      date: newReport.date,
      notes: newReport.notes,
      workItems: newReport.workItems,
      weekProgress,
      cumulativeProgress
    };

    const updatedReports = [...reports, report].sort((a, b) => a.weekNumber - b.weekNumber);
    
    await storageService.set(`project:${project.id}`, {
      ...project,
      weeklyReports: updatedReports,
      boq: updatedBoq
    });
    
    setReports(updatedReports);
    onUpdate();
    setShowModal(false);
    setNewReport({
      weekNumber: updatedReports.length + 1,
      date: '',
      notes: '',
      workItems: []
    });
  }, [newReport, reports, project, onUpdate]);

  if (!project.boq || project.boq.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Please add BoQ items first to create weekly reports</p>
          <p className="text-sm">Weekly progress is calculated based on BoQ item completion</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Weekly Reports</h3>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Weekly Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Week</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Work Items</th>
                <th className="px-3 py-2 text-left">Week Progress</th>
                <th className="px-3 py-2 text-left">Cumulative</th>
                <th className="px-3 py-2 text-left">Notes</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-gray-500">
                    No weekly reports yet
                  </td>
                </tr>
              ) : (
                reports.map(report => (
                  <WeeklyReportRow 
                    key={report.id} 
                    report={report} 
                    onDelete={(id) => handleDeleteReport(id, project, reports, setReports, onUpdate)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <WeeklyReportModal
          newReport={newReport}
          setNewReport={setNewReport}
          project={project}
          onAddWorkItem={handleAddWorkItem}
          onSave={handleSaveReport}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

const WeeklyReportRow = React.memo(({ report, onDelete }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-3 py-2 font-medium">Week {report.weekNumber}</td>
    <td className="px-3 py-2">{report.date}</td>
    <td className="px-3 py-2">
      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
        {report.workItems.length} items
      </span>
    </td>
    <td className="px-3 py-2 text-green-600 font-medium">
      +{report.weekProgress.toFixed(2)}%
    </td>
    <td className="px-3 py-2 font-bold text-blue-600">
      {report.cumulativeProgress.toFixed(2)}%
    </td>
    <td className="px-3 py-2 max-w-xs truncate" title={report.notes}>
      {report.notes || '-'}
    </td>
    <td className="px-3 py-2">
      <button
        onClick={() => onDelete(report.id)}
        className="text-red-600 hover:text-red-800 p-1"
        title="Delete report"
      >
        <Trash2 size={16} />
      </button>
    </td>
  </tr>
));

const WeeklyReportModal = ({
  newReport,
  setNewReport,
  project,
  onAddWorkItem,
  onSave,
  onClose
}) => {
  const weekProgress = useMemo(
    () => calculateWeekProgress(newReport.workItems, project),
    [newReport.workItems, project]
  );

  const handleWorkItemChange = useCallback((index, field, value) => {
    setNewReport(prev => ({
      ...prev,
      workItems: prev.workItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, []);

  const handleRemoveWorkItem = useCallback((index) => {
    setNewReport(prev => ({
      ...prev,
      workItems: prev.workItems.filter((_, i) => i !== index)
    }));
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Add Weekly Report</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Week Number</label>
            <input
              type="number"
              value={newReport.weekNumber}
              onChange={(e) => setNewReport(prev => ({ ...prev, weekNumber: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={newReport.date}
              onChange={(e) => setNewReport(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium">Work Completed This Week</label>
            <button
              onClick={onAddWorkItem}
              className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
            >
              <Plus size={14} />
              Add Work Item
            </button>
          </div>

          {newReport.workItems.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No work items added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newReport.workItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-5">
                    <select
                      value={item.boqItemId}
                      onChange={(e) => handleWorkItemChange(index, 'boqItemId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Select BoQ Item</option>
                      {project.boq.map(boqItem => (
                        <option key={boqItem.id} value={boqItem.id}>
                          {boqItem.description} ({boqItem.quantity} {boqItem.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Quantity Completed"
                      value={item.qtyCompleted}
                      onChange={(e) => handleWorkItemChange(index, 'qtyCompleted', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 text-sm text-gray-600">
                    {project.boq.find(b => b.id === item.boqItemId)?.unit || ''}
                  </div>
                  <div className="md:col-span-1">
                    <button
                      onClick={() => handleRemoveWorkItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm w-full"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {newReport.workItems.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-800">Calculated Progress:</p>
                <p className="text-2xl font-bold text-blue-600">{weekProgress.toFixed(2)}%</p>
              </div>
              <div className="text-sm text-blue-700">
                Based on BoQ weighted values
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
          <textarea
            value={newReport.notes}
            onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
            rows="3"
            placeholder="Add any notes about this week's work..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={newReport.workItems.length === 0}
            className={`px-6 py-2 rounded-md text-white ${newReport.workItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            Save Weekly Report
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SCurveChart = ({ project }) => {
  const reports = project.weeklyReports || [];
  const chartData = useMemo(() => 
    reports
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(r => ({
        week: `W${r.weekNumber}`,
        'Week Progress': r.weekProgress,
        'Cumulative Progress': r.cumulativeProgress
      })),
    [reports]
  );

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">S-Curve Progress Chart</h3>
        <div className="text-center py-12 text-gray-500">
          <p>Add weekly reports to visualize the S-curve</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">S-Curve Progress Chart</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(2)}%`, 'Progress']}
              labelFormatter={(label) => `Week ${label.replace('W', '')}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Week Progress" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Cumulative Progress" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ProjectDetailView = ({ project, onEdit, onDelete, onUpdate, onBack }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold">{project.name}</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>ID: {project.id}</span>
              <span>•</span>
              <span>Created: {new Date(parseInt(project.id)).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Edit2 size={18} />
              Edit Project
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-lg">Project Information</h3>
            <div className="space-y-3">
              <InfoRow label="Contractor" value={project.contractor} />
              <InfoRow label="Supervisor" value={project.supervisor} />
              <InfoRow label="Contract Value" value={formatCurrency(project.contractPrice)} />
              <InfoRow label="Duration" value={`${project.startDate} to ${project.endDate}`} />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-lg">Technical Specifications</h3>
            <div className="space-y-3">
              <InfoRow label="Work Type" value={project.workType} />
              <InfoRow label="Road Hierarchy" value={project.roadHierarchy} />
              <InfoRow label="Maintenance Type" value={project.maintenanceType} />
              <InfoRow 
                label="Overall Progress" 
                value={<ProgressBar progress={calculateProjectProgress(project)} />} 
              />
            </div>
          </div>
        </div>
      </div>
      
      <BoQSection project={project} onUpdate={onUpdate} />
      <WeeklyReportsSection project={project} onUpdate={onUpdate} />
      <SCurveChart project={project} />
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
);

// ========== MAIN APP COMPONENT ==========
export default function App() {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('summary');
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await storageService.list('project:');
      if (result?.keys) {
        const projectData = await Promise.all(
          result.keys.map(async (key) => {
            const data = await storageService.get(key.key);
            return data;
          })
        );
        setProjects(projectData.filter(p => p));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSaveProject = useCallback(async (projectData) => {
    try {
      await storageService.set(`project:${projectData.id}`, projectData);
      await loadProjects();
      setSelectedProject(projectData);
      setView('detail');
    } catch (error) {
      alert('Failed to save project. Please try again.');
      console.error('Save error:', error);
    }
  }, [loadProjects]);

  const handleDeleteProject = useCallback(async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await storageService.delete(`project:${projectId}`);
      await loadProjects();
      setSelectedProject(null);
      setView('summary');
    } catch (error) {
      alert('Failed to delete project. Please try again.');
      console.error('Delete error:', error);
    }
  }, [loadProjects]);

  const handleViewDetail = useCallback((project) => {
    setSelectedProject(project);
    setView('detail');
  }, []);

  const handleBackToSummary = useCallback(() => {
    setView('summary');
    setSelectedProject(null);
  }, []);

  if (loading && view === 'summary') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <Nav view={view} setView={setView} />
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Nav view={view} setView={setView} />
      
      {view === 'summary' && (
        <SummaryView 
          projects={projects} 
          onViewDetail={handleViewDetail} 
        />
      )}
      
      {view === 'add' && (
        <ProjectForm 
          onSave={handleSaveProject}
          onCancel={handleBackToSummary}
        />
      )}
      
      {view === 'edit' && selectedProject && (
        <ProjectForm 
          existing={selectedProject}
          onSave={handleSaveProject}
          onCancel={() => setView('detail')}
        />
      )}
      
      {view === 'detail' && selectedProject && (
        <ProjectDetailView 
          project={selectedProject}
          onEdit={() => setView('edit')}
          onDelete={() => handleDeleteProject(selectedProject.id)}
          onUpdate={loadProjects}
          onBack={handleBackToSummary}
        />
      )}
    </div>
  );
}