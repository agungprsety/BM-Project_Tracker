import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useProject, useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { generateId } from '@/lib/utils';
import { DISTRICTS } from '@/data/districts';
import type { Project, WorkType, RoadHierarchy, MaintenanceType } from '@/types';
import { WorkType as WorkTypeEnum, RoadHierarchy as RoadHierarchyEnum, MaintenanceType as MaintenanceTypeEnum } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import MapPicker from '@/components/features/MapPicker';

interface FormData {
  name: string;
  contractor: string;
  supervisor: string;
  workType: WorkType;
  roadHierarchy: RoadHierarchy;
  maintenanceType: MaintenanceType;
  startDate: string;
  endDate: string;
  length: string;
  averageWidth: string;
  location: [number, number] | null;
  district: string;
  subDistrict: string;
}

const initialData: FormData = {
  name: '',
  contractor: '',
  supervisor: '',
  workType: WorkTypeEnum.FLEXIBLE_PAVEMENT,
  roadHierarchy: RoadHierarchyEnum.JAS,
  maintenanceType: MaintenanceTypeEnum.RECONSTRUCTION,
  startDate: '',
  endDate: '',
  length: '',
  averageWidth: '',
  location: null,
  district: '',
  subDistrict: '',
};

export default function ProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { darkMode } = useAppStore();

  const { data: existingProject } = useProject(id);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [initialized, setInitialized] = useState(false);

  // Derive sub-district options from selected district
  const subDistrictOptions = useMemo(() => {
    if (!formData.district) return [];
    const d = DISTRICTS.find((d) => d.name === formData.district);
    return d ? d.subDistricts.map((s) => ({ value: s, label: s })) : [];
  }, [formData.district]);

  // Pre-populate form when editing an existing project
  useEffect(() => {
    if (isEdit && existingProject && !initialized) {
      setFormData({
        name: existingProject.name,
        contractor: existingProject.contractor,
        supervisor: existingProject.supervisor,
        workType: existingProject.workType,
        roadHierarchy: existingProject.roadHierarchy,
        maintenanceType: existingProject.maintenanceType,
        startDate: existingProject.startDate,
        endDate: existingProject.endDate,
        length: String(existingProject.length),
        averageWidth: String(existingProject.averageWidth),
        location: existingProject.location,
        district: existingProject.district || '',
        subDistrict: existingProject.subDistrict || '',
      });
      setInitialized(true);
    }
  }, [isEdit, existingProject, initialized]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.contractor.trim()) newErrors.contractor = 'Contractor is required';
    if (!formData.supervisor.trim()) newErrors.supervisor = 'Supervisor is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.length || isNaN(Number(formData.length)) || Number(formData.length) <= 0) {
      newErrors.length = 'Length must be a positive number';
    }
    if (!formData.averageWidth || isNaN(Number(formData.averageWidth)) || Number(formData.averageWidth) <= 0) {
      newErrors.averageWidth = 'Average width must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const now = new Date().toISOString();

    if (isEdit && id) {
      updateMutation.mutate(
        {
          id,
          updates: {
            name: formData.name,
            contractor: formData.contractor,
            supervisor: formData.supervisor,
            workType: formData.workType,
            roadHierarchy: formData.roadHierarchy,
            maintenanceType: formData.maintenanceType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            length: Number(formData.length),
            averageWidth: Number(formData.averageWidth),
            location: formData.location,
            district: formData.district,
            subDistrict: formData.subDistrict,
          },
        },
        { onSuccess: () => navigate(`/projects/${id}`) }
      );
    } else {
      const projectData: Project = {
        id: generateId(),
        name: formData.name,
        contractor: formData.contractor,
        supervisor: formData.supervisor,
        contractPrice: '0',
        workType: formData.workType,
        roadHierarchy: formData.roadHierarchy,
        maintenanceType: formData.maintenanceType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        length: Number(formData.length),
        averageWidth: Number(formData.averageWidth),
        location: formData.location,
        district: formData.district,
        subDistrict: formData.subDistrict,
        boq: [],
        weeklyReports: [],
        photos: [],
        createdAt: now,
        updatedAt: now,
      };

      createMutation.mutate(projectData, {
        onSuccess: () => navigate('/dashboard'),
      });
    }
  };

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDistrictChange = (district: string) => {
    setFormData((prev) => ({ ...prev, district, subDistrict: '' }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const districtOptions = [
    { value: '', label: '-- Select District --' },
    ...DISTRICTS.map((d) => ({ value: d.name, label: `${d.name} (${d.code})` })),
  ];

  const subDistrictSelectOptions = [
    { value: '', label: formData.district ? '-- Select Sub-district --' : '-- Select district first --' },
    ...subDistrictOptions,
  ];

  const workTypeOptions = [
    { value: WorkTypeEnum.RIGID_PAVEMENT, label: 'Rigid Pavement' },
    { value: WorkTypeEnum.FLEXIBLE_PAVEMENT, label: 'Flexible Pavement' },
    { value: WorkTypeEnum.COMBINATION, label: 'Combination' },
    { value: WorkTypeEnum.OTHER, label: 'Other' },
  ];

  const roadHierarchyOptions = [
    { value: RoadHierarchyEnum.JAS, label: 'JAS' },
    { value: RoadHierarchyEnum.JKS, label: 'JKS' },
    { value: RoadHierarchyEnum.JLS, label: 'JLS' },
    { value: RoadHierarchyEnum.JLING_S, label: 'Jling-S' },
    { value: RoadHierarchyEnum.JLING_KOTA, label: 'J-ling Kota' },
  ];

  const maintenanceTypeOptions = [
    { value: MaintenanceTypeEnum.RECONSTRUCTION, label: 'Reconstruction' },
    { value: MaintenanceTypeEnum.REHABILITATION, label: 'Rehabilitation' },
    { value: MaintenanceTypeEnum.PERIODIC_REHABILITATION, label: 'Periodic Rehabilitation' },
    { value: MaintenanceTypeEnum.ROUTINE_MAINTENANCE, label: 'Routine Maintenance' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card darkMode={darkMode}>
        <h2 className={`text-2xl font-bold mb-6 border-b pb-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {isEdit ? 'Edit Project' : 'Create New Project'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Project Name *"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="Enter project name"
          />

          <Input
            label="Contractor *"
            value={formData.contractor}
            onChange={(e) => handleChange('contractor', e.target.value)}
            error={errors.contractor}
            placeholder="Enter contractor name"
          />

          <Input
            label="Supervisor *"
            value={formData.supervisor}
            onChange={(e) => handleChange('supervisor', e.target.value)}
            error={errors.supervisor}
            placeholder="Enter supervisor name"
          />

          <Input
            label="Length (meters) *"
            type="number"
            value={formData.length}
            onChange={(e) => handleChange('length', e.target.value)}
            error={errors.length}
            placeholder="Enter road length"
            min="0"
            step="0.01"
          />

          <Input
            label="Average Width (meters) *"
            type="number"
            value={formData.averageWidth}
            onChange={(e) => handleChange('averageWidth', e.target.value)}
            error={errors.averageWidth}
            placeholder="Enter average width"
            min="0"
            step="0.01"
          />

          <Select
            label="Work Type"
            value={formData.workType}
            onChange={(e) => handleChange('workType', e.target.value as WorkType)}
            options={workTypeOptions}
          />

          <Select
            label="Road Hierarchy"
            value={formData.roadHierarchy}
            onChange={(e) => handleChange('roadHierarchy', e.target.value as RoadHierarchy)}
            options={roadHierarchyOptions}
          />

          <Select
            label="Maintenance Type"
            value={formData.maintenanceType}
            onChange={(e) => handleChange('maintenanceType', e.target.value as MaintenanceType)}
            options={maintenanceTypeOptions}
          />

          <Select
            label="District (Kecamatan)"
            value={formData.district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            options={districtOptions}
          />

          <Select
            label="Sub-district (Kelurahan)"
            value={formData.subDistrict}
            onChange={(e) => handleChange('subDistrict', e.target.value)}
            options={subDistrictSelectOptions}
            disabled={!formData.district}
          />

          <Input
            label="Start Date *"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            error={errors.startDate}
          />

          <Input
            label="End Date *"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            error={errors.endDate}
            min={formData.startDate}
          />
        </div>

        <div className="mt-6">
          <MapPicker
            position={formData.location}
            onChange={(loc) => handleChange('location', loc)}
            darkMode={darkMode}
          />
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
          <Button onClick={handleSubmit} isLoading={isSaving}>
            {isEdit ? 'Update Project' : 'Create Project'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
