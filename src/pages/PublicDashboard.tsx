import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useProjects } from '@/hooks/useProjects';
import { calculateProgress, formatCurrency, formatLength } from '@/lib/utils';
import { DISTRICTS } from '@/data/districts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin, Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Eye } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const ITEMS_PER_PAGE = 10;

const BUCKETS = [
    { label: '0–25%', key: 'low', color: '#dc2626', min: 0, max: 25 },
    { label: '25–50%', key: 'mid', color: '#d97706', min: 25, max: 50 },
    { label: '50–75%', key: 'high', color: '#2563eb', min: 50, max: 75 },
    { label: '75–100%', key: 'done', color: '#16a34a', min: 75, max: 101 },
] as const;

type SortKey = 'name' | 'contractor' | 'supervisor' | 'progress' | 'value' | 'district' | 'subDistrict' | 'averageWidth' | 'length' | 'roadHierarchy';
type SortDir = 'asc' | 'desc';

export default function PublicDashboard() {
    const navigate = useNavigate();
    const { darkMode } = useAppStore();
    const { data: projects = [], isLoading } = useProjects();

    // State
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('progress');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [page, setPage] = useState(1);
    const [filterBucket, setFilterBucket] = useState<string | null>(null);
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterSubDistrict, setFilterSubDistrict] = useState('');

    // Pre-compute progress for each project
    const enriched = useMemo(() =>
        projects.map((p) => ({
            ...p,
            _progress: calculateProgress(p.boq || [], p.weeklyReports || []),
            _value: p.boq?.reduce((s, i) => s + (i.quantity * i.unitPrice), 0) || 0,
        })),
        [projects]
    );

    // Summary stats
    const totalValue = enriched.reduce((s, p) => s + p._value, 0);
    const avgProgress = enriched.length > 0
        ? enriched.reduce((s, p) => s + p._progress, 0) / enriched.length
        : 0;
    const totalLength = enriched.reduce((s, p) => s + (p.length || 0), 0);

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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Read-Only Banner */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${darkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                <Eye size={16} />
                <span>You are viewing the <strong>public project directory</strong>. Select a project to see detailed progress.</span>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card darkMode={darkMode}>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Projects</p>
                    <p className="text-3xl font-bold">{projects.length}</p>
                </Card>
                <Card darkMode={darkMode}>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Investment</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
                </Card>
                <Card darkMode={darkMode}>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Progress</p>
                    <p className="text-2xl font-bold text-green-600">{avgProgress.toFixed(1)}%</p>
                </Card>
                <Card darkMode={darkMode}>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Road Infrastructure</p>
                    <p className="text-2xl font-bold text-purple-600">{formatLength(totalLength)}</p>
                </Card>
            </div>

            {projects.length === 0 ? (
                <Card darkMode={darkMode} className="text-center py-12">
                    <p className={`text-lg mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No public projects found.</p>
                </Card>
            ) : (
                <>
                    {/* Distribution histogram */}
                    <Card darkMode={darkMode}>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">Progress Distribution</h3>
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
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={distributionData} margin={{ left: 15, right: 10, top: 10, bottom: 20 }}>
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} label={{ value: 'Progress (%)', position: 'insideBottom', offset: -15, fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: 'No. of Projects', angle: -90, position: 'insideLeft', offset: -5, fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: number) => [`${value} projects`, 'Count']}
                                    contentStyle={darkMode ? { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' } : { borderRadius: '8px' }}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[4, 4, 0, 0]}
                                    cursor="pointer"
                                    onClick={(data: { key: string }) => {
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <h3 className="text-lg font-semibold">Project Directory</h3>
                                <div className="relative w-full sm:w-64">
                                    <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                    <input
                                        type="text"
                                        placeholder="Search projects..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-400'
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Filter size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                                <select
                                    value={filterDistrict}
                                    onChange={(e) => { setFilterDistrict(e.target.value); setFilterSubDistrict(''); setPage(1); }}
                                    className={selectClass}
                                >
                                    <option value="">All Districts</option>
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
                                    <option value="">All Sub-districts</option>
                                    {filterSubDistrictOptions.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-auto"
                                    >
                                        Clear all ×
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                                        <th className="px-3 py-3 text-left text-xs font-medium cursor-pointer" onClick={() => toggleSort('name')}>Project</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium cursor-pointer" onClick={() => toggleSort('district')}>District</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium cursor-pointer" onClick={() => toggleSort('averageWidth')}>Avg Width</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium cursor-pointer" onClick={() => toggleSort('length')}>Length</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium cursor-pointer" onClick={() => toggleSort('roadHierarchy')}>Road Hierarchy</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium cursor-pointer" onClick={() => toggleSort('progress')}>Progress</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paged.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                                                No projects found matching the criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        paged.map((project) => (
                                            <tr key={project.id} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>
                                                <td className="px-3 py-3">
                                                    <div className="font-medium">{project.name}</div>
                                                </td>
                                                <td className="px-3 py-3 text-sm">{project.district || '-'}</td>
                                                <td className="px-3 py-3 text-sm">{project.averageWidth ? `${project.averageWidth} m` : '-'}</td>
                                                <td className="px-3 py-3 text-sm">{project.length ? `${project.length} m` : '-'}</td>
                                                <td className="px-3 py-3 text-sm">{project.roadHierarchy || '-'}</td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-16 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-1.5`}>
                                                            <div className={`${getProgressColor(project._progress)} h-1.5 rounded-full`} style={{ width: `${project._progress}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium">{project._progress.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Button size="sm" variant="secondary" onClick={() => navigate(`/view/${project.id}`)}>
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="text-sm">{page} of {totalPages}</span>
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        <ChevronRight size={20} />
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
