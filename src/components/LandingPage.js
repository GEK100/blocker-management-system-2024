import React from 'react';
import { useNavigate } from 'react-router-dom';
import { brandConfig } from '../design-system/brand';
import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BuildingOfficeIcon,
      title: 'Multi-Tenant Architecture',
      description: 'Complete company isolation with role-based access controls and data segregation.'
    },
    {
      icon: UserGroupIcon,
      title: 'Role-Based Dashboards',
      description: 'Customized interfaces for Super Admins, Company Admins, Contractors, and Field Workers.'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile-Optimized',
      description: 'Touch-friendly interfaces designed for field workers with enhanced mobile navigation.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'GDPR Compliant',
      description: 'Complete data protection with consent management, audit logging, and export capabilities.'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics & Reporting',
      description: 'Comprehensive analytics with interactive charts and printable reports for all user types.'
    },
    {
      icon: DocumentTextIcon,
      title: 'Project Management',
      description: 'Enhanced blocker workflow with Main Contractor review process and team collaboration.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-construction-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-6 w-6 text-construction-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{brandConfig.name}</h1>
                <p className="text-sm text-slate-600">{brandConfig.tagline}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="primary" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Professional Construction
            <span className="text-construction-600 block">Blocker Management</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Streamline your construction projects with our comprehensive SaaS platform.
            Manage blockers, track performance, and collaborate efficiently across all stakeholders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outline-construction"
              size="lg"
              onClick={() => navigate('/login')}
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
              Everything You Need for Construction Management
            </h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              From project planning to completion, our platform provides comprehensive
              tools for modern construction teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} variant="default" hover className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-construction-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-construction-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-slate-900">{feature.title}</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-construction-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Construction Management?
          </h3>
          <p className="text-xl text-construction-100 mb-8">
            Join hundreds of construction companies already using {brandConfig.name}
            to streamline their operations and improve project outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-white border-white hover:bg-white hover:text-construction-600"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-construction-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-5 w-5 text-construction-600" />
              </div>
              <div>
                <h5 className="text-white font-semibold">{brandConfig.name}</h5>
                <p className="text-slate-400 text-sm">{brandConfig.tagline}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 {brandConfig.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;