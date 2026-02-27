import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    nickname: string | null;
    isApproved: boolean;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, nickname: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const isSupabaseConfigured = supabaseUrl.length > 0;

function extractNickname(user: User | null): string | null {
    return user?.user_metadata?.nickname ?? null;
}

async function fetchProfileFlags(userId: string): Promise<{ isApproved: boolean; isAdmin: boolean }> {
    const { data } = await supabase
        .from('profiles')
        .select('is_approved, is_admin')
        .eq('id', userId)
        .single();

    return {
        isApproved: data?.is_approved ?? false,
        isAdmin: data?.is_admin ?? false,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [nickname, setNickname] = useState<string | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const updateProfileFlags = async (currentUser: User | null) => {
        if (currentUser) {
            const flags = await fetchProfileFlags(currentUser.id);
            setIsApproved(flags.isApproved);
            setIsAdmin(flags.isAdmin);
        } else {
            setIsApproved(false);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setNickname(extractNickname(currentUser));

            if (currentUser) {
                const flags = await fetchProfileFlags(currentUser.id);
                setIsApproved(flags.isApproved);
                setIsAdmin(flags.isAdmin);

                // Trap unapproved sessions on fresh load
                if (!flags.isApproved) {
                    await supabase.auth.signOut();
                }
            } else {
                setIsApproved(false);
                setIsAdmin(false);
            }

            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setNickname(extractNickname(currentUser));

                if (currentUser) {
                    const flags = await fetchProfileFlags(currentUser.id);
                    setIsApproved(flags.isApproved);
                    setIsAdmin(flags.isAdmin);

                    // Prevent auto-login for newly registered or unapproved users
                    if (_event === 'SIGNED_IN' && !flags.isApproved) {
                        await supabase.auth.signOut();
                    }
                } else {
                    setIsApproved(false);
                    setIsAdmin(false);
                }

                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
            return { error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.') };
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error as Error | null };

        // Check approval status
        if (data.user) {
            const flags = await fetchProfileFlags(data.user.id);
            if (!flags.isApproved) {
                await supabase.auth.signOut();
                return { error: new Error('ACCOUNT_NOT_APPROVED') };
            }
            setIsApproved(flags.isApproved);
            setIsAdmin(flags.isAdmin);
        }

        return { error: null };
    };

    const signUp = async (email: string, password: string, nickname: string) => {
        if (!isSupabaseConfigured) {
            return { error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.') };
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nickname } },
        });

        if (error) return { error: error as Error | null };

        // After signup, sign the user out so they can't access until approved
        if (data.user) {
            await supabase.auth.signOut();
        }

        return { error: null };
    };

    const signOut = async () => {
        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, nickname, isApproved, isAdmin, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
