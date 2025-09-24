import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import NavigationBar from './NavigationBar';
import SuperAdminDashboard from './analytics/SuperAdminDashboard';
import CompanyAdminDashboard from './analytics/CompanyAdminDashboard';
import CompanyUserDashboard from './analytics/CompanyUserDashboard';
import SubcontractorDashboard from './analytics/SubcontractorDashboard';
import SubcontractorManagementDashboard from './analytics/SubcontractorManagementDashboard';
import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';
import { ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const RoleBasedDashboard = () => {
  const { user, userRole, companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select(`
            *,
            company:companies(name, subscription_status),
            projects!project_members(
              project:projects(id, name)
            )
          `)
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  const getRoleName = (role) => {
    const roleNames = {
      super_admin: 'Super Administrator',
      company_owner: 'Company Owner',
      company_admin: 'Company Administrator',
      main_contractor: 'Main Contractor',
      project_manager: 'Project Manager',
      supervisor: 'Supervisor',
      subcontractor: 'Subcontractor',
      subcontractor_manager: 'Subcontractor Manager',
      field_worker: 'Field Worker'
    };
    return roleNames[role] || role;
  };

  const canAccessWebInterface = () => {
    // All roles can access web interface for their data
    return true;
  };

  const renderRoleBadge = () => {
    const roleColor = {
      super_admin: 'solid-danger',
      company_owner: 'solid-primary',
      company_admin: 'primary',
      main_contractor: 'solid-secondary',
      project_manager: 'secondary',
      supervisor: 'info',
      subcontractor: 'success',
      subcontractor_manager: 'warning',
      field_worker: 'outline-primary'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-construction-100 text-construction-800`}>
        {getRoleName(userRole)}
      </span>
    );
  };

  const renderDashboard = () => {
    switch (userRole) {
      case 'super_admin':
        return <SuperAdminDashboard />;

      case 'company_owner':
      case 'company_admin':
        return <CompanyAdminDashboard companyId={companyId} />;

      case 'main_contractor':
      case 'project_manager':
      case 'supervisor':
        return <CompanyUserDashboard companyId={companyId} userRole={userRole} userId={user.id} />;

      case 'subcontractor_manager':
        return <SubcontractorManagementDashboard companyId={companyId} userId={user.id} />;

      case 'subcontractor':
      case 'field_worker':
        return <SubcontractorDashboard companyId={companyId} userId={user.id} userRole={userRole} />;

      default:
        return (
          <Card className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Dashboard Not Available
            </h3>
            <p className="text-slate-600">
              Your role does not have access to analytics dashboard.
            </p>
          </Card>
        );
    }
  };

  const handlePrintReport = (reportType) => {
    // This will trigger the print functionality in each dashboard component
    window.dispatchEvent(new CustomEvent('printReport', { detail: { type: reportType } }));
    setShowPrintOptions(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                <div className="flex items-center space-x-3 mt-2">
                  {renderRoleBadge()}
                  {userProfile?.company && (
                    <span className="text-sm text-slate-600">
                      {userProfile.company.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Button
                  variant="outline"
                  icon={DocumentTextIcon}
                  onClick={() => setShowPrintOptions(!showPrintOptions)}
                >
                  Generate Report
                </Button>

                {showPrintOptions && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                    <div className="py-2">
                      <button
                        onClick={() => handlePrintReport('summary')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Summary Report
                      </button>
                      <button
                        onClick={() => handlePrintReport('detailed')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Detailed Report
                      </button>
                      <button
                        onClick={() => handlePrintReport('performance')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Performance Report
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                icon={ClockIcon}
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {canAccessWebInterface() ? (
          renderDashboard()
        ) : (
          <Card className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-slate-600">
              You don't have permission to access this dashboard.
            </p>
          </Card>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showPrintOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPrintOptions(false)}
        />
      )}
    </div>
  );
};

export default RoleBasedDashboard;