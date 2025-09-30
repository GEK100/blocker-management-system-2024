#!/usr/bin/env node

/**
 * Force new Vercel project deployment for blocker-management-app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting fresh Vercel deployment...');

// Ensure no existing vercel configuration
const vercelDir = path.join(__dirname, '.vercel');
if (fs.existsSync(vercelDir)) {
  console.log('🗑️  Removing existing .vercel directory...');
  fs.rmSync(vercelDir, { recursive: true, force: true });
}

try {
  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('🌐 Deploying to Vercel as NEW project...');
  console.log('When prompted:');
  console.log('1. Select "Create and deploy"');
  console.log('2. Project name should be "blocker-management-app"');
  console.log('3. Don\'t link to existing project');

  // Deploy without linking to existing project
  execSync('vercel --prod', { stdio: 'inherit' });

  console.log('✅ Deployment completed!');
  console.log('🔗 Check your Vercel dashboard for the new project URL');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}