import { supabase } from './supabase';
import { userManagementAPI } from './userManagementAPI';

export const drawingAPI = {
  // Upload a new drawing to a project
  async uploadDrawing(file, drawingData, companyId) {
    try {
      // Check if user has access to the project
      const accessCheck = await userManagementAPI.checkProjectAccess(
        drawingData.uploadedBy,
        drawingData.projectId
      );

      if (!accessCheck.hasAccess && !['company_admin', 'project_manager'].includes(accessCheck.role)) {
        return { success: false, error: 'Insufficient permissions to upload to this project' };
      }

      // Generate unique file path
      const fileExtension = file.name.split('.').pop();
      const fileName = `${drawingData.projectId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-drawings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Save drawing metadata to database
      const { data, error } = await supabase
        .from('project_drawings')
        .insert([{
          project_id: drawingData.projectId,
          company_id: companyId,
          file_name: fileName,
          original_name: drawingData.originalName,
          file_path: uploadData.path,
          file_size: drawingData.fileSize,
          file_type: drawingData.fileType,
          category: drawingData.category,
          floor: drawingData.floor,
          section: drawingData.section,
          description: drawingData.description,
          version: drawingData.version || '1.0',
          uploaded_by: drawingData.uploadedBy,
          upload_date: new Date().toISOString(),
          status: 'active'
        }])
        .select();

      if (error) {
        console.error('Error saving drawing metadata:', error);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('project-drawings').remove([fileName]);
        return { success: false, error: error.message };
      }

      return { success: true, drawing: data[0] };
    } catch (error) {
      console.error('Error in uploadDrawing:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all drawings for a specific project
  async getProjectDrawings(projectId, userId = null) {
    try {
      let query = supabase
        .from('project_drawings')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .order('upload_date', { ascending: false });

      // If userId is provided, check access permissions
      if (userId) {
        const accessCheck = await userManagementAPI.checkProjectAccess(userId, projectId);
        if (!accessCheck.hasAccess) {
          return { success: false, error: 'No access to this project', drawings: [] };
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching project drawings:', error);
        return { success: false, error: error.message, drawings: [] };
      }

      return { success: true, drawings: data || [] };
    } catch (error) {
      console.error('Error in getProjectDrawings:', error);
      return { success: false, error: error.message, drawings: [] };
    }
  },

  // Get all drawings for a company (admin view)
  async getCompanyDrawings(companyId, filters = {}) {
    try {
      let query = supabase
        .from('project_drawings')
        .select(`
          *,
          project:projects(name, status)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('upload_date', { ascending: false });

      // Apply filters
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.searchTerm) {
        query = query.or(`original_name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching company drawings:', error);
        return { success: false, error: error.message, drawings: [] };
      }

      return { success: true, drawings: data || [] };
    } catch (error) {
      console.error('Error in getCompanyDrawings:', error);
      return { success: false, error: error.message, drawings: [] };
    }
  },

  // Get drawings accessible to a specific user (based on their project assignments)
  async getUserAccessibleDrawings(userId) {
    try {
      // Get user's projects
      const userProjectsResult = await userManagementAPI.getUserProjects(userId);
      if (!userProjectsResult.success) {
        return { success: false, error: 'Could not fetch user projects', drawings: [] };
      }

      const projectIds = userProjectsResult.projects.map(p => p.id);

      if (projectIds.length === 0) {
        return { success: true, drawings: [] };
      }

      const { data, error } = await supabase
        .from('project_drawings')
        .select(`
          *,
          project:projects(name, status)
        `)
        .in('project_id', projectIds)
        .eq('status', 'active')
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching user accessible drawings:', error);
        return { success: false, error: error.message, drawings: [] };
      }

      return { success: true, drawings: data || [] };
    } catch (error) {
      console.error('Error in getUserAccessibleDrawings:', error);
      return { success: false, error: error.message, drawings: [] };
    }
  },

  // Download a drawing file
  async downloadDrawing(drawingId, userId = null) {
    try {
      // Get drawing metadata
      const { data: drawing, error: drawingError } = await supabase
        .from('project_drawings')
        .select('*')
        .eq('id', drawingId)
        .single();

      if (drawingError || !drawing) {
        return { success: false, error: 'Drawing not found' };
      }

      // Check user access if userId provided
      if (userId) {
        const accessCheck = await userManagementAPI.checkProjectAccess(userId, drawing.project_id);
        if (!accessCheck.hasAccess) {
          return { success: false, error: 'No access to this drawing' };
        }
      }

      // Get signed URL for download
      const { data: urlData, error: urlError } = await supabase.storage
        .from('project-drawings')
        .createSignedUrl(drawing.file_path, 3600); // 1 hour expiry

      if (urlError) {
        console.error('Error creating download URL:', urlError);
        return { success: false, error: urlError.message };
      }

      return {
        success: true,
        downloadUrl: urlData.signedUrl,
        drawing: drawing
      };
    } catch (error) {
      console.error('Error in downloadDrawing:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a drawing
  async deleteDrawing(drawingId, userId) {
    try {
      // Get drawing metadata
      const { data: drawing, error: drawingError } = await supabase
        .from('project_drawings')
        .select('*')
        .eq('id', drawingId)
        .single();

      if (drawingError || !drawing) {
        return { success: false, error: 'Drawing not found' };
      }

      // Check permissions
      const accessCheck = await userManagementAPI.checkProjectAccess(userId, drawing.project_id);
      if (!accessCheck.hasAccess || !['company_admin', 'project_manager'].includes(accessCheck.role)) {
        return { success: false, error: 'Insufficient permissions to delete this drawing' };
      }

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('project-drawings')
        .remove([drawing.file_path]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Mark as deleted in database (soft delete)
      const { error: dbError } = await supabase
        .from('project_drawings')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', drawingId);

      if (dbError) {
        console.error('Error marking drawing as deleted:', dbError);
        return { success: false, error: dbError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteDrawing:', error);
      return { success: false, error: error.message };
    }
  },

  // Update drawing metadata
  async updateDrawing(drawingId, updates, userId) {
    try {
      // Get current drawing
      const { data: drawing, error: drawingError } = await supabase
        .from('project_drawings')
        .select('*')
        .eq('id', drawingId)
        .single();

      if (drawingError || !drawing) {
        return { success: false, error: 'Drawing not found' };
      }

      // Check permissions
      const accessCheck = await userManagementAPI.checkProjectAccess(userId, drawing.project_id);
      if (!accessCheck.hasAccess || !['company_admin', 'project_manager'].includes(accessCheck.role)) {
        return { success: false, error: 'Insufficient permissions to update this drawing' };
      }

      // Update drawing metadata
      const { data, error } = await supabase
        .from('project_drawings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', drawingId)
        .select();

      if (error) {
        console.error('Error updating drawing:', error);
        return { success: false, error: error.message };
      }

      return { success: true, drawing: data[0] };
    } catch (error) {
      console.error('Error in updateDrawing:', error);
      return { success: false, error: error.message };
    }
  },

  // Get drawing categories and statistics
  async getDrawingStats(projectId = null, companyId = null) {
    try {
      let query = supabase
        .from('project_drawings')
        .select('category, file_size')
        .eq('status', 'active');

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching drawing stats:', error);
        return { success: false, error: error.message, stats: {} };
      }

      const stats = {
        totalDrawings: data.length,
        totalSize: data.reduce((sum, d) => sum + parseFloat(d.file_size || 0), 0),
        categoryBreakdown: data.reduce((acc, d) => {
          acc[d.category] = (acc[d.category] || 0) + 1;
          return acc;
        }, {}),
        categorySizes: data.reduce((acc, d) => {
          acc[d.category] = (acc[d.category] || 0) + parseFloat(d.file_size || 0);
          return acc;
        }, {})
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error in getDrawingStats:', error);
      return { success: false, error: error.message, stats: {} };
    }
  },

  // Search drawings across projects
  async searchDrawings(searchTerm, companyId, userId = null, projectIds = null) {
    try {
      let query = supabase
        .from('project_drawings')
        .select(`
          *,
          project:projects(name, status)
        `)
        .eq('status', 'active');

      // Apply company filter
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      // Apply project filter for user access
      if (projectIds && projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }

      // Apply search term
      if (searchTerm) {
        query = query.or(`
          original_name.ilike.%${searchTerm}%,
          description.ilike.%${searchTerm}%,
          floor.ilike.%${searchTerm}%,
          section.ilike.%${searchTerm}%
        `);
      }

      query = query.order('upload_date', { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('Error searching drawings:', error);
        return { success: false, error: error.message, drawings: [] };
      }

      return { success: true, drawings: data || [] };
    } catch (error) {
      console.error('Error in searchDrawings:', error);
      return { success: false, error: error.message, drawings: [] };
    }
  },

  // Get recent drawings for a user
  async getRecentDrawings(userId, limit = 10) {
    try {
      // Get user's accessible projects
      const userProjectsResult = await userManagementAPI.getUserProjects(userId);
      if (!userProjectsResult.success) {
        return { success: false, error: 'Could not fetch user projects', drawings: [] };
      }

      const projectIds = userProjectsResult.projects.map(p => p.id);

      if (projectIds.length === 0) {
        return { success: true, drawings: [] };
      }

      const { data, error } = await supabase
        .from('project_drawings')
        .select(`
          *,
          project:projects(name, status)
        `)
        .in('project_id', projectIds)
        .eq('status', 'active')
        .order('upload_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent drawings:', error);
        return { success: false, error: error.message, drawings: [] };
      }

      return { success: true, drawings: data || [] };
    } catch (error) {
      console.error('Error in getRecentDrawings:', error);
      return { success: false, error: error.message, drawings: [] };
    }
  }
};