import React, { useState, useCallback } from 'react';
import { Save, Calendar, CheckCircle, MapPin } from 'lucide-react';
import MapPicker from './MapPicker';

const ProjectForm = React.memo(({ existing, onSave, onCancel, darkMode }) => {
  const [formData, setFormData] = useState(() => ({
    name: '',
    contractor: '',
    supervisor: '',
    contractPrice: '0',
    workType: 'flexible-pavement',
    roadHierarchy: 'JAS',
    maintenanceType: 'reconstruction',
    startDate: '',
    endDate: '',
    length: '',
    averageWidth: '',
    location: existing?.location || null,
    boq: [],
    weeklyReports: [],
    photos: existing?.photos || [],
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
    if (!formData.length || isNaN(formData.length) || parseFloat(formData.length) <= 0) {
      newErrors.length = 'Length must be a positive number';
    }
    if (!formData.averageWidth || isNaN(formData.averageWidth) || parseFloat(formData.averageWidth) <= 0) {
      newErrors.averageWidth = 'Average width must be a positive number';
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
        length: parseFloat(formData.length),
        averageWidth: parseFloat(formData.averageWidth),
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

  const setLocation = useCallback((location) => {
    handleChange('location', location);
  }, [handleChange]);

  const handleNameChange = useCallback((e) => handleChange('name', e.target.value), [handleChange]);
  const handleContractorChange = useCallback((e) => handleChange('contractor', e.target.value), [handleChange]);
  const handleSupervisorChange = useCallback((e) => handleChange('supervisor', e.target.value), [handleChange]);
  const handleWorkTypeChange = useCallback((e) => handleChange('workType', e.target.value), [handleChange]);
  const handleRoadHierarchyChange = useCallback((e) => handleChange('roadHierarchy', e.target.value), [handleChange]);
  const handleMaintenanceTypeChange = useCallback((e) => handleChange('maintenanceType', e.target.value), [handleChange]);
  const handleStartDateChange = useCallback((e) => handleChange('startDate', e.target.value), [handleChange]);
  const handleEndDateChange = useCallback((e) => handleChange('endDate', e.target.value), [handleChange]);
  const handleLengthChange = useCallback((e) => handleChange('length', e.target.value), [handleChange]);
  const handleAverageWidthChange = useCallback((e) => handleChange('averageWidth', e.target.value), [handleChange]);

  const bgClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  const inputClass = darkMode 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
    : 'border-gray-300 text-gray-700 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500';
  const errorBorderClass = darkMode ? 'border-red-500' : 'border-red-500';
  const infoBoxClass = darkMode ? 'bg-blue-900/50 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700';

  return (
    <div className={`max-w-4xl mx-auto rounded-xl shadow-lg p-6 ${bgClass}`}>
      <h2 className={`text-2xl font-bold mb-6 border-b pb-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {existing ? 'Edit Project' : 'Create New Project'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Project Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.name ? errorBorderClass : 'border-gray-300'} ${inputClass}`}
            placeholder="Enter project name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Contractor *</label>
          <input
            type="text"
            value={formData.contractor}
            onChange={handleContractorChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.contractor ? errorBorderClass : 'border-gray-300'} ${inputClass}`}
            placeholder="Enter contractor name"
          />
          {errors.contractor && <p className="mt-1 text-sm text-red-500">{errors.contractor}</p>}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Supervisor *</label>
          <input
            type="text"
            value={formData.supervisor}
            onChange={handleSupervisorChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.supervisor ? errorBorderClass : 'border-gray-300'} ${inputClass}`}
            placeholder="Enter supervisor name"
          />
          {errors.supervisor && <p className="mt-1 text-sm text-red-500">{errors.supervisor}</p>}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Length (meters) *</label>
          <input
            type="number"
            value={formData.length}
            onChange={handleLengthChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.length ? errorBorderClass : 'border-gray-300'} ${inputClass}`}
            placeholder="Enter road length"
            min="0"
            step="0.01"
          />
          {errors.length && <p className="mt-1 text-sm text-red-500">{errors.length}</p>}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Average Width (meters) *</label>
          <input
            type="number"
            value={formData.averageWidth}
            onChange={handleAverageWidthChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.averageWidth ? errorBorderClass : 'border-gray-300'} ${inputClass}`}
            placeholder="Enter average width"
            min="0"
            step="0.01"
          />
          {errors.averageWidth && <p className="mt-1 text-sm text-red-500">{errors.averageWidth}</p>}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Work Type</label>
          <select
            value={formData.workType}
            onChange={handleWorkTypeChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${inputClass}`}
          >
            <option value="rigid-pavement">Rigid Pavement</option>
            <option value="flexible-pavement">Flexible Pavement</option>
            <option value="combination">Combination</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Road Hierarchy</label>
          <select
            value={formData.roadHierarchy}
            onChange={handleRoadHierarchyChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${inputClass}`}
          >
            <option value="JAS">JAS</option>
            <option value="JKS">JKS</option>
            <option value="JLS">JLS</option>
            <option value="Jling-S">Jling-S</option>
            <option value="J-ling Kota">J-ling Kota</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Maintenance Type</label>
          <select
            value={formData.maintenanceType}
            onChange={handleMaintenanceTypeChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${inputClass}`}
          >
            <option value="reconstruction">Reconstruction</option>
            <option value="rehabilitation">Rehabilitation</option>
            <option value="periodic-rehabilitation">Periodic Rehabilitation</option>
            <option value="routine-maintenance">Routine Maintenance</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Start Date *</label>
          <div className="relative">
            <Calendar className={`absolute left-3 top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={20} />
            <input
              type="date"
              value={formData.startDate}
              onChange={handleStartDateChange}
              className={`w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.startDate ? errorBorderClass : 'border-gray-300'} ${inputClass}`}
            />
          </div>
          {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>End Date *</label>
          <div className="relative">
            <Calendar className={`absolute left-3 top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={20} />
            <input
              type="date"
              value={formData.endDate}
              onChange={handleEndDateChange}
              className={`w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.endDate ? errorBorderClass : 'border-gray-300'} ${inputClass}`}
              min={formData.startDate}
            />
          </div>
          {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
        </div>
      </div>

      {/* Location Picker - Full Width */}
      <div className="mt-6">
        <MapPicker 
          position={formData.location} 
          setPosition={setLocation}
          darkMode={darkMode}
        />
      </div>

      <div className={`mt-6 p-4 rounded-lg border ${infoBoxClass}`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={18} />
          <span className="font-medium">Note:</span>
        </div>
        <p className="text-sm">
          • Contract value will be automatically calculated from BoQ items.<br/>
          • You can add BoQ items after creating the project.<br/>
          • Set project location using the map above or use current location.<br/>
          • Photos can be added in weekly reports.
        </p>
      </div>

      <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
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
          className={`px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 ${
            darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

ProjectForm.displayName = 'ProjectForm';

export default ProjectForm;
