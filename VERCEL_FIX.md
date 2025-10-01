# Fix Vercel "Repository cannot be connected to more than 10 Projects" Error

This error occurs when your GitHub repository has reached Vercel's limit of 10 connected projects. This usually happens when multiple deployments created separate projects instead of updating an existing one.

## 🔧 Solution Steps

### Step 1: Clean Up Unused Projects

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Look for multiple projects with similar names (e.g., "blocker-management-app", "construction-blockers-app", etc.)

2. **Delete Unused Projects:**
   - Click on each unused/duplicate project
   - Go to Settings → Advanced
   - Click "Delete Project"
   - Keep only your main "blocker-management-app" project

### Step 2: Link to Existing Project

1. **Get Project Information:**
   - Go to your main project in Vercel Dashboard
   - Click Settings → General
   - Copy the **Project ID** (starts with `prj_`)
   - Copy the **Org ID** (starts with `team_`)

2. **Update Local Configuration:**
   - Edit `.vercel/project.json` in your project root
   - Replace the placeholder values:

```json
{
  "projectId": "prj_your_actual_project_id_here",
  "orgId": "team_your_actual_org_id_here"
}
```

### Step 3: Deploy to Existing Project

Once configured, use the new deployment script:

```bash
npm run deploy:existing
```

This script will:
- Verify project linking
- Build the application
- Deploy to your existing Vercel project (not create a new one)

## 🚀 Alternative Deployment Methods

### Method 1: Manual Vercel CLI
```bash
# Login to Vercel
vercel login

# Link to existing project
vercel link

# Deploy to production
vercel --prod
```

### Method 2: GitHub Integration
- Ensure your repository is connected to only ONE Vercel project
- Push to main branch will automatically deploy
- Go to Vercel Dashboard → Project → Settings → Git to verify

### Method 3: Vercel Dashboard Upload
- Build locally: `npm run build`
- Go to Vercel Dashboard → Your Project
- Drag and drop the `build` folder to deploy

## 🔍 Troubleshooting

### If you still get connection errors:
1. **Check Git Integration:**
   - Vercel Dashboard → Project → Settings → Git
   - Ensure it's connected to the correct repository

2. **Unlink and Relink:**
   - Delete `.vercel` folder
   - Run `vercel link` and select existing project

3. **Contact Vercel Support:**
   - If you still have issues, contact Vercel support to reset project connections

## ✅ Verification

After fixing:
- Your deployments should update the existing project
- No new projects should be created
- Your domain should remain the same
- All previous deployments should be visible in the project history

## 📝 Notes

- The `.vercel` folder is now in `.gitignore` to prevent committing project-specific configuration
- Use `npm run deploy:existing` for future deployments
- This ensures you always deploy to the same project, preventing the 10-project limit issue