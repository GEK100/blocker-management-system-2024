import React, { useState, useRef, createContext, useContext, useEffect } from 'react';
import { Lock, UserPlus, Building, Users, ArrowRight, Check } from 'lucide-react';
import { authAPI, userAPI, companyAPI, projectAPI } from '../lib/multitenant-api';
import { supabase } from '../lib/supabase';

// Multi-tenant Authentication Context
const MultiTenantAuthContext = createContext();

// Multi-tenant Authentication Provider
export const MultiTenantAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadUserContext(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserContext(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setCompany(null);
        setCurrentProject(null);
        setProjects([]);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Load user profile, company, and projects
  const loadUserContext = async (userId) => {
    try {
      // Load user profile with company info
      const { data: profileData, error: profileError } = await userAPI.getCurrentProfile();
      if (profileError) {
        console.error('Profile loading error:', profileError);
        return;
      }

      setProfile(profileData);
      setCompany(profileData.company);

      // Load projects for the company
      const { data: projectsData, error: projectsError } = await projectAPI.getAll();
      if (projectsError) {
        console.error('Projects loading error:', projectsError);
      } else {
        setProjects(projectsData || []);
        // Set first active project as current
        const activeProject = projectsData?.find(p => p.status === 'active');
        if (activeProject) {
          setCurrentProject(activeProject);
        }
      }
    } catch (error) {
      console.error('Context loading error:', error);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const { data, error } = await authAPI.signIn(email, password);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Register new company
  const registerCompany = async (userData, companyData) => {
    try {
      const { data, error } = await authAPI.signUpWithCompany(userData, companyData);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Company created successfully! Please check your email to verify your account.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Register with invitation
  const registerWithInvitation = async (userData, invitationToken) => {
    try {
      const { data, error } = await authAPI.signUpWithInvitation(userData, invitationToken);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Account created successfully! Please check your email to verify your account.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authAPI.signOut();
      setUser(null);
      setProfile(null);
      setCompany(null);
      setCurrentProject(null);
      setProjects([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Switch project context
  const switchProject = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  // Permission checking
  const hasPermission = (requiredRole) => {
    if (!profile) return false;

    const roleHierarchy = {
      'worker': 1,
      'supervisor': 2,
      'admin': 3,
      'owner': 4
    };

    return roleHierarchy[profile.role] >= roleHierarchy[requiredRole];
  };

  const value = {
    user,
    profile,
    company,
    currentProject,
    projects,
    login,
    registerCompany,
    registerWithInvitation,
    logout,
    switchProject,
    hasPermission,
    isLoading,
    loadUserContext
  };

  return <MultiTenantAuthContext.Provider value={value}>{children}</MultiTenantAuthContext.Provider>;
};

// Custom hook to use multi-tenant auth context
export const useMultiTenantAuth = () => {
  const context = useContext(MultiTenantAuthContext);
  if (!context) {
    throw new Error('useMultiTenantAuth must be used within a MultiTenantAuthProvider');
  }
  return context;
};

// Company Registration Component
export const CompanyRegistrationForm = ({ onToggleForm, onSuccess }) => {
  const [formData, setFormData] = useState({
    // User data
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',

    // Company data
    companyName: '',
    companyWebsite: '',
    companyPhone: '',
    companyAddress: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { registerCompany } = useMultiTenantAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone
    };

    const companyData = {
      name: formData.companyName,
      website: formData.companyWebsite,
      phone: formData.companyPhone,
      address: formData.companyAddress
    };

    const result = await registerCompany(userData, companyData);
    if (!result.success) {
      setError(result.error);
    } else {
      onSuccess?.(result.message);
    }
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all user information');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div className=\"min-h-screen bg-orange-50 flex items-center justify-center p-4\">
      <div className=\"max-w-md w-full space-y-8\">
        <div className=\"text-center\">
          <div className=\"mx-auto h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center\">
            <Building className=\"h-6 w-6 text-white\" />
          </div>
          <h2 className=\"mt-6 text-3xl font-extrabold text-gray-900\">
            {step === 1 ? 'Create Your Account' : 'Company Information'}
          </h2>
          <p className=\"mt-2 text-sm text-gray-600\">
            {step === 1 ? 'Set up your personal account' : 'Tell us about your company'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className=\"flex items-center justify-center space-x-4\">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {step > 1 ? <Check className=\"h-4 w-4\" /> : '1'}
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
        </div>

        <form className=\"mt-8 space-y-6\" onSubmit={handleSubmit}>
          {error && (
            <div className=\"bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded\">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className=\"space-y-4\">
              <div>
                <label htmlFor=\"name\" className=\"block text-sm font-medium text-gray-700\">Full Name</label>
                <input
                  id=\"name\"
                  name=\"name\"
                  type=\"text\"
                  required
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"Enter your full name\"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor=\"email\" className=\"block text-sm font-medium text-gray-700\">Email</label>
                <input
                  id=\"email\"
                  name=\"email\"
                  type=\"email\"
                  required
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"Enter your email\"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor=\"phone\" className=\"block text-sm font-medium text-gray-700\">Phone (Optional)</label>
                <input
                  id=\"phone\"
                  name=\"phone\"
                  type=\"tel\"
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"Enter your phone number\"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor=\"password\" className=\"block text-sm font-medium text-gray-700\">Password</label>
                <input
                  id=\"password\"
                  name=\"password\"
                  type=\"password\"
                  required
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"Enter your password\"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor=\"confirmPassword\" className=\"block text-sm font-medium text-gray-700\">Confirm Password</label>
                <input
                  id=\"confirmPassword\"
                  name=\"confirmPassword\"
                  type=\"password\"
                  required
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"Confirm your password\"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button
                type=\"button\"
                onClick={nextStep}
                className=\"w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500\"
              >
                Next Step
                <ArrowRight className=\"ml-2 h-4 w-4\" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className=\"space-y-4\">
              <div>
                <label htmlFor=\"companyName\" className=\"block text-sm font-medium text-gray-700\">Company Name</label>
                <input
                  id=\"companyName\"
                  name=\"companyName\"
                  type=\"text\"
                  required
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"Enter your company name\"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor=\"companyWebsite\" className=\"block text-sm font-medium text-gray-700\">Website (Optional)</label>
                <input
                  id=\"companyWebsite\"
                  name=\"companyWebsite\"
                  type=\"url\"
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"https://yourcompany.com\"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor=\"companyPhone\" className=\"block text-sm font-medium text-gray-700\">Company Phone</label>
                <input
                  id=\"companyPhone\"
                  name=\"companyPhone\"
                  type=\"tel\"
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"Enter company phone\"
                  value={formData.companyPhone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor=\"companyAddress\" className=\"block text-sm font-medium text-gray-700\">Address (Optional)</label>
                <textarea
                  id=\"companyAddress\"
                  name=\"companyAddress\"
                  rows={3}
                  className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500\"
                  placeholder=\"Enter company address\"
                  value={formData.companyAddress}
                  onChange={handleChange}
                />
              </div>

              <div className=\"flex space-x-3\">
                <button
                  type=\"button\"
                  onClick={prevStep}
                  className=\"flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500\"
                >
                  Back
                </button>
                <button
                  type=\"submit\"
                  disabled={isLoading}
                  className=\"flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50\"
                >
                  {isLoading ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </div>
          )}

          <div className=\"text-center\">
            <button
              type=\"button\"
              onClick={onToggleForm}
              className=\"text-sm text-orange-600 hover:text-orange-500\"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};