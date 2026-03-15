import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Extended User type to include app-specific properties
export interface User extends Partial<SupabaseUser> {
    email: string;
    hasCompletedOnboarding: boolean;
    name?: string;
    avatar?: string;
    tenant_id?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: 'native' | 'microsoft', credentials?: { email?: string; password?: string }) => Promise<void>;
    logout: () => Promise<void>;
    completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                mapUser(session.user);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                mapUser(session.user);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const mapUser = async (supabaseUser: SupabaseUser) => {
        // Here you could fetch additional profile data from a 'profiles' table
        // For now, we'll store specific app flags in user_metadata
        const hasCompletedOnboarding = supabaseUser.user_metadata?.hasCompletedOnboarding ?? false;
        const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.user_name;
        const avatar = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.avatar;
        let tenant_id = supabaseUser.user_metadata?.tenant_id;

        // If tenant_id is missing from metadata, try to fetch it from the users table
        if (!tenant_id) {
            try {
                const { data } = await supabase
                    .from('users')
                    .select('tenant_id')
                    .eq('auth_id', supabaseUser.id)
                    .maybeSingle();

                if (data?.tenant_id) {
                    tenant_id = data.tenant_id;
                }
            } catch (err) {
                console.warn('Failed to fetch fallback tenant_id from users table:', err);
            }
        }

        setUser({
            ...supabaseUser,
            email: supabaseUser.email || '',
            hasCompletedOnboarding,
            name,
            avatar,
            tenant_id
        });
    };

    const login = async (provider: 'native' | 'microsoft', credentials?: { email?: string; password?: string }) => {
        setIsLoading(true);
        try {
            if (provider === 'microsoft') {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'azure',
                    options: {
                        scopes: 'email',
                        redirectTo: window.location.origin,
                    },
                });
                if (error) throw error;
            } else if (provider === 'native') {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required for native login');
                }
                const { error } = await supabase.auth.signInWithPassword({
                    email: credentials.email,
                    password: credentials.password,
                });
                // If sign in fails, try sign up (for development convenience, or handle separately if preferred)
                if (error && error.message.includes('Invalid login credentials')) {
                    throw error; // Let's strictly enforce login for now, or we could auto-signup
                } else if (error) {
                    throw error;
                }
            }
            toast.success('Successfully logged in');
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to login');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success('Logged out successfully');
        } catch (error: any) {
            console.error('Logout error:', error);
            toast.error(error.message || 'Failed to logout');
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = async () => {
        if (!user) return;

        try {
            const { error } = await supabase.auth.updateUser({
                data: { hasCompletedOnboarding: true }
            });

            if (error) throw error;

            // Optimistic update
            setUser(prev => prev ? { ...prev, hasCompletedOnboarding: true } : null);
            toast.success('Onboarding completed');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, completeOnboarding }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
