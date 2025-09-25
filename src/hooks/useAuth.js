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
      // First, sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role
          }
        }
      });

      if (authError) throw authError;

      // If user is created successfully, create their profile and company
      if (authData.user && !authData.user.email_confirmed_at) {
        // For demo purposes, we'll create the profile immediately
        // In production, you'd typically wait for email confirmation
        await createUserProfileAndCompany(authData.user, userData);
      } else if (authData.user && authData.user.email_confirmed_at) {
        // User is already confirmed, create profile
        await createUserProfileAndCompany(authData.user, userData);
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Registration error:', error);
      return { data: null, error };
    }
  };

  const createUserProfileAndCompany = async (user, userData) => {
    try {
      // First, create or find the company
      let companyId;

      if (userData.role === 'company_admin' || userData.role === 'company_owner') {
        // Create a new company
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert([{
            name: userData.company_name,
            created_by: user.id,
            status: 'active'
          }])
          .select()
          .single();

        if (companyError) throw companyError;
        companyId = company.id;
      } else {
        // For other roles, we'll need to assign them to a company later
        companyId = null;
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          company_id: companyId,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      console.log('User profile created successfully:', profile);
      return profile;
    } catch (error) {
      console.error('Error creating user profile and company:', error);
      throw error;
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

  // Demo login function for development
  const loginAsDemo = async (role = 'company_admin') => {
    const demoAccounts = {
      super_admin: { email: 'admin@example.com', password: 'password' },
      company_admin: { email: 'company@example.com', password: 'password' },
      field_worker: { email: 'worker@example.com', password: 'password' }
    };

    const account = demoAccounts[role];
    if (account) {
      return await login(account.email, account.password);
    }
    return { data: null, error: { message: 'Demo account not found' } };
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
    fetchUserProfile,
    loginAsDemo,
    createUserProfileAndCompany
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