import React, { createContext, useContext, useState, useEffect } from 'react';

const MockAuthContext = createContext({});

// Mock user data for development
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
  }
];

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
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
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = mockUsers.find(u => u.email === email && u.password === password);

    if (foundUser) {
      const authUser = { id: foundUser.id, email: foundUser.email };

      setUser(authUser);
      setUserProfile(foundUser);
      setUserRole(foundUser.role);
      setCompanyId(foundUser.company_id);

      // Store in localStorage for persistence
      localStorage.setItem('mockAuthUser', JSON.stringify(foundUser));

      setLoading(false);
      return { data: { user: authUser }, error: null };
    } else {
      setLoading(false);
      return { data: null, error: { message: 'Invalid email or password' } };
    }
  };

  const register = async (email, password, userData) => {
    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      setLoading(false);
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

    // Store in localStorage for persistence
    localStorage.setItem('mockAuthUser', JSON.stringify(newUser));

    setLoading(false);
    return { data: { user: authUser }, error: null };
  };

  const logout = async () => {
    setUser(null);
    setUserProfile(null);
    setUserRole(null);
    setCompanyId(null);

    localStorage.removeItem('mockAuthUser');

    return { error: null };
  };

  const fetchUserProfile = async (userId) => {
    const foundUser = mockUsers.find(u => u.id === userId);
    if (foundUser) {
      setUserProfile(foundUser);
      setUserRole(foundUser.role);
      setCompanyId(foundUser.company_id);
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
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

export default useMockAuth;