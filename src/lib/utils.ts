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

export interface DeadlineInfo {
  daysRemaining: number;
  status: 'upcoming' | 'active' | 'ending-soon' | 'overdue';
  label: string;
}

export const getDeadlineInfo = (startDate: string, endDate: string): DeadlineInfo => {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (isNaN(start) || isNaN(end)) {
    return { daysRemaining: 0, status: 'active', label: '—' };
  }

  if (now < start) {
    const days = Math.ceil((start - now) / 86400000);
    return { daysRemaining: days, status: 'upcoming', label: `Starts in ${days}d` };
  }

  const daysLeft = Math.ceil((end - now) / 86400000);

  if (daysLeft < 0) {
    return { daysRemaining: daysLeft, status: 'overdue', label: `${Math.abs(daysLeft)}d overdue` };
  }
  if (daysLeft <= 14) {
    return { daysRemaining: daysLeft, status: 'ending-soon', label: `${daysLeft}d left` };
  }
  return { daysRemaining: daysLeft, status: 'active', label: `${daysLeft}d left` };
};

/**
 * Returns the number of days since the last weekly report was submitted.
 * Returns Infinity if there are no reports yet (project has no updates).
 */
export const getDaysSinceLastReport = (weeklyReports: { createdAt?: string; endDate: string }[]): number => {
  if (!weeklyReports || weeklyReports.length === 0) return Infinity;

  const latestDate = weeklyReports.reduce((latest, r) => {
    const d = new Date(r.createdAt || r.endDate).getTime();
    return d > latest ? d : latest;
  }, 0);

  const now = Date.now();
  return Math.floor((now - latestDate) / (1000 * 60 * 60 * 24));
};

/**
 * Returns staleness status based on days since last report.
 */
export const getReportStaleness = (
  daysSince: number,
  progress: number
): 'fresh' | 'stale' | 'critical' => {
  if (progress >= 100) return 'fresh';  // Completed projects don't count
  if (daysSince >= 14) return 'critical';
  if (daysSince >= 7) return 'stale';
  return 'fresh';
};

export const getRelativeTime = (dateString: string): string => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  if (isNaN(then) || diffMs < 0) return formatDate(dateString);

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateString);
};
