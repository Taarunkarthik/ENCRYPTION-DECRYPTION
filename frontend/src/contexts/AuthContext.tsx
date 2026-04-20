import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: string | null;
  isLoading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('isGuest') === 'true';
  });

  const fetchUserRole = async (userId: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Fetching role for user ${userId} (attempt ${i + 1}/${retries})...`);
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        
        if (!error && data) {
          console.log('Role fetch successful:', data.role);
          setRole(data.role || 'user');
          return;
        }

        if (error) {
          console.warn(`Role fetch error (attempt ${i + 1}):`, error.message);
          // If it's a "not found" error, the trigger might still be running
          if (i < retries - 1) {
            const delay = 1000 * (i + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Default to user if all retries fail or if no data returned
        if (!role) setRole('user');
      } catch (err) {
        console.error(`Unexpected error in fetchUserRole (attempt ${i + 1}):`, err);
        if (i === retries - 1) {
          if (!role) setRole('user');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (mounted) {
        setIsLoading(current => {
          if (current) {
            console.warn('AuthContext: Loading timed out, force clearing isLoading state');
            // If we're timed out but signed in, ensure we at least have a default role
            setRole(prev => prev || 'user');
            return false;
          }
          return current;
        });
      }
    }, 10000); // Increased to 10s safety margin

    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        
        console.log('Initial session check success');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // If logged in, clear guest mode
          setIsGuest(false);
          localStorage.removeItem('isGuest');

          const metaRole = session.user.user_metadata?.role;
          if (metaRole) {
            console.log('Role found in metadata:', metaRole);
            setRole(metaRole);
            setIsLoading(false); // Stop loading immediately if role is known from metadata
          }
          
          fetchUserRole(session.user.id).finally(() => {
            if (mounted) setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Initial session fetch failed:', err);
        if (mounted) setIsLoading(false);
      })
      .finally(() => {
        if (mounted) clearTimeout(timer);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // If logged in, clear guest mode
        setIsGuest(false);
        localStorage.removeItem('isGuest');

        const metaRole = session.user.user_metadata?.role;
        if (metaRole) {
          console.log('Immediate role from metadata:', metaRole);
          setRole(metaRole);
          // If we have a role from metadata, we can stop loading early
          setIsLoading(false);
        }

        // Fetch/Refresh role from DB in background
        const retryCount = (event === 'SIGNED_IN' || event === 'USER_UPDATED') ? 5 : 2;
        fetchUserRole(session.user.id, retryCount).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setRole(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const signOut = async () => {
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    await supabase.auth.signOut();
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
    setRole('guest');
  };

  return (
    <AuthContext.Provider value={{ session, user, role, isLoading, isGuest, signOut, continueAsGuest }}>
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
