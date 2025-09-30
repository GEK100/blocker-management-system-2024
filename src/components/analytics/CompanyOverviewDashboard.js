import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import { subcontractorAPI } from '../../lib/subcontractorAPI';
import ProjectNavigationWrapper from '../navigation/ProjectNavigationWrapper';
import ProjectAnalyticsDashboard from './ProjectAnalyticsDashboard';
import SubcontractorPerformanceAnalytics from './SubcontractorPerformanceAnalytics';
import ProjectTeamManagement from '../team/ProjectTeamManagement';
import ProjectDrawingsManager from '../drawings/ProjectDrawingsManager';
import LessonsLearnedReport from './LessonsLearnedReport';
import Button from '../../design-system/components/Button';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FolderOpenIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  DocumentIcon,
  XMarkIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const CompanyOverviewDashboard = ({ companyId }) => {
  const { user, userRole } = useSmartAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [subcontractors, setSubcontractors] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blockers, setBlockers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showSubcontractorAnalytics, setShowSubcontractorAnalytics] = useState(false);
  const [showProjectTeamManagement, setShowProjectTeamManagement] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);
  const [showDrawingsManager, setShowDrawingsManager] = useState(false);
  const [showProjectNavigation, setShowProjectNavigation] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    budget: '',
    location: '',
    projectManager: '',
    assignedUsers: [], // Array of user IDs assigned to this project
    assignedSubcontractors: [], // Array of subcontractor company IDs assigned to this project
    projectTeam: [], // Array of team member IDs assigned to this project
    priority: 'medium',
    drawings: []
  });

  // Drawings state
  const [projectDrawings, setProjectDrawings] = useState([]);
  const [showDrawingUpload, setShowDrawingUpload] = useState(false);
  const [newDrawing, setNewDrawing] = useState({
    name: '',
    category: 'architectural',
    version: '1.0',
    description: '',
    file: null
  });

  // Subcontractor management within projects
  const [projectSubcontractors, setProjectSubcontractors] = useState([]);
  const [showProjectSubcontractorForm, setShowProjectSubcontractorForm] = useState(false);
  const [newSubcontractor, setNewSubcontractor] = useState({
    companyName: '',
    tradeType: '',
    contactEmail: '',
    contactPhone: '',
    users: [] // Array of individual subcontractor users
  });
  const [newSubcontractorUser, setNewSubcontractorUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'worker'
  });

  // Team management within projects
  const [projectTeam, setProjectTeam] = useState([]);
  const [showProjectTeamForm, setShowProjectTeamForm] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'field_worker',
    department: '',
    startDate: '',
    permissions: []
  });

  // Company/Platform Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalBlockers: 0,
    resolvedBlockers: 0,
    activeSubcontractors: 0,
    totalCompanies: 0,
    monthlyGrowth: 0
  });

  // Company Analytics Data
  const [analytics, setAnalytics] = useState({
    blockersByType: [],
    resolutionTimes: [],
    problematicLocations: [],
    contractorPerformance: [],
    blockerTrends: [],
    avgResolutionTime: 0,
    criticalBlockersCount: 0,
    overdueBlockersCount: 0
  });

  // Form states
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'field_worker'
  });

  const [subcontractorFormData, setSubcontractorFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    tradeType: '',
    projectIds: []
  });

  const [isEditingSubcontractor, setIsEditingSubcontractor] = useState(false);
  const [editingSubcontractorId, setEditingSubcontractorId] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showSubcontractorForm, setShowSubcontractorForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const generateAnalyticsData = (subcontractors, projects, totalBlockers) => {
    // Generate blocker types breakdown
    const blockerTypes = [
      { name: 'Electrical', value: Math.floor(totalBlockers * 0.3), color: '#f59e0b' },
      { name: 'Plumbing', value: Math.floor(totalBlockers * 0.25), color: '#3b82f6' },
      { name: 'HVAC', value: Math.floor(totalBlockers * 0.2), color: '#10b981' },
      { name: 'Structural', value: Math.floor(totalBlockers * 0.15), color: '#ef4444' },
      { name: 'Other', value: Math.floor(totalBlockers * 0.1), color: '#8b5cf6' }
    ];

    // Generate resolution times by subcontractor
    const resolutionData = subcontractors.slice(0, 5).map((sub, index) => ({
      contractor: sub.name,
      company: sub.company_name || sub.companyName,
      avgHours: 24 + (index * 12) + Math.random() * 24,
      blockersSolved: 5 + Math.floor(Math.random() * 15),
      tradeType: sub.trade_type || sub.tradeType
    }));

    // Generate problematic locations
    const locations = [
      { floor: 'Ground Floor', issues: 8, severity: 'High' },
      { floor: '2nd Floor', issues: 6, severity: 'Medium' },
      { floor: 'Basement', issues: 5, severity: 'High' },
      { floor: '1st Floor', issues: 4, severity: 'Low' },
      { floor: '3rd Floor', issues: 3, severity: 'Medium' }
    ];

    // Generate contractor performance
    const performance = subcontractors.slice(0, 6).map((sub, index) => ({
      id: sub.id,
      name: sub.name,
      company: sub.company_name || sub.companyName,
      tradeType: sub.trade_type || sub.tradeType,
      efficiency: 85 + Math.random() * 15,
      completionRate: 88 + Math.random() * 12,
      avgRating: 4.2 + Math.random() * 0.8,
      totalJobs: 15 + Math.floor(Math.random() * 25),
      onTimeDelivery: 85 + Math.random() * 15
    }));

    // Generate blocker trends (last 7 days)
    const trends = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      created: Math.floor(Math.random() * 5) + 2,
      resolved: Math.floor(Math.random() * 4) + 1
    }));

    setAnalytics({
      blockersByType: blockerTypes,
      resolutionTimes: resolutionData,
      problematicLocations: locations,
      contractorPerformance: performance,
      blockerTrends: trends,
      avgResolutionTime: 48 + Math.random() * 24,
      criticalBlockersCount: Math.floor(totalBlockers * 0.15),
      overdueBlockersCount: Math.floor(totalBlockers * 0.08)
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Load subcontractors with proper company ID
      const currentCompanyId = companyId || 'demo_company';

      // Initialize demo data if none exists
      const result = await subcontractorAPI.getSubcontractors(currentCompanyId);
      if (result.success && result.subcontractors.length === 0) {
        // Create demo data
        await subcontractorAPI.createDemoData(currentCompanyId);
        const updatedResult = await subcontractorAPI.getSubcontractors(currentCompanyId);
        if (updatedResult.success) {
          setSubcontractors(updatedResult.subcontractors.filter(sub => sub.status === 'active'));
        }
      } else if (result.success) {
        setSubcontractors(result.subcontractors.filter(sub => sub.status === 'active'));
      } else {
        console.error('Failed to load subcontractors:', result.error);
        setSubcontractors([]);
      }

      // Mock data for demo - replace with actual API calls
      const mockUsers = [
        { id: 1, name: 'John Smith', email: 'john@company.com', role: 'field_worker', status: 'active' },
        { id: 2, name: 'Jane Doe', email: 'jane@company.com', role: 'supervisor', status: 'active' },
        { id: 3, name: 'Bob Wilson', email: 'bob@company.com', role: 'project_manager', status: 'inactive' }
      ];

      const mockProjects = [
        {
          id: 1,
          name: 'Downtown Office Complex',
          status: 'active',
          blockers: 15,
          resolved: 8,
          critical: 2,
          progress: 65,
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(),
          manager: 'John Smith',
          assignedUsers: [],
          budget: 2500000,
          timeline: '18 months'
        },
        {
          id: 2,
          name: 'Residential Tower A',
          status: 'active',
          blockers: 8,
          resolved: 12,
          critical: 1,
          progress: 45,
          lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleDateString(),
          manager: 'Sarah Johnson',
          assignedUsers: [],
          budget: 1800000,
          timeline: '12 months'
        },
        {
          id: 3,
          name: 'Shopping Center Renovation',
          status: 'active',
          blockers: 12,
          resolved: 18,
          critical: 3,
          progress: 80,
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleDateString(),
          manager: 'Mike Davis',
          assignedUsers: [],
          budget: 3200000,
          timeline: '24 months'
        },
        {
          id: 4,
          name: 'Corporate Headquarters',
          status: 'planning',
          blockers: 3,
          resolved: 1,
          critical: 0,
          progress: 15,
          lastActivity: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleDateString(),
          manager: 'Lisa Chen',
          assignedUsers: [],
          budget: 4500000,
          timeline: '30 months'
        }
      ];

      // Comprehensive mock blockers data for lessons learned analysis
      const mockBlockers = [
        {
          id: 1,
          category: 'Electrical',
          description: 'Power distribution panel access blocked',
          location: 'Building A - Floor 2',
          priority: 'high',
          status: 'resolved',
          createdAt: '2024-01-15T10:30:00Z',
          resolvedAt: '2024-01-17T14:20:00Z',
          assignedContractor: 'ElectriCorp Solutions',
          contractorId: 1,
          resolutionTimeHours: 52,
          projectId: 1
        },
        {
          id: 2,
          category: 'Plumbing',
          description: 'Main water line interference with foundation',
          location: 'Building B - Basement',
          priority: 'critical',
          status: 'resolved',
          createdAt: '2024-01-20T08:15:00Z',
          resolvedAt: '2024-01-25T16:45:00Z',
          assignedContractor: 'FlowMaster Plumbing',
          contractorId: 2,
          resolutionTimeHours: 128,
          projectId: 2
        },
        {
          id: 3,
          category: 'HVAC',
          description: 'Ductwork conflicts with structural beams',
          location: 'Building A - Floor 3',
          priority: 'medium',
          status: 'in_progress',
          createdAt: '2024-02-01T09:00:00Z',
          assignedContractor: 'AirFlow Systems',
          contractorId: 3,
          projectId: 1
        },
        {
          id: 4,
          category: 'Structural',
          description: 'Load-bearing wall modification required',
          location: 'Building C - Floor 1',
          priority: 'critical',
          status: 'resolved',
          createdAt: '2024-01-10T07:30:00Z',
          resolvedAt: '2024-01-18T17:00:00Z',
          assignedContractor: 'SteelFrame Construction',
          contractorId: 4,
          resolutionTimeHours: 201,
          projectId: 3
        },
        {
          id: 5,
          category: 'Electrical',
          description: 'Emergency lighting circuit failure',
          location: 'Building A - Floor 1',
          priority: 'high',
          status: 'resolved',
          createdAt: '2024-02-05T11:20:00Z',
          resolvedAt: '2024-02-06T15:30:00Z',
          assignedContractor: 'ElectriCorp Solutions',
          contractorId: 1,
          resolutionTimeHours: 28,
          projectId: 1
        },
        {
          id: 6,
          category: 'Plumbing',
          description: 'Pipe routing through fire-rated wall',
          location: 'Building B - Floor 2',
          priority: 'medium',
          status: 'resolved',
          createdAt: '2024-01-25T13:45:00Z',
          resolvedAt: '2024-01-28T10:15:00Z',
          assignedContractor: 'FlowMaster Plumbing',
          contractorId: 2,
          resolutionTimeHours: 68,
          projectId: 2
        },
        {
          id: 7,
          category: 'HVAC',
          description: 'Ventilation system capacity insufficient',
          location: 'Building C - Floor 2',
          priority: 'high',
          status: 'resolved',
          createdAt: '2024-02-10T08:00:00Z',
          resolvedAt: '2024-02-15T12:30:00Z',
          assignedContractor: 'AirFlow Systems',
          contractorId: 3,
          resolutionTimeHours: 124,
          projectId: 3
        },
        {
          id: 8,
          category: 'Safety',
          description: 'Fall protection anchor points missing',
          location: 'Building A - Roof',
          priority: 'critical',
          status: 'resolved',
          createdAt: '2024-01-30T06:45:00Z',
          resolvedAt: '2024-01-31T18:00:00Z',
          assignedContractor: 'SafetyFirst Inc',
          contractorId: 5,
          resolutionTimeHours: 35,
          projectId: 1
        },
        {
          id: 9,
          category: 'Electrical',
          description: 'Data cable interference with power lines',
          location: 'Building B - Floor 3',
          priority: 'medium',
          status: 'resolved',
          createdAt: '2024-02-08T14:30:00Z',
          resolvedAt: '2024-02-12T09:45:00Z',
          assignedContractor: 'ElectriCorp Solutions',
          contractorId: 1,
          resolutionTimeHours: 91,
          projectId: 2
        },
        {
          id: 10,
          category: 'Structural',
          description: 'Foundation settling affecting alignment',
          location: 'Building C - Foundation',
          priority: 'critical',
          status: 'in_progress',
          createdAt: '2024-02-12T07:15:00Z',
          assignedContractor: 'SteelFrame Construction',
          contractorId: 4,
          projectId: 3
        },
        {
          id: 11,
          category: 'Plumbing',
          description: 'Water pressure inconsistency in upper floors',
          location: 'Building A - Floors 4-6',
          priority: 'medium',
          status: 'resolved',
          createdAt: '2024-02-01T10:00:00Z',
          resolvedAt: '2024-02-05T16:30:00Z',
          assignedContractor: 'FlowMaster Plumbing',
          contractorId: 2,
          resolutionTimeHours: 110,
          projectId: 1
        },
        {
          id: 12,
          category: 'HVAC',
          description: 'Thermostat wiring conflicts',
          location: 'Building B - Floor 1',
          priority: 'low',
          status: 'resolved',
          createdAt: '2024-02-14T12:00:00Z',
          resolvedAt: '2024-02-16T11:00:00Z',
          assignedContractor: 'AirFlow Systems',
          contractorId: 3,
          resolutionTimeHours: 47,
          projectId: 2
        }
      ];

      setUsers(mockUsers);
      setProjects(mockProjects);
      setBlockers(mockBlockers);

      // Calculate stats
      const totalBlockers = mockProjects.reduce((sum, p) => sum + p.blockers, 0);
      setStats({
        totalUsers: mockUsers.length,
        totalProjects: mockProjects.length,
        totalBlockers: totalBlockers,
        resolvedBlockers: Math.floor(totalBlockers * 0.6),
        activeSubcontractors: subcontractors.length,
        totalCompanies: userRole === 'super_admin' ? 12 : 1,
        monthlyGrowth: 15.8
      });

      // Generate analytics data
      generateAnalyticsData(subcontractors, mockProjects, totalBlockers);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Company Overview', icon: ChartBarIcon },
    { id: 'lessons-learned', label: 'Lessons Learned', icon: LightBulbIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon }
  ];

  // Add platform-specific tabs for super admin
  if (userRole === 'super_admin') {
    tabs.splice(1, 0, { id: 'companies', label: 'Companies', icon: BuildingOfficeIcon });
  }

  // Handler functions
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mock user creation - replace with actual API call
      const newUser = {
        id: Date.now(),
        ...userFormData,
        status: 'active'
      };
      setUsers([...users, newUser]);
      setUserFormData({ name: '', email: '', role: 'field_worker' });
      setShowUserForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleSubcontractorSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentCompanyId = companyId || 'demo_company';

      if (isEditingSubcontractor && editingSubcontractorId) {
        const result = await subcontractorAPI.updateSubcontractor(currentCompanyId, editingSubcontractorId, subcontractorFormData);
        if (result.success) {
          setSubcontractors(subcontractors.map(s => s.id === editingSubcontractorId ? result.subcontractor : s));
          resetSubcontractorForm();
        } else {
          alert('Error updating subcontractor: ' + result.error);
        }
      } else {
        const result = await subcontractorAPI.createSubcontractor(currentCompanyId, subcontractorFormData);
        if (result.success) {
          setSubcontractors([...subcontractors, result.subcontractor]);
          resetSubcontractorForm();
        } else {
          alert('Error creating subcontractor: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error saving subcontractor:', error);
      alert('Error saving subcontractor');
    }
  };

  const resetSubcontractorForm = () => {
    setSubcontractorFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      tradeType: '',
      projectIds: []
    });
    setIsEditingSubcontractor(false);
    setEditingSubcontractorId(null);
    setShowSubcontractorForm(false);
  };

  const handleEditSubcontractor = (subcontractor) => {
    setSubcontractorFormData({
      name: subcontractor.name,
      companyName: subcontractor.company_name || subcontractor.companyName,
      email: subcontractor.email,
      phone: subcontractor.phone,
      tradeType: subcontractor.trade_type || subcontractor.tradeType,
      projectIds: subcontractor.project_access || subcontractor.projectIds || []
    });
    setIsEditingSubcontractor(true);
    setEditingSubcontractorId(subcontractor.id);
    setShowSubcontractorForm(true);
  };

  const handleDeleteSubcontractor = async (id) => {
    if (window.confirm('Are you sure you want to delete this subcontractor?')) {
      try {
        const currentCompanyId = companyId || 'demo_company';
        const result = await subcontractorAPI.deleteSubcontractor(currentCompanyId, id);
        if (result.success) {
          setSubcontractors(subcontractors.filter(s => s.id !== id));
        } else {
          alert('Error deleting subcontractor: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting subcontractor:', error);
        alert('Error deleting subcontractor');
      }
    }
  };

  // Project Management Handlers
  const handleAddProject = () => {
    setShowAddProjectModal(true);
  };

  const handleCloseProjectModal = () => {
    setShowAddProjectModal(false);
    setNewProject({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: '',
      location: '',
      projectManager: '',
      assignedUsers: [],
      assignedSubcontractors: [],
      projectTeam: [],
      priority: 'medium',
      drawings: []
    });
    setProjectDrawings([]);
    setShowDrawingUpload(false);
    setNewDrawing({
      name: '',
      category: 'architectural',
      version: '1.0',
      description: '',
      file: null
    });
  };

  const handleProjectInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!newProject.name.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      // Generate new project with unique ID
      const newProjectData = {
        id: Date.now().toString(),
        ...newProject,
        drawings: projectDrawings,
        companyId: companyId || 'demo_company',
        createdAt: new Date().toISOString(),
        blockers: 0,
        teamMembers: newProject.assignedUsers.length
      };

      // Add to projects list
      setProjects(prev => [...prev, newProjectData]);

      // Close modal and reset form
      handleCloseProjectModal();

      alert('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  // Drawing management handlers
  const handleAddDrawing = () => {
    if (!newDrawing.name.trim()) {
      alert('Drawing name is required');
      return;
    }

    const drawing = {
      id: Date.now().toString(),
      ...newDrawing,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Current User',
      status: 'active'
    };

    setProjectDrawings(prev => [...prev, drawing]);
    setNewDrawing({
      name: '',
      category: 'architectural',
      version: '1.0',
      description: '',
      file: null
    });
    setShowDrawingUpload(false);
  };

  const handleRemoveDrawing = (drawingId) => {
    setProjectDrawings(prev => prev.filter(d => d.id !== drawingId));
  };

  const handleDrawingInputChange = (e) => {
    const { name, value } = e.target;
    setNewDrawing(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/vnd.ms-excel', 'text/csv'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid file type (PDF, Image, Excel, CSV)');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setNewDrawing(prev => ({
        ...prev,
        file: file,
        name: prev.name || file.name.split('.')[0]
      }));
    }
  };

  // Edit Project Handlers
  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'planning',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || '',
      location: project.location || '',
      projectManager: project.projectManager || '',
      assignedUsers: project.assignedUsers || [],
      assignedSubcontractors: project.assignedSubcontractors || [],
      priority: project.priority || 'medium',
      drawings: project.drawings || []
    });
    setProjectDrawings(project.drawings || []);
    setShowEditProjectModal(true);
  };

  const handleCloseEditProjectModal = () => {
    setShowEditProjectModal(false);
    setEditingProject(null);
    setNewProject({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: '',
      location: '',
      projectManager: '',
      assignedUsers: [],
      assignedSubcontractors: [],
      projectTeam: [],
      priority: 'medium',
      drawings: []
    });
    setProjectDrawings([]);
    setShowDrawingUpload(false);
    setNewDrawing({
      name: '',
      category: 'architectural',
      version: '1.0',
      description: '',
      file: null
    });
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();

    if (!newProject.name.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      // Update the project in the projects list
      setProjects(prev => prev.map(project =>
        project.id === editingProject.id
          ? { ...project, ...newProject, drawings: projectDrawings, teamMembers: newProject.assignedUsers.length, updatedAt: new Date().toISOString() }
          : project
      ));

      // Close modal and reset form
      handleCloseEditProjectModal();

      alert('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  };

  // Subcontractor management handlers for projects
  const handleAddSubcontractorToProject = () => {
    if (!newSubcontractor.companyName.trim() || !newSubcontractor.tradeType.trim()) {
      alert('Company name and trade type are required');
      return;
    }

    const subcontractorId = Date.now().toString();
    const subcontractorData = {
      id: subcontractorId,
      ...newSubcontractor
    };

    setProjectSubcontractors(prev => [...prev, subcontractorData]);
    setNewProject(prev => ({
      ...prev,
      assignedSubcontractors: [...prev.assignedSubcontractors, subcontractorId]
    }));

    // Reset form
    setNewSubcontractor({
      companyName: '',
      tradeType: '',
      contactEmail: '',
      contactPhone: '',
      users: []
    });

    // Also reset the user form
    setNewSubcontractorUser({
      name: '',
      email: '',
      phone: '',
      role: 'worker'
    });

    setShowProjectSubcontractorForm(false);
  };

  const handleAddUserToSubcontractor = () => {
    if (!newSubcontractorUser.name.trim() || !newSubcontractorUser.email.trim()) {
      alert('Name and email are required for subcontractor users');
      return;
    }

    setNewSubcontractor(prev => ({
      ...prev,
      users: [...prev.users, { ...newSubcontractorUser, id: Date.now().toString() }]
    }));

    // Reset user form
    setNewSubcontractorUser({
      name: '',
      email: '',
      phone: '',
      role: 'worker'
    });
  };

  const handleRemoveUserFromSubcontractor = (userId) => {
    setNewSubcontractor(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== userId)
    }));
  };

  const handleRemoveSubcontractorFromProject = (subcontractorId) => {
    setProjectSubcontractors(prev => prev.filter(sub => sub.id !== subcontractorId));
    setNewProject(prev => ({
      ...prev,
      assignedSubcontractors: prev.assignedSubcontractors.filter(id => id !== subcontractorId)
    }));
  };

  // Team management handlers for projects
  const handleAddTeamMemberToProject = () => {
    if (!newTeamMember.name.trim() || !newTeamMember.email.trim()) {
      alert('Name and email are required for team members');
      return;
    }

    const teamMemberId = Date.now().toString();
    const teamMemberData = {
      id: teamMemberId,
      ...newTeamMember
    };

    setProjectTeam(prev => [...prev, teamMemberData]);
    setNewProject(prev => ({
      ...prev,
      projectTeam: [...prev.projectTeam, teamMemberId]
    }));

    // Reset form
    setNewTeamMember({
      name: '',
      email: '',
      phone: '',
      role: 'field_worker',
      department: '',
      startDate: '',
      permissions: []
    });
    setShowProjectTeamForm(false);
  };

  const handleRemoveTeamMemberFromProject = (teamMemberId) => {
    setProjectTeam(prev => prev.filter(member => member.id !== teamMemberId));
    setNewProject(prev => ({
      ...prev,
      projectTeam: prev.projectTeam.filter(id => id !== teamMemberId)
    }));
  };

  const handleTogglePermission = (permission) => {
    setNewTeamMember(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Render Functions
  const renderCompanyMetrics = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Projects</p>
            <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
            <p className="text-xs text-green-600 mt-1">
              {projects.filter(p => p.status === 'active').length} active
            </p>
          </div>
          <FolderOpenIcon className="h-8 w-8 text-emerald-600" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Blockers</p>
            <p className="text-2xl font-bold text-slate-900">
              {projects.reduce((sum, p) => sum + p.blockers, 0)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {projects.reduce((sum, p) => sum + p.resolved, 0)} resolved
            </p>
          </div>
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Critical Issues</p>
            <p className="text-2xl font-bold text-red-600">
              {projects.reduce((sum, p) => sum + (p.critical || 0), 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across all projects</p>
          </div>
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Avg Progress</p>
            <p className="text-2xl font-bold text-emerald-600">
              {Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)}%
            </p>
            <p className="text-xs text-green-600 mt-1">Company-wide</p>
          </div>
          <ArrowTrendingUpIcon className="h-8 w-8 text-emerald-600" />
        </div>
      </Card>
    </div>
  );

  const renderProjectComparison = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-slate-900">Project Performance Comparison</h4>
        <p className="text-sm text-slate-600">Click on any project for detailed analytics</p>
      </div>

      <div className="space-y-4">
        {projects.map((project) => {
          const resolutionRate = project.blockers > 0 ?
            ((project.resolved / (project.blockers + project.resolved)) * 100).toFixed(1) : 100;
          const criticalIssues = project.critical || 0;

          return (
            <Card
              key={project.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-emerald-500"
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="text-lg font-semibold text-slate-900">{project.name}</h5>
                    <Badge
                      variant={project.status === 'active' ? 'construction' : 'secondary'}
                      size="sm"
                    >
                      {project.status}
                    </Badge>
                    {criticalIssues > 0 && (
                      <Badge variant="destructive" size="sm">
                        {criticalIssues} critical
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Progress</p>
                      <p className="font-medium text-slate-900">{project.progress}%</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Active Blockers</p>
                      <p className="font-medium text-slate-900">{project.blockers}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Resolution Rate</p>
                      <p className="font-medium text-slate-900">{resolutionRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Manager</p>
                      <p className="font-medium text-slate-900">{project.manager}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Last activity: {project.lastActivity}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectForTeam(project);
                          setShowProjectTeamManagement(true);
                        }}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        <span>Manage Team</span>
                      </button>
                      <div className="flex items-center text-emerald-600">
                        <span className="text-sm font-medium">View Analytics</span>
                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Company Metrics */}
      {renderCompanyMetrics()}

      {/* Project Analytics Buttons */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Project Analytics</h4>
            <p className="text-sm text-slate-600">Click on any project to view detailed analytics and insights</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {projects.map((project) => {
            const resolutionRate = project.blockers > 0 ?
              ((project.resolved / (project.blockers + project.resolved)) * 100).toFixed(1) : 100;
            const criticalIssues = project.critical || 0;

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="card text-left p-4 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-lg font-semibold text-slate-900 truncate">{project.name}</h5>
                    <Badge
                      variant={project.status === 'active' ? 'construction' : 'secondary'}
                      size="sm"
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Progress</p>
                      <p className="font-semibold text-slate-900">{project.progress}%</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Blockers</p>
                      <p className="font-semibold text-slate-900">{project.blockers}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Resolution Rate</p>
                      <p className="font-semibold text-green-600">{resolutionRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Critical</p>
                      <p className={`font-semibold ${criticalIssues > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {criticalIssues}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Manager: {project.manager}</span>
                    <div className="flex items-center text-emerald-600">
                      <span className="text-xs font-medium">View Analytics</span>
                      <ArrowRightIcon className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Project Analytics */}
      {selectedProject && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{selectedProject.name} - Detailed Analytics</h4>
              <p className="text-sm text-slate-600">Project manager: {selectedProject.manager}</p>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Overview */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-slate-900">Project Overview</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Progress</p>
                  <p className="text-2xl font-bold text-emerald-600">{selectedProject.progress}%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Active Blockers</p>
                  <p className="text-2xl font-bold text-red-600">{selectedProject.blockers}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{selectedProject.resolved}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600">{selectedProject.critical || 0}</p>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-slate-900">Project Details</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Budget:</span>
                  <span className="text-sm font-medium text-slate-900">
                    ${selectedProject.budget?.toLocaleString() || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Timeline:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedProject.timeline || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Last Activity:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedProject.lastActivity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <Badge
                    variant={selectedProject.status === 'active' ? 'construction' : 'secondary'}
                    size="sm"
                  >
                    {selectedProject.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Analytics for Selected Project */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h5 className="text-md font-semibold text-slate-900 mb-4">Performance Insights</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">
                  {((selectedProject.resolved / (selectedProject.blockers + selectedProject.resolved)) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-blue-600">Resolution Rate</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">
                  {Math.max(0, selectedProject.progress - selectedProject.blockers)}
                </p>
                <p className="text-sm text-green-600">Performance Score</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-lg font-bold text-yellow-600">
                  {selectedProject.critical > 0 ? 'High' : selectedProject.blockers > 5 ? 'Medium' : 'Low'}
                </p>
                <p className="text-sm text-yellow-600">Risk Level</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderCompanies = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Companies Management</h3>
      <div className="grid gap-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Company {index + 1}</h4>
                <p className="text-sm text-slate-600">Placeholder company data</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Projects Management</h3>
        <Button variant="primary" size="sm" onClick={handleAddProject}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{project.name}</h4>
                <p className="text-sm text-slate-600">{project.manager}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditProject(project)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <Badge variant={project.status === 'active' ? 'construction' : 'secondary'}>
                  {project.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Progress</span>
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Active Blockers</span>
                <span className="text-sm font-medium">{project.blockers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Budget</span>
                <span className="text-sm font-medium">${project.budget?.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-8">
      {/* Project Team Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Project Team Management</h3>
            <p className="text-sm text-slate-600 mt-1">Manage team assignments per project</p>
          </div>
        </div>

        {/* Project Selection for Team Management */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">{project.name}</h4>
                <Badge variant={project.status === 'active' ? 'construction' : 'secondary'} size="sm">
                  {project.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Manager:</span>
                  <span className="font-medium">{project.manager}</span>
                </div>
                <div className="flex justify-between">
                  <span>Team Members:</span>
                  <span className="font-medium">{project.teamMembers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Blockers:</span>
                  <span className="font-medium">{project.blockers}</span>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProjectForTeam(project);
                    setShowProjectTeamManagement(true);
                  }}
                  className="flex-1"
                >
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  Manage Team
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Legacy Users Management - Keep for backward compatibility */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Users</h3>
          <Button variant="primary" size="sm" onClick={() => setShowUserForm(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* User Form */}
        {showUserForm && (
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Add New User</h4>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="field_worker">Field Worker</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="project_manager">Project Manager</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <Button type="submit" variant="primary">Add User</Button>
                <Button type="button" variant="ghost" onClick={() => setShowUserForm(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Users List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {users.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">{user.name}</h4>
                  <p className="text-sm text-slate-600">{user.email}</p>
                  <Badge variant="secondary" size="sm" className="mt-2">
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSubcontractors = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Subcontractors</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowSubcontractorForm(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Subcontractor
        </Button>
      </div>

      {/* Subcontractor Form */}
      {showSubcontractorForm && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">
            {isEditingSubcontractor ? 'Edit Subcontractor' : 'Add New Subcontractor'}
          </h4>
          <form onSubmit={handleSubcontractorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
              <input
                type="text"
                value={subcontractorFormData.name}
                onChange={(e) => setSubcontractorFormData({...subcontractorFormData, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
              <input
                type="text"
                value={subcontractorFormData.companyName}
                onChange={(e) => setSubcontractorFormData({...subcontractorFormData, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={subcontractorFormData.email}
                onChange={(e) => setSubcontractorFormData({...subcontractorFormData, email: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                value={subcontractorFormData.phone}
                onChange={(e) => setSubcontractorFormData({...subcontractorFormData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trade Type</label>
              <select
                value={subcontractorFormData.tradeType}
                onChange={(e) => setSubcontractorFormData({...subcontractorFormData, tradeType: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select Trade Type</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC</option>
                <option value="structural">Structural</option>
                <option value="flooring">Flooring</option>
                <option value="roofing">Roofing</option>
                <option value="painting">Painting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2 flex space-x-3">
              <Button type="submit" variant="primary">
                {isEditingSubcontractor ? 'Update' : 'Add'} Subcontractor
              </Button>
              <Button type="button" variant="ghost" onClick={resetSubcontractorForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Subcontractors List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subcontractors.map((subcontractor) => (
          <Card key={subcontractor.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-semibold text-slate-900">{subcontractor.name}</h4>
                  <Badge variant="construction" size="sm">
                    {subcontractor.trade_type || subcontractor.tradeType}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">
                    {subcontractor.company_name || subcontractor.companyName}
                  </p>
                  <p className="text-sm text-slate-600">{subcontractor.email}</p>
                  {subcontractor.phone && (
                    <p className="text-sm text-slate-600">{subcontractor.phone}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditSubcontractor(subcontractor)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSubcontractor(subcontractor.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
      <Card className="p-6">
        <h4 className="text-md font-semibold text-slate-900 mb-4">Company Settings</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Email Notifications</span>
            <input type="checkbox" className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Auto-assign Blockers</span>
            <input type="checkbox" className="toggle" />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderProjectModal = () => {
    if (!showAddProjectModal && !showEditProjectModal) return null;

    const isEditing = showEditProjectModal;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="modal-content max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              {isEditing ? 'Edit Project' : 'Add New Project'}
            </h3>
            <button
              onClick={isEditing ? handleCloseEditProjectModal : handleCloseProjectModal}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={isEditing ? handleUpdateProject : handleCreateProject} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProject.name}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter project name"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newProject.description}
                  onChange={handleProjectInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter project description"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={newProject.status}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={newProject.priority}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={newProject.startDate}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={newProject.endDate}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Budget
                </label>
                <input
                  type="number"
                  name="budget"
                  value={newProject.budget}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Project budget"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={newProject.location}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Project location/address"
                />
              </div>

              {/* Project Manager */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Manager
                </label>
                <input
                  type="text"
                  name="projectManager"
                  value={newProject.projectManager}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Project manager name"
                />
              </div>

              {/* Assigned Team Members */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assigned Team Members
                </label>
                <select
                  multiple
                  value={newProject.assignedUsers}
                  onChange={(e) => {
                    const selectedUsers = Array.from(e.target.selectedOptions, option => option.value);
                    setNewProject(prev => ({ ...prev, assignedUsers: selectedUsers }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[120px]"
                >
                  {users.map(user => (
                    <option key={user.id} value={user.email}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Hold Ctrl/Cmd to select multiple users. Assigned users will see this project in their field worker interface.
                </p>
              </div>

              {/* Project Drawings Section */}
              <div className="md:col-span-2">
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-md font-semibold text-slate-900">Project Drawings</h4>
                      <p className="text-sm text-slate-600">Upload architectural plans, blueprints, and technical drawings</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="badge badge-success text-xs">Auto-synced</span>
                        <span className="text-xs text-slate-500">Available to Field Workers & Subcontractors</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDrawingUpload(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Drawing
                    </Button>
                  </div>

                  {/* Drawing Upload Form */}
                  {showDrawingUpload && (
                    <div className="bg-slate-50 p-4 rounded-lg mb-4">
                      <h5 className="text-sm font-semibold text-slate-900 mb-3">Upload New Drawing</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Drawing Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={newDrawing.name}
                            onChange={handleDrawingInputChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., Floor Plan Level 1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Drawing Type/Category</label>
                          <input
                            type="text"
                            name="category"
                            value={newDrawing.category}
                            onChange={handleDrawingInputChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., Architectural Plans, Electrical Schematics, Site Layout, Custom Category"
                          />
                          <p className="text-xs text-slate-500 mt-1">Enter any custom category or type name for this drawing</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Version</label>
                          <input
                            type="text"
                            name="version"
                            value={newDrawing.version}
                            onChange={handleDrawingInputChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., 1.0, Rev A"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">File Upload</label>
                          <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv"
                            className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:btn file:btn-secondary hover:file:shadow-soft"
                          />
                          <p className="text-xs text-slate-500 mt-1">Supported: PDF, Images, Excel, CSV (Max 10MB)</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                          <textarea
                            name="description"
                            value={newDrawing.description}
                            onChange={handleDrawingInputChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="Optional description or notes about this drawing"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-4">
                        <Button type="button" variant="primary" size="sm" onClick={handleAddDrawing}>
                          Add Drawing
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowDrawingUpload(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing Drawings List */}
                  {projectDrawings.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-slate-900">Added Drawings ({projectDrawings.length})</h5>
                      {projectDrawings.map((drawing) => (
                        <div key={drawing.id} className="card flex items-center justify-between p-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <DocumentIcon className="h-5 w-5 text-emerald-600" />
                              <div>
                                <p className="text-sm font-medium text-slate-900">{drawing.name}</p>
                                <div className="flex items-center space-x-4 text-xs text-slate-500">
                                  <span className="capitalize">{drawing.category}</span>
                                  <span>v{drawing.version}</span>
                                  {drawing.file && <span>{drawing.file.name}</span>}
                                </div>
                                {drawing.description && (
                                  <p className="text-xs text-slate-600 mt-1">{drawing.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDrawing(drawing.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {projectDrawings.length === 0 && !showDrawingUpload && (
                    <div className="text-center py-6 text-slate-500">
                      <DocumentIcon className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm">No drawings added yet</p>
                      <p className="text-xs">Click "Add Drawing" to upload project documents</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Subcontractors Section */}
              <div className="md:col-span-2">
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-md font-semibold text-slate-900">Project Subcontractors</h4>
                      <p className="text-sm text-slate-600">Manage subcontractor companies and their personnel for this project</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProjectSubcontractorForm(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Subcontractor
                    </Button>
                  </div>

                  {/* Subcontractor Form */}
                  {showProjectSubcontractorForm && (
                    <div className="bg-slate-50 p-4 rounded-lg mb-4">
                      <h5 className="text-sm font-semibold text-slate-900 mb-3">Add Subcontractor Company</h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
                          <input
                            type="text"
                            value={newSubcontractor.companyName}
                            onChange={(e) => setNewSubcontractor(prev => ({ ...prev, companyName: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Subcontractor company name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Trade Type *</label>
                          <select
                            value={newSubcontractor.tradeType}
                            onChange={(e) => setNewSubcontractor(prev => ({ ...prev, tradeType: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Select trade type</option>
                            <option value="electrical">Electrical</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="hvac">HVAC</option>
                            <option value="carpentry">Carpentry</option>
                            <option value="masonry">Masonry</option>
                            <option value="roofing">Roofing</option>
                            <option value="flooring">Flooring</option>
                            <option value="painting">Painting</option>
                            <option value="drywall">Drywall</option>
                            <option value="concrete">Concrete</option>
                            <option value="steel">Steel Work</option>
                            <option value="excavation">Excavation</option>
                            <option value="landscaping">Landscaping</option>
                            <option value="security">Security Systems</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
                          <input
                            type="email"
                            value={newSubcontractor.contactEmail}
                            onChange={(e) => setNewSubcontractor(prev => ({ ...prev, contactEmail: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Primary contact email"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
                          <input
                            type="tel"
                            value={newSubcontractor.contactPhone}
                            onChange={(e) => setNewSubcontractor(prev => ({ ...prev, contactPhone: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Primary contact phone"
                          />
                        </div>
                      </div>

                      {/* Subcontractor Users Section */}
                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="text-sm font-semibold text-slate-900">Subcontractor Personnel</h6>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (newSubcontractorUser.name && newSubcontractorUser.email) {
                                handleAddUserToSubcontractor();
                              }
                            }}
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Person
                          </Button>
                        </div>

                        {/* Add User Form */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <input
                            type="text"
                            value={newSubcontractorUser.name}
                            onChange={(e) => setNewSubcontractorUser(prev => ({ ...prev, name: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                            placeholder="Full name"
                          />
                          <input
                            type="email"
                            value={newSubcontractorUser.email}
                            onChange={(e) => setNewSubcontractorUser(prev => ({ ...prev, email: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                            placeholder="Email address"
                          />
                          <input
                            type="tel"
                            value={newSubcontractorUser.phone}
                            onChange={(e) => setNewSubcontractorUser(prev => ({ ...prev, phone: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                            placeholder="Phone (optional)"
                          />
                          <select
                            value={newSubcontractorUser.role}
                            onChange={(e) => setNewSubcontractorUser(prev => ({ ...prev, role: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          >
                            <option value="worker">Worker</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="foreman">Foreman</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>

                        {/* Current Users List */}
                        {newSubcontractor.users.length > 0 && (
                          <div className="space-y-2">
                            {newSubcontractor.users.map((user) => (
                              <div key={user.id} className="card flex items-center justify-between p-2">
                                <div className="flex-1">
                                  <span className="font-medium text-sm">{user.name}</span>
                                  <span className="text-slate-500 text-sm ml-2">({user.email})</span>
                                  <span className="text-xs bg-slate-100 px-2 py-1 rounded ml-2">{user.role}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveUserFromSubcontractor(user.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowProjectSubcontractorForm(false);
                            setNewSubcontractor({
                              companyName: '',
                              tradeType: '',
                              contactEmail: '',
                              contactPhone: '',
                              users: []
                            });
                            setNewSubcontractorUser({
                              name: '',
                              email: '',
                              phone: '',
                              role: 'worker'
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleAddSubcontractorToProject}
                        >
                          Add Subcontractor
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Current Project Subcontractors List */}
                  {projectSubcontractors.length > 0 ? (
                    <div className="space-y-3">
                      {projectSubcontractors.map((subcontractor) => (
                        <div key={subcontractor.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <h6 className="font-semibold text-slate-900">{subcontractor.companyName}</h6>
                              <Badge variant="construction" size="sm">
                                {subcontractor.tradeType}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSubcontractorFromProject(subcontractor.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>

                          {subcontractor.contactEmail && (
                            <p className="text-sm text-slate-600 mb-1">Contact: {subcontractor.contactEmail}</p>
                          )}

                          {subcontractor.users.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-slate-700 mb-1">Personnel ({subcontractor.users.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {subcontractor.users.map((user) => (
                                  <span key={user.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                                    {user.name} ({user.role})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <BuildingOfficeIcon className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm">No subcontractors assigned</p>
                      <p className="text-xs">Click "Add Subcontractor" to assign companies to this project</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Team Management Section */}
              <div className="md:col-span-2">
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-md font-semibold text-slate-900">Project Team Management</h4>
                      <p className="text-sm text-slate-600">Manage internal team members and their roles for this project</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProjectTeamForm(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  </div>

                  {/* Team Member Form */}
                  {showProjectTeamForm && (
                    <div className="bg-slate-50 p-4 rounded-lg mb-4">
                      <h5 className="text-sm font-semibold text-slate-900 mb-3">Add Team Member</h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                          <input
                            type="text"
                            value={newTeamMember.name}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Team member full name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                          <input
                            type="email"
                            value={newTeamMember.email}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="email@example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={newTeamMember.phone}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Phone number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                          <select
                            value={newTeamMember.role}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="field_worker">Field Worker</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="project_manager">Project Manager</option>
                            <option value="site_manager">Site Manager</option>
                            <option value="safety_officer">Safety Officer</option>
                            <option value="quality_controller">Quality Controller</option>
                            <option value="engineer">Engineer</option>
                            <option value="architect">Architect</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                          <input
                            type="text"
                            value={newTeamMember.department}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Department/Team"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={newTeamMember.startDate}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Permissions Section */}
                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <h6 className="text-sm font-semibold text-slate-900 mb-3">Project Permissions</h6>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { key: 'view_blockers', label: 'View Blockers' },
                            { key: 'create_blockers', label: 'Create Blockers' },
                            { key: 'assign_blockers', label: 'Assign Blockers' },
                            { key: 'resolve_blockers', label: 'Resolve Blockers' },
                            { key: 'view_drawings', label: 'View Drawings' },
                            { key: 'upload_drawings', label: 'Upload Drawings' },
                            { key: 'manage_team', label: 'Manage Team' },
                            { key: 'view_analytics', label: 'View Analytics' },
                            { key: 'export_reports', label: 'Export Reports' }
                          ].map(permission => (
                            <label key={permission.key} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newTeamMember.permissions.includes(permission.key)}
                                onChange={() => handleTogglePermission(permission.key)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-sm text-slate-700">{permission.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowProjectTeamForm(false);
                            setNewTeamMember({
                              name: '',
                              email: '',
                              phone: '',
                              role: 'field_worker',
                              department: '',
                              startDate: '',
                              permissions: []
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleAddTeamMemberToProject}
                        >
                          Add Team Member
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Current Project Team List */}
                  {projectTeam.length > 0 ? (
                    <div className="space-y-3">
                      {projectTeam.map((member) => (
                        <div key={member.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <h6 className="font-semibold text-slate-900">{member.name}</h6>
                              <Badge variant="construction" size="sm">
                                {member.role.replace('_', ' ')}
                              </Badge>
                              {member.department && (
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                  {member.department}
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTeamMemberFromProject(member.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="text-sm text-slate-600 space-y-1">
                            <div>📧 {member.email}</div>
                            {member.phone && <div>📞 {member.phone}</div>}
                            {member.startDate && <div>📅 Starts: {new Date(member.startDate).toLocaleDateString()}</div>}
                          </div>

                          {member.permissions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-slate-700 mb-1">Permissions:</p>
                              <div className="flex flex-wrap gap-1">
                                {member.permissions.map((permission) => (
                                  <span key={permission} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    {permission.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm">No team members assigned</p>
                      <p className="text-xs">Click "Add Team Member" to assign internal team members to this project</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                onClick={isEditing ? handleCloseEditProjectModal : handleCloseProjectModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {isEditing ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-1 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {userRole === 'super_admin' ? 'Platform Overview' : 'Company Overview'}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          {userRole === 'super_admin'
            ? 'Manage platform companies, statistics, and system usage'
            : 'Manage your company statistics, team, and projects'
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 -mx-2 sm:mx-0">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto px-2 sm:px-0 scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const buttonClasses = [
              'whitespace-nowrap py-3 sm:py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 flex-shrink-0 touch-manipulation',
              isActive
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            ].join(' ');

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={buttonClasses}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4 sm:mt-6 px-1 sm:px-0">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'companies' && userRole === 'super_admin' && renderCompanies()}
        {activeTab === 'lessons-learned' && (
          <LessonsLearnedReport
            blockers={blockers}
            subcontractors={subcontractors}
            projects={projects}
          />
        )}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Project Modal (Add/Edit) */}
      {renderProjectModal()}
    </div>
  );
};

export default CompanyOverviewDashboard;