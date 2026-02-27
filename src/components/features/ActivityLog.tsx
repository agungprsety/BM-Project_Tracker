import { useMemo, useState } from 'react';
import type { Project } from '@/types';
import { getRelativeTime } from '@/lib/utils';
import { FileText, Image as ImageIcon, PlusCircle, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';

interface ActivityEvent {
    id: string;
    timestamp: string;
    type: 'created' | 'updated' | 'report' | 'photo';
    description: string;
    actor?: string;
    icon: JSX.Element;
    colorClass: string;
}

interface ActivityLogProps {
    project: Project;
    darkMode?: boolean;
}

export default function ActivityLog({ project, darkMode = false }: ActivityLogProps) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    const events = useMemo(() => {
        const list: ActivityEvent[] = [];

        // Project creation
        if (project.createdAt) {
            list.push({
                id: `created-${project.createdAt}`,
                timestamp: project.createdAt,
                type: 'created',
                description: t('activity.created'),
                actor: project.createdByNickname || 'system',
                icon: <PlusCircle size={14} />,
                colorClass: 'w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-2 border-white dark:border-gray-800'
            });
        }

        // Project modification (if clearly different timestamp from creation)
        if (project.updatedAt && project.updatedAt !== project.createdAt) {
            list.push({
                id: `updated-${project.updatedAt}`,
                timestamp: project.updatedAt,
                type: 'updated',
                description: t('activity.updated'),
                actor: project.updatedByNickname || project.createdByNickname,
                icon: <Edit2 size={14} />,
                colorClass: 'w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-2 border-white dark:border-gray-800'
            });
        }

        // Weekly reports
        (project.weeklyReports || []).forEach((wr) => {
            if (!wr.createdAt) return;
            list.push({
                id: `report-${wr.id}`,
                timestamp: wr.createdAt,
                type: 'report',
                description: t('activity.report', { week: wr.weekNumber }),
                icon: <FileText size={14} />,
                colorClass: 'w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-2 border-white dark:border-gray-800'
            });

            // Photos inside weekly reports
            (wr.photos || []).forEach((photo) => {
                if (!photo.createdAt) return;
                list.push({
                    id: `photo-${photo.id}`,
                    timestamp: photo.createdAt,
                    type: 'photo',
                    description: t('activity.reportPhoto', { week: wr.weekNumber }),
                    icon: <ImageIcon size={14} />,
                    colorClass: 'w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-2 border-white dark:border-gray-800'
                });
            });
        });

        // Main gallery photos
        (project.photos || []).forEach((photo) => {
            if (!photo.createdAt) return;
            list.push({
                id: `photo-${photo.id}`,
                timestamp: photo.createdAt,
                type: 'photo',
                description: photo.caption ? t('activity.photoCaption', { caption: photo.caption }) : t('activity.photo'),
                icon: <ImageIcon size={14} />,
                colorClass: 'w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-2 border-white dark:border-gray-800'
            });
        });

        // Sort descending
        return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [project, t]);

    const visibleEvents = expanded ? events : events.slice(0, 5);

    if (events.length === 0) return null;

    return (
        <Card darkMode={darkMode}>
            <h3 className="text-xl font-bold mb-6">{t('activity.title')}</h3>
            <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-6">
                {visibleEvents.map((evt) => (
                    <div key={evt.id} className="relative">
                        <div className={`absolute -left-[37px] ${evt.colorClass}`}>
                            {evt.icon}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 ml-2">
                            <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                    {evt.description}
                                </p>
                                {evt.actor && (
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('activity.by')} <span className="font-semibold text-blue-500">@{evt.actor}</span>
                                    </p>
                                )}
                            </div>
                            <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} whitespace-nowrap`}>
                                {getRelativeTime(evt.timestamp)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {events.length > 5 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`mt-6 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                >
                    {expanded ? (
                        <>
                            {t('activity.showLess')} <ChevronUp size={16} />
                        </>
                    ) : (
                        <>
                            {t('activity.showAll', { count: events.length - 5 })} <ChevronDown size={16} />
                        </>
                    )}
                </button>
            )}
        </Card>
    );
}
