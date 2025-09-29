import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../hooks/useSmartAuth';
import MobileFieldWorkerInterface from './MobileFieldWorkerInterface';

const FieldWorkerWrapper = () => {
  const { user } = useSmartAuth();
  const [projects, setProjects] = useState([]);
  const [blockers, setBlockers] = useState([]);
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
          }
        ];

        setProjects(mockProjects);
        setBlockers(mockBlockers);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  return (
    <MobileFieldWorkerInterface
      user={user}
      projects={projects}
      blockers={blockers}
      onCreateBlocker={handleCreateBlocker}
      onUpdateBlocker={handleUpdateBlocker}
    />
  );
};

export default FieldWorkerWrapper;