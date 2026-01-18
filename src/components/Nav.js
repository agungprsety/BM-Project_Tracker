import React, { useCallback } from 'react';
import { Plus, Download, BarChart3, Moon, Sun } from 'lucide-react';

const Nav = React.memo(({ view, setView, projectsLength, exportData, darkMode, toggleDarkMode }) => {
  const handleSetViewSummary = useCallback(() => setView('summary'), [setView]);
  const handleSetViewAdd = useCallback(() => setView('add'), [setView]);

  return (
    <nav className={`p-4 mb-6 shadow-lg ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white' : 'bg-gradient-to-r from-blue-700 to-blue-800 text-white'}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 size={28} />
          <h1 className="text-2xl font-bold tracking-tight">BM Progress Tracker</h1>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button 
            onClick={toggleDarkMode}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={handleSetViewSummary} 
            className={`px-4 py-2 rounded-lg transition-colors ${view === 'summary' ? (darkMode ? 'bg-gray-700' : 'bg-blue-900') : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700')}`}
          >
            Dashboard
          </button>

          <button 
            onClick={handleSetViewAdd} 
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> New Project
          </button>

          <div className="flex gap-2">
            <button 
              onClick={exportData} 
              disabled={projectsLength === 0}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                darkMode ? 'bg-amber-700 hover:bg-amber-600' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Download size={18} /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
});

Nav.displayName = 'Nav';

export default Nav;
