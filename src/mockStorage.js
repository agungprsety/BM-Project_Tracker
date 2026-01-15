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
    boq: [
      {
        id: '1',
        description: 'Asphalt Concrete Wearing Course',
        quantity: 25000,
        unit: 'm²',
        unitPrice: 185000,
        total: 4625000000,
        completed: 12500
      },
      {
        id: '2',
        description: 'Base Course Aggregate',
        quantity: 18000,
        unit: 'm³',
        unitPrice: 275000,
        total: 4950000000,
        completed: 9500
      }
    ],
    weeklyReports: [
      {
        id: '101',
        weekNumber: 1,
        date: '2024-01-20',
        notes: 'Mobilization and site preparation completed',
        workItems: [
          { boqItemId: '1', qtyCompleted: 1500 },
          { boqItemId: '2', qtyCompleted: 2000 }
        ],
        weekProgress: 8.5,
        cumulativeProgress: 8.5
      },
      {
        id: '102',
        weekNumber: 2,
        date: '2024-01-27',
        notes: 'Earthworks and foundation preparation',
        workItems: [
          { boqItemId: '1', qtyCompleted: 3000 },
          { boqItemId: '2', qtyCompleted: 2500 }
        ],
        weekProgress: 12.3,
        cumulativeProgress: 20.8
      }
    ]
  };
  
  mockStorage.set('project:1', JSON.stringify(sampleProject));
}

window.storage = mockStorage;