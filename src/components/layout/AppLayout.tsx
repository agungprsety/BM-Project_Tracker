import { Outlet } from 'react-router-dom';
import { useAppStore } from '@/store';
import Navbar from './Navbar';

export default function AppLayout() {
  const { darkMode } = useAppStore();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gradient-to-b from-gray-900 to-black text-white' : 'bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900'}`}>
      <Navbar />
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
      <footer className={`mt-12 pt-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
        <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
          BM Progress Tracker v2.0
        </p>
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          https://github.com/agungprsety
        </p>
      </footer>
    </div>
  );
}
