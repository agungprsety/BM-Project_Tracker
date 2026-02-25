import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Plus, LogOut } from 'lucide-react';
import { useAppStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useAppStore();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;



  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className={`p-4 mb-6 shadow-lg ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white' : 'bg-gradient-to-r from-blue-700 to-blue-800 text-white'}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="SigiMarga" className="h-9 w-auto brightness-0 invert" />
        </Link>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            to="/explore"
            className={`px-4 py-2 rounded-lg transition-colors ${isActive('/explore')
              ? (darkMode ? 'bg-gray-700' : 'bg-blue-900')
              : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700')
              }`}
          >
            Explore
          </Link>

          <button
            onClick={toggleDarkMode}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg transition-colors ${isActive('/dashboard')
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

              <button
                onClick={handleSignOut}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${darkMode ? 'bg-red-900/60 hover:bg-red-800' : 'bg-red-600/80 hover:bg-red-700'}`}
              >
                <LogOut size={18} /> Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

