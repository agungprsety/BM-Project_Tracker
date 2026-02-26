import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Plus, LogOut } from 'lucide-react';
import { useAppStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, language, setLanguage } = useAppStore();
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'id' : 'en');
  };

  const isActive = (path: string) => location.pathname === path;



  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className={`p-4 mb-6 shadow-lg ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white' : 'bg-gradient-to-r from-blue-700 to-blue-800 text-white'}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/logo_small.png" alt="SigiMarga" className="h-9 w-auto" />
        </Link>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            to="/explore"
            className={`px-4 py-2 rounded-lg transition-colors ${isActive('/explore')
              ? (darkMode ? 'bg-gray-700' : 'bg-blue-900')
              : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700')
              }`}
          >
            {t('nav.explore')}
          </Link>

          <button
            onClick={toggleLanguage}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-bold ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            title="Toggle Language"
          >
            {language.toUpperCase()}
          </button>

          <button
            onClick={toggleDarkMode}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            title={darkMode ? t('nav.switchToLight') : t('nav.switchToDark')}
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
                {t('nav.dashboard')}
              </Link>

              <Link
                to="/projects/new"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> {t('nav.newProject')}
              </Link>

              <button
                onClick={handleSignOut}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${darkMode ? 'bg-red-900/60 hover:bg-red-800' : 'bg-red-600/80 hover:bg-red-700'}`}
              >
                <LogOut size={18} /> {t('nav.signOut')}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

