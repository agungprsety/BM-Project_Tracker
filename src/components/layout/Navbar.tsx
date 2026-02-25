import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Moon, Sun, Plus } from 'lucide-react';
import { useAppStore } from '@/store';

export default function Navbar() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useAppStore();

  const isActive = (path: string) => location.pathname === path;

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

          <Link
            to="/"
            className={`px-4 py-2 rounded-lg transition-colors ${
              isActive('/') 
                ? (darkMode ? 'bg-gray-700' : 'bg-blue-900') 
                : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700')
            }`}
          >
            Dashboard
          </Link>

          <Link
            to="/projects/new"
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> New Project
          </Link>
        </div>
      </div>
    </nav>
  );
}
