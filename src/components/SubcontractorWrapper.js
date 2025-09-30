import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../hooks/useSmartAuth';
import SubcontractorInterface from './SubcontractorInterface';

const SubcontractorWrapper = () => {
  const { user } = useSmartAuth();
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [projectDrawings, setProjectDrawings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubcontractorData = async () => {
      try {
        setLoading(true);

        // Mock assigned projects for subcontractor
        const mockAssignedProjects = [
          {
            id: '1',
            name: 'Downtown Office Complex',
            description: 'Commercial office building construction',
            status: 'active',
            progress: 65,
            startDate: '2024-01-15',
            expectedEndDate: '2024-12-30',
            tradeAssignment: 'Electrical Work',
            area: 'Floors 1-5'
          },
          {
            id: '2',
            name: 'Residential Tower Project',
            description: 'High-rise residential building',
            status: 'active',
            progress: 40,
            startDate: '2024-03-01',
            expectedEndDate: '2025-08-15',
            tradeAssignment: 'Plumbing Installation',
            area: 'Floors 10-25'
          }
        ];

        // Mock project drawings data (same as field worker to ensure consistency)
        const mockProjectDrawings = [
          // Project 1 - Downtown Office Complex
          {
            id: 'drawing_1',
            projectId: '1',
            name: 'Ground Floor Plan',
            category: 'architectural',
            version: 'Rev C',
            description: 'Main entrance and lobby layout',
            uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            uploadedBy: 'John Smith',
            status: 'active',
            fileUrl: '/mock-drawings/ground-floor.pdf',
            fileType: 'pdf'
          },
          {
            id: 'drawing_2',
            projectId: '1',
            name: 'Electrical Layout - Floor 3',
            category: 'electrical',
            version: 'Rev B',
            description: 'Electrical distribution and conduit routing',
            uploadedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            uploadedBy: 'Sarah Johnson',
            status: 'active',
            fileUrl: '/mock-drawings/electrical-floor3.pdf',
            fileType: 'pdf'
          },
          {
            id: 'drawing_3',
            projectId: '1',
            name: 'HVAC Ductwork Plan',
            category: 'mechanical',
            version: 'Rev A',
            description: 'HVAC system layout and ductwork routing',
            uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            uploadedBy: 'Mike Brown',
            status: 'active',
            fileUrl: '/mock-drawings/hvac-layout.pdf',
            fileType: 'pdf'
          },
          // Project 2 - Residential Tower Project
          {
            id: 'drawing_4',
            projectId: '2',
            name: 'Structural Steel Framework',
            category: 'structural',
            version: 'Rev D',
            description: 'Steel beam and column layout for floors 1-25',
            uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            uploadedBy: 'Engineering Team',
            status: 'active',
            fileUrl: '/mock-drawings/steel-framework.pdf',
            fileType: 'pdf'
          },
          {
            id: 'drawing_5',
            projectId: '2',
            name: 'Apartment Unit Floor Plan',
            category: 'architectural',
            version: 'Rev B',
            description: 'Standard unit layout for floors 5-20',
            uploadedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            uploadedBy: 'Architecture Team',
            status: 'active',
            fileUrl: '/mock-drawings/apartment-layout.pdf',
            fileType: 'pdf'
          },
          {
            id: 'drawing_6',
            projectId: '2',
            name: 'Plumbing Riser Diagram',
            category: 'plumbing',
            version: 'Rev A',
            description: 'Water and waste line routing for all floors',
            uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            uploadedBy: 'PlumbingPro LLC',
            status: 'active',
            fileUrl: '/mock-drawings/plumbing-riser.pdf',
            fileType: 'pdf'
          },
          // Project 3 - Shopping Mall Renovation (not assigned to this subcontractor)
          {
            id: 'drawing_7',
            projectId: '3',
            name: 'Existing Conditions Survey',
            category: 'survey',
            version: 'Rev A',
            description: 'As-built conditions before renovation',
            uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            uploadedBy: 'Survey Team',
            status: 'active',
            fileUrl: '/mock-drawings/existing-conditions.pdf',
            fileType: 'pdf'
          },
          {
            id: 'drawing_8',
            projectId: '3',
            name: 'New Store Layout Design',
            category: 'architectural',
            version: 'Rev C',
            description: 'Proposed retail space configurations',
            uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            uploadedBy: 'Design Team',
            status: 'active',
            fileUrl: '/mock-drawings/store-layout.pdf',
            fileType: 'pdf'
          }
        ];

        setAssignedProjects(mockAssignedProjects);
        setProjectDrawings(mockProjectDrawings);
      } catch (error) {
        console.error('Error fetching subcontractor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcontractorData();
  }, []);

  const handleCreateBlocker = async (blockerData) => {
    try {
      console.log('Creating subcontractor blocker:', blockerData);
      // In a real app, this would create the blocker via API
      // The blocker would be submitted to the main contractor for review
    } catch (error) {
      console.error('Error creating blocker:', error);
    }
  };

  const handleUpdateBlocker = async (blockerId, updates) => {
    try {
      console.log('Updating blocker:', blockerId, updates);
      // In a real app, this would update the blocker via API
    } catch (error) {
      console.error('Error updating blocker:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-slate-600">Loading subcontractor portal...</p>
        </div>
      </div>
    );
  }

  return (
    <SubcontractorInterface
      user={user}
      assignedProjects={assignedProjects}
      projectDrawings={projectDrawings}
      onCreateBlocker={handleCreateBlocker}
      onUpdateBlocker={handleUpdateBlocker}
    />
  );
};

export default SubcontractorWrapper;