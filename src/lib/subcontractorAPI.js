import { supabase } from './supabase';

export const subcontractorAPI = {
  // Trade types commonly used in construction
  getTradeTypes: () => [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Structural Steel',
    'Concrete',
    'Framing',
    'Roofing',
    'Flooring',
    'Painting',
    'Drywall',
    'Windows & Doors',
    'Masonry',
    'Insulation',
    'Landscaping',
    'Site Work',
    'General Labor'
  ],

  // Generate a unique subcontractor ID
  generateSubcontractorId: () => {
    return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Create a new subcontractor
  async createSubcontractor(companyId, subcontractorData) {
    try {
      const subcontractorId = subcontractorAPI.generateSubcontractorId();

      const subcontractor = {
        id: subcontractorId,
        company_id: companyId,
        name: subcontractorData.name,
        company_name: subcontractorData.companyName,
        email: subcontractorData.email,
        phone: subcontractorData.phone,
        trade_type: subcontractorData.tradeType,
        license_number: subcontractorData.licenseNumber || '',
        insurance_expiry: subcontractorData.insuranceExpiry || null,
        hourly_rate: subcontractorData.hourlyRate || 0,
        status: 'active',
        project_access: [], // Array of project IDs they have access to
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: subcontractorData.notes || '',
        emergency_contact: {
          name: subcontractorData.emergencyContactName || '',
          phone: subcontractorData.emergencyContactPhone || ''
        },
        address: {
          street: subcontractorData.street || '',
          city: subcontractorData.city || '',
          state: subcontractorData.state || '',
          zip: subcontractorData.zip || ''
        }
      };

      // In production, this would create record in Supabase
      // For demo purposes, store in localStorage
      const subcontractors = JSON.parse(localStorage.getItem(`subcontractors_${companyId}`) || '[]');
      subcontractors.push(subcontractor);
      localStorage.setItem(`subcontractors_${companyId}`, JSON.stringify(subcontractors));

      return {
        success: true,
        subcontractor,
        subcontractorId
      };
    } catch (error) {
      console.error('Error creating subcontractor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update an existing subcontractor
  async updateSubcontractor(companyId, subcontractorId, updates) {
    try {
      const subcontractors = JSON.parse(localStorage.getItem(`subcontractors_${companyId}`) || '[]');
      const subcontractorIndex = subcontractors.findIndex(sub => sub.id === subcontractorId);

      if (subcontractorIndex === -1) {
        return {
          success: false,
          error: 'Subcontractor not found'
        };
      }

      const updatedSubcontractor = {
        ...subcontractors[subcontractorIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      subcontractors[subcontractorIndex] = updatedSubcontractor;
      localStorage.setItem(`subcontractors_${companyId}`, JSON.stringify(subcontractors));

      return {
        success: true,
        subcontractor: updatedSubcontractor
      };
    } catch (error) {
      console.error('Error updating subcontractor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get all subcontractors for a company
  async getSubcontractors(companyId) {
    try {
      const subcontractors = JSON.parse(localStorage.getItem(`subcontractors_${companyId}`) || '[]');

      return {
        success: true,
        subcontractors
      };
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get subcontractors by trade type
  async getSubcontractorsByTrade(companyId, tradeType) {
    try {
      const result = await subcontractorAPI.getSubcontractors(companyId);
      if (!result.success) {
        return result;
      }

      const filteredSubcontractors = result.subcontractors.filter(sub =>
        sub.trade_type === tradeType && sub.status === 'active'
      );

      return {
        success: true,
        subcontractors: filteredSubcontractors
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Assign subcontractor to project
  async assignToProject(companyId, subcontractorId, projectId) {
    try {
      const result = await subcontractorAPI.getSubcontractors(companyId);
      if (!result.success) {
        return result;
      }

      const subcontractor = result.subcontractors.find(sub => sub.id === subcontractorId);
      if (!subcontractor) {
        return {
          success: false,
          error: 'Subcontractor not found'
        };
      }

      if (!subcontractor.project_access.includes(projectId)) {
        const updatedAccess = [...subcontractor.project_access, projectId];
        return await subcontractorAPI.updateSubcontractor(companyId, subcontractorId, {
          project_access: updatedAccess
        });
      }

      return { success: true, subcontractor };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Remove subcontractor from project
  async removeFromProject(companyId, subcontractorId, projectId) {
    try {
      const result = await subcontractorAPI.getSubcontractors(companyId);
      if (!result.success) {
        return result;
      }

      const subcontractor = result.subcontractors.find(sub => sub.id === subcontractorId);
      if (!subcontractor) {
        return {
          success: false,
          error: 'Subcontractor not found'
        };
      }

      const updatedAccess = subcontractor.project_access.filter(pid => pid !== projectId);
      return await subcontractorAPI.updateSubcontractor(companyId, subcontractorId, {
        project_access: updatedAccess
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete a subcontractor
  async deleteSubcontractor(companyId, subcontractorId) {
    try {
      const subcontractors = JSON.parse(localStorage.getItem(`subcontractors_${companyId}`) || '[]');
      const filteredSubcontractors = subcontractors.filter(sub => sub.id !== subcontractorId);

      localStorage.setItem(`subcontractors_${companyId}`, JSON.stringify(filteredSubcontractors));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting subcontractor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Initialize demo data for a company
  async initializeDemoData(companyId) {
    try {
      const demoSubcontractors = [
        {
          id: 'sub_demo_1',
          company_id: companyId,
          name: 'John Martinez',
          company_name: 'ABC Plumbing Co.',
          email: 'john@abcplumbing.com',
          phone: '(555) 123-4567',
          trade_type: 'Plumbing',
          license_number: 'PL-12345',
          insurance_expiry: '2024-12-31',
          hourly_rate: 85,
          status: 'active',
          project_access: [],
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          notes: 'Experienced with commercial installations',
          emergency_contact: {
            name: 'Maria Martinez',
            phone: '(555) 123-4568'
          },
          address: {
            street: '123 Trade St',
            city: 'Construction City',
            state: 'CA',
            zip: '90210'
          }
        },
        {
          id: 'sub_demo_2',
          company_id: companyId,
          name: 'Sarah Electric',
          company_name: 'ElectriCorp Solutions',
          email: 'info@electricorp.com',
          phone: '(555) 234-5678',
          trade_type: 'Electrical',
          license_number: 'EL-67890',
          insurance_expiry: '2024-11-30',
          hourly_rate: 95,
          status: 'active',
          project_access: [],
          created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          notes: 'Specializes in high-voltage systems',
          emergency_contact: {
            name: 'Mike Electric',
            phone: '(555) 234-5679'
          },
          address: {
            street: '456 Volt Ave',
            city: 'Electric Town',
            state: 'CA',
            zip: '90211'
          }
        },
        {
          id: 'sub_demo_3',
          company_id: companyId,
          name: 'Robert Steel',
          company_name: 'Steel Frame Works',
          email: 'contact@steelframe.com',
          phone: '(555) 345-6789',
          trade_type: 'Structural Steel',
          license_number: 'ST-11111',
          insurance_expiry: '2025-01-31',
          hourly_rate: 120,
          status: 'active',
          project_access: [],
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          notes: 'Heavy machinery certified',
          emergency_contact: {
            name: 'Linda Steel',
            phone: '(555) 345-6790'
          },
          address: {
            street: '789 Steel Rd',
            city: 'Metal Valley',
            state: 'CA',
            zip: '90212'
          }
        },
        {
          id: 'sub_demo_4',
          company_id: companyId,
          name: 'Perfect Paint Pro',
          company_name: 'Perfect Paint Pro',
          email: 'paint@perfectpro.com',
          phone: '(555) 456-7890',
          trade_type: 'Painting',
          license_number: 'PT-22222',
          insurance_expiry: '2024-10-31',
          hourly_rate: 65,
          status: 'active',
          project_access: [],
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          notes: 'Eco-friendly paint specialist',
          emergency_contact: {
            name: 'Anna Paint',
            phone: '(555) 456-7891'
          },
          address: {
            street: '321 Color St',
            city: 'Paint City',
            state: 'CA',
            zip: '90213'
          }
        },
        {
          id: 'sub_demo_5',
          company_id: companyId,
          name: 'Tom HVAC',
          company_name: 'Precision HVAC',
          email: 'service@precisionhvac.com',
          phone: '(555) 567-8901',
          trade_type: 'HVAC',
          license_number: 'HV-33333',
          insurance_expiry: '2024-09-30',
          hourly_rate: 90,
          status: 'active',
          project_access: [],
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          notes: 'Energy efficiency expert',
          emergency_contact: {
            name: 'Sue HVAC',
            phone: '(555) 567-8902'
          },
          address: {
            street: '654 Air Way',
            city: 'Climate Control',
            state: 'CA',
            zip: '90214'
          }
        }
      ];

      localStorage.setItem(`subcontractors_${companyId}`, JSON.stringify(demoSubcontractors));

      return {
        success: true,
        subcontractors: demoSubcontractors
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default subcontractorAPI;