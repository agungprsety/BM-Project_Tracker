import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { Clock, LogOut } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PendingApproval() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { darkMode } = useAppStore();
    const { t } = useTranslation();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card darkMode={darkMode} className="w-full max-w-md p-8 md:p-10 shadow-2xl text-center">
                <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-full ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
                        <Clock size={48} className={darkMode ? 'text-amber-400' : 'text-amber-500'} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold mb-3">{t('pending.title')}</h1>
                <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('pending.message')}
                </p>

                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t('pending.hint')}
                    </p>
                </div>

                <Button
                    onClick={handleSignOut}
                    className="w-full h-11 text-base font-medium"
                    variant="secondary"
                >
                    <LogOut size={18} className="mr-2" />
                    {t('pending.signOut')}
                </Button>

                <div className="mt-4">
                    <button
                        onClick={() => navigate('/')}
                        className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                    >
                        &larr; {t('login.back')}
                    </button>
                </div>
            </Card>
        </div>
    );
}
