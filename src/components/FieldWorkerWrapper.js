import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../hooks/useSmartAuth';
import MobileFieldWorkerInterface from './MobileFieldWorkerInterface';

const FieldWorkerWrapper = () => {
  const { user } = useSmartAuth();
  const [projects, setProjects] = useState([]);
  const [blockers, setBlockers] = useState([]);
  const [allSubcontractors, setAllSubcontractors] = useState([]);
  const [projectDrawings, setProjectDrawings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock projects data with assigned users
        const mockProjects = [
          {
            id: '1',
            name: 'Downtown Office Complex',
            status: 'active',
            assignedUsers: ['worker@example.com', 'field@example.com'],
            projectManager: 'John Smith',
            location: 'Downtown District',
            description: 'Modern office building construction',
            floorPlan: null,
            blockerMarkers: []
          },
          {
            id: '2',
            name: 'Residential Tower Project',
            status: 'active',
            assignedUsers: ['worker@example.com', 'subcontractor@example.com'],
            projectManager: 'Sarah Johnson',
            location: 'North Side',
            description: '25-story residential complex',
            floorPlan: null,
            blockerMarkers: []
          },
          {
            id: '3',
            name: 'Shopping Mall Renovation',
            status: 'planning',
            assignedUsers: ['field@example.com'],
            projectManager: 'Mike Brown',
            location: 'West End',
            description: 'Complete renovation of existing mall',
            floorPlan: null,
            blockerMarkers: []
          }
        ];

        // Mock blockers data
        const mockBlockers = [
          {
            id: '1',
            title: 'Electrical conduit blockage',
            description: 'Main electrical conduit is blocked by concrete debris',
            location: 'Floor 3, Section A',
            status: 'pending_review',
            priority: 'high',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            created_by: user,
            photos: [],
            voiceNotes: []
          },
          {
            id: '2',
            title: 'HVAC duct misalignment',
            description: 'HVAC ducts not aligned with architectural plans',
            location: 'Floor 2, Section C',
            status: 'assigned',
            priority: 'medium',
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            created_by: user,
            assignedTo: 'sub_1',
            assignmentType: 'subcontractor',
            photos: [],
            voiceNotes: []
          },
          // Subcontractor-raised blockers
          {
            id: '3',
            title: 'Plumbing fixture delivery delay',
            description: 'Scheduled plumbing fixtures delayed by 3 weeks, blocking bathroom completion',
            location: 'Floor 4, All Bathrooms',
            status: 'subcontractor_pending',
            priority: 'high',
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            created_by: {
              name: 'Mike Wilson',
              email: 'mike.wilson@plumbingpro.com',
              role: 'subcontractor',
              company: 'PlumbingPro LLC',
              trade: 'Plumbing'
            },
            projectId: '1',
            raisedBy: 'subcontractor',
            subcontractorId: 'sub_1',
            photos: [],
            voiceNotes: []
          },
          {
            id: '4',
            title: 'Steel beam structural issue',
            description: 'Discovered crack in main support beam that needs immediate attention',
            location: 'Floor 2, Central Support',
            status: 'subcontractor_pending',
            priority: 'critical',
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            created_by: {
              name: 'Sarah Martinez',
              email: 'sarah.martinez@steelworks.com',
              role: 'subcontractor',
              company: 'SteelWorks Construction',
              trade: 'Structural Steel'
            },
            projectId: '1',
            raisedBy: 'subcontractor',
            subcontractorId: 'sub_2',
            photos: [],
            voiceNotes: []
          },
          {
            id: '5',
            title: 'Electrical panel access blocked',
            description: 'Cannot access main electrical panel due to drywall installation',
            location: 'Floor 1, Electrical Room',
            status: 'subcontractor_pending',
            priority: 'medium',
            created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            created_by: {
              name: 'Tom Jackson',
              email: 'tom.jackson@voltageexperts.com',
              role: 'subcontractor',
              company: 'Voltage Experts Inc',
              trade: 'Electrical'
            },
            projectId: '2',
            raisedBy: 'subcontractor',
            subcontractorId: 'sub_3',
            photos: [],
            voiceNotes: []
          }
        ];

        // Mock subcontractors from company admin page
        const mockAllSubcontractors = [
          {
            id: 'sub_1',
            name: 'Mike Wilson',
            email: 'mike.wilson@plumbingpro.com',
            phone: '+1-555-0201',
            company_name: 'PlumbingPro LLC',
            trade_type: 'Plumbing',
            status: 'active',
            project_access: ['1', '2'],
            addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            users: [
              {
                id: 'user_1',
                name: 'Mike Wilson',
                email: 'mike.wilson@plumbingpro.com',
                phone: '+1-555-0201',
                role: 'Lead Plumber'
              },
              {
                id: 'user_2',
                name: 'John Smith',
                email: 'john.smith@plumbingpro.com',
                phone: '+1-555-0202',
                role: 'Plumber'
              }
            ]
          },
          {
            id: 'sub_2',
            name: 'Sarah Martinez',
            email: 'sarah.martinez@steelworks.com',
            phone: '+1-555-0301',
            company_name: 'SteelWorks Construction',
            trade_type: 'Structural Steel',
            status: 'active',
            project_access: ['1'],
            addedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            users: [
              {
                id: 'user_3',
                name: 'Sarah Martinez',
                email: 'sarah.martinez@steelworks.com',
                phone: '+1-555-0301',
                role: 'Steel Foreman'
              },
              {
                id: 'user_4',
                name: 'David Chen',
                email: 'david.chen@steelworks.com',
                phone: '+1-555-0302',
                role: 'Welder'
              },
              {
                id: 'user_5',
                name: 'Lisa Rodriguez',
                email: 'lisa.rodriguez@steelworks.com',
                phone: '+1-555-0303',
                role: 'Structural Engineer'
              }
            ]
          },
          {
            id: 'sub_3',
            name: 'Tom Jackson',
            email: 'tom.jackson@voltageexperts.com',
            phone: '+1-555-0401',
            company_name: 'Voltage Experts Inc',
            trade_type: 'Electrical',
            status: 'active',
            project_access: ['2', '3'],
            addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            users: [
              {
                id: 'user_6',
                name: 'Tom Jackson',
                email: 'tom.jackson@voltageexperts.com',
                phone: '+1-555-0401',
                role: 'Master Electrician'
              }
            ]
          },
          {
            id: 'sub_4',
            name: 'Maria Gonzalez',
            email: 'maria.gonzalez@concretemastery.com',
            phone: '+1-555-0501',
            company_name: 'Concrete Mastery LLC',
            trade_type: 'Concrete',
            status: 'active',
            project_access: ['1', '2', '3'],
            addedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            users: [
              {
                id: 'user_7',
                name: 'Maria Gonzalez',
                email: 'maria.gonzalez@concretemastery.com',
                phone: '+1-555-0501',
                role: 'Concrete Supervisor'
              },
              {
                id: 'user_8',
                name: 'Robert Kim',
                email: 'robert.kim@concretemastery.com',
                phone: '+1-555-0502',
                role: 'Concrete Finisher'
              }
            ]
          },
          {
            id: 'sub_5',
            name: 'James Wright',
            email: 'james.wright@hvacpro.com',
            phone: '+1-555-0601',
            company_name: 'HVAC Pro Services',
            trade_type: 'HVAC',
            status: 'active',
            project_access: ['1'],
            addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            users: [
              {
                id: 'user_9',
                name: 'James Wright',
                email: 'james.wright@hvacpro.com',
                phone: '+1-555-0601',
                role: 'HVAC Technician'
              }
            ]
          }
        ];

        // Mock project drawings data
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
          // Project 3 - Shopping Mall Renovation
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

        setProjects(mockProjects);
        setBlockers(mockBlockers);
        setAllSubcontractors(mockAllSubcontractors);
        setProjectDrawings(mockProjectDrawings);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCreateBlocker = (newBlocker) => {
    setBlockers(prev => [...prev, newBlocker]);
  };

  const handleUpdateBlocker = (updatedBlocker) => {
    setBlockers(prev => prev.map(blocker =>
      blocker.id === updatedBlocker.id ? updatedBlocker : blocker
    ));
  };

  const handleUpdateSubcontractor = (updatedSubcontractor) => {
    setAllSubcontractors(prev => prev.map(sub =>
      sub.id === updatedSubcontractor.id ? updatedSubcontractor : sub
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <MobileFieldWorkerInterface
      user={user}
      projects={projects}
      blockers={blockers}
      allSubcontractors={allSubcontractors}
      projectDrawings={projectDrawings}
      onCreateBlocker={handleCreateBlocker}
      onUpdateBlocker={handleUpdateBlocker}
      onUpdateSubcontractor={handleUpdateSubcontractor}
    />
  );
};

export default FieldWorkerWrapper;