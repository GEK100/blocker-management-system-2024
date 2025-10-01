#!/usr/bin/env node

/**
 * Deploy to Vercel with a unique project name to avoid conflicts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting fresh Vercel deployment with unique name...');

// Generate unique project name with timestamp
const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const uniqueName = `blocker-mgmt-${timestamp}`;

console.log(`📦 Using project name: ${uniqueName}`);

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

  console.log('🌐 Deploying to Vercel with unique name...');
  console.log('When prompted:');
  console.log(`1. Select "Create and deploy"`);
  console.log(`2. Project name will be: ${uniqueName}`);
  console.log('3. Don\'t link to existing project');

  // Deploy with unique name (using --yes to auto-confirm)
  execSync(`vercel --prod --yes`, { stdio: 'inherit' });

  console.log('✅ Deployment completed!');
  console.log(`🔗 Your app is live at: https://${uniqueName}.vercel.app`);
  console.log('🎉 Check your Vercel dashboard for the new project');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('');
  console.log('💡 Alternative options:');
  console.log('1. Use manual upload: drag build folder to vercel.com');
  console.log('2. Clean up old Vercel projects and retry');
  console.log('3. Use a different Git repository');
  process.exit(1);
}