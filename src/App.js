import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Nav from './components/Nav';
import Summary from './components/Summary';
import Detail from './components/Detail';
import ProjectForm from './components/ProjectForm';
import { setProjects, setLoading, setError } from './store/projectsSlice';
import './data/storage';
import { formatCurrency, formatDate, formatLength, formatArea } from './utils';
import { exportSummaryPDF } from './utils/pdfExport';
import 'leaflet/dist/leaflet.css';

function App() {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector(state => state.projects);
  const [view, setView] = useState('summary');
  const [selected, setSelected] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const loadProjects = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
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
        dispatch(setProjects(validProjects));
      } else {
        dispatch(setProjects([]));
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
      dispatch(setError(e.message || 'Failed to load projects'));
      dispatch(setProjects([]));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

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

  const handleDeleteProject = useCallback(async (id) => {
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

  const exportData = useCallback(() => {
    exportSummaryPDF(projects, getProgress);
  }, [projects, getProgress]);

  const currentView = useMemo(() => {
    switch (view) {
      case 'summary':
        return (
          <Summary 
            projects={projects}
            loading={loading}
            error={error}
            getProgress={getProgress}
            onViewDetail={handleViewDetail}
            onEditProject={handleEditProject}
            onReload={handleReload}
            darkMode={darkMode}
          />
        );
      case 'add':
        return (
          <ProjectForm 
            onSave={handleSaveSuccess}
            onCancel={handleFormCancel}
            darkMode={darkMode}
          />
        );
      case 'edit':
        return selected ? (
          <ProjectForm 
            existing={selected}
            onSave={handleSaveSuccess}
            onCancel={() => setView('detail')}
            darkMode={darkMode}
          />
        ) : null;
      case 'detail':
        return selected ? (
          <Detail 
            project={selected}
            onUpdate={loadProjects}
            onEdit={handleEditInDetail}
            onDelete={handleDeleteProject}
            calculateTotalFromBoQ={calculateTotalFromBoQ}
            getProgress={getProgress}
            darkMode={darkMode}
            formatDate={formatDate}
            formatLength={formatLength}
            formatArea={formatArea}
            formatCurrency={formatCurrency}
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
    calculateTotalFromBoQ, darkMode
  ]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gradient-to-b from-gray-900 to-black text-white' : 'bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900'} p-4 md:p-6`}>
      <Nav
        view={view}
        setView={setView}
        projectsLength={projects.length}
        exportData={exportData}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <main>
        {currentView}
      </main>
      
      <footer className={`mt-12 pt-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
        <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
          BM Progress Tracker v1.3
        </p>
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          This work was done in assist of Claude Sonnet. All rights reserved. https://github.com/agungprsety
        </p>
      </footer>
    </div>
  );
}

export default App;