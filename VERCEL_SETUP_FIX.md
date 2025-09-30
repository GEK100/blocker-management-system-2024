# Vercel Setup Fix Guide

This guide will help you fix the project name and environment variable issues.

## Problem 1: Wrong Project Name
Your Vercel project is still called "construction-blockers-app" instead of "blocker-management-app".

## Problem 2: Missing Environment Variables
Vercel is looking for Supabase environment variables that don't exist.

## Solution Options

### Option A: Create New Project (Recommended)

1. **Delete old .vercel directory:**
   ```bash
   rm -rf .vercel
   ```

2. **Deploy as new project:**
   ```bash
   vercel --prod
   ```
   - When prompted, choose "Create new project"
   - Project name will be "blocker-management-app" (from package.json)

3. **Set up environment variables:**
   ```bash
   # Add your actual Supabase values
   vercel env add REACT_APP_SUPABASE_URL
   vercel env add REACT_APP_SUPABASE_ANON_KEY
   ```

4. **Re-deploy:**
   ```bash
   vercel --prod
   ```

### Option B: Rename Existing Project

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your "construction-blockers-app" project
   - Go to Settings > General
   - Change project name to "blocker-management-app"

2. **Add Environment Variables:**
   - Go to Settings > Environment Variables
   - Add: `REACT_APP_SUPABASE_URL` = your_supabase_url
   - Add: `REACT_APP_SUPABASE_ANON_KEY` = your_supabase_anon_key

3. **Re-deploy:**
   ```bash
   vercel --prod
   ```

## Getting Your Supabase Values

1. **Go to your Supabase dashboard:**
   - https://app.supabase.com/
   - Select your project

2. **Get the values:**
   - Go to Settings > API
   - Copy "Project URL" → This is your `REACT_APP_SUPABASE_URL`
   - Copy "anon public" key → This is your `REACT_APP_SUPABASE_ANON_KEY`

## Environment Variable Format

In Vercel dashboard, add these exactly:

**Variable Name:** `REACT_APP_SUPABASE_URL`
**Value:** `https://your-project.supabase.co`

**Variable Name:** `REACT_APP_SUPABASE_ANON_KEY`
**Value:** `eyJ...` (your actual anon key)

## Verification

After setup, verify:
1. Project name shows as "blocker-management-app" in Vercel
2. Environment variables are set in project settings
3. Deployment succeeds without errors

## Notes

- I've temporarily removed the env references from vercel.json to prevent deployment errors
- You can add them back later using the @secret syntax if preferred
- For now, setting them directly in Vercel dashboard is simpler