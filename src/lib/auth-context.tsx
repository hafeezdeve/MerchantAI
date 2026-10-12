import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Business } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    setProfile(prof as Profile | null);

    if (prof) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', prof.business_id)
        .maybeSingle();
      setBusiness(biz as Business | null);
    } else {
      setBusiness(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).catch(() => { setProfile(null); setBusiness(null); }).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Run database calls after the auth callback releases its lock.
        window.setTimeout(() => {
          loadProfile(sess.user.id)
            .catch(() => { setProfile(null); setBusiness(null); })
            .finally(() => setLoading(false));
        }, 0);
      } else {
        setProfile(null);
        setBusiness(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setBusiness(null);
  };

  const refreshProfile = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user) await loadProfile(data.session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, business, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
