import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { LogIn, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const { darkMode } = useAppStore();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card darkMode={darkMode} className="w-full max-w-md p-8 md:p-10 shadow-2xl">
                <div className="text-center mb-8">
                    <img src="/sigi_margafull_transparent.png" alt="SigiMarga" className={`h-16 w-auto mx-auto mb-4 transition-all ${darkMode ? 'brightness-0 invert' : ''}`} />
                    <h1 className="text-2xl font-bold mb-2">{t('login.title')}</h1>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('login.subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${darkMode ? 'bg-red-900/40 text-red-300 border border-red-700/50' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('login.email')}
                        </label>
                        <Input
                            type="email"
                            placeholder={t('login.emailPh')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('login.password')}
                        </label>
                        <Input
                            type="password"
                            placeholder={t('login.passwordPh')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-medium shadow-lg"
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        {t('login.btn')}
                    </Button>
                </form>

                <div className="mt-6 text-center">
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
