import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, BarChart3, LineChart, Download, Calendar, Users, DollarSign, ChevronRight, CheckCircle, AlertCircle, Building, HardHat, FileText, TrendingUp, Clock, Target, ChevronLeft } from 'lucide-react';
import { BarChart, Bar, LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

// ========== UTILITIES ==========
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const calculateProjectProgress = (project) => {
  if (!project?.weeklyReports?.length) return 0;
  return project.weeklyReports[project.weeklyReports.length - 1].cumulativeProgress || 0;
};

const getStatusColor = (progress) => {
  if (progress >= 90) return 'text-green-600 bg-green-50';
  if (progress >= 70) return 'text-blue-600 bg-blue-50';
  if (progress >= 50) return 'text-yellow-600 bg-yellow-50';
  if (progress >= 30) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const getStatusText = (progress) => {
  if (progress >= 90) return 'Excellent';
  if (progress >= 70) return 'Good';
  if (progress >= 50) return 'On Track';
  if (progress >= 30) return 'Delayed';
  return 'Critical';
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

// ========== STORAGE SERVICE ==========
const storageService = {
  list: async (prefix) => {
    try {
      return await window.storage.list(prefix);
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [] };
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
  <nav className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-xl">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg">
            <Building className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">BM Progress Tracker</h1>
            <p className="text-blue-200 text-sm">Construction Management Dashboard</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setView('summary')} 
            className={`px-4 py-2 rounded-lg transition-all ${view === 'summary' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-blue-600'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setView('add')} 
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
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
    { label: 'Project Name', field: 'name', type: 'text', required: true, icon: <FileText size={18} /> },
    { label: 'Contractor', field: 'contractor', type: 'text', required: true, icon: <HardHat size={18} /> },
    { label: 'Supervisor', field: 'supervisor', type: 'text', required: true, icon: <Users size={18} /> },
    { label: 'Contract Value (IDR)', field: 'contractPrice', type: 'number', required: true, icon: <DollarSign size={18} /> },
    { 
      label: 'Work Type', 
      field: 'workType', 
      type: 'select',
      options: [
        { value: 'rigid-pavement', label: 'Rigid Pavement' },
        { value: 'flexible-pavement', label: 'Flexible Pavement' },
        { value: 'combination', label: 'Combination' },
        { value: 'other', label: 'Other' }
      ],
      icon: <Building size={18} />
    },
    { 
      label: 'Road Hierarchy', 
      field: 'roadHierarchy', 
      type: 'select',
      options: [
        { value: 'JAS', label: 'Jalan Arteri Sekunder (JAS)' },
        { value: 'JKS', label: 'Jalan Kolektor Sekunder (JKS)' },
        { value: 'JLS', label: 'Jalan Lokal Sekunder (JLS)' },
        { value: 'Jling-S', label: 'Jalan Lingkungan Sekunder (Jling-S)' },
        { value: 'J-ling Kota', label: 'Jalan Lingkungan Kota' }
      ],
      icon: <Target size={18} />
    },
    { 
      label: 'Maintenance Type', 
      field: 'maintenanceType', 
      type: 'select',
      options: [
        { value: 'reconstruction', label: 'Reconstruction' },
        { value: 'rehabilitation', label: 'Rehabilitation' },
        { value: 'periodic-rehabilitation', label: 'Periodic Rehabilitation' },
        { value: 'routine-maintenance', label: 'Routine Maintenance' }
      ],
      icon: <TrendingUp size={18} />
    },
    { label: 'Start Date', field: 'startDate', type: 'date', required: true, icon: <Calendar size={18} /> },
    { label: 'End Date', field: 'endDate', type: 'date', required: true, icon: <Calendar size={18} /> }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{existing ? 'Edit Project' : 'Create New Project'}</h2>
              <p className="text-blue-100 mt-1">Fill in the project details below</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formFields.map(({ label, field, type, options, required, icon }) => (
              <div key={field} className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  {icon && <span className="mr-2 text-blue-600">{icon}</span>}
                  {label} {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {type === 'select' ? (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {icon}
                    </div>
                    <select
                      value={formData[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    >
                      {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {icon}
                    </div>
                    <input
                      type={type}
                      value={formData[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required={required}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all flex items-center space-x-2 font-medium"
            >
              <Save size={18} />
              <span>{existing ? 'Update Project' : 'Create Project'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendText, color }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold mt-2 text-gray-900">{value}</p>
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↗' : '↘'} {trendText}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color || 'bg-blue-50'}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${color?.includes('blue') ? 'text-blue-600' : color?.includes('green') ? 'text-green-600' : color?.includes('orange') ? 'text-orange-600' : 'text-blue-600'}` })}
      </div>
    </div>
  </div>
);

const ProgressBar = ({ progress, showLabel = true, size = 'md' }) => {
  const height = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3';
  const fontSize = size === 'lg' ? 'text-sm' : 'text-xs';
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        {showLabel && (
          <>
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">{progress.toFixed(1)}%</span>
          </>
        )}
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            progress >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            progress >= 70 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
            progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
            progress >= 30 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
            'bg-gradient-to-r from-red-500 to-red-600'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`${fontSize} font-medium ${getStatusColor(progress).split(' ')[0]}`}>
            {getStatusText(progress)}
          </span>
          <span className={`${fontSize} ${getStatusColor(progress).split(' ')[0]}`}>
            {progress >= 90 ? '🚀 Excellent' : 
             progress >= 70 ? '👍 Good' : 
             progress >= 50 ? '⏱️ On Track' : 
             progress >= 30 ? '⚠️ Delayed' : '🚨 Critical'}
          </span>
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, onClick, onDelete }) => {
  const progress = calculateProjectProgress(project);
  const daysRemaining = Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:border-blue-300 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 truncate">{project.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(progress)}`}>
                {getStatusText(progress)}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center">
                <HardHat size={14} className="mr-1" />
                {project.contractor}
              </span>
              <span className="flex items-center">
                <Users size={14} className="mr-1" />
                {project.supervisor}
              </span>
            </div>
          </div>
        </div>
        
        <ProgressBar progress={progress} showLabel={false} size="lg" />
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Contract Value</p>
            <p className="font-semibold text-gray-900">{formatCurrency(project.contractPrice)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Timeline</p>
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-gray-400" />
              <span className={`font-semibold ${daysRemaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Completed'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClick}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            <span>View Details</span>
            <ChevronRight size={16} />
          </button>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete project"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryView = ({ projects, onViewDetail, onDeleteProject }) => {
  const stats = useMemo(() => {
    const totalValue = projects.reduce((sum, p) => sum + Number(p.contractPrice || 0), 0);
    const avgProgress = projects.length > 0 
      ? projects.reduce((sum, p) => sum + calculateProjectProgress(p), 0) / projects.length 
      : 0;
    
    const activeProjects = projects.filter(p => new Date(p.endDate) > new Date()).length;
    const delayedProjects = projects.filter(p => {
      const progress = calculateProjectProgress(p);
      const expectedProgress = 100 * (Date.now() - new Date(p.startDate)) / (new Date(p.endDate) - new Date(p.startDate));
      return progress < expectedProgress;
    }).length;
    
    return { totalValue, avgProgress, activeProjects, delayedProjects };
  }, [projects]);

  const chartData = useMemo(() => 
    projects.map(p => ({
      name: p.name.length > 12 ? `${p.name.substring(0, 12)}...` : p.name,
      progress: calculateProjectProgress(p),
      value: Number(p.contractPrice) / 1000000000
    })),
    [projects]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Monitor all your construction projects in one place</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Projects" 
          value={projects.length} 
          icon={<Building />}
          color="bg-blue-50"
          trend={projects.length > 0 ? 1 : 0}
          trendText="All projects"
        />
        <StatCard 
          title="Total Value" 
          value={formatCurrency(stats.totalValue)} 
          icon={<DollarSign />}
          color="bg-green-50"
        />
        <StatCard 
          title="Avg. Progress" 
          value={`${stats.avgProgress.toFixed(1)}%`} 
          icon={<TrendingUp />}
          color="bg-orange-50"
          trend={stats.avgProgress > 50 ? 1 : -1}
          trendText={stats.avgProgress > 50 ? 'Ahead' : 'Behind'}
        />
        <StatCard 
          title="Active Projects" 
          value={stats.activeProjects} 
          icon={<CheckCircle />}
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Project Progress Overview</h2>
                <p className="text-gray-600 text-sm">Visual comparison of all project progress</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 100]} 
                    stroke="#666"
                    label={{ value: 'Progress %', angle: -90, position: 'insideLeft', offset: -10 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    stroke="#666"
                    label={{ value: 'Value (B)', angle: 90, position: 'insideRight', offset: -10 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'progress') return [`${value}%`, 'Progress'];
                      if (name === 'value') return [`${value} Billion IDR`, 'Value'];
                      return [value, name];
                    }}
                    contentStyle={{ 
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="progress" 
                    fill="url(#progressGradient)" 
                    name="Progress %"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="value" 
                    fill="url(#valueGradient)" 
                    name="Value (Billion IDR)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick Stats</h2>
              <p className="text-gray-600 text-sm">Project health indicators</p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">On Schedule</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.length - stats.delayedProjects}
                  </p>
                </div>
              </div>
              <span className="text-green-600 text-sm font-semibold">✓ Good</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Delayed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.delayedProjects}</p>
                </div>
              </div>
              <span className="text-orange-600 text-sm font-semibold">⚠️ Needs Attention</span>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-1">Overall Health</p>
              <ProgressBar progress={stats.avgProgress} size="sm" />
              <p className="text-xs text-blue-600 mt-2">
                {stats.avgProgress > 70 ? 'Projects are performing well' :
                 stats.avgProgress > 40 ? 'Projects need monitoring' :
                 'Immediate attention required'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">All Projects ({projects.length})</h2>
              <p className="text-gray-600 text-sm">Click on any project to view details</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center space-x-2">
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Building className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">Create your first project to get started</p>
              <button 
                onClick={() => window.location.href = '#add'}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md font-medium"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => onViewDetail(project)}
                  onDelete={onDeleteProject}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simplified Detail View for now (to fix build)
const ProjectDetailView = ({ project, onEdit, onDelete, onUpdate, onBack }) => {
  const progress = calculateProjectProgress(project);
  
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ChevronLeft size={20} />
          <span className="ml-2">Back to Dashboard</span>
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-blue-100">
                <span className="flex items-center">
                  <HardHat size={16} className="mr-2" />
                  {project.contractor}
                </span>
                <span className="flex items-center">
                  <Users size={16} className="mr-2" />
                  {project.supervisor}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors flex items-center space-x-2"
              >
                <Edit2 size={18} />
                <span>Edit</span>
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contract Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(project.contractPrice)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Progress</p>
                  <p className="text-xl font-bold text-gray-900">{progress.toFixed(1)}%</p>
                </div>
              </div>
              <ProgressBar progress={progress} />
            </div>
            
            <div className="bg-purple-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Timeline</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Work Type</p>
                <p className="font-medium">{project.workType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Road Hierarchy</p>
                <p className="font-medium">{project.roadHierarchy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Maintenance Type</p>
                <p className="font-medium">{project.maintenanceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
            </div>
          </div>
          
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">BoQ & Reports Coming Soon</h3>
            <p className="text-gray-600">Full project management features will be available in the next update.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Nav view={view} setView={setView} />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Nav view={view} setView={setView} />
      
      <main className="py-8">
        {view === 'summary' && (
          <SummaryView 
            projects={projects} 
            onViewDetail={handleViewDetail}
            onDeleteProject={handleDeleteProject}
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
      </main>
    </div>
  );
}