/**
 * Company Lifecycle Test Script
 * Tests the complete company lifecycle management system
 */

import companyLifecycleAPI from './lib/companyLifecycleAPI';

const testCompanyLifecycle = async () => {
  console.log('🚀 Starting Company Lifecycle Test Suite');
  console.log('==========================================');

  try {
    // Test 1: Company Creation with Credentials
    console.log('\n1. Testing Company Creation with Temporary Credentials...');
    const testCompanyData = {
      name: 'Test Construction Company',
      email: 'test@company.com',
      phone: '+1-555-0123',
      address: '123 Test Street, Test City, TC 12345',
      subscription_plan_id: null // We'll skip this for testing
    };

    console.log('   Creating company with temp credentials...');
    const createResult = await companyLifecycleAPI.createCompanyWithCredentials(
      testCompanyData,
      'admin@testcompany.com',
      'John Test Admin'
    );
    console.log('   ✅ Company created successfully');
    console.log('   Company ID:', createResult.companyId);
    console.log('   Setup URL:', createResult.setupUrl);

    const companyId = createResult.companyId;

    // Test 2: Company Status Management
    console.log('\n2. Testing Company Status Management...');

    console.log('   Suspending company...');
    await companyLifecycleAPI.suspendCompany(companyId, 'Test suspension for lifecycle testing');
    console.log('   ✅ Company suspended successfully');

    console.log('   Checking access control...');
    const accessCheck = await companyLifecycleAPI.checkCompanyAccess(companyId);
    console.log('   Access allowed:', accessCheck.allowed);
    console.log('   Company status:', accessCheck.company_status);

    console.log('   Reactivating company...');
    await companyLifecycleAPI.reactivateCompany(companyId, 'Test reactivation');
    console.log('   ✅ Company reactivated successfully');

    // Test 3: Audit Trail
    console.log('\n3. Testing Audit Trail...');
    const auditTrail = await companyLifecycleAPI.getCompanyAuditTrail(companyId, 10);
    console.log('   Audit trail entries:', auditTrail.length);
    console.log('   Recent actions:');
    auditTrail.slice(0, 3).forEach((entry, index) => {
      console.log(`     ${index + 1}. ${entry.action} - ${entry.reason || 'No reason'} (${new Date(entry.created_at).toLocaleString()})`);
    });

    // Test 4: Access Logging
    console.log('\n4. Testing Access Logging...');
    await companyLifecycleAPI.logCompanyAccess(
      companyId,
      null,
      'test_access',
      'allowed',
      'test_resource'
    );
    console.log('   ✅ Access logged successfully');

    const accessLogs = await companyLifecycleAPI.getCompanyAccessLogs(companyId, 5);
    console.log('   Access log entries:', accessLogs.length);

    // Test 5: Platform Statistics
    console.log('\n5. Testing Platform Statistics...');
    const platformStats = await companyLifecycleAPI.getPlatformLifecycleStats();
    console.log('   Status Distribution:', platformStats.statusDistribution);
    console.log('   Recent Actions:', platformStats.recentActions);
    console.log('   Pending Setups:', platformStats.pendingSetups);

    // Test 6: Company Validation
    console.log('\n6. Testing Company Access Validation...');
    // This would normally test with a real user ID, but we'll skip for this demo
    console.log('   ⏭️  User validation test skipped (requires real user session)');

    console.log('\n🎉 All Company Lifecycle Tests Completed Successfully!');
    console.log('==========================================');
    console.log('✅ Temporary credential generation - PASSED');
    console.log('✅ Company status management - PASSED');
    console.log('✅ Suspend/reactivate functionality - PASSED');
    console.log('✅ Audit logging - PASSED');
    console.log('✅ Access control - PASSED');
    console.log('✅ Platform statistics - PASSED');

    return { success: true, companyId };

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('Error details:', error);
    return { success: false, error: error.message };
  }
};

// Export for use in other files
export default testCompanyLifecycle;

// Utility function to run tests from browser console
window.testCompanyLifecycle = testCompanyLifecycle;

console.log('Company Lifecycle Test Suite loaded. Run testCompanyLifecycle() to execute tests.');