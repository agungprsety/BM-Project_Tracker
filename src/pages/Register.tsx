import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { UserPlus, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Register() {
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const { darkMode } = useAppStore();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (nickname.length < 3) {
            setError(t('register.nicknameTooShort'));
            return;
        }
        if (password.length < 6) {
            setError(t('register.passwordTooShort'));
            return;
        }

        setIsLoading(true);
        const { error } = await signUp(email, password, nickname);

        if (error) {
            // Detect common errors and show friendlier messages
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                setError(t('register.nicknameTaken'));
            } else {
                setError(error.message);
            }
            setIsLoading(false);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card darkMode={darkMode} className="w-full max-w-md p-8 md:p-10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/full_logo.png"
                            alt="SigiMarga"
                            className="h-16 md:h-20 w-auto transition-all"
                        />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{t('register.title')}</h1>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('register.subtitle')}
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
                            {t('register.nickname')}
                        </label>
                        <Input
                            type="text"
                            placeholder={t('register.nicknamePh')}
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                            required
                            className="h-11"
                            maxLength={24}
                        />
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('register.nicknameHint')}
                        </p>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('register.email')}
                        </label>
                        <Input
                            type="email"
                            placeholder={t('register.emailPh')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('register.password')}
                        </label>
                        <Input
                            type="password"
                            placeholder={t('register.passwordPh')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11"
                            minLength={6}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-medium shadow-lg"
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        <UserPlus size={18} className="mr-2" />
                        {t('register.btn')}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('register.hasAccount')}{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
                        >
                            {t('register.loginLink')}
                        </button>
                    </p>
                </div>

                <div className="mt-4 text-center">
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
