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
