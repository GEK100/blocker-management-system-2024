import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import { drawingAPI } from '../../lib/drawingAPI';
import { userManagementAPI } from '../../lib/userManagementAPI';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import {
  DocumentIcon,
  PhotoIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const FieldWorkerDrawings = () => {
  const { user, userRole } = useSmartAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  // Data states
  const [userProjects, setUserProjects] = useState([]);
  const [drawings, setDrawings] = useState([]);

  useEffect(() => {
    loadUserDrawings();
  }, [user]);

  const loadUserDrawings = async () => {
    setLoading(true);
    try {
      // Get user's assigned projects
      const projectsResult = await userManagementAPI.getUserProjects(user.id);
      if (projectsResult.success) {
        setUserProjects(projectsResult.projects);

        // Get drawings for all user's projects
        const drawingsResult = await drawingAPI.getUserAccessibleDrawings(user.id);
        if (drawingsResult.success) {
          setDrawings(drawingsResult.drawings);
        }
      } else {
        // Fallback to demo data
        initializeDemoData();
      }
    } catch (error) {
      console.error('Error loading user drawings:', error);
      initializeDemoData();
    } finally {
      setLoading(false);
    }
  };

  const initializeDemoData = () => {
    // Demo projects for field worker
    const demoProjects = [
      {
        id: 'proj1',
        name: 'Downtown Office Complex',
        status: 'active',
        user_role: 'field_worker',
        user_permissions: { view_drawings: true, upload_photos: true }
      },
      {
        id: 'proj2',
        name: 'Residential Tower A',
        status: 'active',
        user_role: 'field_worker',
        user_permissions: { view_drawings: true, upload_photos: true }
      }
    ];

    // Demo drawings based on user's projects
    const demoDrawings = [
      {
        id: 'draw1',
        project_id: 'proj1',
        file_name: 'Floor_Plan_L1_North_Wing.pdf',
        original_name: 'Floor Plan L1 North Wing.pdf',
        category: 'floor_plan',
        floor: 'L1',
        section: 'North Wing',
        description: 'Level 1 floor plan for the north wing office spaces',
        upload_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        uploaded_by: 'john.smith@company.com',
        file_size: 2.4,
        file_type: 'application/pdf',
        version: '1.0',
        status: 'active',
        project: { name: 'Downtown Office Complex', status: 'active' }
      },
      {
        id: 'draw2',
        project_id: 'proj1',
        file_name: 'Electrical_Layout_L2.dwg',
        original_name: 'Electrical Layout L2.dwg',
        category: 'electrical',
        floor: 'L2',
        section: 'Central Core',
        description: 'Electrical layout and power distribution for Level 2',
        upload_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        uploaded_by: 'sarah.supervisor@company.com',
        file_size: 1.8,
        file_type: 'application/dwg',
        version: '2.1',
        status: 'active',
        project: { name: 'Downtown Office Complex', status: 'active' }
      },
      {
        id: 'draw3',
        project_id: 'proj2',
        file_name: 'Structural_Plans_GF.pdf',
        original_name: 'Structural Plans Ground Floor.pdf',
        category: 'structural',
        floor: 'GF',
        section: 'East Block',
        description: 'Structural engineering plans for ground floor',
        upload_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        uploaded_by: 'mike.engineer@company.com',
        file_size: 5.2,
        file_type: 'application/pdf',
        version: '1.5',
        status: 'active',
        project: { name: 'Residential Tower A', status: 'active' }
      },
      {
        id: 'draw4',
        project_id: 'proj2',
        file_name: 'Safety_Plan_All_Floors.pdf',
        original_name: 'Safety Plan All Floors.pdf',
        category: 'safety',
        floor: 'All',
        section: 'All Areas',
        description: 'Fire safety and evacuation plans for all floors',
        upload_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        uploaded_by: 'safety.coordinator@company.com',
        file_size: 1.2,
        file_type: 'application/pdf',
        version: '2.0',
        status: 'active',
        project: { name: 'Residential Tower A', status: 'active' }
      }
    ];

    setUserProjects(demoProjects);
    setDrawings(demoDrawings);
  };

  const handleViewDrawing = async (drawingId) => {
    try {
      const result = await drawingAPI.downloadDrawing(drawingId, user.id);
      if (result.success) {
        // Open drawing in new tab
        window.open(result.downloadUrl, '_blank');
      } else {
        alert('Unable to view drawing: ' + result.error);
      }
    } catch (error) {
      console.error('Error viewing drawing:', error);
      alert('Error viewing drawing. Please try again.');
    }
  };

  const handleDownloadDrawing = async (drawingId) => {
    try {
      const result = await drawingAPI.downloadDrawing(drawingId, user.id);
      if (result.success) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.drawing.original_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Unable to download drawing: ' + result.error);
      }
    } catch (error) {
      console.error('Error downloading drawing:', error);
      alert('Error downloading drawing. Please try again.');
    }
  };

  const getFilteredDrawings = () => {
    return drawings.filter(drawing => {
      const matchesProject = selectedProject === 'all' || drawing.project_id === selectedProject;
      const matchesSearch = !searchTerm ||
        drawing.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      if (!grouped[drawing.project_id]) {
        const project = userProjects.find(p => p.id === drawing.project_id) ||
                        { id: drawing.project_id, name: drawing.project?.name || 'Unknown Project' };
        grouped[drawing.project_id] = {
          project: project,
          drawings: []
        };
      }
      grouped[drawing.project_id].drawings.push(drawing);
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
      <div>
        <h2 className="text-xl font-bold text-slate-900">Project Drawings</h2>
        <p className="text-slate-600">View drawings and plans for your assigned projects</p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">My Projects</p>
              <p className="text-3xl font-bold text-slate-900">{userProjects.length}</p>
            </div>
            <FolderOpenIcon className="h-8 w-8 text-construction-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Available Drawings</p>
              <p className="text-3xl font-bold text-slate-900">{drawings.length}</p>
            </div>
            <DocumentIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Recent Updates</p>
              <p className="text-3xl font-bold text-slate-900">
                {drawings.filter(d => new Date(d.upload_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
            <PhotoIcon className="h-8 w-8 text-green-600" />
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
            <option value="all">All Projects</option>
            {userProjects.map(project => (
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
                    {data.drawings.length} drawings available
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
                const FileIcon = getFileTypeIcon(drawing.file_type);

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
                          onClick={() => handleViewDrawing(drawing.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="View Drawing"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadDrawing(drawing.id)}
                          className="p-1 text-slate-400 hover:text-green-600 rounded"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900 truncate" title={drawing.original_name}>
                        {drawing.original_name}
                      </h4>

                      {drawing.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {drawing.description}
                        </p>
                      )}

                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{drawing.floor}</span>
                        <span>{drawing.file_size}MB</span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{drawing.section}</span>
                        <span>v{drawing.version}</span>
                      </div>

                      <div className="text-xs text-slate-500">
                        Updated {new Date(drawing.upload_date).toLocaleDateString()}
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No drawings available</h3>
              <p>No drawings match your current filters or you don't have access to any project drawings yet.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FieldWorkerDrawings;