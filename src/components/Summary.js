import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, MapPin } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';
import { formatCurrency, formatDate, formatLength } from '../utils';

const Summary = React.memo(({ 
  projects, 
  loading, 
  error, 
  getProgress, 
  onViewDetail,
  onEditProject,
  onReload,
  darkMode 
}) => {
  const totalValue = useMemo(() => 
    projects.reduce((s, p) => s + Number(p.contractPrice || 0), 0), 
    [projects]
  );
  
  const avgProgress = useMemo(() => 
    projects.length > 0 
      ? projects.reduce((s, p) => s + getProgress(p), 0) / projects.length 
      : 0,
    [projects, getProgress]
  );

  const totalLength = useMemo(() => 
    projects.reduce((s, p) => s + (p.length || 0), 0),
    [projects]
  );

  const chartData = useMemo(() => 
    projects.map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
      progress: getProgress(p),
      value: Number(p.contractPrice || 0)
    })),
    [projects, getProgress]
  );

  const projectsByProgress = useMemo(() => 
    [...projects].sort((a, b) => getProgress(b) - getProgress(a)),
    [projects, getProgress]
  );

  const handleReload = useCallback(() => {
    if (onReload) onReload();
  }, [onReload]);

  const bgClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  const cardBgClass = darkMode ? 'from-gray-800 to-gray-900 border-gray-700' : 'from-white to-gray-50 border-gray-100';
  const tableHeaderClass = darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500';
  const tableRowClass = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-600'}`}>
          <p>{error}</p>
          <button
            onClick={handleReload}
            className={`mt-2 text-sm ${darkMode ? 'text-red-300 underline' : 'text-red-700 underline'}`}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton darkMode={darkMode} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 border ${cardBgClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Projects</p>
                  <p className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mt-2`}>{projects.length}</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-100'}`}>
                  <BarChart3 className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={28} />
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 border ${cardBgClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Contract Value</p>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mt-2`}>{formatCurrency(totalValue)}</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-emerald-100'}`}>
                  <div className={darkMode ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold'}>IDR</div>
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 border ${cardBgClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Length</p>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mt-2`}>{formatLength(totalLength)}</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-amber-100'}`}>
                  <div className={darkMode ? 'text-amber-400 font-bold' : 'text-amber-600 font-bold'}>m</div>
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 border ${cardBgClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Progress</p>
                  <p className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mt-2`}>{avgProgress.toFixed(1)}%</p>
                </div>
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={darkMode ? 'text-amber-400 font-bold' : 'text-amber-600 font-bold'}>{avgProgress.toFixed(0)}%</div>
                  </div>
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className={darkMode ? 'text-gray-700' : 'text-amber-200'}
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={175.93}
                      strokeDashoffset={175.93 * (1 - avgProgress / 100)}
                      className={darkMode ? 'text-amber-500' : 'text-amber-600'}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {projects.length > 0 && (
            <div className={`rounded-xl shadow-lg p-6 mb-8 ${bgClass}`}>
              <h2 className="text-xl font-bold mb-4">Progress Overview</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 12 }}
                      stroke={darkMode ? "#9CA3AF" : "#374151"}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      label={{ 
                        value: 'Progress (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10,
                        style: { textAnchor: 'middle', fill: darkMode ? '#9CA3AF' : '#374151' }
                      }}
                      tick={{ fontSize: 12 }}
                      stroke={darkMode ? "#9CA3AF" : "#374151"}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Progress']}
                      labelStyle={{ fontWeight: 'bold' }}
                      contentStyle={{ 
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: darkMode ? '#1F2937' : 'white',
                        color: darkMode ? 'white' : '#374151',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="progress" 
                      name="Progress" 
                      fill={darkMode ? "#3B82F6" : "#3b82f6"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className={`rounded-xl shadow-lg overflow-hidden ${bgClass}`}>
            <div className={`px-6 py-4 border-b ${borderClass} ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-gray-50 to-white'}`}>
              <h2 className="text-xl font-bold">All Projects</h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{projects.length} project(s) found</p>
            </div>
            
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <div className={darkMode ? 'text-gray-500 mb-4' : 'text-gray-400 mb-4'}>
                  <BarChart3 size={64} className="mx-auto" />
                </div>
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No projects yet</h3>
                <p className={darkMode ? 'text-gray-500 mb-6' : 'text-gray-500 mb-6'}>Get started by creating your first project</p>
                <button
                  onClick={() => onViewDetail && onViewDetail(null)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={tableHeaderClass}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Length</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Contractor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderClass}`}>
                    {projectsByProgress.map(p => (
                      <tr key={p.id} className={`transition-colors ${tableRowClass}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium">{p.name}</div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{p.workType?.replace('-', ' ') || ''}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Photos: {p.photos?.length || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{formatLength(p.length)}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {p.averageWidth ? `Width: ${p.averageWidth} m` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {p.location ? (
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin size={12} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                  {p.location[0].toFixed(4)}, {p.location[1].toFixed(4)}
                                </span>
                              </div>
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                GPS Coordinates
                              </div>
                            </div>
                          ) : (
                            <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>No location</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{p.contractor}</div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{p.supervisor}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>{formatDate(p.startDate)}</div>
                          <div className={darkMode ? 'text-gray-500' : 'text-gray-400'}>to</div>
                          <div>{formatDate(p.endDate)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">{formatCurrency(p.contractPrice)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-xs">
                              <div className={darkMode ? 'bg-gray-700' : 'bg-gray-200'} style={{ height: '10px', borderRadius: '9999px' }}>
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${getProgress(p)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="font-bold min-w-[60px] text-right">
                              {getProgress(p).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onViewDetail && onViewDetail(p)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            >
                              View
                            </button>
                            <button
                              onClick={() => onEditProject && onEditProject(p)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-amber-900/50 text-amber-300 hover:bg-amber-900' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

Summary.displayName = 'Summary';

export default Summary;
