import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SmartAuthContext = createContext({});

// Mock user data for development/fallback
const mockUsers = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    password: 'password',
    first_name: 'Super',
    last_name: 'Admin',
    role: 'super_admin',
    company_id: null,
    company: null,
    status: 'active'
  },
  {
    id: 'company-1',
    email: 'company@example.com',
    password: 'password',
    first_name: 'Company',
    last_name: 'Admin',
    role: 'company_admin',
    company_id: 'company-1',
    company: { id: 'company-1', name: 'Demo Construction Company' },
    status: 'active'
  },
  {
    id: 'worker-1',
    email: 'worker@example.com',
    password: 'password',
    first_name: 'Field',
    last_name: 'Worker',
    role: 'field_worker',
    company_id: 'company-1',
    company: { id: 'company-1', name: 'Demo Construction Company' },
    status: 'active'
  },
  {
    id: 'subcontractor-1',
    email: 'subcontractor@example.com',
    password: 'password',
    first_name: 'Sub',
    last_name: 'Contractor',
    role: 'subcontractor',
    company_id: 'company-2',
    company: { id: 'company-2', name: 'ABC Subcontractors' },
    status: 'active'
  }
];

export const SmartAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseWorking, setIsSupabaseWorking] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Test Supabase connection
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('Supabase auth error, falling back to mock auth:', error);
        setIsSupabaseWorking(false);
        initializeMockAuth();
      } else {
        // Supabase is working
        if (data.session?.user) {
          setUser(data.session.user);
          await fetchUserProfile(data.session.user.id);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            setUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            clearAuthState();
          }
        });

        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
      }
    } catch (error) {
      console.warn('Failed to initialize Supabase, using mock auth:', error);
      setIsSupabaseWorking(false);
      initializeMockAuth();
    } finally {
      setLoading(false);
    }
  };

  const initializeMockAuth = () => {
    const storedUser = localStorage.getItem('mockAuthUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ id: parsedUser.id, email: parsedUser.email });
        setUserProfile(parsedUser);
        setUserRole(parsedUser.role);
        setCompanyId(parsedUser.company_id);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('mockAuthUser');
      }
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setUserProfile(null);
    setUserRole(null);
    setCompanyId(null);
  };

  const fetchUserProfile = async (userId) => {
    if (!isSupabaseWorking) return;

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
    if (isSupabaseWorking) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        console.error('Supabase login error:', error);
        // Fall back to mock auth
        return mockLogin(email, password);
      }
    } else {
      return mockLogin(email, password);
    }
  };

  const mockLogin = async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = mockUsers.find(u => u.email === email && u.password === password);

    if (foundUser) {
      const authUser = { id: foundUser.id, email: foundUser.email };

      setUser(authUser);
      setUserProfile(foundUser);
      setUserRole(foundUser.role);
      setCompanyId(foundUser.company_id);

      localStorage.setItem('mockAuthUser', JSON.stringify(foundUser));

      return { data: { user: authUser }, error: null };
    } else {
      return { data: null, error: { message: 'Invalid email or password' } };
    }
  };

  const register = async (email, password, userData) => {
    if (isSupabaseWorking) {
      try {
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

        // Try to create user profile
        if (authData.user) {
          await createUserProfileAndCompany(authData.user, userData);
        }

        return { data: authData, error: null };
      } catch (error) {
        console.error('Supabase registration error:', error);
        // Fall back to mock registration
        return mockRegister(email, password, userData);
      }
    } else {
      return mockRegister(email, password, userData);
    }
  };

  const mockRegister = async (email, password, userData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return { data: null, error: { message: 'User already exists' } };
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      company_id: userData.role === 'company_admin' ? `company-${Date.now()}` : null,
      company: userData.role === 'company_admin' ?
        { id: `company-${Date.now()}`, name: userData.company_name } : null,
      status: 'active'
    };

    // Add to mock database
    mockUsers.push(newUser);

    const authUser = { id: newUser.id, email: newUser.email };

    setUser(authUser);
    setUserProfile(newUser);
    setUserRole(newUser.role);
    setCompanyId(newUser.company_id);

    localStorage.setItem('mockAuthUser', JSON.stringify(newUser));

    return { data: { user: authUser }, error: null };
  };

  const createUserProfileAndCompany = async (user, userData) => {
    try {
      let companyId;

      if (userData.role === 'company_admin' || userData.role === 'company_owner') {
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
        companyId = null;
      }

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

      return profile;
    } catch (error) {
      console.error('Error creating user profile and company:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (isSupabaseWorking) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    clearAuthState();
    localStorage.removeItem('mockAuthUser');
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
    isSupabaseWorking
  };

  return (
    <SmartAuthContext.Provider value={value}>
      {children}
    </SmartAuthContext.Provider>
  );
};

export const useSmartAuth = () => {
  const context = useContext(SmartAuthContext);
  if (!context) {
    throw new Error('useSmartAuth must be used within a SmartAuthProvider');
  }
  return context;
};

export default useSmartAuth;