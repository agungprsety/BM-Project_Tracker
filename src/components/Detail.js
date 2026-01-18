import React, { useMemo, useCallback, useRef } from 'react';
import { Edit2, Trash2, MapPin, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import BoQ from './BoQ';
import Weekly from './Weekly';
import SCurve from './SCurve';
import PhotoGallery from './PhotoGallery';
import ProjectMap from './ProjectMap';

import { formatCurrency, formatDate, formatLength, formatArea } from '../utils';
import { exportProjectDetailPDF, exportBoQPDF, exportReportsPDF, exportSCurvePDF } from '../utils/pdfExport';

const Detail = React.memo(({ 
  project, 
  onUpdate, 
  onEdit, 
  onDelete,
  calculateTotalFromBoQ,
  getProgress,
  darkMode 
}) => {
  const sCurveRef = useRef(null);
  const totalValue = useMemo(() => calculateTotalFromBoQ(project.boq || []), [project.boq, calculateTotalFromBoQ]);
  const progress = useMemo(() => getProgress(project), [project, getProgress]);
  const area = useMemo(() => (project.length || 0) * (project.averageWidth || 0), [project.length, project.averageWidth]);
  
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

  const handleExportFullPDF = async () => {
    let sCurveImage = null;
    if (sCurveRef.current) {
      try {
        const canvas = await html2canvas(sCurveRef.current, {
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          scale: 2
        });
        sCurveImage = canvas.toDataURL('image/png');
      } catch (e) {
        console.error('Failed to capture S-Curve:', e);
      }
    }
    exportProjectDetailPDF(project, totalValue, completedValue, progress, sCurveImage);
  };

  const handleExportBoQ = () => exportBoQPDF(project, totalValue, completedValue);
  const handleExportReports = () => exportReportsPDF(project);
  const handleExportSCurve = async () => {
    let sCurveImage = null;
    if (sCurveRef.current) {
      try {
        const canvas = await html2canvas(sCurveRef.current, {
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          scale: 2
        });
        sCurveImage = canvas.toDataURL('image/png');
      } catch (e) {
        console.error('Failed to capture S-Curve:', e);
      }
    }
    exportSCurvePDF(project, sCurveImage);
  };

  const handleDeletePhoto = useCallback(async (photoId) => {
    if (!window.confirm('Delete this photo? This action cannot be undone.')) return;

    const updatedProject = {
      ...project,
      photos: project.photos?.filter(photo => photo.id !== photoId) || [],
      weeklyReports: project.weeklyReports?.map(report => ({
        ...report,
        photos: report.photos?.filter(photo => photo.id !== photoId) || []
      })) || [],
      updatedAt: new Date().toISOString()
    };

    await window.storage.set('project:' + updatedProject.id, JSON.stringify(updatedProject));
    if (onUpdate) onUpdate();
  }, [project, onUpdate]);

  const bgClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  const cardBgClass = darkMode ? 'from-gray-800 to-gray-900 border-gray-700' : 'from-white to-gray-50 border-gray-100';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Project Header */}
      <div className={`rounded-xl shadow-lg p-6 mb-6 ${bgClass}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                {project.workType?.replace('-', ' ') || ''}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                {project.roadHierarchy || ''}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                {project.maintenanceType || ''}
              </span>
              {project.location && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                  <MapPin size={10} className="inline mr-1" />
                  Location Set
                </span>
              )}
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Project ID: {project.id}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportFullPDF}
              className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shadow-md"
            >
              <Download size={18} /> Full PDF Report
            </button>
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
          <div className={`bg-gradient-to-br p-6 rounded-xl border ${cardBgClass}`}>
            <h3 className="font-semibold mb-3">Project Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Contractor:</span>
                <span className="font-medium">{project.contractor}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Supervisor:</span>
                <span className="font-medium">{project.supervisor}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Dates:</span>
                <span className="font-medium">
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Length:</span>
                <span className="font-medium">{formatLength(project.length)}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Avg. Width:</span>
                <span className="font-medium">{project.averageWidth ? `${project.averageWidth} m` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Area:</span>
                <span className="font-medium">{formatArea(area)}</span>
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br p-6 rounded-xl border ${cardBgClass}`}>
            <h3 className="font-semibold mb-3">Financial Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Value:</span>
                <span className="font-bold text-blue-600">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Completed Value:</span>
                <span className="font-bold text-green-600">{formatCurrency(completedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Remaining Value:</span>
                <span className="font-bold text-amber-600">{formatCurrency(totalValue - completedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Progress Value:</span>
                <span className="font-bold text-purple-600">{formatCurrency(totalValue * progress / 100)}</span>
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br p-6 rounded-xl border ${cardBgClass}`}>
            <h3 className="font-semibold mb-3">Progress Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Current Progress:</span>
                <span className="font-bold text-purple-600">{progress.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>BoQ Items:</span>
                <span className="font-medium">{project.boq?.length || 0} items</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Weekly Reports:</span>
                <span className="font-medium">{project.weeklyReports?.length || 0} weeks</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Photos:</span>
                <span className="font-medium">{project.photos?.length || 0} photos</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Road Length:</span>
                <span className="font-medium">{formatLength(project.length)}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Work Area:</span>
                <span className="font-medium">{formatArea(area)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className={`flex justify-between text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>Project Progress</span>
            <span>{progress.toFixed(2)}%</span>
          </div>
          <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-4`}>
            <div
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className={`flex justify-between text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            <span>{formatCurrency(completedValue)} completed</span>
            <span>{formatCurrency(totalValue - completedValue)} remaining</span>
          </div>
        </div>
      </div>

      {/* Project Map Section */}
      <div className={`rounded-xl shadow-lg p-6 mb-6 ${bgClass}`}>
        <ProjectMap project={project} darkMode={darkMode} />
      </div>

      {/* Photo Gallery Section */}
      <div className={`rounded-xl shadow-lg p-6 mb-6 ${bgClass}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold">Project Photos</h3>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {project.photos?.length || 0} photo(s) from weekly reports
            </p>
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Click to preview, hover to delete
          </div>
        </div>
        <PhotoGallery 
          photos={project.photos || []} 
          projectId={project.id} 
          darkMode={darkMode}
          onDeletePhoto={handleDeletePhoto}
        />
      </div>

      {/* BoQ Section */}
      <div className="relative">
        <div className="absolute right-6 top-6 z-10">
          <button
            onClick={handleExportBoQ}
            className="flex items-center gap-2 bg-blue-600/10 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-600/20 transition-colors text-sm font-medium border border-blue-600/20"
          >
            <Download size={14} /> Export BoQ PDF
          </button>
        </div>
        <BoQ project={project} onUpdate={onUpdate} darkMode={darkMode} />
      </div>

      {/* Weekly Reports Section */}
      <div className="relative">
        <div className="absolute right-6 top-6 z-10">
          <button
            onClick={handleExportReports}
            className="flex items-center gap-2 bg-emerald-600/10 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-600/20 transition-colors text-sm font-medium border border-emerald-600/20"
          >
            <Download size={14} /> Export Reports PDF
          </button>
        </div>
        <Weekly project={project} onUpdate={onUpdate} darkMode={darkMode} />
      </div>

      {/* S-Curve Section */}
      <div className="relative" ref={sCurveRef}>
        <div className="absolute right-6 top-6 z-10">
          <button
            onClick={handleExportSCurve}
            className="flex items-center gap-2 bg-purple-600/10 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-600/20 transition-colors text-sm font-medium border border-purple-600/20"
          >
            <Download size={14} /> Export S-Curve PDF
          </button>
        </div>
        <SCurve project={project} darkMode={darkMode} />
      </div>
    </div>
  );
});

Detail.displayName = 'Detail';

export default Detail;
