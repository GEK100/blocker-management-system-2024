import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import { drawingAPI } from '../../lib/drawingAPI';
import notificationService from '../../lib/notificationService';
import Button from '../../design-system/components/Button';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import {
  DocumentIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ProjectDrawingsManager = ({ companyId, onBack }) => {
  const { user, userRole } = useSmartAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Data states
  const [projects, setProjects] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);

  // Upload form state
  const [uploadData, setUploadData] = useState({
    projectId: '',
    category: 'floor_plan',
    description: '',
    floor: '',
    section: ''
  });

  useEffect(() => {
    loadDrawingsData();
  }, [companyId]);

  const loadDrawingsData = async () => {
    setLoading(true);
    try {
      // Load projects and drawings
      const projectsData = generateProjectsData();
      const drawingsData = await loadProjectDrawings();

      setProjects(projectsData);
      setDrawings(drawingsData);
    } catch (error) {
      console.error('Error loading drawings data:', error);
      initializeDemoData();
    } finally {
      setLoading(false);
    }
  };

  const generateProjectsData = () => {
    return [
      {
        id: 'proj1',
        name: 'Downtown Office Complex',
        status: 'active',
        manager: 'John Smith',
        location: 'Downtown District',
        floors: ['B1', 'GF', 'L1', 'L2', 'L3', 'L4', 'L5', 'RF'],
        sections: ['North Wing', 'South Wing', 'Central Core']
      },
      {
        id: 'proj2',
        name: 'Residential Tower A',
        status: 'active',
        manager: 'Sarah Johnson',
        location: 'Riverside Complex',
        floors: ['B2', 'B1', 'GF', 'P1', 'P2', 'L1-L20', 'RF'],
        sections: ['East Block', 'West Block', 'Amenities']
      },
      {
        id: 'proj3',
        name: 'Industrial Warehouse',
        status: 'planning',
        manager: 'Mike Chen',
        location: 'Industrial Zone',
        floors: ['GF', 'Mezzanine', 'RF'],
        sections: ['Storage Area', 'Loading Dock', 'Office Area']
      },
      {
        id: 'proj4',
        name: 'Shopping Center Phase 2',
        status: 'active',
        manager: 'Lisa Rodriguez',
        location: 'Commercial District',
        floors: ['B1', 'GF', 'L1', 'L2'],
        sections: ['Retail Wing', 'Food Court', 'Parking']
      }
    ];
  };

  const loadProjectDrawings = async () => {
    // Generate realistic drawings data
    const mockDrawings = [
      {
        id: 'draw1',
        projectId: 'proj1',
        fileName: 'Floor_Plan_L1_North_Wing.pdf',
        originalName: 'Floor Plan L1 North Wing.pdf',
        category: 'floor_plan',
        floor: 'L1',
        section: 'North Wing',
        description: 'Level 1 floor plan for the north wing office spaces',
        uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'john.smith@company.com',
        fileSize: 2.4,
        fileType: 'application/pdf',
        version: '1.0',
        status: 'active'
      },
      {
        id: 'draw2',
        projectId: 'proj1',
        fileName: 'Electrical_Layout_L2.dwg',
        originalName: 'Electrical Layout L2.dwg',
        category: 'electrical',
        floor: 'L2',
        section: 'Central Core',
        description: 'Electrical layout and power distribution for Level 2',
        uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'sarah.supervisor@company.com',
        fileSize: 1.8,
        fileType: 'application/dwg',
        version: '2.1',
        status: 'active'
      },
      {
        id: 'draw3',
        projectId: 'proj2',
        fileName: 'Structural_Plans_GF.pdf',
        originalName: 'Structural Plans Ground Floor.pdf',
        category: 'structural',
        floor: 'GF',
        section: 'East Block',
        description: 'Structural engineering plans for ground floor',
        uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'mike.engineer@company.com',
        fileSize: 5.2,
        fileType: 'application/pdf',
        version: '1.5',
        status: 'active'
      },
      {
        id: 'draw4',
        projectId: 'proj2',
        fileName: 'HVAC_System_L1-L5.pdf',
        originalName: 'HVAC System Layout L1-L5.pdf',
        category: 'hvac',
        floor: 'L1-L5',
        section: 'West Block',
        description: 'HVAC system layout for residential floors 1-5',
        uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'lisa.hvac@company.com',
        fileSize: 3.7,
        fileType: 'application/pdf',
        version: '1.0',
        status: 'active'
      },
      {
        id: 'draw5',
        projectId: 'proj3',
        fileName: 'Site_Plan_Overview.jpg',
        originalName: 'Site Plan Overview.jpg',
        category: 'site_plan',
        floor: 'Site',
        section: 'Full Site',
        description: 'Overall site plan showing building placement and access roads',
        uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'mike.chen@company.com',
        fileSize: 0.8,
        fileType: 'image/jpeg',
        version: '3.0',
        status: 'active'
      },
      {
        id: 'draw6',
        projectId: 'proj4',
        fileName: 'Fire_Safety_Plan_All_Floors.pdf',
        originalName: 'Fire Safety Plan All Floors.pdf',
        category: 'safety',
        floor: 'All',
        section: 'All Areas',
        description: 'Fire safety and evacuation plans for all floors',
        uploadDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'lisa.rodriguez@company.com',
        fileSize: 1.2,
        fileType: 'application/pdf',
        version: '2.0',
        status: 'active'
      }
    ];

    return mockDrawings;
  };

  const initializeDemoData = () => {
    const demoProjects = generateProjectsData();
    const demoDrawings = loadProjectDrawings();

    setProjects(demoProjects);
    setDrawings(demoDrawings);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setUploadFiles(files);
  };

  const handleUpload = async () => {
    if (!uploadFiles.length || !uploadData.projectId) {
      alert('Please select files and a project');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = uploadFiles.map(async (file) => {
        const drawingData = {
          id: `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          projectId: uploadData.projectId,
          fileName: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
          originalName: file.name,
          category: uploadData.category,
          floor: uploadData.floor,
          section: uploadData.section,
          description: uploadData.description,
          uploadDate: new Date().toISOString(),
          uploadedBy: user.email,
          fileSize: (file.size / (1024 * 1024)).toFixed(1),
          fileType: file.type,
          version: '1.0',
          status: 'active'
        };

        // In a real app, upload file to storage service
        // const uploadResult = await drawingAPI.uploadDrawing(file, drawingData);
        // return uploadResult;

        return drawingData;
      });

      const uploadedDrawings = await Promise.all(uploadPromises);
      setDrawings(prev => [...prev, ...uploadedDrawings]);

      // Notify subcontractors of new drawings
      for (const drawing of uploadedDrawings) {
        try {
          await notificationService.notifyDrawingUpload(drawing);
        } catch (error) {
          console.error('Error sending drawing notification:', error);
        }
      }

      // Reset form
      setUploadFiles([]);
      setUploadData({
        projectId: '',
        category: 'floor_plan',
        description: '',
        floor: '',
        section: ''
      });
      setShowUploadModal(false);

    } catch (error) {
      console.error('Error uploading drawings:', error);
      alert('Error uploading drawings. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDrawing = async (drawingId) => {
    if (!window.confirm('Are you sure you want to delete this drawing?')) {
      return;
    }

    try {
      // In a real app, delete from storage and database
      // await drawingAPI.deleteDrawing(drawingId);

      setDrawings(prev => prev.filter(d => d.id !== drawingId));
    } catch (error) {
      console.error('Error deleting drawing:', error);
      alert('Error deleting drawing. Please try again.');
    }
  };

  const getFilteredDrawings = () => {
    return drawings.filter(drawing => {
      const matchesProject = !selectedProject || drawing.projectId === selectedProject;
      const matchesSearch = !searchTerm ||
        drawing.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drawing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drawing.floor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drawing.section.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || drawing.category === selectedCategory;

      return matchesProject && matchesSearch && matchesCategory;
    });
  };

  const getDrawingsByProject = () => {
    const filtered = getFilteredDrawings();
    const grouped = {};

    filtered.forEach(drawing => {
      if (!grouped[drawing.projectId]) {
        const project = projects.find(p => p.id === drawing.projectId);
        grouped[drawing.projectId] = {
          project: project,
          drawings: []
        };
      }
      grouped[drawing.projectId].drawings.push(drawing);
    });

    return grouped;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      floor_plan: DocumentIcon,
      structural: DocumentIcon,
      electrical: DocumentIcon,
      hvac: DocumentIcon,
      plumbing: DocumentIcon,
      site_plan: PhotoIcon,
      safety: ExclamationTriangleIcon,
      other: DocumentIcon
    };
    return icons[category] || DocumentIcon;
  };

  const getCategoryColor = (category) => {
    const colors = {
      floor_plan: 'blue',
      structural: 'green',
      electrical: 'yellow',
      hvac: 'purple',
      plumbing: 'cyan',
      site_plan: 'orange',
      safety: 'red',
      other: 'slate'
    };
    return colors[category] || 'slate';
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType?.includes('image')) return PhotoIcon;
    return DocumentIcon;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Project Drawings Management</h1>
            <p className="text-slate-600">Upload and manage project-specific drawings and floor plans</p>
          </div>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2"
        >
          <CloudArrowUpIcon className="h-4 w-4" />
          <span>Upload Drawings</span>
        </Button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Drawings</p>
              <p className="text-3xl font-bold text-slate-900">{drawings.length}</p>
            </div>
            <DocumentIcon className="h-8 w-8 text-construction-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Projects</p>
              <p className="text-3xl font-bold text-slate-900">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
            <FolderOpenIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Recent Uploads</p>
              <p className="text-3xl font-bold text-slate-900">
                {drawings.filter(d => new Date(d.uploadDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Storage Used</p>
              <p className="text-3xl font-bold text-slate-900">
                {drawings.reduce((sum, d) => sum + parseFloat(d.fileSize), 0).toFixed(1)}MB
              </p>
            </div>
            <CloudArrowUpIcon className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search drawings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-construction-500 focus:border-construction-500 w-full md:w-80"
            />
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="all">All Categories</option>
            <option value="floor_plan">Floor Plans</option>
            <option value="structural">Structural</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
            <option value="plumbing">Plumbing</option>
            <option value="site_plan">Site Plans</option>
            <option value="safety">Safety Plans</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Drawings by Project */}
      <div className="space-y-6">
        {Object.entries(getDrawingsByProject()).map(([projectId, data]) => (
          <Card key={projectId} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FolderOpenIcon className="h-6 w-6 text-construction-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{data.project.name}</h3>
                  <p className="text-sm text-slate-600">
                    {data.project.manager} • {data.drawings.length} drawings
                  </p>
                </div>
              </div>
              <Badge
                variant={data.project.status === 'active' ? 'construction' : 'secondary'}
                size="sm"
              >
                {data.project.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.drawings.map((drawing) => {
                const CategoryIcon = getCategoryIcon(drawing.category);
                const FileIcon = getFileTypeIcon(drawing.fileType);

                return (
                  <Card key={drawing.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FileIcon className="h-5 w-5 text-slate-400" />
                        <Badge variant={getCategoryColor(drawing.category)} size="sm">
                          {drawing.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="View Drawing"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        {(userRole === 'company_admin' || userRole === 'project_manager') && (
                          <button
                            onClick={() => handleDeleteDrawing(drawing.id)}
                            className="p-1 text-red-400 hover:text-red-600 rounded"
                            title="Delete Drawing"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900 truncate" title={drawing.originalName}>
                        {drawing.originalName}
                      </h4>

                      {drawing.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {drawing.description}
                        </p>
                      )}

                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{drawing.floor}</span>
                        <span>{drawing.fileSize}MB</span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{drawing.section}</span>
                        <span>v{drawing.version}</span>
                      </div>

                      <div className="text-xs text-slate-500">
                        Uploaded {new Date(drawing.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {data.drawings.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No drawings found for this project.</p>
              </div>
            )}
          </Card>
        ))}

        {Object.keys(getDrawingsByProject()).length === 0 && (
          <Card className="p-12">
            <div className="text-center text-slate-500">
              <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No drawings found</h3>
              <p>No drawings match your current filters. Try adjusting your search criteria.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Project Drawings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Project *
                  </label>
                  <select
                    value={uploadData.projectId}
                    onChange={(e) => setUploadData(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                    required
                  >
                    <option value="">Choose a project...</option>
                    {projects.filter(p => p.status === 'active').map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category
                    </label>
                    <select
                      value={uploadData.category}
                      onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                    >
                      <option value="floor_plan">Floor Plan</option>
                      <option value="structural">Structural</option>
                      <option value="electrical">Electrical</option>
                      <option value="hvac">HVAC</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="site_plan">Site Plan</option>
                      <option value="safety">Safety Plan</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Floor/Level
                    </label>
                    <input
                      type="text"
                      value={uploadData.floor}
                      onChange={(e) => setUploadData(prev => ({ ...prev, floor: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                      placeholder="e.g., L1, GF, B1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Section/Area
                  </label>
                  <input
                    type="text"
                    value={uploadData.section}
                    onChange={(e) => setUploadData(prev => ({ ...prev, section: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                    placeholder="e.g., North Wing, Central Core"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                    rows="3"
                    placeholder="Brief description of the drawing..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Files *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.dwg,.jpg,.jpeg,.png,.gif,.bmp"
                    onChange={handleFileSelect}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Supported formats: PDF, DWG, JPG, PNG, GIF, BMP (Max 10MB per file)
                  </p>
                </div>

                {uploadFiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Selected Files:</h4>
                    <div className="space-y-2">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div className="flex items-center space-x-2">
                            <DocumentIcon className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-700">{file.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {(file.size / (1024 * 1024)).toFixed(1)}MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFiles.length || !uploadData.projectId}
                >
                  {uploading ? 'Uploading...' : 'Upload Drawings'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDrawingsManager;