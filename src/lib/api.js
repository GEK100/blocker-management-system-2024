import { supabase } from './supabase'

// Authentication API
export const authAPI = {
  signUp: async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
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

// User Profiles API
export const userAPI = {
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
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

  getAllProfiles: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

// Contractors API
export const contractorAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
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
      .delete()
      .eq('id', id)
    return { data, error }
  }
}

// Site Drawings API
export const drawingAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('site_drawings')
      .select(`
        *,
        uploader:uploaded_by (
          name,
          company
        )
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  upload: async (file, metadata) => {
    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `drawings/${fileName}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('site-drawings')
      .upload(filePath, file)

    if (uploadError) {
      return { data: null, error: uploadError }
    }

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
  },

  delete: async (id, filePath) => {
    // Delete file from storage
    await supabase.storage
      .from('site-drawings')
      .remove([filePath])

    // Delete database record
    const { data, error } = await supabase
      .from('site_drawings')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  getPublicUrl: (filePath) => {
    const { data } = supabase.storage
      .from('site-drawings')
      .getPublicUrl(filePath)
    return data.publicUrl
  }
}

// Blockers API
export const blockerAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('blockers')
      .select(`
        *,
        creator:created_by (
          name,
          company
        ),
        contractor:assigned_to (
          name,
          contact_email
        ),
        resolver:resolved_by (
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
          company
        ),
        contractor:assigned_to (
          name,
          contact_email
        ),
        resolver:resolved_by (
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
          company
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
          company
        ),
        contractor:assigned_to (
          name,
          contact_email
        ),
        resolver:resolved_by (
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

  uploadPhoto: async (file, blockerId) => {
    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${blockerId}-${Date.now()}.${fileExt}`
    const filePath = `blocker-photos/${fileName}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blocker-photos')
      .upload(filePath, file)

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blocker-photos')
      .getPublicUrl(filePath)

    return { data: { path: filePath, url: urlData.publicUrl }, error: null }
  },

  getMyBlockers: async (userId) => {
    const { data, error } = await supabase
      .from('blockers')
      .select(`
        *,
        contractor:assigned_to (
          name,
          contact_email
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

// Status History API
export const statusHistoryAPI = {
  getByBlockerId: async (blockerId) => {
    const { data, error } = await supabase
      .from('blocker_status_history')
      .select(`
        *,
        user:user_id (
          name,
          company
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

// Invitations API
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
          company
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

// Storage buckets setup instructions
export const setupStorageBuckets = async () => {
  // This function should be called once to set up storage buckets
  // Run this in Supabase SQL Editor or via the dashboard:

  const buckets = [
    {
      name: 'site-drawings',
      public: true,
      allowedMimeTypes: ['image/*', 'application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    },
    {
      name: 'blocker-photos',
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880 // 5MB
    }
  ]

  console.log('Please create the following storage buckets in your Supabase dashboard:')
  console.log(JSON.stringify(buckets, null, 2))

  // Storage policies should also be created:
  const policies = `
    -- Allow authenticated users to upload site drawings
    CREATE POLICY "Allow authenticated uploads to site-drawings" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'site-drawings' AND
      auth.role() = 'authenticated'
    );

    -- Allow authenticated users to view site drawings
    CREATE POLICY "Allow authenticated access to site-drawings" ON storage.objects
    FOR SELECT USING (bucket_id = 'site-drawings');

    -- Allow authenticated users to upload blocker photos
    CREATE POLICY "Allow authenticated uploads to blocker-photos" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'blocker-photos' AND
      auth.role() = 'authenticated'
    );

    -- Allow authenticated users to view blocker photos
    CREATE POLICY "Allow authenticated access to blocker-photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'blocker-photos');

    -- Allow users to delete their own uploads
    CREATE POLICY "Allow users to delete own uploads" ON storage.objects
    FOR DELETE USING (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  `

  console.log('Please also run these storage policies in your Supabase SQL Editor:')
  console.log(policies)
}