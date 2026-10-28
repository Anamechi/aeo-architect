import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const authRevision = useRef(0);

  useEffect(() => {
    let disposed = false;
    const applySession = async (next: Session | null) => {
      const revision = ++authRevision.current;
      setSession(next);
      setUser(next?.user ?? null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(true);
      if (next?.user) {
        try {
          const { data, error } = await supabase.from('user_roles').select('role')
            .eq('user_id', next.user.id);
          if (disposed || revision !== authRevision.current) return;
          const roles = !error ? (data ?? []).map(row => String(row.role)) : [];
          setIsSuperAdmin(roles.includes('super_admin'));
          setIsAdmin(roles.includes('admin') || roles.includes('super_admin'));
        } catch {
          if (disposed || revision !== authRevision.current) return;
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
      if (!disposed && revision === authRevision.current) setLoading(false);
    };
    const initialRevision = authRevision.current;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        // Keep database calls outside Supabase's auth callback lock.
        ++authRevision.current;
        setIsSuperAdmin(false);
        setIsAdmin(false);
        setLoading(true);
        const revision = authRevision.current;
        setTimeout(() => {
          if (!disposed && revision === authRevision.current) void applySession(next);
        }, 0);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!disposed && authRevision.current === initialRevision) void applySession(session);
    });

    return () => { disposed = true; ++authRevision.current; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsSuperAdmin(false);
  };

  // Sends a password-recovery email. The link returns the user to the
  // reset-password page, where THEY set a new password (never stored here).
  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    return { error };
  };

  // Completes the reset: the recovery link creates a temporary session, and
  // the user submits their own new password here.
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isSuperAdmin, loading, signIn, signOut, sendPasswordReset, updatePassword }}>
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
