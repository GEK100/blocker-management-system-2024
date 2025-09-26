import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import ProjectAnalyticsDashboard from '../analytics/ProjectAnalyticsDashboard';
import SubcontractorPerformanceAnalytics from '../analytics/SubcontractorPerformanceAnalytics';
import ProjectTeamManagement from '../team/ProjectTeamManagement';
import ProjectDrawingsManager from '../drawings/ProjectDrawingsManager';
import Button from '../../design-system/components/Button';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  SwitchHorizontalIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

const ProjectNavigationWrapper = ({ companyId, onBack }) => {
  const { user, userRole } = useSmartAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [companyId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      // Generate realistic project data
      const projectsData = [
        {
          id: 'proj1',
          name: 'Downtown Office Complex',
          status: 'active',
          manager: 'John Smith',
          location: 'Downtown District',
          progress: 75,
          startDate: '2024-01-15',
          endDate: '2024-12-20',
          budget: 2500000,
          teamSize: 12,
          totalBlockers: 8,
          resolvedBlockers: 6,
          criticalIssues: 1,
          lastActivity: '2 hours ago',
          description: 'Modern 15-story office building with retail ground floor',
          floors: ['B1', 'GF', 'L1-L15', 'RF'],
          sections: ['North Wing', 'South Wing', 'Central Core'],
          trades: ['structural', 'electrical', 'hvac', 'plumbing']
        },
        {
          id: 'proj2',
          name: 'Residential Tower A',
          status: 'active',
          manager: 'Sarah Johnson',
          location: 'Riverside Complex',
          progress: 60,
          startDate: '2024-03-01',
          endDate: '2025-02-28',
          budget: 4200000,
          teamSize: 18,
          totalBlockers: 12,
          resolvedBlockers: 9,
          criticalIssues: 2,
          lastActivity: '1 hour ago',
          description: '25-story residential tower with 200 units',
          floors: ['B2', 'B1', 'GF', 'P1', 'P2', 'L1-L25', 'RF'],
          sections: ['East Block', 'West Block', 'Amenities'],
          trades: ['structural', 'electrical', 'hvac', 'plumbing', 'elevators']
        },
        {
          id: 'proj3',
          name: 'Industrial Warehouse',
          status: 'planning',
          manager: 'Mike Chen',
          location: 'Industrial Zone',
          progress: 25,
          startDate: '2024-05-01',
          endDate: '2024-11-30',
          budget: 1800000,
          teamSize: 8,
          totalBlockers: 3,
          resolvedBlockers: 1,
          criticalIssues: 0,
          lastActivity: '4 hours ago',
          description: 'Large-scale distribution center with automated systems',
          floors: ['GF', 'Mezzanine', 'RF'],
          sections: ['Storage Area', 'Loading Dock', 'Office Area'],
          trades: ['structural', 'electrical', 'hvac']
        },
        {
          id: 'proj4',
          name: 'Shopping Center Phase 2',
          status: 'active',
          manager: 'Lisa Rodriguez',
          location: 'Commercial District',
          progress: 40,
          startDate: '2024-02-15',
          endDate: '2024-10-15',
          budget: 3100000,
          teamSize: 15,
          totalBlockers: 7,
          resolvedBlockers: 4,
          criticalIssues: 1,
          lastActivity: '30 minutes ago',
          description: 'Extension of existing shopping center with new retail spaces',
          floors: ['B1', 'GF', 'L1', 'L2'],
          sections: ['Retail Wing', 'Food Court', 'Parking'],
          trades: ['structural', 'electrical', 'hvac', 'plumbing', 'fire_safety']
        },
        {
          id: 'proj5',
          name: 'Medical Center Renovation',
          status: 'completed',
          manager: 'Dr. Patricia Wilson',
          location: 'Healthcare District',
          progress: 100,
          startDate: '2023-08-01',
          endDate: '2024-01-31',
          budget: 2200000,
          teamSize: 10,
          totalBlockers: 15,
          resolvedBlockers: 15,
          criticalIssues: 0,
          lastActivity: '2 weeks ago',
          description: 'Complete renovation of existing medical facility',
          floors: ['GF', 'L1', 'L2'],
          sections: ['Emergency Wing', 'Patient Rooms', 'Operating Theater'],
          trades: ['electrical', 'hvac', 'plumbing', 'medical_gas']
        }
      ];

      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setCurrentProject(project);
    setActiveView('overview');
    setShowProjectSelector(false);
    setSearchTerm('');
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
    setActiveView('overview');
  };

  const getFilteredProjects = () => {
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'construction',
      planning: 'yellow',
      on_hold: 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'slate';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Company Admin', onClick: onBack },
      { label: 'Projects', onClick: currentProject ? handleBackToProjects : null }
    ];

    if (currentProject) {
      breadcrumbs.push({ label: currentProject.name, onClick: null });

      if (activeView !== 'overview') {
        const viewLabels = {
          analytics: 'Analytics',
          team: 'Team Management',
          drawings: 'Drawings',
          subcontractor_analytics: 'Contractor Performance'
        };
        breadcrumbs.push({ label: viewLabels[activeView] || activeView, onClick: null });
      }
    }

    return (
      <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-6">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRightIcon className="h-4 w-4 text-slate-400" />}
            {crumb.onClick ? (
              <button
                onClick={crumb.onClick}
                className="hover:text-slate-900 transition-colors"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-slate-900 font-medium">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  };

  const renderProjectSelector = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Management</h1>
          <p className="text-slate-600">Select a project to manage its analytics, team, and drawings</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
          />
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredProjects().map((project) => (
          <Card
            key={project.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-construction-500"
            onClick={() => handleProjectSelect(project)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <Badge variant={getStatusColor(project.status)} size="sm">
                  {project.status}
                </Badge>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Progress</span>
                  <span className={`text-sm font-medium ${getProgressColor(project.progress)}`}>
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-construction-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Manager</p>
                  <p className="font-medium text-slate-900">{project.manager}</p>
                </div>
                <div>
                  <p className="text-slate-600">Team Size</p>
                  <p className="font-medium text-slate-900">{project.teamSize} members</p>
                </div>
                <div>
                  <p className="text-slate-600">Active Blockers</p>
                  <p className="font-medium text-slate-900">
                    {project.totalBlockers - project.resolvedBlockers}
                    {project.criticalIssues > 0 && (
                      <span className="text-red-600 ml-1">({project.criticalIssues} critical)</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Location</p>
                  <p className="font-medium text-slate-900">{project.location}</p>
                </div>
              </div>

              {/* Budget */}
              <div>
                <p className="text-slate-600 text-sm">Budget</p>
                <p className="font-semibold text-slate-900">
                  ${(project.budget / 1000000).toFixed(1)}M
                </p>
              </div>

              {/* Action */}
              <div className="flex items-center text-construction-600 pt-2 border-t border-slate-100">
                <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Manage Project</span>
                <ChevronRightIcon className="h-4 w-4 ml-auto" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {getFilteredProjects().length === 0 && (
        <Card className="p-12">
          <div className="text-center text-slate-500">
            <BuildingOfficeIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
            <p>No projects match your search criteria.</p>
          </div>
        </Card>
      )}
    </div>
  );

  const renderProjectDashboard = () => {
    if (!currentProject) return null;

    if (activeView === 'analytics') {
      return (
        <ProjectAnalyticsDashboard
          project={currentProject}
          onBack={() => setActiveView('overview')}
          companyId={companyId}
        />
      );
    }

    if (activeView === 'subcontractor_analytics') {
      return (
        <SubcontractorPerformanceAnalytics
          companyId={companyId}
          projectId={currentProject.id}
          onBack={() => setActiveView('overview')}
        />
      );
    }

    if (activeView === 'team') {
      return (
        <ProjectTeamManagement
          project={currentProject}
          onBack={() => setActiveView('overview')}
          companyId={companyId}
        />
      );
    }

    if (activeView === 'drawings') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveView('overview')}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Project</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {currentProject.name} - Drawings
                </h1>
                <p className="text-slate-600">Manage project drawings and floor plans</p>
              </div>
            </div>
          </div>

          <ProjectDrawingsManager
            companyId={companyId}
            projectFilter={currentProject.id}
          />
        </div>
      );
    }

    // Default overview
    return (
      <div className="space-y-6">
        {/* Project Header */}
        <div className="bg-gradient-to-r from-construction-50 to-construction-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <h1 className="text-2xl font-bold text-construction-900">
                  {currentProject.name}
                </h1>
                <Badge variant={getStatusColor(currentProject.status)} size="lg">
                  {currentProject.status}
                </Badge>
              </div>
              <p className="text-construction-800 mb-4">{currentProject.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-construction-700">Manager</p>
                  <p className="font-medium text-construction-900">{currentProject.manager}</p>
                </div>
                <div>
                  <p className="text-construction-700">Progress</p>
                  <p className="font-medium text-construction-900">{currentProject.progress}%</p>
                </div>
                <div>
                  <p className="text-construction-700">Team Size</p>
                  <p className="font-medium text-construction-900">{currentProject.teamSize} members</p>
                </div>
                <div>
                  <p className="text-construction-700">Budget</p>
                  <p className="font-medium text-construction-900">
                    ${(currentProject.budget / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowProjectSelector(true)}
                className="flex items-center space-x-2"
              >
                <SwitchHorizontalIcon className="h-4 w-4" />
                <span>Switch Project</span>
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-construction-200 rounded-full h-3">
              <div
                className="bg-construction-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${currentProject.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            className="p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setActiveView('analytics')}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Project Analytics</h3>
                <p className="text-sm text-slate-600">View detailed project metrics</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-slate-400" />
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setActiveView('team')}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Team Management</h3>
                <p className="text-sm text-slate-600">Manage project team members</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-slate-400" />
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setActiveView('drawings')}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DocumentIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Drawings</h3>
                <p className="text-sm text-slate-600">View and manage drawings</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-slate-400" />
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setActiveView('subcontractor_analytics')}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Contractor Performance</h3>
                <p className="text-sm text-slate-600">Analyze contractor metrics</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-slate-400" />
            </div>
          </Card>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Blockers</p>
                <p className="text-3xl font-bold text-slate-900">
                  {currentProject.totalBlockers - currentProject.resolvedBlockers}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            {currentProject.criticalIssues > 0 && (
              <p className="text-sm text-red-600 mt-2">
                {currentProject.criticalIssues} critical issues requiring attention
              </p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Resolution Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {Math.round((currentProject.resolvedBlockers / currentProject.totalBlockers) * 100)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              {currentProject.resolvedBlockers} of {currentProject.totalBlockers} blockers resolved
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Last Activity</p>
                <p className="text-xl font-bold text-slate-900">{currentProject.lastActivity}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-2">Most recent project update</p>
          </Card>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderBreadcrumbs()}

      {showProjectSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Switch Project</h3>
                <button
                  onClick={() => setShowProjectSelector(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
              {renderProjectSelector()}
            </div>
          </div>
        </div>
      )}

      {currentProject ? renderProjectDashboard() : renderProjectSelector()}
    </div>
  );
};

export default ProjectNavigationWrapper;