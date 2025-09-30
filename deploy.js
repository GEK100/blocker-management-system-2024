#!/usr/bin/env node

/**
 * Deployment script for Construction Blockers App
 * Ensures deployment updates existing Vercel project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment process...');

// Check if .vercel directory exists and is properly configured
const vercelDir = path.join(__dirname, '.vercel');
const projectJsonPath = path.join(vercelDir, 'project.json');

if (!fs.existsSync(vercelDir)) {
  console.log('⚠️  .vercel directory not found. Creating...');
  fs.mkdirSync(vercelDir, { recursive: true });
}

if (!fs.existsSync(projectJsonPath)) {
  console.log('⚠️  project.json not found. Please configure your Vercel project linking.');
  console.log('Run the following steps:');
  console.log('1. vercel login');
  console.log('2. vercel link');
  console.log('3. Select your existing construction-blockers-app project');
  process.exit(1);
}

try {
  // Read project configuration
  const projectConfig = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));

  if (projectConfig.projectId === 'YOUR_PROJECT_ID_HERE') {
    console.log('⚠️  Please configure .vercel/project.json with your actual project ID and org ID');
    console.log('See .vercel/README.txt for instructions');
    process.exit(1);
  }

  console.log('✅ Vercel project linked:', projectConfig.projectId);

  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  // Deploy to Vercel
  console.log('🌐 Deploying to Vercel...');
  execSync('vercel --prod', { stdio: 'inherit' });

  console.log('✅ Deployment completed successfully!');
  console.log('🔗 Your app should be updated at your existing Vercel URL');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}