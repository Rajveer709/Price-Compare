import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check active sessions and set the user
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { user: data?.user, error };
    } catch (error) {
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { user: data?.user, error };
    } catch (error) {
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('Initiating Google OAuth flow...');
      
      // Verify supabase client is properly initialized
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { data: null, error: new Error('Supabase client not initialized') };
      }

      // Add more detailed logging
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Redirect URL:', `${window.location.origin}/products`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/products`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('OAuth response:', { data, error });
      
      if (error) {
        console.error('OAuth error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error in signInWithGoogle:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    user,
    session,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
