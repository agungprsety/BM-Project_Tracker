import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { calculateProgress, calculateBoQTotal, getCompletedByItem, formatCurrency, formatDate, formatLength, formatArea, generateId } from '@/lib/utils';
import { exportProjectDetail } from '@/lib/exportPdf';
import { MapPin, Edit2, Trash2, FileDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BoQ from '@/components/features/BoQ';
import Weekly from '@/components/features/Weekly';
import PhotoGallery from '@/components/features/PhotoGallery';
import SCurve from '@/components/features/SCurve';
import ProjectMap from '@/components/features/ProjectMap';
import type { Photo, BoQItem, WeeklyReport } from '@/types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { darkMode } = useAppStore();

  const { data: project, isLoading } = useProject(id);
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card darkMode={darkMode} className="text-center py-12">
          <p className="text-lg mb-4">Project not found</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const boq = project.boq || [];
  const weeklyReports = project.weeklyReports || [];

  const totalValue = calculateBoQTotal(boq);
  const progress = calculateProgress(boq, weeklyReports);
  const completedMap = getCompletedByItem(weeklyReports);
  const completedValue = boq.reduce((s, i) => {
    const completedQty = Math.min(completedMap[i.id] || 0, i.quantity);
    return s + completedQty * i.unitPrice;
  }, 0);
  const area = (project.length || 0) * (project.averageWidth || 0);

  const handleUpdateBoQ = (boq: BoQItem[]) => {
    updateMutation.mutate({ id: project.id, updates: { boq } });
  };

  const handleUpdateReports = (weeklyReports: WeeklyReport[]) => {
    updateMutation.mutate({ id: project.id, updates: { weeklyReports } });
  };

  const handlePhotoUpload = async (files: FileList) => {
    try {
      // The button handles its own visual loading, we just await all uploads here.
      // Dynamic import to avoid circular dependency if projectService isn't handy, but we can import it.
      // Wait, let's import projectService at the top!
      const { projectService } = await import('@/lib/db');

      const newPhotos: Photo[] = [];

      // Upload sequentially or in parallel. Parallel is faster.
      const uploadPromises = Array.from(files).map(async (file) => {
        const publicUrl = await projectService.uploadPhoto(file, project.id);
        return {
          id: generateId(),
          url: publicUrl,
          createdAt: new Date().toISOString(),
        };
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      newPhotos.push(...uploadedPhotos);

      const updatedPhotos = [...(project.photos || []), ...newPhotos];
      updateMutation.mutate({ id: project.id, updates: { photos: updatedPhotos } });
    } catch (error) {
      console.error("Failed to upload photos:", error);
      alert("Failed to upload one or more photos. Are your storage policies and bucket set up?");
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    const updatedPhotos = project.photos?.filter((p) => p.id !== photoId) || [];
    updateMutation.mutate({ id: project.id, updates: { photos: updatedPhotos } });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    deleteMutation.mutate(project.id, {
      onSuccess: () => navigate('/'),
    });
  };

  const cardBgClass = darkMode ? 'from-gray-800 to-gray-900 border-gray-700' : 'from-white to-gray-50 border-gray-100';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card darkMode={darkMode}>
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
            <Button variant="secondary" onClick={() => exportProjectDetail(project)}>
              <FileDown size={18} className="mr-2" /> Export PDF
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/projects/${project.id}/edit`)}>
              <Edit2 size={18} className="mr-2" /> Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              <Trash2 size={18} className="mr-2" /> Delete
            </Button>
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
              {project.district && (
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>District:</span>
                  <span className="font-medium">{project.district}</span>
                </div>
              )}
              {project.subDistrict && (
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Sub-district:</span>
                  <span className="font-medium">{project.subDistrict}</span>
                </div>
              )}
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
                <span className="font-medium">{boq.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Weekly Reports:</span>
                <span className="font-medium">{weeklyReports.length} weeks</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Photos:</span>
                <span className="font-medium">{project.photos?.length || 0} photos</span>
              </div>
            </div>
          </div>
        </div>

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
      </Card>

      {/* Project Map */}
      <ProjectMap project={project} darkMode={darkMode} />

      {/* Photo Gallery */}
      <PhotoGallery
        photos={project.photos || []}
        onUpload={handlePhotoUpload}
        onDelete={handleDeletePhoto}
        darkMode={darkMode}
      />

      {/* BoQ Section */}
      <BoQ
        projectId={project.id}
        boq={boq}
        onUpdate={handleUpdateBoQ}
        darkMode={darkMode}
      />

      {/* Weekly Reports */}
      <Weekly
        projectId={project.id}
        reports={weeklyReports}
        boq={boq}
        onUpdate={handleUpdateReports}
        contractStartDate={project.startDate}
        contractEndDate={project.endDate}
        darkMode={darkMode}
      />

      {/* S-Curve */}
      <SCurve project={project} darkMode={darkMode} />
    </div>
  );
}
