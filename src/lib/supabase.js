import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Database helpers
export const getUser = () => supabase.auth.getUser()
export const getSession = () => supabase.auth.getSession()

// Storage helpers
export const uploadFile = async (bucket, path, file) => {
  return supabase.storage.from(bucket).upload(path, file)
}

export const getPublicUrl = (bucket, path) => {
  return supabase.storage.from(bucket).getPublicUrl(path)
}

export const deleteFile = async (bucket, paths) => {
  return supabase.storage.from(bucket).remove(paths)
}