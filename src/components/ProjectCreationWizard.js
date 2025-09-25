import React, { useState, useRef } from 'react';
import { multitenant } from '../lib/multitenant-api';
import { supabase } from '../lib/supabase';
import './ProjectCreationWizard.css';

const ProjectCreationWizard = ({ company, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingDrawings, setUploadingDrawings] = useState(false);
  const fileInputRef = useRef(null);

  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    status: 'planning',
    startDate: '',
    expectedEndDate: '',
    budget: '',
    projectManager: '',
    client: '',
    contractor: '',
    projectType: 'construction',
    drawings: []
  });

  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const steps = [
    { id: 1, title: 'Project Details', description: 'Basic project information' },
    { id: 2, title: 'Location & Timeline', description: 'Address and scheduling' },
    { id: 3, title: 'Team & Budget', description: 'Project team and budget' },
    { id: 4, title: 'Site Drawings', description: 'Upload project drawings' },
    { id: 5, title: 'Review & Create', description: 'Confirm and create project' }
  ];

  const projectTypes = [
    'construction', 'renovation', 'maintenance', 'inspection',
    'design', 'planning', 'other'
  ];

  const projectStatuses = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' }
  ];

  const handleInputChange = (field, value) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!projectData.name.trim()) newErrors.name = 'Project name is required';
        if (!projectData.description.trim()) newErrors.description = 'Project description is required';
        break;

      case 2:
        if (!projectData.address.trim()) newErrors.address = 'Project address is required';
        if (!projectData.city.trim()) newErrors.city = 'City is required';
        if (projectData.startDate && projectData.expectedEndDate) {
          if (new Date(projectData.startDate) >= new Date(projectData.expectedEndDate)) {
            newErrors.expectedEndDate = 'End date must be after start date';
          }
        }
        break;

      case 3:
        if (projectData.budget && isNaN(parseFloat(projectData.budget))) {
          newErrors.budget = 'Budget must be a valid number';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only images and PDFs under 10MB are allowed.');
    }

    const newFiles = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      uploaded: false,
      uploading: false,
      url: null
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const uploadDrawings = async () => {
    if (uploadedFiles.length === 0) return [];

    setUploadingDrawings(true);
    const uploadedDrawings = [];

    try {
      for (const fileData of uploadedFiles) {
        if (fileData.uploaded) {
          uploadedDrawings.push({
            name: fileData.name,
            url: fileData.url,
            type: fileData.type,
            size: fileData.size
          });
          continue;
        }

        // Update file status to uploading
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileData.id ? { ...f, uploading: true } : f)
        );

        // Upload to Supabase Storage
        const fileName = `${company.id}/${Date.now()}-${fileData.name}`;
        const { data, error } = await supabase.storage
          .from('site-drawings')
          .upload(fileName, fileData.file);

        if (error) {
          console.error('Error uploading file:', error);
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('site-drawings')
          .getPublicUrl(fileName);

        const uploadedDrawing = {
          name: fileData.name,
          url: urlData.publicUrl,
          type: fileData.type,
          size: fileData.size,
          storage_path: fileName
        };

        uploadedDrawings.push(uploadedDrawing);

        // Update file status to uploaded
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileData.id ?
            { ...f, uploading: false, uploaded: true, url: urlData.publicUrl } : f
          )
        );
      }

      return uploadedDrawings;
    } catch (error) {
      console.error('Error uploading drawings:', error);
      alert('Failed to upload some drawings. Please try again.');
      return [];
    } finally {
      setUploadingDrawings(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // Upload drawings first
      const drawings = await uploadDrawings();

      // Create the project
      const newProject = await multitenant.projectAPI.create({
        company_id: company.id,
        name: projectData.name,
        description: projectData.description,
        address: projectData.address,
        city: projectData.city,
        state: projectData.state,
        zip_code: projectData.zipCode,
        country: projectData.country,
        status: projectData.status,
        start_date: projectData.startDate || null,
        expected_end_date: projectData.expectedEndDate || null,
        budget: projectData.budget ? parseFloat(projectData.budget) : null,
        project_manager: projectData.projectManager || null,
        client: projectData.client || null,
        contractor: projectData.contractor || null,
        project_type: projectData.projectType,
        metadata: {
          created_via: 'wizard',
          initial_drawings_count: drawings.length
        }
      });

      // Add drawings to the project if any were uploaded
      if (drawings.length > 0) {
        for (const drawing of drawings) {
          await multitenant.siteDrawingAPI.create({
            company_id: company.id,
            project_id: newProject.id,
            name: drawing.name,
            file_url: drawing.url,
            file_type: drawing.type,
            file_size: drawing.size,
            storage_path: drawing.storage_path,
            uploaded_by: multitenant.getCurrentUser()?.id
          });
        }
      }

      // Log project creation
      await supabase
        .from('audit_logs')
        .insert({
          user_id: multitenant.getCurrentUser()?.id,
          action: 'project_created',
          resource_type: 'project',
          resource_id: newProject.id,
          details: {
            project_name: projectData.name,
            drawings_count: drawings.length,
            created_via: 'wizard'
          }
        });

      // Call completion callback
      if (onComplete) {
        onComplete(newProject);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setErrors({ submit: error.message || 'Failed to create project. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Project Details</h2>
            <p>Let's start with the basic information about your project.</p>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Project Name *</label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Downtown Office Complex"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Project Type</label>
                <select
                  value={projectData.projectType}
                  onChange={(e) => handleInputChange('projectType', e.target.value)}
                >
                  <option value="construction">Construction</option>
                  <option value="renovation">Renovation</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="design">Design</option>
                  <option value="planning">Planning</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={projectData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {projectStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Project Description *</label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the project scope and objectives..."
                  rows="4"
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Location & Timeline</h2>
            <p>Where is your project located and when will it take place?</p>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Project Address *</label>
                <input
                  type="text"
                  value={projectData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={projectData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="New York"
                  className={errors.city ? 'error' : ''}
                />
                {errors.city && <span className="error-text">{errors.city}</span>}
              </div>

              <div className="form-group">
                <label>State/Province</label>
                <input
                  type="text"
                  value={projectData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="NY"
                />
              </div>

              <div className="form-group">
                <label>ZIP/Postal Code</label>
                <input
                  type="text"
                  value={projectData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="10001"
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <select
                  value={projectData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={projectData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Expected End Date</label>
                <input
                  type="date"
                  value={projectData.expectedEndDate}
                  onChange={(e) => handleInputChange('expectedEndDate', e.target.value)}
                  className={errors.expectedEndDate ? 'error' : ''}
                />
                {errors.expectedEndDate && <span className="error-text">{errors.expectedEndDate}</span>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Team & Budget</h2>
            <p>Who's involved in this project and what's the budget?</p>

            <div className="form-grid">
              <div className="form-group">
                <label>Project Manager</label>
                <input
                  type="text"
                  value={projectData.projectManager}
                  onChange={(e) => handleInputChange('projectManager', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label>Client</label>
                <input
                  type="text"
                  value={projectData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  placeholder="Client Company Name"
                />
              </div>

              <div className="form-group">
                <label>Primary Contractor</label>
                <input
                  type="text"
                  value={projectData.contractor}
                  onChange={(e) => handleInputChange('contractor', e.target.value)}
                  placeholder="ABC Construction"
                />
              </div>

              <div className="form-group">
                <label>Budget (USD)</label>
                <input
                  type="number"
                  value={projectData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="100000"
                  min="0"
                  step="1000"
                  className={errors.budget ? 'error' : ''}
                />
                {errors.budget && <span className="error-text">{errors.budget}</span>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Site Drawings</h2>
            <p>Upload architectural drawings, site plans, or any relevant project documents.</p>

            <div className="file-upload-section">
              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <div className="upload-content" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    <p><strong>Click to upload</strong> or drag and drop</p>
                    <p>PNG, JPG, PDF up to 10MB each</p>
                  </div>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  <h3>Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="files-list">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="file-item">
                        <div className="file-preview">
                          {file.preview ? (
                            <img src={file.preview} alt={file.name} />
                          ) : (
                            <div className="file-icon">📄</div>
                          )}
                        </div>
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                          {file.uploading && (
                            <div className="upload-status">Uploading...</div>
                          )}
                          {file.uploaded && (
                            <div className="upload-status success">✓ Uploaded</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="remove-file-btn"
                          disabled={file.uploading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>Review & Create</h2>
            <p>Please review your project details before creating.</p>

            <div className="review-sections">
              <div className="review-section">
                <h3>Project Information</h3>
                <div className="review-item">
                  <span>Name:</span>
                  <span>{projectData.name}</span>
                </div>
                <div className="review-item">
                  <span>Type:</span>
                  <span>{projectData.projectType}</span>
                </div>
                <div className="review-item">
                  <span>Status:</span>
                  <span>{projectStatuses.find(s => s.value === projectData.status)?.label}</span>
                </div>
                <div className="review-item">
                  <span>Description:</span>
                  <span>{projectData.description}</span>
                </div>
              </div>

              <div className="review-section">
                <h3>Location</h3>
                <div className="review-item">
                  <span>Address:</span>
                  <span>{projectData.address}</span>
                </div>
                <div className="review-item">
                  <span>City:</span>
                  <span>{projectData.city}, {projectData.state} {projectData.zipCode}</span>
                </div>
                <div className="review-item">
                  <span>Country:</span>
                  <span>{projectData.country}</span>
                </div>
              </div>

              {(projectData.startDate || projectData.expectedEndDate) && (
                <div className="review-section">
                  <h3>Timeline</h3>
                  {projectData.startDate && (
                    <div className="review-item">
                      <span>Start Date:</span>
                      <span>{new Date(projectData.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {projectData.expectedEndDate && (
                    <div className="review-item">
                      <span>Expected End:</span>
                      <span>{new Date(projectData.expectedEndDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              {(projectData.projectManager || projectData.client || projectData.contractor || projectData.budget) && (
                <div className="review-section">
                  <h3>Team & Budget</h3>
                  {projectData.projectManager && (
                    <div className="review-item">
                      <span>Project Manager:</span>
                      <span>{projectData.projectManager}</span>
                    </div>
                  )}
                  {projectData.client && (
                    <div className="review-item">
                      <span>Client:</span>
                      <span>{projectData.client}</span>
                    </div>
                  )}
                  {projectData.contractor && (
                    <div className="review-item">
                      <span>Contractor:</span>
                      <span>{projectData.contractor}</span>
                    </div>
                  )}
                  {projectData.budget && (
                    <div className="review-item">
                      <span>Budget:</span>
                      <span>${parseFloat(projectData.budget).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="review-section">
                  <h3>Site Drawings</h3>
                  <div className="review-item">
                    <span>Files:</span>
                    <span>{uploadedFiles.length} document(s)</span>
                  </div>
                </div>
              )}
            </div>

            {errors.submit && <div className="error-banner">{errors.submit}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="project-creation-wizard">
      <div className="wizard-header">
        <h1>Create New Project</h1>
        <p>Set up a new project for {company.name}</p>
      </div>

      <div className="progress-bar">
        {steps.map((step, index) => (
          <div key={step.id} className="progress-step-container">
            <div className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}>
              <div className="step-number">{step.id}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`progress-line ${currentStep > step.id ? 'active' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="wizard-content">
        {renderStepContent()}

        <div className="form-actions">
          <div className="left-actions">
            <button onClick={onCancel} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
          </div>

          <div className="right-actions">
            {currentStep > 1 && (
              <button onClick={prevStep} className="btn-secondary" disabled={loading}>
                Previous
              </button>
            )}

            {currentStep < steps.length && (
              <button onClick={nextStep} className="btn-primary" disabled={loading}>
                Next
              </button>
            )}

            {currentStep === steps.length && (
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={loading || uploadingDrawings}
              >
                {loading ? 'Creating Project...' : uploadingDrawings ? 'Uploading...' : 'Create Project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationWizard;
