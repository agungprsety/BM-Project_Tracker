export const formatCurrency = (n: number): string => {
  if (!n) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatLength = (meters: number | undefined): string => {
  if (!meters) return '0 m';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(2)} m`;
};

export const formatArea = (sqMeters: number | undefined): string => {
  if (!sqMeters) return '0 m²';
  if (sqMeters >= 10000) {
    return `${(sqMeters / 10000).toFixed(2)} ha`;
  }
  return `${sqMeters.toFixed(2)} m²`;
};

export const generateId = (): string => {
  return crypto.randomUUID();
};

export const calculateBoQTotal = (boq: { quantity: number; unitPrice: number }[]): number => {
  if (!boq || !Array.isArray(boq)) return 0;
  return boq.reduce((total, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return total + quantity * unitPrice;
  }, 0);
};

/**
 * Build a map of boqItemId → total completed quantity by summing
 * across all weekly reports.
 */
export const getCompletedByItem = (
  weeklyReports: { itemProgress?: { boqItemId: string; quantity: number }[] }[]
): Record<string, number> => {
  const map: Record<string, number> = {};
  if (!weeklyReports) return map;
  for (const report of weeklyReports) {
    if (!report.itemProgress) continue;
    for (const ip of report.itemProgress) {
      map[ip.boqItemId] = (map[ip.boqItemId] || 0) + ip.quantity;
    }
  }
  return map;
};

/**
 * Calculate overall weighted progress from BoQ + weekly reports.
 * Progress = sum(completedQty * unitPrice) / sum(contractQty * unitPrice) * 100
 */
export const calculateProgress = (
  boq: { id?: string; quantity: number; unitPrice: number }[],
  weeklyReports?: { itemProgress?: { boqItemId: string; quantity: number }[] }[]
): number => {
  if (!boq || boq.length === 0) return 0;

  const totalValue = calculateBoQTotal(boq);
  if (totalValue === 0) return 0;

  const completedMap = getCompletedByItem(weeklyReports || []);

  const completedValue = boq.reduce((total, item) => {
    const completedQty = completedMap[item.id || ''] || 0;
    return total + completedQty * (item.unitPrice || 0);
  }, 0);

  return Math.min(100, (completedValue / totalValue) * 100);
};

/**
 * Calculate percentage of contract time elapsed.
 * (Today - Start) / (End - Start) * 100
 */
export const calculateTimeProgress = (startDate: string, endDate: string): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();

  if (isNaN(start) || isNaN(end)) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;

  const total = end - start;
  const elapsed = now - start;

  if (total <= 0) return 100;

  return Math.min(100, (elapsed / total) * 100);
};

/**
 * Determine if a project is significantly delayed.
 * A project is "At Risk" if Physical Progress < Time Progress - Threshold (e.g., 10%)
 */
export const getScheduleStatus = (physicalProgress: number, timeProgress: number): 'ahead' | 'on-track' | 'at-risk' | 'delayed' => {
  const slippage = physicalProgress - timeProgress;

  if (physicalProgress >= 100) return 'on-track'; // Completed
  if (slippage < -15) return 'delayed';
  if (slippage < -5) return 'at-risk';
  if (slippage > 5) return 'ahead';
  return 'on-track';
};
