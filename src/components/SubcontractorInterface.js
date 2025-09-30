import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../hooks/useSmartAuth';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentIcon,
  ChartBarIcon,
  CameraIcon,
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
  CameraIcon as CameraIconSolid
} from '@heroicons/react/24/solid';

const SubcontractorTab = ({ icon: Icon, iconSolid: IconSolid, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-3 px-2 mobile-tap-target transition-all duration-300 touch-manipulation rounded-xl hover-lift ${
      active
        ? 'nav-tab-active'
        : 'nav-tab-inactive'
    }`}
  >
    <div className="relative">
      {active && IconSolid ? (
        <IconSolid className="h-5 w-5 sm:h-6 sm:w-6" />
      ) : (
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      )}
      {badge && (
        <span className="badge badge-primary absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-xs font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
    <span className="text-xs mt-1 font-medium">{label}</span>
  </button>
);

const TouchButton = ({ children, onClick, variant = 'primary', size = 'lg', className = '', disabled = false }) => {
  const baseClasses = "active:scale-95";

  const variants = {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    success: "btn btn-success",
    danger: "btn btn-danger",
    outline: "btn btn-outline",
    ghost: "btn btn-ghost"
  };

  const sizes = {
    sm: "px-4 py-3 text-sm min-h-[44px]",
    md: "px-6 py-3 text-base min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[56px]",
    xl: "px-10 py-5 text-xl min-h-[64px]"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const SubcontractorInterface = ({ user, assignedProjects = [], projectDrawings = [], onCreateBlocker, onUpdateBlocker }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProject, setSelectedProject] = useState(assignedProjects[0] || null);
  const [blockers, setBlockers] = useState([]);
  const [showDrawingsModal, setShowDrawingsModal] = useState(false);
  const [selectedDrawingCategory, setSelectedDrawingCategory] = useState('all');
  const [showCreateBlocker, setShowCreateBlocker] = useState(false);

  // New blocker state
  const [newBlocker, setNewBlocker] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'safety',
    location: '',
    photos: [],
    relatedDrawing: '',
    relatedDrawingName: '',
    status: 'active'
  });

  useEffect(() => {
    // Load subcontractor-specific blockers
    const subcontractorBlockers = [
      {
        id: 'sub_blocker_1',
        title: 'Material Delivery Access Blocked',
        description: 'Cannot access loading dock due to concrete pour scheduled',
        priority: 'high',
        category: 'logistics',
        location: 'Loading Dock Area',
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdBy: user?.name || 'Subcontractor',
        projectId: selectedProject?.id,
        subcontractorId: user?.subcontractorId
      },
      {
        id: 'sub_blocker_2',
        title: 'Electrical Conduit Conflicts with HVAC',
        description: 'Planned electrical routes conflict with new HVAC ductwork installation',
        priority: 'medium',
        category: 'coordination',
        location: 'Floor 3 - Mechanical Room',
        status: 'pending_review',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdBy: user?.name || 'Subcontractor',
        projectId: selectedProject?.id,
        subcontractorId: user?.subcontractorId
      }
    ];
    setBlockers(subcontractorBlockers);
  }, [selectedProject, user]);

  const resetBlockerForm = () => {
    setNewBlocker({
      title: '',
      description: '',
      priority: 'medium',
      category: 'safety',
      location: '',
      photos: [],
      relatedDrawing: '',
      relatedDrawingName: '',
      status: 'active'
    });
  };

  const handleCreateBlocker = () => {
    const blocker = {
      ...newBlocker,
      id: `sub_blocker_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Subcontractor',
      projectId: selectedProject?.id,
      subcontractorId: user?.subcontractorId
    };

    setBlockers(prev => [blocker, ...prev]);
    onCreateBlocker?.(blocker);
    resetBlockerForm();
    setShowCreateBlocker(false);
    setActiveTab('blockers');
  };

  const DrawingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    // Filter drawings for the selected project
    const currentProjectDrawings = projectDrawings.filter(drawing =>
      drawing.projectId === selectedProject?.id && drawing.status === 'active'
    );

    // Filter by category
    const filteredDrawings = selectedDrawingCategory === 'all'
      ? currentProjectDrawings
      : currentProjectDrawings.filter(drawing => drawing.category === selectedDrawingCategory);

    const categories = [
      { value: 'all', label: 'All Categories' },
      { value: 'architectural', label: 'Architectural' },
      { value: 'structural', label: 'Structural' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'mechanical', label: 'Mechanical' },
      { value: 'plumbing', label: 'Plumbing' },
      { value: 'survey', label: 'Survey' }
    ];

    const getCategoryColor = (category) => {
      const colors = {
        architectural: 'bg-blue-100 text-blue-800',
        structural: 'bg-green-100 text-green-800',
        electrical: 'bg-yellow-100 text-yellow-800',
        mechanical: 'bg-purple-100 text-purple-800',
        plumbing: 'bg-indigo-100 text-indigo-800',
        survey: 'bg-gray-100 text-gray-800'
      };
      return colors[category] || 'bg-slate-100 text-slate-800';
    };

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Project Drawings</h3>
              {selectedProject && (
                <p className="text-sm text-slate-600">{selectedProject.name}</p>
              )}
            </div>
            <TouchButton
              onClick={onClose}
              variant="ghost"
              size="md"
              className="p-2"
            >
              <XMarkIcon className="h-5 w-5" />
            </TouchButton>
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Category
            </label>
            <select
              value={selectedDrawingCategory}
              onChange={(e) => setSelectedDrawingCategory(e.target.value)}
              className="form-select w-full py-2 text-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Drawings List */}
          <div className="space-y-3">
            {filteredDrawings.length > 0 ? (
              filteredDrawings.map(drawing => (
                <div key={drawing.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 text-sm">{drawing.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{drawing.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(drawing.category)}`}>
                        {drawing.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full">
                        {drawing.version}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Uploaded by: {drawing.uploadedBy}</span>
                    <span>{new Date(drawing.uploadedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <TouchButton
                      onClick={() => {
                        alert(`Opening ${drawing.name} - ${drawing.fileUrl}`);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs py-2"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </TouchButton>
                    <TouchButton
                      onClick={() => {
                        setNewBlocker(prev => ({
                          ...prev,
                          relatedDrawing: drawing.id,
                          relatedDrawingName: drawing.name
                        }));
                        setShowDrawingsModal(false);
                        setShowCreateBlocker(true);
                      }}
                      variant="primary"
                      size="sm"
                      className="flex-1 text-xs py-2"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Reference in Blocker
                    </TouchButton>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-slate-900 mb-1">No Drawings Found</h4>
                <p className="text-xs text-slate-600">
                  {selectedDrawingCategory === 'all'
                    ? 'No drawings have been uploaded for this project'
                    : `No ${selectedDrawingCategory} drawings found`}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 mt-6">
            <TouchButton
              onClick={onClose}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Close
            </TouchButton>
          </div>
        </div>
      </div>
    );
  };

  const renderHomeTab = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome, {user?.name || 'Subcontractor'}
        </h2>
        {selectedProject ? (
          <p className="text-slate-600">
            Working on: <span className="font-medium text-emerald-600">{selectedProject.name}</span>
          </p>
        ) : (
          <p className="text-slate-600">No project assigned</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <TouchButton
          onClick={() => setShowCreateBlocker(true)}
          variant="primary"
          size="lg"
          className="flex-col py-6"
          disabled={!selectedProject}
        >
          <ExclamationTriangleIcon className="h-6 w-6 mb-2" />
          <span className="text-sm">Report Issue</span>
        </TouchButton>

        <TouchButton
          onClick={() => setShowDrawingsModal(true)}
          variant="outline"
          size="lg"
          className="flex-col py-6"
          disabled={!selectedProject}
        >
          <DocumentIcon className="h-6 w-6 mb-2" />
          <span className="text-sm">View Drawings</span>
        </TouchButton>
      </div>

      {/* Recent Blockers */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Recent Issues</h3>
        <div className="space-y-3">
          {blockers.slice(0, 3).map(blocker => (
            <div key={blocker.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 text-sm">{blocker.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{blocker.location}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`badge text-xs ${
                      blocker.priority === 'high' ? 'badge-danger' :
                      blocker.priority === 'medium' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {blocker.priority}
                    </span>
                    <span className={`badge text-xs ${
                      blocker.status === 'active' ? 'badge-danger' :
                      blocker.status === 'pending_review' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {blocker.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {blockers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-slate-400" />
              <p className="text-sm">No issues reported yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBlockersTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Your Issues</h3>
        <TouchButton
          onClick={() => setShowCreateBlocker(true)}
          variant="primary"
          size="sm"
          disabled={!selectedProject}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Report Issue
        </TouchButton>
      </div>

      <div className="space-y-3">
        {blockers.map(blocker => (
          <div key={blocker.id} className="card p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{blocker.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{blocker.description}</p>
                  <p className="text-xs text-slate-500 mt-1">📍 {blocker.location}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`badge text-xs ${
                    blocker.priority === 'high' ? 'badge-danger' :
                    blocker.priority === 'medium' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {blocker.priority}
                  </span>
                  <span className={`badge text-xs ${
                    blocker.status === 'active' ? 'badge-danger' :
                    blocker.status === 'pending_review' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {blocker.status.replace('_', ' ')}
                  </span>
                  <span className="badge badge-slate text-xs">
                    {blocker.category}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(blocker.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {blockers.length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-900 mb-2">No Issues Reported</h4>
            <p className="text-slate-600 mb-4">Start by reporting your first issue or concern</p>
            <TouchButton
              onClick={() => setShowCreateBlocker(true)}
              variant="primary"
              size="lg"
              disabled={!selectedProject}
            >
              Report Your First Issue
            </TouchButton>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateBlockerModal = () => {
    if (!showCreateBlocker) return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Report Issue</h3>
            <TouchButton
              onClick={() => {
                setShowCreateBlocker(false);
                resetBlockerForm();
              }}
              variant="ghost"
              size="md"
              className="p-2"
            >
              <XMarkIcon className="h-5 w-5" />
            </TouchButton>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Issue Title *
              </label>
              <input
                type="text"
                value={newBlocker.title}
                onChange={(e) => setNewBlocker(prev => ({ ...prev, title: e.target.value }))}
                className="form-input w-full"
                placeholder="Brief description of the issue"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={newBlocker.description}
                onChange={(e) => setNewBlocker(prev => ({ ...prev, description: e.target.value }))}
                className="form-textarea w-full h-24"
                placeholder="Provide detailed information about the issue"
              />
            </div>

            {/* Priority and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  value={newBlocker.priority}
                  onChange={(e) => setNewBlocker(prev => ({ ...prev, priority: e.target.value }))}
                  className="form-select w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={newBlocker.category}
                  onChange={(e) => setNewBlocker(prev => ({ ...prev, category: e.target.value }))}
                  className="form-select w-full"
                >
                  <option value="safety">Safety</option>
                  <option value="quality">Quality</option>
                  <option value="logistics">Logistics</option>
                  <option value="coordination">Coordination</option>
                  <option value="materials">Materials</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={newBlocker.location}
                onChange={(e) => setNewBlocker(prev => ({ ...prev, location: e.target.value }))}
                className="form-input w-full"
                placeholder="Specific location of the issue"
              />
            </div>

            {/* Referenced Drawing */}
            {newBlocker.relatedDrawing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Referenced Drawing</p>
                      <p className="text-xs text-blue-700">{newBlocker.relatedDrawingName}</p>
                    </div>
                  </div>
                  <TouchButton
                    onClick={() => setNewBlocker(prev => ({
                      ...prev,
                      relatedDrawing: '',
                      relatedDrawingName: ''
                    }))}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </TouchButton>
                </div>
              </div>
            )}

            {/* Browse Drawings */}
            <div>
              <TouchButton
                onClick={() => setShowDrawingsModal(true)}
                variant="outline"
                size="lg"
                className="w-full py-3"
                disabled={!selectedProject}
              >
                <DocumentIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">Browse Project Drawings</span>
              </TouchButton>
              {!selectedProject && (
                <p className="text-xs text-slate-500 mt-1">Project required to access drawings</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex space-x-3">
                <TouchButton
                  onClick={() => {
                    setShowCreateBlocker(false);
                    resetBlockerForm();
                  }}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Cancel
                </TouchButton>
                <TouchButton
                  onClick={handleCreateBlocker}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={!newBlocker.title || !newBlocker.description || !newBlocker.location}
                >
                  Report Issue
                </TouchButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Subcontractor Portal</h1>
            <p className="text-sm text-slate-600">{user?.company || 'Subcontractor Company'}</p>
          </div>

          {/* Project Selector */}
          {assignedProjects.length > 0 && (
            <div className="min-w-0 flex-1 max-w-xs ml-4">
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = assignedProjects.find(p => p.id === e.target.value);
                  setSelectedProject(project);
                }}
                className="form-select w-full text-sm"
              >
                <option value="">Select Project</option>
                {assignedProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 overflow-x-auto">
        <div className="flex space-x-1 py-2">
          <SubcontractorTab
            icon={HomeIcon}
            label="Home"
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <SubcontractorTab
            icon={ClipboardDocumentListIcon}
            label="Issues"
            active={activeTab === 'blockers'}
            onClick={() => setActiveTab('blockers')}
            badge={blockers.length}
          />
          <SubcontractorTab
            icon={DocumentIcon}
            label="Drawings"
            active={activeTab === 'drawings'}
            onClick={() => setShowDrawingsModal(true)}
          />
          <SubcontractorTab
            icon={ChartBarIcon}
            label="Analytics"
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'blockers' && renderBlockersTab()}
        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Analytics Coming Soon</h3>
            <p className="text-slate-600">Track your project performance and metrics</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <DrawingsModal
        isOpen={showDrawingsModal}
        onClose={() => setShowDrawingsModal(false)}
      />
      {renderCreateBlockerModal()}
    </div>
  );
};

export default SubcontractorInterface;