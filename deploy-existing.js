#!/usr/bin/env node

/**
 * Deploy to existing Vercel project for blocker-management-app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying to EXISTING Vercel project...');

// Check if project is linked
const vercelDir = path.join(__dirname, '.vercel');
const projectFile = path.join(vercelDir, 'project.json');

if (!fs.existsSync(projectFile)) {
  console.log('❌ Project not linked to Vercel.');
  console.log('📋 Please follow these steps:');
  console.log('');
  console.log('1. Go to https://vercel.com/dashboard');
  console.log('2. Find your "blocker-management-app" project');
  console.log('3. Go to Settings → General');
  console.log('4. Copy Project ID and Org ID');
  console.log('5. Update .vercel/project.json with these IDs');
  console.log('');
  console.log('Example .vercel/project.json:');
  console.log('{');
  console.log('  "projectId": "prj_your_project_id_here",');
  console.log('  "orgId": "team_your_org_id_here"');
  console.log('}');
  process.exit(1);
}

try {
  // Read and validate project configuration
  const projectConfig = JSON.parse(fs.readFileSync(projectFile, 'utf8'));

  if (projectConfig.projectId === 'REPLACE_WITH_YOUR_PROJECT_ID') {
    console.log('❌ Please update .vercel/project.json with your actual project IDs');
    process.exit(1);
  }

  console.log('✅ Project linked to:', projectConfig.projectId);

  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('🌐 Deploying to existing Vercel project...');

  // Deploy to production
  execSync('vercel --prod', { stdio: 'inherit' });

  console.log('✅ Deployment completed!');
  console.log('🔗 Your app should be live at your existing domain');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('');
  console.log('💡 If you get authentication errors, run: vercel login');
  console.log('💡 If you get project linking errors, verify your .vercel/project.json');
  process.exit(1);
}