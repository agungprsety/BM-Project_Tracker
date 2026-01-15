import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, Save, X, Download, Upload, Calendar, BarChart3, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Initialize storage ONCE at the top level
if (!window.storage) {
  window.storage = {
    async set(key, value) {
      localStorage.setItem(key, value);
      return { success: true };
    },
    
    async get(key) {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    },
    
    async delete(key) {
      localStorage.removeItem(key);
      return { success: true };
    },
    
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return { keys };
    }
  };
}

// Helper functions
const formatCurrency = (n) => {
  if (!n) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Loading skeleton
const LoadingSkeleton = React.memo(() => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="h-24 bg-gray-200 rounded"></div>
      <div className="h-24 bg-gray-200 rounded"></div>
      <div className="h-24 bg-gray-200 rounded"></div>
    </div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// ProjectForm Component
const ProjectForm = React.memo(({ existing, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => ({
    name: '',
    contractor: '',
    supervisor: '',
    contractPrice: '0', // Will be auto-calculated from BoQ
    workType: 'flexible-pavement',
    roadHierarchy: 'JAS',
    maintenanceType: 'reconstruction',
    startDate: '',
    endDate: '',
    boq: [],
    weeklyReports: [],
    ...existing
  }));
  
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.contractor.trim()) newErrors.contractor = 'Contractor is required';
    if (!formData.supervisor.trim()) newErrors.supervisor = 'Supervisor is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    return newErrors;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      const projectToSave = {
        ...formData,
        contractPrice: formData.contractPrice || '0',
        updatedAt: new Date().toISOString(),
        id: existing?.id || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      if (!existing) {
        projectToSave.createdAt = new Date().toISOString();
      }

      await window.storage.set('project:' + projectToSave.id, JSON.stringify(projectToSave));
      
      if (onSave) onSave();
    } catch (e) {
      console.error('Save failed:', e);
      alert(`Save failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [formData, existing, validate, onSave]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const handleNameChange = useCallback((e) => handleChange('name', e.target.value), [handleChange]);
  const handleContractorChange = useCallback((e) => handleChange('contractor', e.target.value), [handleChange]);
  const handleSupervisorChange = useCallback((e) => handleChange('supervisor', e.target.value), [handleChange]);
  const handleWorkTypeChange = useCallback((e) => handleChange('workType', e.target.value), [handleChange]);
  const handleRoadHierarchyChange = useCallback((e) => handleChange('roadHierarchy', e.target.value), [handleChange]);
  const handleMaintenanceTypeChange = useCallback((e) => handleChange('maintenanceType', e.target.value), [handleChange]);
  const handleStartDateChange = useCallback((e) => handleChange('startDate', e.target.value), [handleChange]);
  const handleEndDateChange = useCallback((e) => handleChange('endDate', e.target.value), [handleChange]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        {existing ? 'Edit Project' : 'Create New Project'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Project Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter project name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Contractor *</label>
          <input
            type="text"
            value={formData.contractor}
            onChange={handleContractorChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.contractor ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter contractor name"
          />
          {errors.contractor && <p className="mt-1 text-sm text-red-600">{errors.contractor}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Supervisor *</label>
          <input
            type="text"
            value={formData.supervisor}
            onChange={handleSupervisorChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.supervisor ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter supervisor name"
          />
          {errors.supervisor && <p className="mt-1 text-sm text-red-600">{errors.supervisor}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Work Type</label>
          <select
            value={formData.workType}
            onChange={handleWorkTypeChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="rigid-pavement">Rigid Pavement</option>
            <option value="flexible-pavement">Flexible Pavement</option>
            <option value="combination">Combination</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Road Hierarchy</label>
          <select
            value={formData.roadHierarchy}
            onChange={handleRoadHierarchyChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="JAS">JAS</option>
            <option value="JKS">JKS</option>
            <option value="JLS">JLS</option>
            <option value="Jling-S">Jling-S</option>
            <option value="J-ling Kota">J-ling Kota</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Maintenance Type</label>
          <select
            value={formData.maintenanceType}
            onChange={handleMaintenanceTypeChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="reconstruction">Reconstruction</option>
            <option value="rehabilitation">Rehabilitation</option>
            <option value="periodic-rehabilitation">Periodic Rehabilitation</option>
            <option value="routine-maintenance">Routine Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Start Date *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="date"
              value={formData.startDate}
              onChange={handleStartDateChange}
              className={`w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">End Date *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="date"
              value={formData.endDate}
              onChange={handleEndDateChange}
              className={`w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
              min={formData.startDate}
            />
          </div>
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <CheckCircle size={18} />
          <span className="font-medium">Note:</span>
        </div>
        <p className="text-sm text-blue-600">
          Contract value will be automatically calculated from BoQ items. You can add BoQ items after creating the project.
        </p>
      </div>

      <div className="flex gap-3 mt-8 pt-6 border-t">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} /> {existing ? 'Update Project' : 'Create Project'}
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

ProjectForm.displayName = 'ProjectForm';

// Nav Component
const Nav = React.memo(({ view, setView, projectsLength, exportData, importData }) => {
  const handleSetViewSummary = useCallback(() => setView('summary'), [setView]);
  const handleSetViewAdd = useCallback(() => setView('add'), [setView]);

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-4 mb-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 size={28} />
          <h1 className="text-2xl font-bold tracking-tight">BM Progress Tracker</h1>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button 
            onClick={handleSetViewSummary} 
            className={`px-4 py-2 rounded-lg transition-colors ${view === 'summary' ? 'bg-blue-900' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Dashboard
          </button>

          <button 
            onClick={handleSetViewAdd} 
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> New Project
          </button>

          <div className="flex gap-2">
            <label className="cursor-pointer px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
              <Upload size={18} /> Import
              <input 
                type="file" 
                accept=".json" 
                onChange={importData} 
                className="hidden" 
              />
            </label>

            <button 
              onClick={exportData} 
              disabled={projectsLength === 0}
              className="px-4 py-2 bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} /> Export
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
});

Nav.displayName = 'Nav';

// Main App Component
function App() {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('summary');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.storage.list('project:');
      if (result && result.keys) {
        const data = await Promise.all(result.keys.map(async (key) => {
          try {
            const d = await window.storage.get(key);
            return d ? JSON.parse(d.value) : null;
          } catch (e) {
            console.warn('Failed to parse project:', key, e);
            return null;
          }
        }));
        const validProjects = data.filter(p => p && p.id && p.name);
        setProjects(validProjects);
      } else {
        setProjects([]);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
      setError(e.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const calculateTotalFromBoQ = useCallback((boq) => {
    if (!boq || !Array.isArray(boq)) return 0;
    return boq.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  }, []);

  const saveProject = useCallback(async (project) => {
    try {
      if (!project.name || !project.contractor || !project.supervisor) {
        throw new Error('Required fields missing');
      }

      // Auto-calculate contract price from BoQ if BoQ exists
      let contractPrice = '0';
      if (project.boq && project.boq.length > 0) {
        contractPrice = calculateTotalFromBoQ(project.boq).toString();
      }

      const projectToSave = {
        ...project,
        contractPrice,
        id: project.id || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        updatedAt: new Date().toISOString()
      };

      if (!project.id) {
        projectToSave.createdAt = new Date().toISOString();
      }

      await window.storage.set('project:' + projectToSave.id, JSON.stringify(projectToSave));
      await loadProjects();
      return projectToSave;
    } catch (e) {
      console.error('Save failed:', e);
      throw e;
    }
  }, [loadProjects, calculateTotalFromBoQ]);

  const deleteProject = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await window.storage.delete('project:' + id);
        await loadProjects();
        if (view === 'detail' && selected?.id === id) {
          setView('summary');
          setSelected(null);
        }
      } catch (e) {
        console.error('Delete failed:', e);
        alert('Failed to delete project');
      }
    }
  }, [loadProjects, view, selected]);

  const exportData = useCallback(async () => {
    try {
      const data = {
        version: '1.1',
        exportDate: new Date().toISOString(),
        projects: projects
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bm-projects-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed');
    }
  }, [projects]);

  const importData = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.confirm('This will overwrite existing data. Are you sure?')) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.version !== '1.1') {
        throw new Error('Invalid file version');
      }

      if (!Array.isArray(data.projects)) {
        throw new Error('Invalid data format');
      }

      for (const project of data.projects) {
        if (project.id && project.name) {
          await window.storage.set('project:' + project.id, JSON.stringify(project));
        }
      }
      
      await loadProjects();
      alert('Import completed successfully!');
    } catch (e) {
      console.error('Import failed:', e);
      alert('Import failed: Invalid file format');
    }
    
    event.target.value = '';
  }, [loadProjects]);

  const getProgress = useCallback((p) => {
    if (!p.boq || p.boq.length === 0) return 0;
    
    const totalValue = calculateTotalFromBoQ(p.boq);
    if (totalValue === 0) return 0;
    
    const completedValue = p.boq.reduce((total, item) => {
      const completedQty = item.completed || 0;
      return total + (completedQty * (item.unitPrice || 0));
    }, 0);
    
    return Math.min(100, (completedValue / totalValue) * 100);
  }, [calculateTotalFromBoQ]);

  const handleSaveSuccess = useCallback(() => {
    setView('summary');
    loadProjects();
  }, [loadProjects]);

  const handleFormCancel = useCallback(() => {
    setView('summary');
    setSelected(null);
  }, []);

  const handleViewDetail = useCallback((project) => {
    setSelected(project);
    setView('detail');
  }, []);

  const handleEditProject = useCallback((project) => {
    setSelected(project);
    setView('edit');
  }, []);

  const handleReload = useCallback(() => {
    loadProjects();
  }, [loadProjects]);

  const handleEditInDetail = useCallback(() => {
    setView('edit');
  }, []);

  const handleDeleteProject = useCallback((id) => {
    deleteProject(id);
  }, [deleteProject]);

  const currentView = useMemo(() => {
    switch (view) {
      case 'summary':
        return (
          <Summary 
            projects={projects}
            loading={loading}
            error={error}
            getProgress={getProgress}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onViewDetail={handleViewDetail}
            onEditProject={handleEditProject}
            onReload={handleReload}
          />
        );
      case 'add':
        return (
          <ProjectForm 
            onSave={handleSaveSuccess}
            onCancel={handleFormCancel}
          />
        );
      case 'edit':
        return selected ? (
          <ProjectForm 
            existing={selected}
            onSave={handleSaveSuccess}
            onCancel={() => setView('detail')}
          />
        ) : null;
      case 'detail':
        return selected ? (
          <Detail 
            project={selected}
            onUpdate={loadProjects}
            onEdit={handleEditInDetail}
            onDelete={handleDeleteProject}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            calculateTotalFromBoQ={calculateTotalFromBoQ}
            getProgress={getProgress}
          />
        ) : null;
      default:
        return null;
    }
  }, [
    view, projects, loading, error, selected, 
    getProgress, handleViewDetail, handleEditProject, 
    handleReload, handleSaveSuccess, handleFormCancel,
    handleEditInDetail, handleDeleteProject, loadProjects,
    calculateTotalFromBoQ
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Nav
        view={view}
        setView={setView}
        projectsLength={projects.length}
        exportData={exportData}
        importData={importData}
      />
      <main>
        {currentView}
      </main>
      
      <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-gray-600 text-sm">
          BM Progress Tracker v1.0
        </p>
        <p className="text-gray-500 text-xs mt-2">
          This work was done in assist of Claude Sonnet. All rights reserved. https://github.com/agungprsety
        </p>
      </footer>
    </div>
  );
}

// Summary Component
const Summary = React.memo(({ 
  projects, 
  loading, 
  error, 
  getProgress, 
  formatCurrency, 
  formatDate,
  onViewDetail,
  onEditProject,
  onReload 
}) => {
  const totalValue = useMemo(() => 
    projects.reduce((s, p) => s + Number(p.contractPrice || 0), 0), 
    [projects]
  );
  
  const avgProgress = useMemo(() => 
    projects.length > 0 
      ? projects.reduce((s, p) => s + getProgress(p), 0) / projects.length 
      : 0,
    [projects, getProgress]
  );
  
  const chartData = useMemo(() => 
    projects.map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
      progress: getProgress(p),
      value: Number(p.contractPrice || 0)
    })),
    [projects, getProgress]
  );

  const projectsByProgress = useMemo(() => 
    [...projects].sort((a, b) => getProgress(b) - getProgress(a)),
    [projects, getProgress]
  );

  const handleReload = useCallback(() => {
    if (onReload) onReload();
  }, [onReload]);

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleReload}
            className="mt-2 text-sm text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Projects</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{projects.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="text-blue-600" size={28} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Contract Value</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">{formatCurrency(totalValue)}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <div className="text-emerald-600 font-bold">IDR</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-lg p-6 border border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Average Progress</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{avgProgress.toFixed(1)}%</p>
                </div>
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-amber-600 font-bold">{avgProgress.toFixed(0)}%</div>
                  </div>
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-amber-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={175.93}
                      strokeDashoffset={175.93 * (1 - avgProgress / 100)}
                      className="text-amber-600"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Progress Overview</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      label={{ 
                        value: 'Progress (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10,
                        style: { textAnchor: 'middle' }
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Progress']}
                      labelStyle={{ fontWeight: 'bold' }}
                      contentStyle={{ 
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="progress" 
                      name="Progress" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl font-bold text-gray-800">All Projects</h2>
              <p className="text-sm text-gray-600 mt-1">{projects.length} project(s) found</p>
            </div>
            
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <BarChart3 size={64} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first project</p>
                <button
                  onClick={() => onViewDetail && onViewDetail(null)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projectsByProgress.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{p.workType?.replace('-', ' ') || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{p.contractor}</div>
                          <div className="text-sm text-gray-500">{p.supervisor}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>{formatDate(p.startDate)}</div>
                          <div className="text-gray-400">to</div>
                          <div>{formatDate(p.endDate)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(p.contractPrice)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-xs">
                              <div className="bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${getProgress(p)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="font-bold text-gray-700 min-w-[60px] text-right">
                              {getProgress(p).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onViewDetail && onViewDetail(p)}
                              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => onEditProject && onEditProject(p)}
                              className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

Summary.displayName = 'Summary';

// ==================== BoQ COMPONENT (UPDATED) ====================

const BoQ = React.memo(({ project, onUpdate }) => {
  const [items, setItems] = useState(project.boq || []);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: '',
    unit: '',
    unitPrice: ''
  });

  // Calculate totals
  const totalValue = useMemo(() => 
    items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
    [items]
  );

  const completedValue = useMemo(() => 
    items.reduce((sum, item) => {
      const completedQty = item.completed || 0;
      return sum + (completedQty * item.unitPrice);
    }, 0),
    [items]
  );

  const addItem = useCallback(() => {
    if (!newItem.description || !newItem.quantity || !newItem.unit || !newItem.unitPrice) {
      alert('Please fill all fields');
      return;
    }

    const item = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      unitPrice: Number(newItem.unitPrice),
      total: Number(newItem.quantity) * Number(newItem.unitPrice), // Auto-calculate total
      completed: 0,
      remaining: Number(newItem.quantity) // Initialize remaining quantity
    };

    const updatedItems = [...items, item];
    setItems(updatedItems);
    setNewItem({ description: '', quantity: '', unit: '', unitPrice: '' });
    saveBoQ(updatedItems);
  }, [items, newItem]);

  const deleteItem = useCallback((id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveBoQ(updatedItems);
  }, [items]);

  const updateCompleted = useCallback((id, completed) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const completedQty = Math.min(Math.max(0, completed), item.quantity);
        return {
          ...item,
          completed: completedQty,
          remaining: item.quantity - completedQty
        };
      }
      return item;
    });
    setItems(updatedItems);
    saveBoQ(updatedItems);
  }, [items]);

  const saveBoQ = useCallback(async (boqItems) => {
    const updatedProject = {
      ...project,
      boq: boqItems,
      contractPrice: boqItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toString(),
      updatedAt: new Date().toISOString()
    };
    
    await window.storage.set('project:' + updatedProject.id, JSON.stringify(updatedProject));
    if (onUpdate) onUpdate();
  }, [project, onUpdate]);

  const handleDescriptionChange = useCallback((e) => 
    setNewItem(prev => ({ ...prev, description: e.target.value })), []);
  
  const handleQuantityChange = useCallback((e) => 
    setNewItem(prev => ({ ...prev, quantity: e.target.value })), []);
  
  const handleUnitChange = useCallback((e) => 
    setNewItem(prev => ({ ...prev, unit: e.target.value })), []);
  
  const handleUnitPriceChange = useCallback((e) => 
    setNewItem(prev => ({ ...prev, unitPrice: e.target.value })), []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Bill of Quantities (BoQ)</h3>
          <p className="text-sm text-gray-600 mt-1">
            Contract Value: <span className="font-bold text-blue-600">{formatCurrency(totalValue)}</span>
            {totalValue > 0 && (
              <span className="ml-4">
                Completed: <span className="font-bold text-green-600">{formatCurrency(completedValue)}</span>
                <span className="text-gray-500 ml-2">
                  ({totalValue > 0 ? ((completedValue / totalValue) * 100).toFixed(1) : 0}%)
                </span>
              </span>
            )}
          </p>
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Add Item Form */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
        <input
          type="text"
          placeholder="Description (e.g., Asphalt)"
          value={newItem.description}
          onChange={handleDescriptionChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={newItem.quantity}
          onChange={handleQuantityChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          min="0"
          step="0.01"
        />
        <input
          type="text"
          placeholder="Unit (ton, m³, etc)"
          value={newItem.unit}
          onChange={handleUnitChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="number"
          placeholder="Unit Price"
          value={newItem.unitPrice}
          onChange={handleUnitPriceChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          min="0"
          step="1000"
        />
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
        >
          Add to BoQ
        </button>
      </div>

      {/* BoQ Table */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <BarChart3 size={48} className="mx-auto" />
          </div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">No BoQ Items Yet</h4>
          <p className="text-gray-500 mb-4">Add your first BoQ item to start tracking progress</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(item => {
                const itemTotal = item.quantity * item.unitPrice;
                const itemCompletedValue = (item.completed || 0) * item.unitPrice;
                const progressPercentage = item.quantity > 0 ? ((item.completed || 0) / item.quantity) * 100 : 0;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.description}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">{formatCurrency(itemTotal)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.completed || 0}
                          onChange={(e) => updateCompleted(item.id, parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                          max={item.quantity}
                          step="0.01"
                        />
                        <span className="text-gray-600 text-sm">{item.unit}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {progressPercentage.toFixed(1)}% complete
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{(item.remaining || item.quantity).toLocaleString()} {item.unit}</div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan="4" className="px-4 py-3 text-right">TOTAL CONTRACT VALUE:</td>
                <td className="px-4 py-3 text-blue-600">{formatCurrency(totalValue)}</td>
                <td colSpan="2" className="px-4 py-3 text-green-600">
                  Completed: {formatCurrency(completedValue)} ({totalValue > 0 ? ((completedValue / totalValue) * 100).toFixed(1) : 0}%)
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
});

BoQ.displayName = 'BoQ';

// ==================== Weekly Reports Component (UPDATED) ====================

const Weekly = React.memo(({ project, onUpdate }) => {
  const [reports, setReports] = useState(project.weeklyReports || []);
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({
    weekNumber: '',
    date: '',
    notes: '',
    workItems: []
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
      weekNumber: reports.length + 1,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      workItems: []
    });
    setShowModal(true);
  }, [boqItems.length, reports.length]);

  const addWorkItem = useCallback(() => {
    setNewReport(prev => ({
      ...prev,
      workItems: [...prev.workItems, { boqItemId: '', qtyCompleted: '' }]
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
        boqItem.remaining = boqItem.quantity - boqItem.completed;
      }
    });

    const report = {
      id: Date.now().toString(),
      weekNumber: parseInt(newReport.weekNumber),
      date: newReport.date,
      notes: newReport.notes,
      workItems: newReport.workItems.map(item => ({
        ...item,
        qtyCompleted: parseFloat(item.qtyCompleted)
      })),
      weeklyProgress: weeklyProgress,
      cumulativeProgress: cumulativeProgress,
      createdAt: new Date().toISOString()
    };

    const updatedReports = [...reports, report].sort((a, b) => a.weekNumber - b.weekNumber);
    
    const updatedProject = {
      ...project,
      weeklyReports: updatedReports,
      boq: updatedBoq,
      updatedAt: new Date().toISOString()
    };

    await window.storage.set('project:' + updatedProject.id, JSON.stringify(updatedProject));
    setReports(updatedReports);
    setShowModal(false);
    if (onUpdate) onUpdate();
  }, [newReport, boqItems, calculateWeeklyProgress, reports, project, onUpdate]);

  const deleteWeeklyReport = useCallback(async (reportId) => {
    if (!window.confirm('Delete this weekly report? This will recalculate all progress.')) return;

    const reportToDelete = reports.find(r => r.id === reportId);
    if (!reportToDelete) return;

    // Reset BoQ completed quantities and recalculate from scratch
    const updatedBoq = boqItems.map(item => ({
      ...item,
      completed: 0,
      remaining: item.quantity
    }));

    const remainingReports = reports.filter(r => r.id !== reportId);
    
    // Recalculate progress for remaining reports
    let cumulativeProgress = 0;
    const recalculatedReports = remainingReports.map(report => {
      let weeklyValue = 0;
      report.workItems.forEach(workItem => {
        const boqItem = updatedBoq.find(item => item.id === workItem.boqItemId);
        if (boqItem) {
          boqItem.completed += workItem.qtyCompleted;
          boqItem.remaining = boqItem.quantity - boqItem.completed;
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

  const closeModal = useCallback(() => setShowModal(false), []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Weekly Reports</h3>
          <p className="text-sm text-gray-600 mt-1">
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
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <Calendar size={48} className="mx-auto" />
          </div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">No Weekly Reports Yet</h4>
          <p className="text-gray-500 mb-4">Add your first weekly report to track progress over time</p>
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulative Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">Week {report.weekNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(report.date)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {report.workItems.length} item(s)
                      {report.workItems.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {report.workItems.slice(0, 2).map((workItem, idx) => {
                            const boqItem = boqItems.find(item => item.id === workItem.boqItemId);
                            return boqItem ? (
                              <div key={idx} className="truncate">
                                {boqItem.description}: {workItem.qtyCompleted} {boqItem.unit}
                                <div className="text-xs text-blue-600">
                                  = {formatCurrency(workItem.qtyCompleted * boqItem.unitPrice)}
                                </div>
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
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${report.weeklyProgress > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        +{report.weeklyProgress.toFixed(2)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-blue-600">{report.cumulativeProgress.toFixed(2)}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, report.cumulativeProgress)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {report.notes || '-'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Add Weekly Report</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Number *</label>
                <input
                  type="number"
                  value={newReport.weekNumber}
                  onChange={handleWeekNumberChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={newReport.date}
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Work Items Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">Work Completed This Week *</label>
                <button
                  onClick={addWorkItem}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} /> Add Work Item
                </button>
              </div>

              {newReport.workItems.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500">No work items added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add at least one work item to calculate progress</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newReport.workItems.map((workItem, index) => {
                    const selectedBoqItem = boqItems.find(item => item.id === workItem.boqItemId);
                    const remainingQty = selectedBoqItem ? selectedBoqItem.quantity - (selectedBoqItem.completed || 0) : 0;
                    
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">BoQ Item *</label>
                            <select
                              value={workItem.boqItemId}
                              onChange={(e) => handleWorkItemBoqChange(index, e)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select BoQ Item</option>
                              {boqItems.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.description} - {item.quantity} {item.unit} @ {formatCurrency(item.unitPrice)}
                                  {item.remaining !== undefined && (
                                    ` (Remaining: ${item.remaining} ${item.unit})`
                                  )}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Completed *</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={workItem.qtyCompleted}
                                onChange={(e) => handleWorkItemQtyChange(index, e)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                max={remainingQty}
                              />
                              <span className="text-sm text-gray-500 self-center">
                                {selectedBoqItem ? selectedBoqItem.unit : ''}
                              </span>
                            </div>
                            {selectedBoqItem && (
                              <div className="text-xs text-gray-500 mt-1">
                                Max: {remainingQty.toFixed(2)} {selectedBoqItem.unit}
                              </div>
                            )}
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
                          <div className="text-xs bg-blue-50 p-2 rounded mt-2">
                            <div className="text-blue-700 font-medium">
                              Calculation: ({workItem.qtyCompleted} {selectedBoqItem.unit} × {formatCurrency(selectedBoqItem.unitPrice)}) = {formatCurrency(parseFloat(workItem.qtyCompleted) * selectedBoqItem.unitPrice)}
                            </div>
                            <div className="text-blue-600 text-xs mt-1">
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

            {/* Progress Calculation Preview */}
            {newReport.workItems.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-blue-800 mb-1">Progress Calculation Preview</div>
                    <div className="text-xs text-blue-600">
                      Formula: Σ(Completed Qty × Unit Price) / Total Contract Value × 100
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Total Contract Value: {formatCurrency(totalContractValue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-700">{calculateWeeklyProgress().toFixed(2)}%</div>
                    <div className="text-xs text-blue-600">Weekly Progress</div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={newReport.notes}
                onChange={handleNotesChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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

// S-Curve Component
const SCurve = React.memo(({ project }) => {
  const reports = project.weeklyReports || [];
  
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">S-Curve Progress Chart</h3>
        <div className="text-center py-12 text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Add weekly reports to see the S-curve</p>
        </div>
      </div>
    );
  }

  const data = useMemo(() => 
    reports
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(report => ({
        week: `W${report.weekNumber}`,
        'Weekly Progress': report.weeklyProgress,
        'Cumulative Progress': report.cumulativeProgress,
        date: report.date
      })),
    [reports]
  );

  const latestProgress = reports.length > 0 ? reports[reports.length - 1].cumulativeProgress : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">S-Curve Progress Chart</h3>
          <p className="text-sm text-gray-600 mt-1">
            Current Progress: <span className="font-bold text-blue-600">{latestProgress.toFixed(1)}%</span>
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {reports.length} week(s) tracked
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Week', 
                position: 'insideBottom', 
                offset: -5,
                style: { fontSize: 12 }
              }}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Progress (%)', 
                angle: -90, 
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: 12 }
              }}
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

// Detail Component
const Detail = React.memo(({ 
  project, 
  onUpdate, 
  onEdit, 
  onDelete,
  formatCurrency,
  formatDate,
  calculateTotalFromBoQ,
  getProgress 
}) => {
  const totalValue = useMemo(() => calculateTotalFromBoQ(project.boq || []), [project.boq, calculateTotalFromBoQ]);
  const progress = useMemo(() => getProgress(project), [project, getProgress]);
  
  const completedValue = useMemo(() => 
    project.boq ? project.boq.reduce((sum, item) => {
      return sum + ((item.completed || 0) * (item.unitPrice || 0));
    }, 0) : 0,
    [project.boq]
  );

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    if (onDelete) onDelete(project.id);
  }, [onDelete, project.id]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Project Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{project.name}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {project.workType?.replace('-', ' ') || ''}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {project.roadHierarchy || ''}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {project.maintenanceType || ''}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Project ID: {project.id}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 size={18} /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-gray-700 mb-3">Project Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Contractor:</span>
                <span className="font-medium">{project.contractor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Supervisor:</span>
                <span className="font-medium">{project.supervisor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dates:</span>
                <span className="font-medium">
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100">
            <h3 className="font-semibold text-gray-700 mb-3">Financial Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-bold text-blue-600">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Value:</span>
                <span className="font-bold text-green-600">{formatCurrency(completedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Value:</span>
                <span className="font-bold text-amber-600">{formatCurrency(totalValue - completedValue)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
            <h3 className="font-semibold text-gray-700 mb-3">Progress Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Progress:</span>
                <span className="font-bold text-purple-600">{progress.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">BoQ Items:</span>
                <span className="font-medium">{project.boq?.length || 0} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Reports:</span>
                <span className="font-medium">{project.weeklyReports?.length || 0} weeks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Project Progress</span>
            <span>{progress.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(completedValue)} completed</span>
            <span>{formatCurrency(totalValue - completedValue)} remaining</span>
          </div>
        </div>
      </div>

      {/* BoQ Section */}
      <BoQ project={project} onUpdate={onUpdate} />

      {/* Weekly Reports Section */}
      <Weekly project={project} onUpdate={onUpdate} />

      {/* S-Curve Section */}
      <SCurve project={project} />
    </div>
  );
});

Detail.displayName = 'Detail';

export default App;