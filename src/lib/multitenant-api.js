import { supabase } from './supabase'

// Multi-tenant API layer with complete data isolation

// Company API
export const companyAPI = {
  // Get current user's company
  getCurrentCompany: async () => {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        projects:projects(
          id,
          name,
          status,
          created_at
        )
      `)
      .single()
    return { data, error }
  },

  // Update company details (owner only)
  update: async (companyId, updates) => {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single()
    return { data, error }
  },

  // Create new company (for new registrations)
  create: async (companyData) => {
    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single()
    return { data, error }
  }
}

// Projects API
export const projectAPI = {
  // Get all projects for current company
  getAll: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        company:companies(name, slug),
        blockers_count:blockers(count),
        active_blockers:blockers!inner(count)
      `)
      .eq('blockers.status', 'open')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get single project with details
  getById: async (projectId) => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        company:companies(name, slug),
        blockers(
          id,
          title,
          status,
          priority,
          created_at
        ),
        drawings:site_drawings(
          id,
          name,
          filename,
          created_at
        )
      `)
      .eq('id', projectId)
      .single()
    return { data, error }
  },

  // Create new project
  create: async (projectData) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()
    return { data, error }
  },

  // Update project
  update: async (projectId, updates) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()
    return { data, error }
  },

  // Delete project
  delete: async (projectId) => {
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
    return { data, error }
  }
}

// Authentication API with company context
export const authAPI = {
  // Sign up new user with company creation
  signUpWithCompany: async (userData, companyData) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone
          }
        }
      })

      if (authError) throw authError

      // Create company
      const { data: company, error: companyError } = await companyAPI.create({
        ...companyData,
        slug: companyData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      })

      if (companyError) throw companyError

      // Create user profile as owner
      if (authData.user) {
        const { error: profileError } = await userAPI.createProfile({
          id: authData.user.id,
          company_id: company.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: 'owner'
        })

        if (profileError) throw profileError
      }

      return { data: { user: authData.user, company }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign up user to existing company via invitation
  signUpWithInvitation: async (userData, invitationToken) => {
    try {
      // Verify invitation
      const { data: invitation, error: inviteError } = await invitationAPI.getByToken(invitationToken)
      if (inviteError) throw inviteError

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            company_id: invitation.company_id
          }
        }
      })

      if (authError) throw authError

      // Create user profile
      if (authData.user) {
        const { error: profileError } = await userAPI.createProfile({
          id: authData.user.id,
          company_id: invitation.company_id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: invitation.role
        })

        if (profileError) throw profileError

        // Mark invitation as used
        await invitationAPI.markAsUsed(invitation.id)
      }

      return { data: authData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// User Profiles API with company context
export const userAPI = {
  getCurrentProfile: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        company:companies(
          id,
          name,
          slug,
          plan
        )
      `)
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()
    return { data, error }
  },

  createProfile: async (profile) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single()
    return { data, error }
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Get all users in current company
  getCompanyUsers: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Update user role (admin only)
  updateUserRole: async (userId, role) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Deactivate user
  deactivateUser: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  }
}

// Contractors API with company isolation
export const contractorAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
    return { data, error }
  },

  create: async (contractor) => {
    const { data, error } = await supabase
      .from('contractors')
      .insert([contractor])
      .select()
      .single()
    return { data, error }
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('contractors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  delete: async (id) => {
    const { data, error } = await supabase
      .from('contractors')
      .update({ is_active: false })
      .eq('id', id)
    return { data, error }
  }
}

// Site Drawings API with project isolation
export const drawingAPI = {
  getAllForProject: async (projectId) => {
    const { data, error } = await supabase
      .from('site_drawings')
      .select(`
        *,
        uploader:user_profiles(
          name,
          email
        )
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  upload: async (file, metadata) => {
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `drawings/${metadata.company_id}/${metadata.project_id}/${fileName}`

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-drawings')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create database record
      const { data, error } = await supabase
        .from('site_drawings')
        .insert([{
          ...metadata,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type
        }])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  delete: async (id, filePath) => {
    try {
      // Delete file from storage
      await supabase.storage
        .from('site-drawings')
        .remove([filePath])

      // Mark as inactive in database
      const { data, error } = await supabase
        .from('site_drawings')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  getPublicUrl: (filePath) => {
    const { data } = supabase.storage
      .from('site-drawings')
      .getPublicUrl(filePath)
    return data.publicUrl
  }
}

// Blockers API with company and project isolation
export const blockerAPI = {
  getAllForProject: async (projectId) => {
    const { data, error } = await supabase
      .from('blockers')
      .select(`
        *,
        creator:created_by (
          name,
          email
        ),
        contractor:assigned_to (
          name,
          contact_email,
          type
        ),
        resolver:resolved_by (
          name,
          email
        ),
        project:projects (
          name
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  getAllForCompany: async () => {
    const { data, error } = await supabase
      .from('blockers')
      .select(`
        *,
        creator:created_by (
          name,
          email
        ),
        contractor:assigned_to (
          name,
          contact_email,
          type
        ),
        resolver:resolved_by (
          name,
          email
        ),
        project:projects (
          name
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('blockers')
      .select(`
        *,
        creator:created_by (
          name,
          email
        ),
        contractor:assigned_to (
          name,
          contact_email,
          type
        ),
        resolver:resolved_by (
          name,
          email
        ),
        project:projects (
          name
        )
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },

  create: async (blocker) => {
    const { data, error } = await supabase
      .from('blockers')
      .insert([blocker])
      .select(`
        *,
        creator:created_by (
          name,
          email
        ),
        project:projects (
          name
        )
      `)
      .single()
    return { data, error }
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('blockers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        creator:created_by (
          name,
          email
        ),
        contractor:assigned_to (
          name,
          contact_email,
          type
        ),
        resolver:resolved_by (
          name,
          email
        ),
        project:projects (
          name
        )
      `)
      .single()
    return { data, error }
  },

  assign: async (id, contractorId) => {
    const { data, error } = await supabase
      .from('blockers')
      .update({
        assigned_to: contractorId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  resolve: async (id, resolvedBy) => {
    const { data, error } = await supabase
      .from('blockers')
      .update({
        status: 'resolved',
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  uploadPhoto: async (file, blockerId, companyId, projectId) => {
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${blockerId}-${Date.now()}.${fileExt}`
      const filePath = `blocker-photos/${companyId}/${projectId}/${fileName}`

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blocker-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('blocker-photos')
        .getPublicUrl(filePath)

      return { data: { path: filePath, url: urlData.publicUrl }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  getMyBlockers: async (userId) => {
    const { data, error } = await supabase
      .from('blockers')
      .select(`
        *,
        contractor:assigned_to (
          name,
          contact_email
        ),
        project:projects (
          name
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

// Status History API with company isolation
export const statusHistoryAPI = {
  getByBlockerId: async (blockerId) => {
    const { data, error } = await supabase
      .from('blocker_status_history')
      .select(`
        *,
        user:user_profiles (
          name,
          email
        )
      `)
      .eq('blocker_id', blockerId)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  create: async (entry) => {
    const { data, error } = await supabase
      .from('blocker_status_history')
      .insert([entry])
      .select()
      .single()
    return { data, error }
  }
}

// Invitations API with company isolation
export const invitationAPI = {
  create: async (invitation) => {
    const { data, error } = await supabase
      .from('invitations')
      .insert([invitation])
      .select()
      .single()
    return { data, error }
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        inviter:invited_by (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  getByToken: async (token) => {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()
    return { data, error }
  },

  markAsUsed: async (id) => {
    const { data, error } = await supabase
      .from('invitations')
      .update({ used: true })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  delete: async (id) => {
    const { data, error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)
    return { data, error }
  }
}

// Analytics API for company-wide insights
export const analyticsAPI = {
  getCompanyStats: async () => {
    const { data, error } = await supabase
      .rpc('get_company_stats')
    return { data, error }
  },

  getProjectStats: async (projectId) => {
    const { data, error } = await supabase
      .rpc('get_project_stats', { project_id: projectId })
    return { data, error }
  }
}