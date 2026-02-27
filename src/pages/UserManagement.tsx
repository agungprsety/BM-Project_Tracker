import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Shield, UserCheck, UserX, RefreshCw, ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ProfileRow {
    id: string;
    nickname: string;
    email: string;
    is_approved: boolean;
    is_admin: boolean;
    created_at: string;
}

export default function UserManagement() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const { darkMode } = useAppStore();
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState<ProfileRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, nickname, email, is_approved, is_admin, created_at')
            .order('created_at', { ascending: true });
        setProfiles(data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            navigate('/dashboard');
            return;
        }
        fetchProfiles();
    }, [isAdmin, navigate, fetchProfiles]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        await supabase.from('profiles').update({ is_approved: true }).eq('id', id);
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_approved: true } : p));
        setActionLoading(null);
    };

    const handleRevoke = async (id: string) => {
        setActionLoading(id);
        await supabase.from('profiles').update({ is_approved: false }).eq('id', id);
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_approved: false } : p));
        setActionLoading(null);
    };

    const pendingUsers = profiles.filter(p => !p.is_approved);
    const approvedUsers = profiles.filter(p => p.is_approved);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isAdmin) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield size={24} className="text-blue-500" />
                            {t('admin.title')}
                        </h1>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('admin.subtitle')}
                        </p>
                    </div>
                </div>
                <Button onClick={fetchProfiles} variant="secondary" className="flex items-center gap-2">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {t('admin.refresh')}
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : (
                <>
                    {/* Pending Approval Section */}
                    {pendingUsers.length > 0 && (
                        <Card darkMode={darkMode} className="p-5 mb-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                {t('admin.pendingSection')}
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                                    {pendingUsers.length}
                                </span>
                            </h2>
                            <div className="space-y-3">
                                {pendingUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{user.nickname}</span>
                                            </div>
                                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {user.email} · {formatDate(user.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                onClick={() => handleApprove(user.id)}
                                                className="flex items-center gap-1.5 text-xs px-3 py-1.5"
                                                disabled={actionLoading === user.id}
                                                isLoading={actionLoading === user.id}
                                            >
                                                <UserCheck size={14} />
                                                {t('admin.approve')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Approved Users Section */}
                    <Card darkMode={darkMode} className="p-5">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <UserCheck size={18} className="text-green-500" />
                            {t('admin.approvedSection')}
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                {approvedUsers.length}
                            </span>
                        </h2>
                        {approvedUsers.length === 0 ? (
                            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('admin.noApproved')}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {approvedUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-800/30' : 'bg-gray-50'}`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{user.nickname}</span>
                                                {user.is_admin && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {user.email} · {formatDate(user.created_at)}
                                            </p>
                                        </div>
                                        {!user.is_admin && (
                                            <Button
                                                onClick={() => handleRevoke(user.id)}
                                                variant="secondary"
                                                className="flex items-center gap-1.5 text-xs px-3 py-1.5"
                                                disabled={actionLoading === user.id}
                                                isLoading={actionLoading === user.id}
                                            >
                                                <UserX size={14} />
                                                {t('admin.revoke')}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}
