// Mock storage for testing
const mockStorage = {
  data: {},
  list: async (prefix) => {
    const keys = Object.keys(mockStorage.data)
      .filter(key => key.startsWith(prefix))
      .map(key => ({ key }));
    return { keys };
  },
  get: async (key) => {
    return { value: mockStorage.data[key] || null };
  },
  set: async (key, value) => {
    mockStorage.data[key] = value;
  },
  delete: async (key) => {
    delete mockStorage.data[key];
  }
};

// Initialize with sample data if empty
if (Object.keys(mockStorage.data).length === 0) {
  const sampleProject = {
    id: '1',
    name: 'Highway Reconstruction Project',
    contractor: 'PT Jaya Konstruksi Indonesia',
    supervisor: 'Ir. Budi Santoso, M.Eng',
    contractPrice: 15000000000,
    workType: 'flexible-pavement',
    roadHierarchy: 'JAS',
    maintenanceType: 'reconstruction',
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    boq: [],
    weeklyReports: []
  };
  
  mockStorage.set('project:1', JSON.stringify(sampleProject));
}

window.storage = mockStorage;