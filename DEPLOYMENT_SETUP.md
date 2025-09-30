# Vercel Deployment Configuration

This guide will help you properly configure Vercel deployment to update your existing project instead of creating new ones.

## Quick Setup

### Option 1: Using Vercel CLI (Recommended)

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Link to existing project:**
   ```bash
   npm run vercel:link
   # or
   vercel link
   ```
   - Select your existing "construction-blockers-app" project when prompted
   - This will create the proper `.vercel/project.json` file

3. **Deploy:**
   ```bash
   npm run deploy:prod    # Production deployment
   npm run deploy:preview # Preview deployment
   ```

### Option 2: Manual Configuration

1. **Find your project details:**
   - Go to https://vercel.com/dashboard
   - Navigate to your "construction-blockers-app" project
   - Click Settings > General
   - Copy the Project ID (starts with `prj_`)
   - Copy the Team/Org ID (starts with `team_`)

2. **Update `.vercel/project.json`:**
   ```json
   {
     "projectId": "prj_your_actual_project_id",
     "orgId": "team_your_actual_org_id"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy:prod
   ```

## Available Scripts

- `npm run deploy` - Smart deployment with checks
- `npm run deploy:preview` - Preview deployment
- `npm run deploy:prod` - Production deployment
- `npm run vercel:link` - Link to existing project

## Configuration Files

### vercel.json
Enhanced configuration with:
- Proper build settings for React
- Static asset caching
- SPA routing support
- Environment variable references

### .vercel/project.json
Links your local project to the existing Vercel project to prevent duplicates.

## Environment Variables

Make sure these are set in your Vercel project:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Troubleshooting

**Problem: New projects keep being created**
- Solution: Ensure `.vercel/project.json` exists and has correct IDs

**Problem: Deployment fails**
- Check that you're logged in: `vercel whoami`
- Verify project linking: `vercel ls`

**Problem: Environment variables not working**
- Check Vercel dashboard > Project > Settings > Environment Variables
- Ensure variable names match vercel.json references

## Security Notes

- `.vercel/` directory is in `.gitignore` and should not be committed
- Environment variables are managed in Vercel dashboard
- Project linking information is stored locally only