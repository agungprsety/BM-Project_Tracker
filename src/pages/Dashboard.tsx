import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useProjects } from '@/hooks/useProjects';
import { exportAllProjectsSummary } from '@/lib/exportPdf';
import { exportDashboardCsv } from '@/lib/exportCsv';
import { calculateProgress, calculateTimeProgress, getScheduleStatus, formatCurrency, formatLength, getDeadlineInfo, getDaysSinceLastReport, getReportStaleness } from '@/lib/utils';
import { DISTRICTS } from '@/data/districts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { MapPin, FileDown, FileSpreadsheet, Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter, AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const ITEMS_PER_PAGE = 10;

const BUCKETS = [
  { label: '0–25%', key: 'low', color: '#dc2626', min: 0, max: 25 },
  { label: '25–50%', key: 'mid', color: '#d97706', min: 25, max: 50 },
  { label: '50–75%', key: 'high', color: '#2563eb', min: 50, max: 75 },
  { label: '75–100%', key: 'done', color: '#16a34a', min: 75, max: 101 },
] as const;

type SortKey = 'name' | 'contractor' | 'supervisor' | 'progress' | 'value' | 'district' | 'subDistrict' | 'averageWidth' | 'length' | 'roadHierarchy' | 'schedule';
type SortDir = 'asc' | 'desc';

export default function Dashboard() {
  const navigate = useNavigate();
  const { darkMode } = useAppStore();
  const { data: projects = [], isLoading } = useProjects();
  const { t } = useTranslation();

  // State
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('progress');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [filterBucket, setFilterBucket] = useState<string | null>(null);
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSubDistrict, setFilterSubDistrict] = useState('');

  // Pre-compute progress and schedule for each project
  const enriched = useMemo(() =>
    projects.map((p) => {
      const physical = calculateProgress(p.boq || [], p.weeklyReports || []);
      const time = calculateTimeProgress(p.startDate, p.endDate);
      const daysSince = getDaysSinceLastReport(p.weeklyReports || []);
      return {
        ...p,
        _progress: physical,
        _timeProgress: time,
        _status: getScheduleStatus(physical, time),
        _deadline: getDeadlineInfo(p.startDate, p.endDate),
        _daysSinceReport: daysSince,
        _reportStaleness: getReportStaleness(daysSince, physical),
        _value: p.boq?.reduce((s, i) => s + (i.quantity * i.unitPrice), 0) || 0,
      };
    }),
    [projects]
  );

  // Summary stats
  const totalValue = enriched.reduce((s, p) => s + p._value, 0);
  const avgProgress = enriched.length > 0
    ? enriched.reduce((s, p) => s + p._progress, 0) / enriched.length
    : 0;
  const totalLength = enriched.reduce((s, p) => s + (p.length || 0), 0);
  const delayedCount = enriched.filter(p => p._status === 'delayed' || p._status === 'at-risk').length;
  const staleCount = enriched.filter(p => (p as any)._reportStaleness !== 'fresh').length;

  // Filtered projects (excluding bucket filter) - for the chart
  const projectsForChart = useMemo(() => {
    let list = [...enriched];

    // Text search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.contractor.toLowerCase().includes(q) ||
          p.supervisor.toLowerCase().includes(q)
      );
    }

    // District filter
    if (filterDistrict) {
      list = list.filter((p) => p.district === filterDistrict);
    }

    // Sub-district filter
    if (filterSubDistrict) {
      list = list.filter((p) => p.subDistrict === filterSubDistrict);
    }

    return list;
  }, [enriched, search, filterDistrict, filterSubDistrict]);

  // Distribution histogram data
  const distributionData = useMemo(() =>
    BUCKETS.map((b) => ({
      ...b,
      count: projectsForChart.filter((p) => p._progress >= b.min && p._progress < b.max).length,
    })),
    [projectsForChart]
  );

  // Derive sub-district options from selected filter district
  const filterSubDistrictOptions = useMemo(() => {
    if (!filterDistrict) return [];
    const d = DISTRICTS.find((d) => d.name === filterDistrict);
    return d ? d.subDistricts : [];
  }, [filterDistrict]);

  // Filtered + sorted projects
  const filtered = useMemo(() => {
    let list = [...projectsForChart];

    // Bucket filter
    if (filterBucket) {
      const bucket = BUCKETS.find((b) => b.key === filterBucket);
      if (bucket) {
        list = list.filter((p) => p._progress >= bucket.min && p._progress < bucket.max);
      }
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'contractor': cmp = a.contractor.localeCompare(b.contractor); break;
        case 'supervisor': cmp = a.supervisor.localeCompare(b.supervisor); break;
        case 'progress': cmp = a._progress - b._progress; break;
        case 'value': cmp = a._value - b._value; break;
        case 'district': cmp = (a.district || '').localeCompare(b.district || ''); break;
        case 'subDistrict': cmp = (a.subDistrict || '').localeCompare(b.subDistrict || ''); break;
        case 'averageWidth': cmp = (a.averageWidth || 0) - (b.averageWidth || 0); break;
        case 'length': cmp = (a.length || 0) - (b.length || 0); break;
        case 'roadHierarchy': cmp = (a.roadHierarchy || '').localeCompare(b.roadHierarchy || ''); break;
        case 'schedule': {
          const statusOrder = { 'ahead': 0, 'on-track': 1, 'at-risk': 2, 'delayed': 3 };
          cmp = statusOrder[a._status] - statusOrder[b._status];
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [projectsForChart, filterBucket, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasActiveFilters = filterBucket || filterDistrict || filterSubDistrict || search;

  const clearAllFilters = () => {
    setFilterBucket(null);
    setFilterDistrict('');
    setFilterSubDistrict('');
    setSearch('');
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const selectClass = `px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
    }`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {projects.length > 0 && (
        <div className="flex justify-end mb-4 gap-2">
          <Button variant="secondary" size="sm" onClick={() => exportDashboardCsv(projects)}>
            <FileSpreadsheet size={16} className="mr-2" /> Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportAllProjectsSummary(projects)}>
            <FileDown size={16} className="mr-2" /> Export PDF
          </Button>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card darkMode={darkMode}>
          <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('dashboard.totalProjects')}</p>
          <p className="text-3xl font-bold">{projects.length}</p>
        </Card>
        <Card darkMode={darkMode}>
          <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('dashboard.totalValue')}</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
        </Card>
        <Card darkMode={darkMode}>
          <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('dashboard.avgProgress')}</p>
          <p className="text-2xl font-bold text-green-600">{avgProgress.toFixed(1)}%</p>
        </Card>
        <Card darkMode={darkMode}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Schedule Monitoring</p>
              <p className={`text-2xl font-bold ${delayedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {delayedCount} At Risk
              </p>
              {staleCount > 0 && (
                <p className={`text-sm font-medium pt-1 mt-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} ${staleCount > 0 ? 'text-amber-500' : 'text-green-600'}`}>
                  {staleCount} Stale Reports
                </p>
              )}
            </div>
            <div className={`p-2 rounded-lg ${delayedCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
        </Card>
      </div>

      {projects.length === 0 ? (
        <Card darkMode={darkMode} className="text-center py-12">
          <p className={`text-lg mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No projects yet</p>
          <Button onClick={() => navigate('/projects/new')}>Create Your First Project</Button>
        </Card>
      ) : (
        <>
          {/* Distribution histogram */}
          <Card darkMode={darkMode} className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">{t('dashboard.progressDist')}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Click a bar to filter the table below
                </p>
              </div>
              {filterBucket && (
                <button
                  onClick={() => { setFilterBucket(null); setPage(1); }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filter ×
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={distributionData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 13, fill: darkMode ? '#9ca3af' : '#6b7280', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 13, fill: darkMode ? '#9ca3af' : '#6b7280', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  formatter={(value: number) => [value, t('dashboard.tooltip')]}
                  cursor={{ fill: darkMode ? '#374151' : '#f3f4f6', opacity: 0.4 }}
                  contentStyle={
                    darkMode
                      ? { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }
                      : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
                  }
                  itemStyle={{ color: darkMode ? '#e5e7eb' : '#111827', fontWeight: 600 }}
                  labelStyle={{ color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: '4px', fontWeight: 500 }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (filterBucket === data.key) {
                      setFilterBucket(null);
                    } else {
                      setFilterBucket(data.key);
                    }
                    setPage(1);
                  }}
                >
                  {distributionData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.color}
                      opacity={filterBucket && filterBucket !== entry.key ? 0.3 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Filterable project table */}
          <Card darkMode={darkMode}>
            <div className="flex flex-col gap-3 mb-4">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-semibold">
                  {t('dashboard.title')}
                  {filtered.length !== enriched.length && (
                    <span className={`text-sm font-normal ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({filtered.length} of {enriched.length})
                    </span>
                  )}
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder={t('dashboard.search')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-400'
                      }`}
                  />
                </div>
              </div>

              {/* Filter row */}
              <div className="flex flex-wrap items-center gap-3">
                <Filter size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                <select
                  value={filterDistrict}
                  onChange={(e) => { setFilterDistrict(e.target.value); setFilterSubDistrict(''); setPage(1); }}
                  className={selectClass}
                >
                  <option value="">{t('dashboard.allDistricts')}</option>
                  {DISTRICTS.map((d) => (
                    <option key={d.code} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <select
                  value={filterSubDistrict}
                  onChange={(e) => { setFilterSubDistrict(e.target.value); setPage(1); }}
                  className={selectClass}
                  disabled={!filterDistrict}
                >
                  <option value="">{t('dashboard.allSubDistricts')}</option>
                  {filterSubDistrictOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-auto"
                  >
                    Clear all filters ×
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '16%' }} />{/* Project Name */}
                  <col style={{ width: '14%' }} />{/* Contractor / Consultant */}
                  <col style={{ width: '12%' }} />{/* District / Sub-district */}
                  <col style={{ width: '7%' }} />{/* Width */}
                  <col style={{ width: '7%' }} />{/* Length */}
                  <col style={{ width: '8%' }} />{/* Road Class */}
                  <col style={{ width: '12%' }} />{/* Progress */}
                  <col style={{ width: '14%' }} />{/* Schedule */}
                  <col style={{ width: '10%' }} />{/* Value */}
                </colgroup>
                <thead>
                  <tr className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                    {([
                      ['name', t('dashboard.thProject')],
                      ['contractor', t('dashboard.thContractor')],
                      ['district', t('dashboard.thDistrict')],
                      ['averageWidth', t('dashboard.thAvgWidth')],
                      ['length', t('dashboard.thLength')],
                      ['roadHierarchy', t('dashboard.thHierarchy')],
                      ['progress', t('dashboard.thProgress')],
                      ['schedule', 'Schedule'],
                      ['value', t('dashboard.thValue')]
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <th
                        key={key}
                        className="px-2 py-2.5 text-left text-[11px] font-medium cursor-pointer select-none hover:text-blue-600 transition-colors truncate"
                        onClick={() => toggleSort(key)}
                      >
                        <span className="flex items-center gap-0.5">
                          <span className="truncate">{label}</span>
                          <ArrowUpDown size={10} className={`shrink-0 ${sortKey === key ? 'text-blue-500' : 'opacity-40'}`} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center">
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{t('dashboard.noProjects')}</p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((project) => (
                      <tr key={project.id} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors cursor-pointer`} onClick={() => navigate(`/projects/${project.id}`)}>
                        <td className="px-2 py-2.5">
                          <div className="font-medium text-sm truncate" title={project.name}>{project.name}</div>
                          {project.location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${project.location[0]},${project.location[1]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center text-[10px] mt-0.5 px-1 py-0.5 rounded transition-colors w-fit ${darkMode ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/40' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                            >
                              <MapPin size={9} className="mr-0.5" />
                              <span className="font-medium">Map</span>
                            </a>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="text-xs truncate" title={project.contractor}>{project.contractor}</div>
                          <div className={`text-[11px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={project.supervisor}>{project.supervisor}</div>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="text-xs truncate" title={project.district || undefined}>{project.district || <span className="opacity-40">-</span>}</div>
                          {project.subDistrict && <div className={`text-[11px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={project.subDistrict}>{project.subDistrict}</div>}
                        </td>
                        <td className="px-2 py-2.5 text-xs">{project.averageWidth ? `${project.averageWidth} m` : <span className="opacity-40">-</span>}</td>
                        <td className="px-2 py-2.5 text-xs">{project.length ? `${project.length} m` : <span className="opacity-40">-</span>}</td>
                        <td className="px-2 py-2.5 text-xs truncate" title={project.roadHierarchy || undefined}>{project.roadHierarchy || <span className="opacity-40">-</span>}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-14 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-1.5 shrink-0`}>
                              <div className={`${getProgressColor(project._progress)} h-1.5 rounded-full transition-all`} style={{ width: `${project._progress}%` }}></div>
                            </div>
                            <span className="text-[11px] font-medium whitespace-nowrap">{project._progress.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex flex-col items-start gap-0.5">
                            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${project._status === 'delayed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              project._status === 'at-risk' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                project._status === 'ahead' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                              {project._status === 'delayed' || project._status === 'at-risk' ? <AlertTriangle size={9} className="shrink-0" /> : <Clock size={9} className="shrink-0" />}
                              {project._status.replace('-', ' ')}
                            </div>
                            <span className={`text-[10px] font-medium whitespace-nowrap ${project._deadline.status === 'overdue' ? 'text-red-500' :
                              project._deadline.status === 'ending-soon' ? 'text-amber-500' :
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              {project._deadline.label}
                            </span>
                            {(project as any)._reportStaleness !== 'fresh' && (
                              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider whitespace-nowrap ${(project as any)._reportStaleness === 'critical'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                <AlertTriangle size={9} className="shrink-0" />
                                {(project as any)._daysSinceReport === Infinity ? t('staleness.noReports') : ((project as any)._reportStaleness === 'critical' ? t('staleness.critical', { days: (project as any)._daysSinceReport }) : t('staleness.stale', { days: (project as any)._daysSinceReport }))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-xs whitespace-nowrap">{formatCurrency(project._value)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className={`p-2 rounded-lg transition-colors ${currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : `${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className={`p-2 rounded-lg transition-colors ${currentPage >= totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
