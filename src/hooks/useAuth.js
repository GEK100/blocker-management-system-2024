import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);

      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
        setCompanyId(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(profile);
      setUserRole(profile.role);
      setCompanyId(profile.company_id);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error };
    }
  };

  const register = async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Registration error:', error);
      return { data: null, error };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local state
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      setCompanyId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    userProfile,
    userRole,
    companyId,
    loading,
    login,
    register,
    logout,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;