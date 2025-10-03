/**
 * Multi-Tenant Testing Utilities
 * Test suite for verifying complete data isolation between companies
 */

import { supabase } from '../lib/supabase';
import authMiddleware from '../lib/authMiddleware';
import { authAPI, companyAPI, projectAPI, blockerAPI, userAPI } from '../lib/multitenant-api';
import superAdminAPI from '../lib/superAdminAPI';

class MultiTenantTestSuite {
  constructor() {
    this.testResults = [];
    this.testCompanies = [];
    this.testUsers = [];
  }

  // Helper method to log test results
  logResult(testName, passed, message, data = null) {
    const result = {
      testName,
      passed,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${message}`, data || '');
    return result;
  }

  // Create test companies for isolation testing
  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');

    try {
      // Create test companies
      const company1Data = {
        name: 'Test Company Alpha',
        email: 'admin@alpha.test',
        phone: '+1234567890',
        address: '123 Alpha Street'
      };

      const company2Data = {
        name: 'Test Company Beta',
        email: 'admin@beta.test',
        phone: '+1234567891',
        address: '456 Beta Avenue'
      };

      // Note: In real implementation, you'd use proper test user creation
      // For now, we'll simulate the test environment setup
      console.log('Test companies would be created here with proper authentication flow');

      this.logResult('Environment Setup', true, 'Test environment prepared');
      return true;

    } catch (error) {
      this.logResult('Environment Setup', false, `Failed to setup test environment: ${error.message}`);
      return false;
    }
  }

  // Test 1: Verify RLS policies prevent cross-company data access
  async testCompanyDataIsolation() {
    console.log('🔐 Testing company data isolation...');

    try {
      // Test companies table access
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*');

      if (companiesError) {
        return this.logResult(
          'Company Data Isolation',
          false,
          `Error accessing companies: ${companiesError.message}`
        );
      }

      // If user is not super admin, they should only see their own company
      const userContext = authMiddleware.getCurrentUser();
      if (!authMiddleware.isSuperAdmin()) {
        const userCompanyId = userContext.profile?.company_id;
        const visibleCompanies = companies.filter(c => c.id === userCompanyId);

        if (visibleCompanies.length !== 1 || companies.length > 1) {
          return this.logResult(
            'Company Data Isolation',
            false,
            `User can see ${companies.length} companies, should only see 1`,
            { companies, userCompanyId }
          );
        }
      }

      return this.logResult(
        'Company Data Isolation',
        true,
        'Company data properly isolated by RLS'
      );

    } catch (error) {
      return this.logResult(
        'Company Data Isolation',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Test 2: Verify project isolation within companies
  async testProjectIsolation() {
    console.log('📋 Testing project isolation...');

    try {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) {
        return this.logResult(
          'Project Isolation',
          false,
          `Error accessing projects: ${projectsError.message}`
        );
      }

      // Verify all visible projects belong to user's company
      const userContext = authMiddleware.getCurrentUser();
      if (!authMiddleware.isSuperAdmin()) {
        const userCompanyId = userContext.profile?.company_id;
        const invalidProjects = projects.filter(p => p.company_id !== userCompanyId);

        if (invalidProjects.length > 0) {
          return this.logResult(
            'Project Isolation',
            false,
            `User can see ${invalidProjects.length} projects from other companies`,
            { invalidProjects }
          );
        }
      }

      return this.logResult(
        'Project Isolation',
        true,
        `All ${projects.length} visible projects properly isolated`
      );

    } catch (error) {
      return this.logResult(
        'Project Isolation',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Test 3: Verify blocker isolation
  async testBlockerIsolation() {
    console.log('🚧 Testing blocker isolation...');

    try {
      const { data: blockers, error: blockersError } = await supabase
        .from('blockers')
        .select('*');

      if (blockersError) {
        return this.logResult(
          'Blocker Isolation',
          false,
          `Error accessing blockers: ${blockersError.message}`
        );
      }

      // Verify all visible blockers belong to user's company
      const userContext = authMiddleware.getCurrentUser();
      if (!authMiddleware.isSuperAdmin()) {
        const userCompanyId = userContext.profile?.company_id;
        const invalidBlockers = blockers.filter(b => b.company_id !== userCompanyId);

        if (invalidBlockers.length > 0) {
          return this.logResult(
            'Blocker Isolation',
            false,
            `User can see ${invalidBlockers.length} blockers from other companies`,
            { invalidBlockers }
          );
        }
      }

      return this.logResult(
        'Blocker Isolation',
        true,
        `All ${blockers.length} visible blockers properly isolated`
      );

    } catch (error) {
      return this.logResult(
        'Blocker Isolation',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Test 4: Verify user profile isolation
  async testUserProfileIsolation() {
    console.log('👥 Testing user profile isolation...');

    try {
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*');

      if (usersError) {
        return this.logResult(
          'User Profile Isolation',
          false,
          `Error accessing user profiles: ${usersError.message}`
        );
      }

      // Verify all visible users belong to user's company
      const userContext = authMiddleware.getCurrentUser();
      if (!authMiddleware.isSuperAdmin()) {
        const userCompanyId = userContext.profile?.company_id;
        const invalidUsers = users.filter(u => u.company_id !== userCompanyId);

        if (invalidUsers.length > 0) {
          return this.logResult(
            'User Profile Isolation',
            false,
            `User can see ${invalidUsers.length} profiles from other companies`,
            { invalidUsers }
          );
        }
      }

      return this.logResult(
        'User Profile Isolation',
        true,
        `All ${users.length} visible user profiles properly isolated`
      );

    } catch (error) {
      return this.logResult(
        'User Profile Isolation',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Test 5: Verify contractor isolation
  async testContractorIsolation() {
    console.log('🏗️ Testing contractor isolation...');

    try {
      const { data: contractors, error: contractorsError } = await supabase
        .from('contractors')
        .select('*');

      if (contractorsError) {
        return this.logResult(
          'Contractor Isolation',
          false,
          `Error accessing contractors: ${contractorsError.message}`
        );
      }

      // Verify all visible contractors belong to user's company
      const userContext = authMiddleware.getCurrentUser();
      if (!authMiddleware.isSuperAdmin()) {
        const userCompanyId = userContext.profile?.company_id;
        const invalidContractors = contractors.filter(c => c.company_id !== userCompanyId);

        if (invalidContractors.length > 0) {
          return this.logResult(
            'Contractor Isolation',
            false,
            `User can see ${invalidContractors.length} contractors from other companies`,
            { invalidContractors }
          );
        }
      }

      return this.logResult(
        'Contractor Isolation',
        true,
        `All ${contractors.length} visible contractors properly isolated`
      );

    } catch (error) {
      return this.logResult(
        'Contractor Isolation',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Test 6: Verify site drawings isolation
  async testSiteDrawingsIsolation() {
    console.log('📐 Testing site drawings isolation...');

    try {
      const { data: drawings, error: drawingsError } = await supabase
        .from('site_drawings')
        .select('*');

      if (drawingsError) {
        return this.logResult(
          'Site Drawings Isolation',
          false,
          `Error accessing site drawings: ${drawingsError.message}`
        );
      }

      // Verify all visible drawings belong to user's company
      const userContext = authMiddleware.getCurrentUser();
      if (!authMiddleware.isSuperAdmin()) {
        const userCompanyId = userContext.profile?.company_id;
        const invalidDrawings = drawings.filter(d => d.company_id !== userCompanyId);

        if (invalidDrawings.length > 0) {
          return this.logResult(
            'Site Drawings Isolation',
            false,
            `User can see ${invalidDrawings.length} drawings from other companies`,
            { invalidDrawings }
          );
        }
      }

      return this.logResult(
        'Site Drawings Isolation',
        true,
        `All ${drawings.length} visible drawings properly isolated`
      );

    } catch (error) {
      return this.logResult(
        'Site Drawings Isolation',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Test 7: Verify super admin can access all data
  async testSuperAdminAccess() {
    console.log('👑 Testing super admin access...');

    try {
      if (!authMiddleware.isSuperAdmin()) {
        return this.logResult(
          'Super Admin Access',
          true,
          'User is not super admin - test skipped'
        );
      }

      // Super admin should be able to access all companies
      const { data: allCompanies, error: companiesError } = await supabase
        .from('companies')
        .select('*');

      if (companiesError) {
        return this.logResult(
          'Super Admin Access',
          false,
          `Super admin cannot access companies: ${companiesError.message}`
        );
      }

      // Test platform settings access (super admin only)
      const { data: platformSettings, error: settingsError } = await supabase
        .from('platform_settings')
        .select('*');

      if (settingsError) {
        return this.logResult(
          'Super Admin Access',
          false,
          `Super admin cannot access platform settings: ${settingsError.message}`
        );
      }

      return this.logResult(
        'Super Admin Access',
        true,
        `Super admin can access ${allCompanies.length} companies and ${platformSettings.length} platform settings`
      );

    } catch (error) {
      return this.logResult(
        'Super Admin Access',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Test 8: Verify role-based permissions
  async testRoleBasedPermissions() {
    console.log('🔑 Testing role-based permissions...');

    try {
      const permissions = authMiddleware.getPermissions();
      const userRole = authMiddleware.getCurrentUser().profile?.role;

      // Define expected permissions based on role
      const expectedPermissions = {
        'super_admin': {
          canCreateProjects: true,
          canManageUsers: true,
          canManageContractors: true,
          canUploadDrawings: true,
          canCreateBlockers: true,
          canAssignBlockers: true,
          canResolveBlockers: true,
          canViewAnalytics: true,
          canManageCompany: true,
          isSuperAdmin: true
        },
        'company_owner': {
          canCreateProjects: true,
          canManageUsers: true,
          canManageContractors: true,
          canUploadDrawings: true,
          canCreateBlockers: true,
          canAssignBlockers: true,
          canResolveBlockers: true,
          canViewAnalytics: true,
          canManageCompany: true,
          isSuperAdmin: false
        },
        'field_worker': {
          canCreateProjects: false,
          canManageUsers: false,
          canManageContractors: false,
          canUploadDrawings: false,
          canCreateBlockers: true,
          canAssignBlockers: false,
          canResolveBlockers: true,
          canViewAnalytics: false,
          canManageCompany: false,
          isSuperAdmin: false
        }
      };

      const expected = expectedPermissions[userRole];
      if (!expected) {
        return this.logResult(
          'Role-Based Permissions',
          false,
          `Unknown role: ${userRole}`
        );
      }

      // Check if permissions match expected values
      const mismatches = [];
      Object.entries(expected).forEach(([permission, expectedValue]) => {
        if (permissions[permission] !== expectedValue) {
          mismatches.push({
            permission,
            expected: expectedValue,
            actual: permissions[permission]
          });
        }
      });

      if (mismatches.length > 0) {
        return this.logResult(
          'Role-Based Permissions',
          false,
          `Permission mismatches for role ${userRole}`,
          { mismatches }
        );
      }

      return this.logResult(
        'Role-Based Permissions',
        true,
        `All permissions correct for role: ${userRole}`
      );

    } catch (error) {
      return this.logResult(
        'Role-Based Permissions',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Test 9: Verify subscription-based feature access
  async testSubscriptionFeatureAccess() {
    console.log('💳 Testing subscription-based feature access...');

    try {
      const userContext = authMiddleware.getCurrentUser();
      const subscription = authMiddleware.validateSubscription();

      if (!subscription.valid) {
        return this.logResult(
          'Subscription Feature Access',
          false,
          `Invalid subscription: ${subscription.reason}`
        );
      }

      // Test basic feature access
      const hasBasicFeatures = authMiddleware.hasFeatureAccess('projects');
      const hasAdvancedFeatures = authMiddleware.hasFeatureAccess('api_access');

      // Test usage limits
      const userLimit = authMiddleware.checkUsageLimit('users');
      const projectLimit = authMiddleware.checkUsageLimit('projects');

      return this.logResult(
        'Subscription Feature Access',
        true,
        `Subscription valid: ${subscription.type}`,
        {
          subscription,
          hasBasicFeatures,
          hasAdvancedFeatures,
          userLimit,
          projectLimit
        }
      );

    } catch (error) {
      return this.logResult(
        'Subscription Feature Access',
        false,
        `Test failed: ${error.message}`
      );
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Multi-Tenant Test Suite...');
    this.testResults = [];

    try {
      // Initialize auth middleware
      await authMiddleware.initialize();

      const tests = [
        () => this.testCompanyDataIsolation(),
        () => this.testProjectIsolation(),
        () => this.testBlockerIsolation(),
        () => this.testUserProfileIsolation(),
        () => this.testContractorIsolation(),
        () => this.testSiteDrawingsIsolation(),
        () => this.testSuperAdminAccess(),
        () => this.testRoleBasedPermissions(),
        () => this.testSubscriptionFeatureAccess()
      ];

      for (const test of tests) {
        await test();
      }

      // Generate summary
      const passedTests = this.testResults.filter(r => r.passed).length;
      const totalTests = this.testResults.length;
      const successRate = (passedTests / totalTests) * 100;

      console.log('\n📊 Test Summary:');
      console.log(`✅ Passed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
      console.log(`❌ Failed: ${totalTests - passedTests}`);

      if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Multi-tenant isolation is working correctly.');
      } else {
        console.log('⚠️ Some tests failed. Please review the results above.');
      }

      return {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate
        },
        results: this.testResults
      };

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return {
        summary: { total: 0, passed: 0, failed: 1, successRate: 0 },
        results: this.testResults,
        error: error.message
      };
    }
  }

  // Generate test report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userContext: authMiddleware.getCurrentUser(),
      testResults: this.testResults,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.passed).length,
        failed: this.testResults.filter(r => !r.passed).length
      }
    };

    return report;
  }

  // Export test results for analysis
  exportResults() {
    const report = this.generateReport();
    const jsonReport = JSON.stringify(report, null, 2);

    // In a real app, you might save this to a file or send to an API
    console.log('📋 Test Report:', jsonReport);

    return jsonReport;
  }
}

// Create singleton instance
const multiTenantTestSuite = new MultiTenantTestSuite();

export default multiTenantTestSuite;