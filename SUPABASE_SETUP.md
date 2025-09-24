# Supabase Backend Setup Guide

This guide will help you set up the complete Supabase backend for the Construction Blocker Management app.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose your organization and create a new project:
   - Name: `construction-blockers-app`
   - Database Password: Create a strong password
   - Region: Choose the closest to your users

## 2. Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings > API**
2. Copy the following values to your `.env` file:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the placeholder values in your `.env` file with the actual values from your Supabase project.

## 3. Set Up Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql` and paste it into a new query
3. Click **Run** to execute the schema creation

This will create:
- User profiles table
- Contractors table
- Site drawings table
- Blockers table
- Status history table
- Invitations table
- All necessary indexes, RLS policies, and triggers

## 4. Set Up Storage Buckets

1. In your Supabase project dashboard, go to **Storage**
2. Create two new buckets:

### Site Drawings Bucket
- **Name**: `site-drawings`
- **Public**: ✅ Enabled
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/*,application/pdf`

### Blocker Photos Bucket
- **Name**: `blocker-photos`
- **Public**: ✅ Enabled
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/*`

3. After creating the buckets, go to **SQL Editor** and run the contents of `supabase-storage-setup.sql` to set up storage policies.

## 5. Authentication Setup

1. Go to **Authentication > Settings**
2. Configure the following:

### Site URL
- Add your development URL: `http://localhost:3000`
- Add your production URL when deploying

### Email Templates (Optional)
- Customize the email templates for user registration and password reset
- Update the email templates to match your app's branding

### Auth Providers (Optional)
- You can enable additional providers like Google, GitHub, etc.

## 6. Row Level Security (RLS)

The SQL schema automatically sets up RLS policies, but verify they're active:

1. Go to **Authentication > Policies**
2. Verify that policies exist for all tables:
   - `user_profiles`: Users can view all, update own
   - `contractors`: All can view, admins can manage
   - `site_drawings`: All can view, supervisors+ can upload
   - `blockers`: All can view, users can create, supervisors can assign
   - `blocker_status_history`: All can view, system can insert
   - `invitations`: Only admins can manage

## 7. Test the Setup

1. Start your development server: `npm start`
2. Try to register a new user
3. Verify the user profile is created in the database
4. Test creating a blocker
5. Test uploading a photo
6. Test assigning blockers (requires supervisor+ role)

## 8. Initial Data (Optional)

The schema includes initial contractor data. You can add more contractors through the admin interface or directly in the database.

## 9. Production Deployment

When deploying to production:

1. Update environment variables with production Supabase URLs
2. Add your production domain to the **Site URL** in Auth settings
3. Ensure all RLS policies are properly configured
4. Test all functionality in production environment

## Troubleshooting

### Common Issues:

1. **RLS Policy Errors**: Make sure you're signed in and have the right role
2. **Storage Upload Errors**: Verify bucket names and policies are correct
3. **Auth Errors**: Check if environment variables are set correctly
4. **Database Errors**: Ensure the schema was run completely without errors

### Debug Tips:

1. Check the browser console for error messages
2. Use Supabase dashboard to view real-time logs
3. Test API calls in the SQL Editor first
4. Verify user roles in the `user_profiles` table

## Database Tables Overview

- **user_profiles**: Extended user information with roles
- **contractors**: Company information for assignment
- **site_drawings**: Uploaded construction drawings
- **blockers**: Main blocker tracking table
- **blocker_status_history**: Audit trail for status changes
- **invitations**: User invitation system

## Security Features

- Row Level Security (RLS) on all tables
- Role-based access control (worker, supervisor, admin)
- Secure file uploads with policies
- Automatic audit trails
- JWT-based authentication

## Next Steps

After setup is complete:

1. Create your first admin user
2. Upload site drawings
3. Add contractors if needed
4. Test the complete workflow
5. Deploy to production

For any issues, check the Supabase documentation or the app's error logs.