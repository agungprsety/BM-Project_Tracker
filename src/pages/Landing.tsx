import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowRight,
    BarChart3,
    Map,
    FileText,
    Globe,
    ShieldCheck,
    Zap,
    Smartphone,
    Lock,
    ChevronRight,
} from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();
    const { darkMode } = useAppStore();
    const { user } = useAuth();

    const dm = darkMode;

    return (
        <div className="font-sans -mt-6">

            {/* ─── SECTION 1: HERO ────────────────────────────────── */}
            <section className="relative overflow-hidden">
                {/* Background Gradient Blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 ${dm ? 'bg-blue-600' : 'bg-blue-400'}`} />
                    <div className={`absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-15 ${dm ? 'bg-indigo-600' : 'bg-indigo-300'}`} />
                </div>

                <div className="relative max-w-5xl mx-auto text-center py-24 md:py-36 px-4">
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-8 ${dm ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                        </span>
                        Bina Marga Kota Jambi
                    </div>

                    <h1 className={`text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 ${dm ? 'text-white' : 'text-gray-900'}`}>
                        Digital Intelligence for{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
                            Urban Infrastructure
                        </span>
                    </h1>

                    <p className={`text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                        SigiMarga is the professional monitoring ecosystem for Bina Marga Kota Jambi. Trace every kilometer of progress with real-time geospatial tracking, automated S-Curves, and audit-ready documentation.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate(user ? '/dashboard' : '/login')}
                            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Launch Staff Dashboard
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/explore')}
                            className={`group inline-flex items-center gap-2 px-8 py-4 font-semibold text-lg rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 ${dm ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800/50' : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}
                        >
                            Explore Public Projects
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ─── SECTION 2: FEATURES BENTO GRID ─────────────────── */}
            <section className={`py-20 md:py-28 ${dm ? 'bg-gray-900/50' : 'bg-white'}`}>
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>
                            Purpose-Built for Engineers
                        </p>
                        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>
                            Features That Save Hours, Not Minutes
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className={`group p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dm ? 'bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700 hover:border-blue-600/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-300'}`}>
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 ${dm ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                <BarChart3 className="w-7 h-7" />
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>
                                Automated Engineering Analytics
                            </h3>
                            <p className={`leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                Stop fighting with Excel formulas. Upload your Bill of Quantities (BoQ) and let SigiMarga generate real-time S-Curves and financial absorption charts automatically.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className={`group p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dm ? 'bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700 hover:border-emerald-600/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-emerald-300'}`}>
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 ${dm ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                <Map className="w-7 h-7" />
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>
                                Geospatial Command Center
                            </h3>
                            <p className={`leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                Visualize your city's growth. Our integrated Leaflet GIS allows you to pin projects, monitor regional distribution, and verify site conditions with GPS-tagged photo evidence.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className={`group p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dm ? 'bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700 hover:border-purple-600/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-purple-300'}`}>
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 ${dm ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                                <FileText className="w-7 h-7" />
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>
                                One-Click Audit Reports
                            </h3>
                            <p className={`leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                Go from data to document in seconds. Export professional, branded PDF summaries for portfolio reviews or detailed individual project reports—formatted and ready for stakeholders.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── SECTION 3: DUAL-ENGINE TRANSPARENCY ──────────── */}
            <section className={`py-20 md:py-28 ${dm ? '' : 'bg-gray-50'}`}>
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${dm ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Dual-Engine Architecture
                        </p>
                        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>
                            Transparency Meets Security
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Public Explore */}
                        <div className={`relative p-10 rounded-2xl border overflow-hidden ${dm ? 'bg-gradient-to-br from-emerald-950/40 to-gray-900 border-emerald-800/50' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'}`}>
                            <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
                                <Globe className="w-full h-full" />
                            </div>
                            <div className="relative">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 ${dm ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <Globe className="w-3 h-3" /> Public Explore
                                </div>
                                <h3 className={`text-2xl font-extrabold mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>
                                    Radical Transparency
                                </h3>
                                <p className={`leading-relaxed text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Give the citizens of Kota Jambi a front-row seat to progress. A read-only dashboard allowing anyone to track road improvements, view site photos, and see where their tax Rupiahs are at work. No login, no friction.
                                </p>
                                <button
                                    onClick={() => navigate('/explore')}
                                    className={`mt-6 inline-flex items-center gap-2 font-semibold transition-colors ${dm ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                                >
                                    Browse Public Dashboard <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Staff Portal */}
                        <div className={`relative p-10 rounded-2xl border overflow-hidden ${dm ? 'bg-gradient-to-br from-blue-950/40 to-gray-900 border-blue-800/50' : 'bg-gradient-to-br from-blue-50 to-white border-blue-200'}`}>
                            <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
                                <ShieldCheck className="w-full h-full" />
                            </div>
                            <div className="relative">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 ${dm ? 'bg-blue-900/60 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                    <ShieldCheck className="w-3 h-3" /> Staff Portal
                                </div>
                                <h3 className={`text-2xl font-extrabold mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>
                                    Secure Field Management
                                </h3>
                                <p className={`leading-relaxed text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                    A high-performance workspace for authorized personnel. Manage contractors, update weekly work logs, and oversee the entire project lifecycle with Supabase-powered security and real-time data syncing.
                                </p>
                                <button
                                    onClick={() => navigate(user ? '/dashboard' : '/login')}
                                    className={`mt-6 inline-flex items-center gap-2 font-semibold transition-colors ${dm ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                >
                                    {user ? 'Go to Dashboard' : 'Sign In to Portal'} <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── SECTION 4: TECHNICAL SPECS ──────────────────── */}
            <section className={`py-20 md:py-28 ${dm ? 'bg-gray-900/50' : 'bg-white'}`}>
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                            Under the Hood
                        </p>
                        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>
                            Enterprise-Grade Infrastructure
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 ${dm ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
                                Real-Time Architecture
                            </h3>
                            <p className={`text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                Powered by Supabase and React Query for instant updates across all devices. No refresh needed.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 ${dm ? 'bg-teal-900/40 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>
                                <Smartphone className="w-8 h-8" />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
                                Built for the Field
                            </h3>
                            <p className={`text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                Responsive design and Supabase Storage integration allow inspectors to upload site photos directly from their mobile browsers.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 ${dm ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>
                                <Lock className="w-8 h-8" />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
                                Data Integrity
                            </h3>
                            <p className={`text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                State-of-the-art Row Level Security (RLS) ensures that public users see everything, but only verified staff can change anything.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── SECTION 5: FINAL CTA ───────────────────────── */}
            <section className="relative overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-10 ${dm ? 'bg-blue-500' : 'bg-blue-400'}`} />
                </div>
                <div className="relative max-w-3xl mx-auto text-center px-4">
                    <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6 ${dm ? 'text-white' : 'text-gray-900'}`}>
                        Better Roads. Better Data.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Better Jambi.
                        </span>
                    </h2>
                    <p className={`text-lg md:text-xl mb-10 leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                        Transition your department into the digital age. SigiMarga simplifies the complex so you can focus on building a more connected city.
                    </p>
                    <button
                        onClick={() => navigate(user ? '/dashboard' : '/login')}
                        className="group inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Get Started with SigiMarga
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

        </div>
    );
}
