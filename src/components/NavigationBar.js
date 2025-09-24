import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { brandConfig } from '../design-system/brand';
import Button from '../design-system/components/Button';
import Badge from '../design-system/components/Badge';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CogIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const NavigationBar = () => {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Analytics',
        path: '/analytics',
        icon: ChartBarIcon,
        description: 'View performance metrics and reports',
        allowedRoles: 'all' // All authenticated users can access analytics
      }
    ];

    const roleSpecificItems = [];

    switch (userRole) {
      case 'super_admin':
        roleSpecificItems.push(
          {
            name: 'Platform Admin',
            path: '/super-admin',
            icon: CogIcon,
            description: 'Manage platform and companies'
          }
        );
        break;

      case 'company_owner':
      case 'company_admin':
        roleSpecificItems.push(
          {
            name: 'Company Management',
            path: '/company-admin',
            icon: BuildingOfficeIcon,
            description: 'Manage company and users'
          }
        );
        break;

      case 'field_worker':
      case 'subcontractor':
      case 'supervisor':
        roleSpecificItems.push(
          {
            name: 'Field Interface',
            path: '/mobile',
            icon: ExclamationTriangleIcon,
            description: 'Mobile-optimized interface'
          }
        );
        break;

      case 'main_contractor':
      case 'project_manager':
      case 'subcontractor_manager':
        roleSpecificItems.push(
          {
            name: 'Blockers',
            path: '/blockers',
            icon: ExclamationTriangleIcon,
            description: 'Manage project blockers'
          },
          {
            name: 'Team Management',
            path: '/team',
            icon: UserGroupIcon,
            description: 'Manage team and assignments'
          }
        );
        break;
    }

    return [...baseItems, ...roleSpecificItems];
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-construction-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-5 w-5 text-construction-600" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-slate-900">{brandConfig.name}</h1>
                <p className="text-xs text-slate-600">{brandConfig.tagline}</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-construction-100 text-construction-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <BellIcon className="h-5 w-5" />
            </button>

            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
              >
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-slate-900">
                    {user.user_metadata?.first_name || user.email}
                  </div>
                  <div className="text-xs text-slate-600">
                    {getRoleName(userRole)}
                  </div>
                </div>
                <div className="w-8 h-8 bg-construction-100 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="h-5 w-5 text-construction-600" />
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-construction-100 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="h-6 w-6 text-construction-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {user.user_metadata?.first_name || user.email}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {user.email}
                        </p>
                        <Badge variant="construction" size="sm" className="mt-1">
                          {getRoleName(userRole)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Quick Access
                      </p>
                    </div>
                    {navigationItems.slice(0, 3).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Icon className="h-4 w-4 text-slate-400" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-700 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-construction-100 text-construction-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1 text-left">
                      <div>{item.name}</div>
                      <div className="text-xs text-slate-500">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;