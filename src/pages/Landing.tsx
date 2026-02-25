import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { ArrowRight, Activity, Shield, BarChart2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function Landing() {
    const navigate = useNavigate();
    const { darkMode } = useAppStore();

    const features = [
        {
            icon: <Activity className="w-6 h-6 text-blue-500" />,
            title: "Real-time Tracking",
            description: "Monitor project milestones, S-curves, and progress updates instantly."
        },
        {
            icon: <BarChart2 className="w-6 h-6 text-purple-500" />,
            title: "Detailed Analytics",
            description: "Financial summaries, BoQ completions, and timeline visualizations."
        },
        {
            icon: <Shield className="w-6 h-6 text-green-500" />,
            title: "Secure Access",
            description: "Public view-only links protect your data while keeping stakeholders informed."
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mb-12">
                <h1 className={`text-4xl md:text-6xl font-extrabold mb-6 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Simplify Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Project Tracking</span>
                </h1>
                <p className={`text-lg md:text-xl mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    The professional platform for managing construction projects, tracking progress, and communicating with stakeholders.
                </p>
            </div>

            {/* Main Interaction Card */}
            <Card darkMode={darkMode} className="w-full max-w-2xl p-8 md:p-12 mb-16 shadow-2xl border-t-4 border-t-blue-600">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Monitor Project Progress</h2>
                    <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Access our public directory to track infrastructure developments, road maintenance, and construction milestones across all districts.
                    </p>

                    <Button
                        onClick={() => navigate('/explore')}
                        className="h-14 px-10 text-xl font-bold shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                    >
                        Explore Projects <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                </div>

                <div className="relative flex items-center py-8">
                    <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                    <span className={`flex-shrink-0 mx-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Internal Access</span>
                    <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                </div>

                <div className="text-center">
                    <Button
                        variant="secondary"
                        className="w-full md:w-auto h-11 px-8 text-base font-medium border-2"
                        onClick={() => navigate('/login')}
                    >
                        Login for Staff &rarr;
                    </Button>
                </div>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                {features.map((feature, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'} backdrop-blur-sm text-center`}>
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
