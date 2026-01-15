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
  mockStorage.set('project:1', JSON.stringify({
    id: '1',
    name: 'Sample Highway Project',
    contractor: 'PT Jaya Konstruksi',
    supervisor: 'Ir. Budi Santoso',
    contractPrice: 5000000000,
    workType: 'flexible-pavement',
    roadHierarchy: 'JAS',
    maintenanceType: 'reconstruction',
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    boq: [
      {
        id: '1',
        description: 'Asphalt Concrete Wearing Course',
        quantity: 10000,
        unit: 'm²',
        unitPrice: 150000,
        total: 1500000000,
        completed: 3500
      },
      {
        id: '2',
        description: 'Base Course Aggregate',
        quantity: 12000,
        unit: 'm³',
        unitPrice: 250000,
        total: 3000000000,
        completed: 8000
      }
    ],
    weeklyReports: [
      {
        id: '101',
        weekNumber: 1,
        date: '2024-01-20',
        notes: 'Mobilization and site preparation',
        workItems: [
          { boqItemId: '1', qtyCompleted: 500 },
          { boqItemId: '2', qtyCompleted: 1000 }
        ],
        weekProgress: 5.25,
        cumulativeProgress: 5.25
      },
      {
        id: '102',
        weekNumber: 2,
        date: '2024-01-27',
        notes: 'Earthworks and foundation',
        workItems: [
          { boqItemId: '1', qtyCompleted: 1000 },
          { boqItemId: '2', qtyCompleted: 2000 }
        ],
        weekProgress: 7.5,
        cumulativeProgress: 12.75
      }
    ]
  }));
}

window.storage = mockStorage;