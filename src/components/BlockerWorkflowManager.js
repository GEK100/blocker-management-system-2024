import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { multitenant } from '../lib/multitenant-api';
import './BlockerWorkflowManager.css';

const BlockerWorkflowManager = ({ user, company, currentProject, onBlockerUpdate }) => {
  const [blockers, setBlockers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_review');
  const [selectedBlocker, setSelectedBlocker] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Review/Action form data
  const [reviewData, setReviewData] = useState({
    action: 'approve', // approve, reject
    assignedContractor: '',
    comments: '',
    priority: '',
    estimatedDuration: '',
    dueDate: ''
  });

  // Completion form data
  const [completionData, setCompletionData] = useState({
    action: 'mark_complete', // mark_complete, verify_complete, reject_completion
    comments: '',
    completionPhotos: [],
    workDescription: '',
    materialsUsed: '',
    timeSpent: '',
    rejectionReason: ''
  });

  const [errors, setErrors] = useState({});

  // Define blocker statuses with workflow
  const blockerStatuses = {
    pending_review: {
      label: 'Pending Review',
      color: '#f59e0b',
      description: 'Awaiting Main Contractor review and assignment',
      canReview: ['main_contractor', 'company_owner', 'company_admin'],
      canView: ['main_contractor', 'company_owner', 'company_admin', 'project_manager']
    },
    assigned: {
      label: 'Assigned',
      color: '#3b82f6',
      description: 'Assigned to subcontractor, work in progress',
      canUpdate: ['subcontractor', 'assigned_contractor'],
      canView: ['main_contractor', 'company_owner', 'company_admin', 'project_manager', 'subcontractor']
    },
    completed: {
      label: 'Completed',
      color: '#10b981',
      description: 'Marked complete by subcontractor, pending verification',
      canVerify: ['main_contractor', 'company_owner', 'company_admin'],
      canView: ['main_contractor', 'company_owner', 'company_admin', 'project_manager', 'subcontractor']
    },
    verified_complete: {
      label: 'Verified Complete',
      color: '#059669',
      description: 'Verified complete by Main Contractor',
      canView: 'all'
    },
    rejected: {
      label: 'Rejected',
      color: '#ef4444',
      description: 'Rejected by Main Contractor with comments',
      canResubmit: ['field_worker', 'supervisor'],
      canView: 'all'
    }
  };

  const userRoleHierarchy = {
    company_owner: 10,
    company_admin: 9,
    main_contractor: 8,
    project_manager: 7,
    supervisor: 6,
    subcontractor: 5,
    field_worker: 4
  };

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBlockers(),
        loadContractors()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockers = async () => {
    try {
      const { data, error } = await supabase
        .from('blockers')
        .select(`
          *,
          reporter:user_profiles!reporter_id(full_name, role),
          assigned_contractor:contractors(name, type),
          assigned_to:user_profiles!assigned_to(full_name, role),
          status_history(
            id,
            old_status,
            new_status,
            comments,
            changed_by:user_profiles(full_name, role),
            changed_at,
            metadata
          )
        `)
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter blockers based on user permissions
      const filteredBlockers = data.filter(blocker => canUserViewBlocker(blocker));
      setBlockers(filteredBlockers);
    } catch (error) {
      console.error('Error loading blockers:', error);
    }
  };

  const loadContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setContractors(data || []);
    } catch (error) {
      console.error('Error loading contractors:', error);
    }
  };

  const canUserViewBlocker = (blocker) => {
    const status = blockerStatuses[blocker.status];
    if (!status) return true;

    if (status.canView === 'all') return true;
    if (Array.isArray(status.canView)) {
      return status.canView.includes(user.role) ||
             blocker.reporter_id === user.id ||
             blocker.assigned_to === user.id;
    }
    return true;
  };

  const canUserPerformAction = (blocker, action) => {
    const userRole = user.role;
    const status = blockerStatuses[blocker.status];

    switch (action) {
      case 'review':
        return status?.canReview?.includes(userRole) || userRole === 'main_contractor';
      case 'assign':
        return userRole === 'main_contractor' || userRoleHierarchy[userRole] >= 8;
      case 'mark_complete':
        return (blocker.assigned_to === user.id || userRole === 'subcontractor') &&
               blocker.status === 'assigned';
      case 'verify_complete':
        return (userRole === 'main_contractor' || userRoleHierarchy[userRole] >= 8) &&
               blocker.status === 'completed';
      case 'reject':
        return userRole === 'main_contractor' || userRoleHierarchy[userRole] >= 8;
      default:
        return false;
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedBlocker || !validateReviewData()) return;

    setLoading(true);
    try {
      const newStatus = reviewData.action === 'approve' ? 'assigned' : 'rejected';
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (reviewData.action === 'approve') {
        updateData.assigned_contractor_id = reviewData.assignedContractor;
        updateData.priority = reviewData.priority || selectedBlocker.priority;
        updateData.estimated_duration = reviewData.estimatedDuration || null;
        updateData.due_date = reviewData.dueDate || null;

        // Assign to specific contractor user if available
        if (reviewData.assignedContractor) {
          const contractor = contractors.find(c => c.id === reviewData.assignedContractor);
          if (contractor && contractor.primary_contact_user_id) {
            updateData.assigned_to = contractor.primary_contact_user_id;
          }
        }
      }

      const { error: updateError } = await supabase
        .from('blockers')
        .update(updateData)
        .eq('id', selectedBlocker.id);

      if (updateError) throw updateError;

      // Add status history
      await supabase
        .from('status_history')
        .insert({
          blocker_id: selectedBlocker.id,
          old_status: selectedBlocker.status,
          new_status: newStatus,
          changed_by: user.id,
          changed_at: new Date().toISOString(),
          comments: reviewData.comments,
          metadata: {
            action: reviewData.action,
            assigned_contractor_id: reviewData.assignedContractor,
            priority: reviewData.priority,
            estimated_duration: reviewData.estimatedDuration,
            due_date: reviewData.dueDate
          }
        });

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: `blocker_${reviewData.action}ed`,
          resource_type: 'blocker',
          resource_id: selectedBlocker.id,
          details: {
            from_status: selectedBlocker.status,
            to_status: newStatus,
            contractor_assigned: reviewData.assignedContractor,
            comments: reviewData.comments
          }
        });

      // Send notifications
      await sendWorkflowNotifications(selectedBlocker, newStatus, reviewData);

      // Reset and reload
      setShowReviewModal(false);
      setSelectedBlocker(null);
      setReviewData({
        action: 'approve',
        assignedContractor: '',
        comments: '',
        priority: '',
        estimatedDuration: '',
        dueDate: ''
      });
      await loadBlockers();

      if (onBlockerUpdate) {
        onBlockerUpdate();
      }
    } catch (error) {
      console.error('Error processing review:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCompletionSubmit = async () => {
    if (!selectedBlocker || !validateCompletionData()) return;

    setLoading(true);
    try {
      let newStatus = selectedBlocker.status;
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (completionData.action === 'mark_complete') {
        newStatus = 'completed';
        updateData.status = newStatus;
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user.id;
        updateData.completion_notes = completionData.workDescription;
        updateData.materials_used = completionData.materialsUsed;
        updateData.time_spent = completionData.timeSpent;
      } else if (completionData.action === 'verify_complete') {
        newStatus = 'verified_complete';
        updateData.status = newStatus;
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user.id;
        updateData.verification_notes = completionData.comments;
      } else if (completionData.action === 'reject_completion') {
        newStatus = 'assigned';
        updateData.status = newStatus;
        updateData.rejection_reason = completionData.rejectionReason;
        // Clear completion data
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error: updateError } = await supabase
        .from('blockers')
        .update(updateData)
        .eq('id', selectedBlocker.id);

      if (updateError) throw updateError;

      // Add status history
      await supabase
        .from('status_history')
        .insert({
          blocker_id: selectedBlocker.id,
          old_status: selectedBlocker.status,
          new_status: newStatus,
          changed_by: user.id,
          changed_at: new Date().toISOString(),
          comments: completionData.comments || completionData.rejectionReason,
          metadata: {
            action: completionData.action,
            work_description: completionData.workDescription,
            materials_used: completionData.materialsUsed,
            time_spent: completionData.timeSpent,
            rejection_reason: completionData.rejectionReason
          }
        });

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: `blocker_${completionData.action}`,
          resource_type: 'blocker',
          resource_id: selectedBlocker.id,
          details: {
            from_status: selectedBlocker.status,
            to_status: newStatus,
            action: completionData.action
          }
        });

      // Send notifications
      await sendWorkflowNotifications(selectedBlocker, newStatus, completionData);

      // Reset and reload
      setShowCompletionModal(false);
      setSelectedBlocker(null);
      setCompletionData({
        action: 'mark_complete',
        comments: '',
        completionPhotos: [],
        workDescription: '',
        materialsUsed: '',
        timeSpent: '',
        rejectionReason: ''
      });
      await loadBlockers();

      if (onBlockerUpdate) {
        onBlockerUpdate();
      }
    } catch (error) {
      console.error('Error processing completion:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const validateReviewData = () => {
    const newErrors = {};

    if (reviewData.action === 'approve') {
      if (!reviewData.assignedContractor) {
        newErrors.assignedContractor = 'Please select a contractor';
      }
    }

    if (reviewData.action === 'reject') {
      if (!reviewData.comments.trim()) {
        newErrors.comments = 'Please provide rejection reason';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCompletionData = () => {
    const newErrors = {};

    if (completionData.action === 'mark_complete') {
      if (!completionData.workDescription.trim()) {
        newErrors.workDescription = 'Please describe the work completed';
      }
    }

    if (completionData.action === 'reject_completion') {
      if (!completionData.rejectionReason.trim()) {
        newErrors.rejectionReason = 'Please provide rejection reason';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendWorkflowNotifications = async (blocker, newStatus, actionData) => {
    try {
      const notifications = [];

      // Notify based on new status
      if (newStatus === 'assigned' && blocker.assigned_to) {
        notifications.push({
          user_id: blocker.assigned_to,
          title: 'New Blocker Assigned',
          message: `You have been assigned blocker: ${blocker.title}`,
          type: 'assignment',
          metadata: { blocker_id: blocker.id }
        });
      }

      if (newStatus === 'completed') {
        // Notify main contractors
        const mainContractors = await getMainContractorUsers();
        mainContractors.forEach(contractor => {
          notifications.push({
            user_id: contractor.id,
            title: 'Blocker Completed - Verification Needed',
            message: `Blocker "${blocker.title}" has been marked complete and needs verification`,
            type: 'verification_needed',
            metadata: { blocker_id: blocker.id }
          });
        });
      }

      if (newStatus === 'rejected') {
        notifications.push({
          user_id: blocker.reporter_id,
          title: 'Blocker Rejected',
          message: `Your blocker "${blocker.title}" was rejected: ${actionData.comments}`,
          type: 'rejection',
          metadata: { blocker_id: blocker.id }
        });
      }

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const getMainContractorUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('company_id', company.id)
        .eq('role', 'main_contractor')
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting main contractor users:', error);
      return [];
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = blockerStatuses[status];
    if (!statusInfo) return <span className="status-badge">{status}</span>;

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: statusInfo.color }}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getFilteredBlockers = () => {
    return blockers.filter(blocker => {
      if (activeTab === 'all') return true;
      return blocker.status === activeTab;
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#16a34a'
    };
    return colors[priority] || '#6b7280';
  };

  const canShowActionButton = (blocker, action) => {
    return canUserPerformAction(blocker, action);
  };

  const openReviewModal = (blocker) => {
    setSelectedBlocker(blocker);
    setReviewData({
      action: 'approve',
      assignedContractor: '',
      comments: '',
      priority: blocker.priority,
      estimatedDuration: '',
      dueDate: ''
    });
    setShowReviewModal(true);
  };

  const openCompletionModal = (blocker, action = 'mark_complete') => {
    setSelectedBlocker(blocker);
    setCompletionData({
      action,
      comments: '',
      completionPhotos: [],
      workDescription: '',
      materialsUsed: '',
      timeSpent: '',
      rejectionReason: ''
    });
    setShowCompletionModal(true);
  };

  if (loading) {
    return (
      <div className="blocker-workflow-manager loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blocker-workflow-manager">
      <div className="workflow-header">
        <h2>Blocker Workflow Management</h2>
        <p>Manage blocker reviews, assignments, and completion verification</p>
      </div>

      <div className="workflow-tabs">
        <button
          className={`tab-button ${activeTab === 'pending_review' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending_review')}
        >
          Pending Review ({blockers.filter(b => b.status === 'pending_review').length})
        </button>
        <button
          className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          Assigned ({blockers.filter(b => b.status === 'assigned').length})
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Awaiting Verification ({blockers.filter(b => b.status === 'completed').length})
        </button>
        <button
          className={`tab-button ${activeTab === 'verified_complete' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified_complete')}
        >
          Verified Complete ({blockers.filter(b => b.status === 'verified_complete').length})
        </button>
        <button
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({blockers.filter(b => b.status === 'rejected').length})
        </button>
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({blockers.length})
        </button>
      </div>

      <div className="workflow-content">
        <div className="blockers-list">
          {getFilteredBlockers().map(blocker => (
            <div key={blocker.id} className="blocker-card">
              <div className="blocker-header">
                <div className="blocker-title-section">
                  <h3 className="blocker-title">{blocker.title}</h3>
                  <div className="blocker-meta">
                    {getStatusBadge(blocker.status)}
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(blocker.priority) }}
                    >
                      {blocker.priority}
                    </span>
                  </div>
                </div>
                <div className="blocker-actions">
                  {canShowActionButton(blocker, 'review') && blocker.status === 'pending_review' && (
                    <button
                      onClick={() => openReviewModal(blocker)}
                      className="btn-primary btn-small"
                    >
                      Review
                    </button>
                  )}

                  {canShowActionButton(blocker, 'mark_complete') && (
                    <button
                      onClick={() => openCompletionModal(blocker, 'mark_complete')}
                      className="btn-success btn-small"
                    >
                      Mark Complete
                    </button>
                  )}

                  {canShowActionButton(blocker, 'verify_complete') && blocker.status === 'completed' && (
                    <>
                      <button
                        onClick={() => openCompletionModal(blocker, 'verify_complete')}
                        className="btn-success btn-small"
                      >
                        Verify Complete
                      </button>
                      <button
                        onClick={() => openCompletionModal(blocker, 'reject_completion')}
                        className="btn-danger btn-small"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="blocker-details">
                <p className="blocker-description">{blocker.description}</p>

                <div className="blocker-info-grid">
                  <div className="info-item">
                    <span>Reporter:</span>
                    <span>{blocker.reporter?.full_name}</span>
                  </div>
                  <div className="info-item">
                    <span>Created:</span>
                    <span>{new Date(blocker.created_at).toLocaleDateString()}</span>
                  </div>
                  {blocker.assigned_contractor && (
                    <div className="info-item">
                      <span>Assigned To:</span>
                      <span>{blocker.assigned_contractor.name}</span>
                    </div>
                  )}
                  {blocker.due_date && (
                    <div className="info-item">
                      <span>Due Date:</span>
                      <span>{new Date(blocker.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {blocker.completed_at && (
                    <div className="info-item">
                      <span>Completed:</span>
                      <span>{new Date(blocker.completed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {blocker.status_history && blocker.status_history.length > 0 && (
                  <div className="status-history">
                    <h4>Status History</h4>
                    <div className="history-list">
                      {blocker.status_history.slice(0, 3).map(history => (
                        <div key={history.id} className="history-item">
                          <div className="history-action">
                            {history.old_status} → {history.new_status}
                          </div>
                          <div className="history-meta">
                            by {history.changed_by?.full_name} on{' '}
                            {new Date(history.changed_at).toLocaleDateString()}
                          </div>
                          {history.comments && (
                            <div className="history-comments">{history.comments}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {getFilteredBlockers().length === 0 && (
            <div className="empty-state">
              <p>No blockers found for the current filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedBlocker && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Review Blocker: {selectedBlocker.title}</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="review-actions">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="review-action"
                    value="approve"
                    checked={reviewData.action === 'approve'}
                    onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                  />
                  <span>Approve & Assign</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="review-action"
                    value="reject"
                    checked={reviewData.action === 'reject'}
                    onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                  />
                  <span>Reject</span>
                </label>
              </div>

              {reviewData.action === 'approve' && (
                <div className="approval-fields">
                  <div className="form-group">
                    <label>Assign to Contractor *</label>
                    <select
                      value={reviewData.assignedContractor}
                      onChange={(e) => setReviewData(prev => ({ ...prev, assignedContractor: e.target.value }))}
                      className={errors.assignedContractor ? 'error' : ''}
                    >
                      <option value="">Select Contractor</option>
                      {contractors.map(contractor => (
                        <option key={contractor.id} value={contractor.id}>
                          {contractor.name} ({contractor.type})
                        </option>
                      ))}
                    </select>
                    {errors.assignedContractor && <span className="error-text">{errors.assignedContractor}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={reviewData.priority}
                        onChange={(e) => setReviewData(prev => ({ ...prev, priority: e.target.value }))}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        value={reviewData.dueDate}
                        onChange={(e) => setReviewData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Estimated Duration (hours)</label>
                    <input
                      type="number"
                      value={reviewData.estimatedDuration}
                      onChange={(e) => setReviewData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                      placeholder="e.g., 4"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>{reviewData.action === 'approve' ? 'Assignment Notes' : 'Rejection Reason *'}</label>
                <textarea
                  value={reviewData.comments}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder={
                    reviewData.action === 'approve'
                      ? 'Any special instructions or notes for the contractor...'
                      : 'Please provide reason for rejection...'
                  }
                  className={errors.comments ? 'error' : ''}
                  rows="4"
                />
                {errors.comments && <span className="error-text">{errors.comments}</span>}
              </div>

              {errors.submit && <div className="error-banner">{errors.submit}</div>}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                className={`btn-${reviewData.action === 'approve' ? 'primary' : 'danger'}`}
                disabled={loading}
              >
                {loading ? 'Processing...' : (reviewData.action === 'approve' ? 'Approve & Assign' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedBlocker && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>
                {completionData.action === 'mark_complete' && 'Mark Complete'}
                {completionData.action === 'verify_complete' && 'Verify Complete'}
                {completionData.action === 'reject_completion' && 'Reject Completion'}
                : {selectedBlocker.title}
              </h3>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {completionData.action === 'mark_complete' && (
                <>
                  <div className="form-group">
                    <label>Work Description *</label>
                    <textarea
                      value={completionData.workDescription}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, workDescription: e.target.value }))}
                      placeholder="Describe the work that was completed..."
                      className={errors.workDescription ? 'error' : ''}
                      rows="4"
                    />
                    {errors.workDescription && <span className="error-text">{errors.workDescription}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Materials Used</label>
                      <input
                        type="text"
                        value={completionData.materialsUsed}
                        onChange={(e) => setCompletionData(prev => ({ ...prev, materialsUsed: e.target.value }))}
                        placeholder="List materials used..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Time Spent (hours)</label>
                      <input
                        type="number"
                        value={completionData.timeSpent}
                        onChange={(e) => setCompletionData(prev => ({ ...prev, timeSpent: e.target.value }))}
                        placeholder="e.g., 3.5"
                        step="0.5"
                      />
                    </div>
                  </div>
                </>
              )}

              {completionData.action === 'verify_complete' && (
                <div className="form-group">
                  <label>Verification Notes</label>
                  <textarea
                    value={completionData.comments}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Notes about the verification..."
                    rows="4"
                  />
                </div>
              )}

              {completionData.action === 'reject_completion' && (
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    value={completionData.rejectionReason}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                    placeholder="Explain why the completion is being rejected..."
                    className={errors.rejectionReason ? 'error' : ''}
                    rows="4"
                  />
                  {errors.rejectionReason && <span className="error-text">{errors.rejectionReason}</span>}
                </div>
              )}

              {errors.submit && <div className="error-banner">{errors.submit}</div>}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCompletionSubmit}
                className={`btn-${
                  completionData.action === 'reject_completion' ? 'danger' : 'primary'
                }`}
                disabled={loading}
              >
                {loading ? 'Processing...' : (
                  completionData.action === 'mark_complete' ? 'Mark Complete' :
                  completionData.action === 'verify_complete' ? 'Verify Complete' :
                  'Reject Completion'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockerWorkflowManager;
