import React, { useState, useRef, createContext, useContext, useEffect } from 'react';
import { Camera, MapPin, Send, Eye, CheckCircle, Clock, AlertTriangle, User, LogOut, Plus, Filter, Search, Settings, Upload, Users, Mail, Edit, Trash2, FileText, Lock, UserPlus } from 'lucide-react';
import { authAPI, userAPI, contractorAPI, drawingAPI, blockerAPI, statusHistoryAPI, invitationAPI } from './lib/api';
import { supabase } from './lib/supabase';

// Authentication Context
const AuthContext = createContext();

// This will be loaded from Supabase

// Pre-uploaded site drawings
const siteDrawings = [
  { id: 1, name: "Ground Floor", filename: "GF_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" },
  { id: 2, name: "1st Floor", filename: "1F_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" },
  { id: 3, name: "2nd Floor", filename: "2F_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" },
  { id: 4, name: "Basement", filename: "Basement_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" },
  { id: 5, name: "Roof Plan", filename: "Roof_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" }
];

// Authorized users (pre-loaded from admin panel)
const initialAuthorizedUsers = [
  { id: 1, name: "John Smith", company: "ABC Electrical Ltd", role: "supervisor", email: "john@abcelectrical.com", phone: "+44 7700 900123" },
  { id: 2, name: "Sarah Wilson", company: "PlumbPro Services", role: "foreman", email: "sarah@plumbpro.com", phone: "+44 7700 900124" },
  { id: 3, name: "Mike Johnson", company: "BuildRight Construction", role: "site_manager", email: "mike@buildright.com", phone: "+44 7700 900125" },
  { id: 4, name: "Emma Davis", company: "SteelWorks Ltd", role: "supervisor", email: "emma@steelworks.com", phone: "+44 7700 900126" },
  { id: 5, name: "Tom Brown", company: "FloorMasters", role: "team_lead", email: "tom@floormasters.com", phone: "+44 7700 900127" }
];

const mockBlockers = [
  {
    id: 1,
    ticketNumber: "BLK-2025-001",
    title: "Ceiling access blocked by pipes",
    description: "Cannot install light fixtures due to exposed plumbing blocking access",
    photo: "/api/placeholder/300/200",
    location: { x: 150, y: 200 },
    floor: "1st Floor",
    status: "open",
    priority: "high",
    createdBy: "John Smith",
    createdByCompany: "ABC Electrical Ltd",
    assignedTo: null,
    createdAt: "2025-01-20T10:30:00Z",
    dueDate: "2025-01-25T17:00:00Z",
    statusHistory: [
      {
        status: "submitted",
        timestamp: "2025-01-20T10:30:00Z",
        user: "John Smith (ABC Electrical Ltd)",
        action: "Blocker submitted to main contractor"
      }
    ]
  },
  {
    id: 2,
    ticketNumber: "BLK-2025-002",
    title: "Power not isolated in panel room",
    description: "Electrical panel still live, cannot proceed with wall modifications",
    photo: "/api/placeholder/300/200",
    location: { x: 300, y: 150 },
    floor: "Ground Floor",
    status: "assigned",
    priority: "critical",
    createdBy: "Sarah Wilson",
    createdByCompany: "PlumbPro Services",
    assignedTo: "ABC Electrical Ltd",
    createdAt: "2025-01-19T14:15:00Z",
    dueDate: "2025-01-22T09:00:00Z",
    statusHistory: [
      {
        status: "submitted",
        timestamp: "2025-01-19T14:15:00Z",
        user: "Sarah Wilson (PlumbPro Services)",
        action: "Blocker submitted to main contractor"
      },
      {
        status: "reviewed",
        timestamp: "2025-01-19T15:30:00Z",
        user: "Main Contractor",
        action: "Blocker reviewed and categorized"
      },
      {
        status: "assigned",
        timestamp: "2025-01-19T15:45:00Z",
        user: "Main Contractor",
        action: "Assigned to ABC Electrical Ltd"
      }
    ]
  }
];

// Authentication Provider Component with Supabase
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Load user profile
          const { data: profileData } = await userAPI.getProfile(session.user.id);
          setProfile(profileData);
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
        // Load user profile
        const { data: profileData } = await userAPI.getProfile(session.user.id);
        setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await authAPI.signIn(email, password);
      if (error) {
        return { success: false, error: error.message };
      }

      // Profile will be loaded by the auth state change listener
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const { data, error } = await authAPI.signUp(
        userData.email,
        userData.password,
        {
          name: userData.name,
          company: userData.company,
          phone: userData.phone,
          role: userData.role || 'worker'
        }
      );

      if (error) {
        return { success: false, error: error.message };
      }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await userAPI.createProfile({
          id: data.user.id,
          name: userData.name,
          company: userData.company,
          phone: userData.phone,
          role: userData.role || 'worker'
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasPermission = (requiredRole) => {
    if (!profile) return false;

    const roleHierarchy = {
      'worker': 1,
      'supervisor': 2,
      'admin': 3
    };

    return roleHierarchy[profile.role] >= roleHierarchy[requiredRole];
  };

  const value = {
    user,
    profile,
    login,
    register,
    logout,
    hasPermission,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Component
const LoginForm = ({ onToggleForm }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Demo credentials for easy testing
  const demoCredentials = [
    { role: 'Admin', email: 'admin@construction.com', password: 'admin123' },
    { role: 'Supervisor', email: 'supervisor@construction.com', password: 'super123' },
    { role: 'Worker', email: 'worker@construction.com', password: 'worker123' }
  ];

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">Construction Blocker Management</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleForm}
              className="text-sm text-orange-600 hover:text-orange-500"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</h3>
          <div className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="text-xs text-gray-600">
                <strong>{cred.role}:</strong> {cred.email} / {cred.password}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Registration Component
const RegisterForm = ({ onToggleForm }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    role: 'worker'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

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

    const result = await register(formData);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Join the Construction Blocker Management system</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
              <select
                id="company"
                name="company"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                value={formData.company}
                onChange={handleChange}
              >
                <option value="">Select your company</option>
                <option value="ABC Electrical Ltd">ABC Electrical Ltd</option>
                <option value="PlumbPro Services">PlumbPro Services</option>
                <option value="BuildRight Construction">BuildRight Construction</option>
                <option value="SteelWorks Ltd">SteelWorks Ltd</option>
                <option value="FloorMasters">FloorMasters</option>
                <option value="Main Contractor">Main Contractor</option>
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="role"
                name="role"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="worker">Worker</option>
                <option value="supervisor">Supervisor</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Admin accounts require approval</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleForm}
              className="text-sm text-orange-600 hover:text-orange-500"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Auth Wrapper Component
const AuthWrapper = () => {
  const [showLogin, setShowLogin] = useState(true);

  return showLogin ?
    <LoginForm onToggleForm={() => setShowLogin(false)} /> :
    <RegisterForm onToggleForm={() => setShowLogin(true)} />;
};

const BlockersApp = () => {
  const { user, profile, logout, hasPermission } = useAuth();

  // Use profile for user data (name, role, company, etc.)
  const userData = profile || {};
  const [currentView, setCurrentView] = useState('dashboard');
  const [blockers, setBlockers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [selectedBlocker, setSelectedBlocker] = useState(null);
  const [isCreatingBlocker, setIsCreatingBlocker] = useState(false);
  const [newBlocker, setNewBlocker] = useState({
    title: '',
    description: '',
    photo: null,
    location: null,
    priority: 'medium',
    selectedFloor: ''
  });
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [isPinModeActive, setIsPinModeActive] = useState(false);
  const [tempPinLocation, setTempPinLocation] = useState(null);
  const [drawingTransform, setDrawingTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  const [lastTouch, setLastTouch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Admin state management
  const [drawings, setDrawings] = useState([]);
  const [users, setUsers] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [adminView, setAdminView] = useState('drawings');
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    company: '',
    role: 'supervisor',
    phone: ''
  });
  const [inviteEmail, setInviteEmail] = useState({
    email: '',
    role: 'supervisor',
    company: '',
    message: ''
  });

  const fileInputRef = useRef(null);
  const drawingRef = useRef(null);
  const drawingUploadRef = useRef(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setIsDataLoading(true);

        // Load all data in parallel
        const [blockersRes, contractorsRes, drawingsRes, usersRes] = await Promise.all([
          blockerAPI.getAll(),
          contractorAPI.getAll(),
          drawingAPI.getAll(),
          userAPI.getAllProfiles()
        ]);

        if (blockersRes.data) setBlockers(blockersRes.data);
        if (contractorsRes.data) setContractors(contractorsRes.data);
        if (drawingsRes.data) setDrawings(drawingsRes.data);
        if (usersRes.data) setUsers(usersRes.data);

        if (blockersRes.error) console.error('Error loading blockers:', blockersRes.error);
        if (contractorsRes.error) console.error('Error loading contractors:', contractorsRes.error);
        if (drawingsRes.error) console.error('Error loading drawings:', drawingsRes.error);
        if (usersRes.error) console.error('Error loading users:', usersRes.error);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  const statusColors = {
    open: 'bg-red-100 text-red-800 border-red-200',
    assigned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    resolved: 'bg-green-100 text-green-800 border-green-200'
  };

  const priorityColors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  };

  const filteredBlockers = blockers.filter(blocker => {
    const matchesStatus = filterStatus === 'all' || blocker.status === filterStatus;
    const matchesSearch = blocker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blocker.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewBlocker(prev => ({ ...prev, photo: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e) => {
    if (!isCreatingBlocker || !isPinModeActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - drawingTransform.translateX) / drawingTransform.scale;
    const y = (e.clientY - rect.top - drawingTransform.translateY) / drawingTransform.scale;

    setTempPinLocation({ x, y });
  };

  const handleTouchStart = (e) => {
    if (isPinModeActive) return; // Don't interfere with pin mode

    if (e.touches.length === 1) {
      setLastTouch({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (isPinModeActive) return;

    if (e.touches.length === 1 && lastTouch) {
      // Single finger - pan
      const deltaX = e.touches[0].clientX - lastTouch.x;
      const deltaY = e.touches[0].clientY - lastTouch.y;

      setDrawingTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));

      setLastTouch({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      });
    } else if (e.touches.length === 2) {
      // Two fingers - zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (lastTouch && lastTouch.distance) {
        const scaleChange = distance / lastTouch.distance;
        setDrawingTransform(prev => ({
          ...prev,
          scale: Math.max(0.5, Math.min(3, prev.scale * scaleChange))
        }));
      }

      setLastTouch({
        distance,
        time: Date.now()
      });
    }
  };

  const handleTouchEnd = () => {
    setLastTouch(null);
  };

  const resetDrawingView = () => {
    setDrawingTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
  };

  const zoomIn = () => {
    setDrawingTransform(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale * 1.2)
    }));
  };

  const zoomOut = () => {
    setDrawingTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, prev.scale / 1.2)
    }));
  };

  const activatePinMode = () => {
    setIsPinModeActive(true);
    setTempPinLocation(null);
  };

  const confirmPin = () => {
    if (tempPinLocation) {
      setNewBlocker(prev => ({ ...prev, location: tempPinLocation }));
      setIsPinModeActive(false);
      setTempPinLocation(null);
    }
  };

  const cancelPin = () => {
    setIsPinModeActive(false);
    setTempPinLocation(null);
  };

  const clearPin = () => {
    setNewBlocker(prev => ({ ...prev, location: null }));
    setIsPinModeActive(false);
    setTempPinLocation(null);
  };

  const handleFloorSelection = (floorName) => {
    const drawing = drawings.find(d => d.name === floorName);
    setSelectedDrawing(drawing);
    setNewBlocker(prev => ({ ...prev, selectedFloor: floorName, location: null }));
    setIsPinModeActive(false);
    setTempPinLocation(null);
    setDrawingTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBlocker = async () => {
    if (!newBlocker.title || !newBlocker.description || !newBlocker.selectedFloor) {
      alert('Please fill in all required fields and select a floor');
      return;
    }

    try {
      setIsSubmitting(true);

      let photoUrl = null;

      // Upload photo if exists
      if (newBlocker.photo) {
        const { data: photoData, error: photoError } = await blockerAPI.uploadPhoto(
          newBlocker.photo,
          'temp-' + Date.now() // Temporary ID until blocker is created
        );

        if (photoError) {
          console.error('Error uploading photo:', photoError);
        } else {
          photoUrl = photoData.url;
        }
      }

      // Create blocker
      const blockerData = {
        title: newBlocker.title,
        description: newBlocker.description,
        photo_url: photoUrl,
        location_x: newBlocker.location?.x,
        location_y: newBlocker.location?.y,
        floor: newBlocker.selectedFloor,
        priority: newBlocker.priority,
        created_by: user.id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await blockerAPI.create(blockerData);

      if (error) {
        console.error('Error creating blocker:', error);
        alert('Failed to create blocker: ' + error.message);
        return;
      }

      // Add to local state
      setBlockers(prev => [data, ...prev]);

      // Reset form
      setNewBlocker({ title: '', description: '', photo: null, location: null, priority: 'medium', selectedFloor: '' });
      setSelectedDrawing(null);
      setIsPinModeActive(false);
      setTempPinLocation(null);
      setIsCreatingBlocker(false);
      setCurrentView('dashboard');

      alert(`✅ Blocker created successfully!\nTicket Number: ${data.ticket_number}\nFloor: ${data.floor}`);
    } catch (error) {
      console.error('Error creating blocker:', error);
      alert('Failed to create blocker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignBlocker = async (blockerId, contractorId) => {
    try {
      const { data, error } = await blockerAPI.assign(blockerId, contractorId);
      if (error) {
        console.error('Error assigning blocker:', error);
        alert('Failed to assign blocker: ' + error.message);
        return;
      }

      // Update local state
      setBlockers(prev => prev.map(blocker =>
        blocker.id === blockerId ? { ...blocker, ...data } : blocker
      ));

      const contractor = contractors.find(c => c.id === contractorId);
      alert(`📋 Blocker assigned to ${contractor?.name}!`);
    } catch (error) {
      console.error('Error assigning blocker:', error);
      alert('Failed to assign blocker');
    }
  };

  const updateBlockerStatus = async (blockerId, newStatus) => {
    try {
      let updateData;

      if (newStatus === 'resolved') {
        const { data, error } = await blockerAPI.resolve(blockerId, user.id);
        updateData = data;
        if (error) throw error;
      } else {
        const { data, error } = await blockerAPI.update(blockerId, { status: newStatus });
        updateData = data;
        if (error) throw error;
      }

      // Update local state
      setBlockers(prev => prev.map(blocker =>
        blocker.id === blockerId ? { ...blocker, ...updateData } : blocker
      ));

      if (newStatus === 'resolved') {
        alert('✅ Blocker marked as resolved!');
      }
    } catch (error) {
      console.error('Error updating blocker status:', error);
      alert('Failed to update blocker status: ' + error.message);
    }
  };

  const updateBlockerStatusOld = (blockerId, newStatus) => {
    const now = new Date().toISOString();
    setBlockers(prev => prev.map(blocker =>
      blocker.id === blockerId
        ? {
            ...blocker,
            status: newStatus,
            statusHistory: [
              ...blocker.statusHistory,
              {
                status: newStatus,
                timestamp: now,
                user: blocker.assignedTo || "Contractor",
                action: newStatus === 'resolved' ? 'Marked as resolved' : `Status updated to ${newStatus}`
              }
            ]
          }
        : blocker
    ));
  };

  // Admin Functions
  const handleDrawingUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newDrawing = {
          id: Date.now() + Math.random(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          filename: file.name,
          uploadedAt: new Date().toISOString().split('T')[0],
          url: e.target.result
        };
        setDrawings(prev => [...prev, newDrawing]);
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteDrawing = (drawingId) => {
    if (window.confirm('Are you sure you want to delete this drawing?')) {
      setDrawings(prev => prev.filter(d => d.id !== drawingId));
    }
  };

  const addUser = () => {
    if (!newUser.name || !newUser.email || !newUser.company) {
      alert('Please fill in all required fields');
      return;
    }

    const user = {
      ...newUser,
      id: Date.now()
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ name: '', email: '', company: '', role: 'supervisor', phone: '' });
    alert(`✅ User ${newUser.name} added successfully!`);
  };

  const editUser = (userId, updatedUser) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, ...updatedUser } : user
    ));
    setEditingUser(null);
    alert('✅ User updated successfully!');
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('✅ User deleted successfully!');
    }
  };

  const sendInvitation = () => {
    if (!inviteEmail.email || !inviteEmail.company) {
      alert('Please fill in email and company fields');
      return;
    }

    // In a real app, this would send an actual email
    const inviteData = {
      ...inviteEmail,
      invitedBy: userData.name,
      invitedAt: new Date().toISOString(),
      status: 'pending'
    };

    console.log('Sending invitation:', inviteData);
    alert(`📧 Invitation sent to ${inviteEmail.email}!\n\nThey will receive:\n- Login credentials\n- Company assignment: ${inviteEmail.company}\n- Role: ${inviteEmail.role}\n- Custom message: ${inviteEmail.message || 'Welcome to the construction blocker system!'}`);

    setInviteEmail({ email: '', role: 'supervisor', company: '', message: '' });
  };

  const renderDashboard = () => {
    if (isDataLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Blockers</p>
              <p className="text-2xl font-bold text-gray-900">
                {blockers.filter(b => b.status === 'open').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">
                {blockers.filter(b => b.status === 'assigned').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {blockers.filter(b => b.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{blockers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search blockers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>
        </div>
      </div>

      {/* Blockers List */}
      <div className="space-y-4">
        {filteredBlockers.map(blocker => (
          <div key={blocker.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{blocker.title}</h3>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {blocker.ticketNumber}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${priorityColors[blocker.priority]}`} title={`${blocker.priority} priority`}></div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[blocker.status]}`}>
                    {blocker.status.charAt(0).toUpperCase() + blocker.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{blocker.description}</p>
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 text-sm text-gray-500">
                  <span>Created by: {blocker.createdBy} ({blocker.createdByCompany})</span>
                  <span>Floor: {blocker.floor}</span>
                  {blocker.assignedTo && <span>Assigned to: {blocker.assignedTo}</span>}
                  <span>Due: {new Date(blocker.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <button
                  onClick={() => setSelectedBlocker(blocker)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                {blocker.status === 'open' && hasPermission('supervisor') && (
                  <select
                    onChange={(e) => assignBlocker(blocker.id, e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                    defaultValue=""
                  >
                    <option value="" disabled>Assign to...</option>
                    {contractors.map(contractor => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </option>
                    ))}
                  </select>
                )}
                {blocker.status === 'assigned' && (hasPermission('supervisor') || (userData.company === blocker.assignedTo)) && (
                  <button
                    onClick={() => updateBlockerStatus(blocker.id, 'resolved')}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark Resolved</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateBlocker = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Blocker</h2>

        {/* User Info Display */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Submitter Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Name:</span>
              <span className="ml-2 text-blue-700">{userData.name}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Company:</span>
              <span className="ml-2 text-blue-700">{userData.company}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Role:</span>
              <span className="ml-2 text-blue-700">{userData.role}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Phone:</span>
              <span className="ml-2 text-blue-700">{userData.phone}</span>
            </div>
          </div>
        </div>

        {/* Floor Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Floor/Area</label>
          <select
            value={newBlocker.selectedFloor}
            onChange={(e) => handleFloorSelection(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Choose a floor...</option>
            {drawings.map(drawing => (
              <option key={drawing.id} value={drawing.name}>
                {drawing.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drawing Display */}
        {selectedDrawing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mark blocker location - {selectedDrawing.name}
                </label>
                {!newBlocker.location && !isPinModeActive && (
                  <p className="text-sm text-gray-500 mt-1">
                    📱 Use gestures to zoom/pan, then activate pin mode to mark location
                  </p>
                )}
              </div>

              {/* Pin Mode Controls */}
              <div className="flex items-center space-x-2">
                {!newBlocker.location && !isPinModeActive && (
                  <button
                    onClick={activatePinMode}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Pin Mode</span>
                  </button>
                )}

                {isPinModeActive && !tempPinLocation && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600 font-medium">📍 Tap to place</span>
                    <button
                      onClick={cancelPin}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {tempPinLocation && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={confirmPin}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={cancelPin}
                      className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {newBlocker.location && !isPinModeActive && (
                  <button
                    onClick={clearPin}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Clear Pin
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Drawing Controls */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Drawing Controls:</span>
                <button
                  onClick={zoomOut}
                  disabled={isPinModeActive}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  −
                </button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(drawingTransform.scale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  disabled={isPinModeActive}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={resetDrawingView}
                disabled={isPinModeActive}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Reset View
              </button>
            </div>

            <div className="relative border rounded-lg overflow-hidden bg-gray-100" style={{ height: '400px' }}>
              {/* Status indicator */}
              {isPinModeActive && (
                <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded-md shadow-lg z-20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Pin Mode - Tap to place</span>
                  </div>
                </div>
              )}

              {/* Instructions overlay */}
              {!isPinModeActive && !newBlocker.location && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-md shadow-lg z-20">
                  <span className="text-sm">👆 Pinch to zoom • Drag to pan</span>
                </div>
              )}

              <div
                ref={drawingRef}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`w-full h-full relative ${
                  isPinModeActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                }`}
                style={{
                  backgroundImage: `url(${selectedDrawing.url})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  transform: `translate(${drawingTransform.translateX}px, ${drawingTransform.translateY}px) scale(${drawingTransform.scale})`,
                  transformOrigin: 'center',
                  transition: isPinModeActive ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                {/* Temporary pin (during placement) */}
                {tempPinLocation && (
                  <div
                    className="absolute w-6 h-6 bg-yellow-500 rounded-full border-2 border-white shadow-lg transform -translate-x-3 -translate-y-3 animate-pulse z-10"
                    style={{
                      left: tempPinLocation.x * drawingTransform.scale + drawingTransform.translateX,
                      top: tempPinLocation.y * drawingTransform.scale + drawingTransform.translateY
                    }}
                  >
                    <div className="absolute -top-10 -left-8 bg-yellow-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Confirm this location?
                    </div>
                  </div>
                )}

                {/* Confirmed pin */}
                {newBlocker.location && !isPinModeActive && (
                  <div
                    className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-3 -translate-y-3 z-10"
                    style={{
                      left: newBlocker.location.x * drawingTransform.scale + drawingTransform.translateX,
                      top: newBlocker.location.y * drawingTransform.scale + drawingTransform.translateY
                    }}
                  >
                    <div className="absolute -top-10 -left-6 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      ✓ Blocker Location
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Help Text */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Mobile Tips:</strong> Use two fingers to zoom in/out. Drag with one finger to move around.
                When you've found the right spot, tap "Pin Mode" then tap the exact location.
              </p>
            </div>
          </div>
        )}

        {/* Blocker Details Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={newBlocker.title}
              onChange={(e) => setNewBlocker(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Brief description of the blocker"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={newBlocker.description}
              onChange={(e) => setNewBlocker(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Detailed description of what is blocking the work"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={newBlocker.priority}
              onChange={(e) => setNewBlocker(prev => ({ ...prev, priority: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
            {!newBlocker.photo ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Camera className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Take Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <img src={newBlocker.photo} alt="Blocker" className="w-full max-w-md rounded-lg" />
                <button
                  onClick={() => setNewBlocker(prev => ({ ...prev, photo: null }))}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={() => {
              setIsCreatingBlocker(false);
              setCurrentView('dashboard');
              setNewBlocker({ title: '', description: '', photo: null, location: null, priority: 'medium', selectedFloor: '' });
              setSelectedDrawing(null);
              setIsPinModeActive(false);
              setTempPinLocation(null);
              setDrawingTransform({ scale: 1, translateX: 0, translateY: 0 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submitBlocker}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            <span>Submit Blocker</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTrackingView = () => {
    // For Supabase, we need to filter by created_by ID instead of name
    const myBlockers = blockers.filter(blocker =>
      blocker.created_by === user?.id || blocker.creator?.name === userData.name
    );

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-6">My Submitted Blockers</h2>

          {myBlockers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>You haven't submitted any blockers yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {myBlockers.map(blocker => (
                <div key={blocker.id} className="border rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row lg:space-x-8">
                    {/* Blocker Info */}
                    <div className="flex-1 mb-6 lg:mb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{blocker.title}</h3>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {blocker.ticketNumber}
                        </span>
                        <div className={`w-3 h-3 rounded-full ${priorityColors[blocker.priority]}`}></div>
                      </div>
                      <p className="text-gray-600 mb-3">{blocker.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Submitted: {new Date(blocker.createdAt).toLocaleDateString()}</span>
                        <span>Floor: {blocker.floor}</span>
                        {blocker.assignedTo && (
                          <span className="text-blue-600">Assigned to: {blocker.assignedTo}</span>
                        )}
                        <span>Due: {new Date(blocker.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Status Tracker */}
                    <div className="lg:w-80">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Status Tracker</h4>
                      <div className="space-y-3">
                        {blocker.statusHistory.map((entry, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                              index === blocker.statusHistory.length - 1
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {entry.action}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(entry.timestamp).toLocaleString()} • {entry.user}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Future status indicators */}
                        {blocker.status === 'open' && (
                          <div className="flex items-start space-x-3 opacity-40">
                            <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">Waiting for assignment...</p>
                            </div>
                          </div>
                        )}

                        {blocker.status === 'assigned' && (
                          <div className="flex items-start space-x-3 opacity-40">
                            <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">Waiting for resolution...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Current Status Badge */}
                      <div className="mt-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[blocker.status]}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            blocker.status === 'open' ? 'bg-red-500' :
                            blocker.status === 'assigned' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          {blocker.status.charAt(0).toUpperCase() + blocker.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <button
                      onClick={() => setSelectedBlocker(blocker)}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBlockerDetail = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedBlocker.title}</h2>
            <p className="text-sm font-mono text-gray-500 mt-1">{selectedBlocker.ticketNumber}</p>
          </div>
          <button
            onClick={() => setSelectedBlocker(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${priorityColors[selectedBlocker.priority]}`}></div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[selectedBlocker.status]}`}>
                {selectedBlocker.status.charAt(0).toUpperCase() + selectedBlocker.status.slice(1)}
              </span>
            </div>

            <p className="text-gray-600">{selectedBlocker.description}</p>

            {selectedBlocker.photo && (
              <img src={selectedBlocker.photo} alt="Blocker" className="w-full max-w-md rounded-lg" />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Created by:</span>
                <span className="ml-2 text-gray-600">{selectedBlocker.createdBy}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Company:</span>
                <span className="ml-2 text-gray-600">{selectedBlocker.createdByCompany}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Floor:</span>
                <span className="ml-2 text-gray-600">{selectedBlocker.floor}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">{new Date(selectedBlocker.createdAt).toLocaleString()}</span>
              </div>
              {selectedBlocker.assignedTo && (
                <div>
                  <span className="font-medium text-gray-700">Assigned to:</span>
                  <span className="ml-2 text-gray-600">{selectedBlocker.assignedTo}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Due date:</span>
                <span className="ml-2 text-gray-600">{new Date(selectedBlocker.dueDate).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Status History</h4>
            <div className="space-y-3">
              {selectedBlocker.statusHistory?.map((entry, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                    index === selectedBlocker.statusHistory.length - 1
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{entry.user}</p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No status history available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Admin Render Functions
  const renderAdminDrawings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Site Drawings Management</h2>
          <div className="flex items-center space-x-4">
            <input
              ref={drawingUploadRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleDrawingUpload}
              className="hidden"
            />
            <button
              onClick={() => drawingUploadRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Drawings</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drawings.map(drawing => (
            <div key={drawing.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={drawing.url}
                  alt={drawing.name}
                  className="w-full h-32 object-cover rounded-md bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">{drawing.name}</h3>
                <p className="text-sm text-gray-500">
                  <FileText className="inline h-4 w-4 mr-1" />
                  {drawing.filename}
                </p>
                <p className="text-sm text-gray-500">
                  Uploaded: {new Date(drawing.uploadedAt).toLocaleDateString()}
                </p>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => window.open(drawing.url, '_blank')}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => deleteDrawing(drawing.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {drawings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No drawings uploaded yet. Click "Upload Drawings" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdminUsers = () => (
    <div className="space-y-6">
      {/* Add New User */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New User</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={newUser.name}
            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={newUser.email}
            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Company"
            value={newUser.company}
            onChange={(e) => setNewUser(prev => ({ ...prev, company: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="supervisor">Supervisor</option>
            <option value="foreman">Foreman</option>
            <option value="site_manager">Site Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="tel"
            placeholder="Phone Number"
            value={newUser.phone}
            onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={addUser}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Authorized Users ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit User</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={editingUser.name}
                onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={editingUser.email}
                onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <input
                type="text"
                placeholder="Company"
                value={editingUser.company}
                onChange={(e) => setEditingUser(prev => ({ ...prev, company: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="supervisor">Supervisor</option>
                <option value="foreman">Foreman</option>
                <option value="site_manager">Site Manager</option>
                <option value="team_lead">Team Lead</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="tel"
                placeholder="Phone Number"
                value={editingUser.phone}
                onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => editUser(editingUser.id, editingUser)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAdminInvites = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Send User Invitation</h2>
        <div className="max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="user@company.com"
                value={inviteEmail.email}
                onChange={(e) => setInviteEmail(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <input
                type="text"
                placeholder="Company Name"
                value={inviteEmail.company}
                onChange={(e) => setInviteEmail(prev => ({ ...prev, company: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={inviteEmail.role}
                onChange={(e) => setInviteEmail(prev => ({ ...prev, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="supervisor">Supervisor</option>
                <option value="foreman">Foreman</option>
                <option value="site_manager">Site Manager</option>
                <option value="team_lead">Team Lead</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message (Optional)</label>
              <textarea
                placeholder="Welcome to our construction site blocker management system..."
                value={inviteEmail.message}
                onChange={(e) => setInviteEmail(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <button
              onClick={sendInvitation}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Mail className="h-5 w-5" />
              <span>Send Invitation</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Invitation Email Preview</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>To:</strong> {inviteEmail.email || 'user@company.com'}</p>
          <p><strong>Subject:</strong> Invitation to Construction Blocker Management System</p>
          <div className="mt-4 p-4 bg-white rounded border">
            <p>Hello,</p>
            <p className="mt-2">
              You've been invited to join the Construction Blocker Management System by {userData.name}.
            </p>
            <p className="mt-2">
              <strong>Company:</strong> {inviteEmail.company || '[Company Name]'}<br />
              <strong>Role:</strong> {inviteEmail.role || 'supervisor'}
            </p>
            {inviteEmail.message && (
              <div className="mt-2">
                <strong>Message:</strong>
                <p className="mt-1 italic">{inviteEmail.message}</p>
              </div>
            )}
            <p className="mt-4">
              Click the link below to set up your account and start managing construction blockers.
            </p>
            <div className="mt-4 p-2 bg-blue-100 rounded text-center">
              <strong>[Setup Account Button]</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminInterface = () => (
    <div className="space-y-6">
      {/* Admin Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setAdminView('drawings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                adminView === 'drawings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="inline h-4 w-4 mr-2" />
              Site Drawings
            </button>
            <button
              onClick={() => setAdminView('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                adminView === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline h-4 w-4 mr-2" />
              User Management
            </button>
            <button
              onClick={() => setAdminView('invites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                adminView === 'invites'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="inline h-4 w-4 mr-2" />
              Send Invitations
            </button>
          </nav>
        </div>
      </div>

      {/* Admin Content */}
      {adminView === 'drawings' && renderAdminDrawings()}
      {adminView === 'users' && renderAdminUsers()}
      {adminView === 'invites' && renderAdminInvites()}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Blockers List</h1>
              <span className="text-sm text-gray-500">Field App</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {userData.name} ({userData.role})</span>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedBlocker(null);
                setIsCreatingBlocker(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'dashboard' && !selectedBlocker
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentView('tracking');
                setSelectedBlocker(null);
                setIsCreatingBlocker(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                currentView === 'tracking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Track My Blockers</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('create');
                setSelectedBlocker(null);
                setIsCreatingBlocker(true);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                isCreatingBlocker
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Create Blocker</span>
            </button>
            {hasPermission('admin') && (
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setSelectedBlocker(null);
                  setIsCreatingBlocker(false);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                  currentView === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedBlocker ? renderBlockerDetail() :
         isCreatingBlocker ? renderCreateBlocker() :
         currentView === 'tracking' ? renderTrackingView() :
         currentView === 'admin' ? renderAdminInterface() :
         renderDashboard()}
      </main>
    </div>
  );
};

// Main App with Authentication
const App = () => {
  return (
    <AuthProvider>
      <AuthApp />
    </AuthProvider>
  );
};

// App component that handles authentication state
const AuthApp = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return user ? <AuthWrapper /> : (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (user && profile) ? <BlockersApp /> : <AuthWrapper />;
};

export default App;