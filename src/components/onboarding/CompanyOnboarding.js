import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { inviteAPI } from '../../lib/inviteAPI';
import { companyAPI } from '../../lib/companyAPI';
import Card from '../../design-system/components/Card';
import Button from '../../design-system/components/Button';
import Badge from '../../design-system/components/Badge';
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  UserGroupIcon,
  FolderIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const CompanyOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [currentStep, setCurrentStep] = useState(1);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    projectName: '',
    projectDescription: '',
    projectAddress: '',
    estimatedStartDate: '',
    estimatedEndDate: '',
    initialUsers: [
      { email: '', firstName: '', lastName: '', role: 'project_manager' }
    ]
  });

  const steps = [
    {
      id: 1,
      title: 'Verify Invitation',
      description: 'Validate your company invitation',
      icon: EnvelopeIcon,
      completed: false
    },
    {
      id: 2,
      title: 'Email Verification',
      description: 'Verify your email address',
      icon: CheckCircleIcon,
      completed: false
    },
    {
      id: 3,
      title: 'Account Setup',
      description: 'Create your administrator account',
      icon: BuildingOfficeIcon,
      completed: false
    },
    {
      id: 4,
      title: 'First Project',
      description: 'Set up your first project',
      icon: FolderIcon,
      completed: false
    },
    {
      id: 5,
      title: 'Team Setup',
      description: 'Add your initial team members',
      icon: UserGroupIcon,
      completed: false
    }
  ];

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link - no token provided');
      setLoading(false);
      return;
    }
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const result = await inviteAPI.validateInviteToken(token);
      if (result.valid) {
        setInvitation(result.invitation);
        setFormData(prev => ({
          ...prev,
          email: result.invitation.adminEmail,
          companyName: result.invitation.companyName
        }));
        setCurrentStep(2);
        updateStepStatus(1, true);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = (stepId, completed) => {
    steps.find(step => step.id === stepId).completed = completed;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserChange = (index, field, value) => {
    const updatedUsers = [...formData.initialUsers];
    updatedUsers[index][field] = value;
    setFormData(prev => ({
      ...prev,
      initialUsers: updatedUsers
    }));
  };

  const addUser = () => {
    setFormData(prev => ({
      ...prev,
      initialUsers: [
        ...prev.initialUsers,
        { email: '', firstName: '', lastName: '', role: 'field_worker' }
      ]
    }));
  };

  const removeUser = (index) => {
    setFormData(prev => ({
      ...prev,
      initialUsers: prev.initialUsers.filter((_, i) => i !== index)
    }));
  };

  const sendEmailVerification = async () => {
    setLoading(true);
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const result = await inviteAPI.sendEmailVerification(formData.email, verificationCode);
      if (result.success) {
        alert(`Verification code sent to ${formData.email}. For demo purposes, the code is: ${verificationCode}`);
      }
    } catch (error) {
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!formData.verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await inviteAPI.verifyEmailCode(formData.email, formData.verificationCode);
      if (result.valid) {
        updateStepStatus(2, true);
        setCurrentStep(3);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const validateAccountSetup = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.password || formData.password.length < 8) return 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const setupAccount = () => {
    const validationError = validateAccountSetup();
    if (validationError) {
      setError(validationError);
      return;
    }

    updateStepStatus(3, true);
    setCurrentStep(4);
    setError(null);
  };

  const validateProject = () => {
    if (!formData.projectName.trim()) return 'Project name is required';
    if (!formData.estimatedStartDate) return 'Estimated start date is required';
    return null;
  };

  const createProject = () => {
    const validationError = validateProject();
    if (validationError) {
      setError(validationError);
      return;
    }

    updateStepStatus(4, true);
    setCurrentStep(5);
    setError(null);
  };

  const validateUsers = () => {
    const validUsers = formData.initialUsers.filter(user =>
      user.email.trim() && user.firstName.trim() && user.lastName.trim()
    );
    return validUsers.length > 0 ? null : 'At least one team member is required';
  };

  const completeOnboarding = async () => {
    const validationError = validateUsers();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // Prepare onboarding data
      const onboardingData = {
        companyName: formData.companyName,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        projectAddress: formData.projectAddress,
        estimatedStartDate: formData.estimatedStartDate,
        estimatedEndDate: formData.estimatedEndDate,
        initialUsers: formData.initialUsers.filter(user =>
          user.email.trim() && user.firstName.trim() && user.lastName.trim()
        ),
        subscriptionPlan: invitation?.subscriptionPlan || 'trial'
      };

      // Complete the full onboarding process
      const result = await companyAPI.completeOnboarding(invitation.companyName, onboardingData);

      if (result.success) {
        // Mark the original invitation as used
        await inviteAPI.markInviteAsUsed(token, result.companyId);

        // Send invitations to team members
        if (result.users && result.users.length > 0) {
          const validUsers = result.users
            .filter(userResult => userResult.success)
            .map(userResult => userResult.user);

          if (validUsers.length > 0) {
            await companyAPI.sendUserInvitations(result.companyId, validUsers);
          }
        }

        updateStepStatus(5, true);

        // Store company ID for navigation
        localStorage.setItem('currentCompanyId', result.companyId);

        // Navigate to company admin dashboard after a brief delay
        setTimeout(() => {
          navigate('/company-admin');
        }, 2000);
      } else {
        setError(result.error || 'Failed to complete onboarding');
        setLoading(false);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      setError('Failed to complete onboarding');
      setLoading(false);
    }
  };

  const goToStep = (step) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  if (loading && !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Invitation</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <BuildingOfficeIcon className="h-8 w-8 text-construction-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Company Onboarding</h1>
              <p className="text-slate-600">Welcome to {formData.companyName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = step.completed;
              const isAccessible = step.id <= currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={!isAccessible}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isActive
                        ? 'border-construction-500 text-construction-600 bg-construction-50'
                        : isAccessible
                        ? 'border-slate-300 text-slate-400 hover:border-slate-400'
                        : 'border-slate-200 text-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>
                  <div className={`ml-3 ${isAccessible ? '' : 'opacity-50'}`}>
                    <p className={`text-sm font-medium ${isActive ? 'text-construction-600' : 'text-slate-900'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-4 ${
                      step.completed ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card className="p-8">
          {/* Step 2: Email Verification */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Verify Your Email</h2>
              <p className="text-slate-600 mb-6">
                We'll send a verification code to <strong>{formData.email}</strong> to ensure you have access to this email address.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={sendEmailVerification}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </Button>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={formData.verificationCode}
                    onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={verifyEmail}
                    disabled={!formData.verificationCode || loading}
                    className="flex-1"
                  >
                    Verify & Continue
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Account Setup */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Set Up Your Administrator Account</h2>
              <p className="text-slate-600 mb-6">
                Create your company administrator account. You'll be the primary admin for {formData.companyName}.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    placeholder="Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 pr-10"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-slate-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={setupAccount}
                  className="flex-1"
                >
                  Create Account
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: First Project */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Create Your First Project</h2>
              <p className="text-slate-600 mb-6">
                Set up your first construction project to start managing your team and tracking progress.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    placeholder="Downtown Office Building"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project Description
                  </label>
                  <textarea
                    value={formData.projectDescription}
                    onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    placeholder="Brief description of the construction project..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project Address
                  </label>
                  <input
                    type="text"
                    value={formData.projectAddress}
                    onChange={(e) => handleInputChange('projectAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    placeholder="123 Main St, City, State"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Estimated Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.estimatedStartDate}
                      onChange={(e) => handleInputChange('estimatedStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Estimated End Date
                    </label>
                    <input
                      type="date"
                      value={formData.estimatedEndDate}
                      onChange={(e) => handleInputChange('estimatedEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={createProject}
                    className="flex-1"
                  >
                    Create Project
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Team Setup */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Add Your Initial Team</h2>
              <p className="text-slate-600 mb-6">
                Add your initial team members who will be invited to join {formData.companyName}.
              </p>

              <div className="space-y-4">
                {formData.initialUsers.map((user, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-slate-900">Team Member {index + 1}</h4>
                      {formData.initialUsers.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeUser(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                          placeholder="user@company.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={user.firstName}
                          onChange={(e) => handleUserChange(index, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                          placeholder="John"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={user.lastName}
                          onChange={(e) => handleUserChange(index, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                          placeholder="Smith"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Role
                        </label>
                        <select
                          value={user.role}
                          onChange={(e) => handleUserChange(index, 'role', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                        >
                          <option value="project_manager">Project Manager</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="field_worker">Field Worker</option>
                          <option value="subcontractor">Subcontractor</option>
                          <option value="subcontractor_manager">Subcontractor Manager</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addUser}
                  className="w-full"
                >
                  Add Another Team Member
                </Button>

                <div className="flex space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    className="flex-1"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={completeOnboarding}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Setting up...' : 'Complete Setup'}
                    <CheckCircleIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {steps.every(step => step.completed) && (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Setup Complete!</h2>
              <p className="text-slate-600 mb-4">
                Welcome to your construction management platform. Redirecting to your dashboard...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-600 mx-auto"></div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CompanyOnboarding;