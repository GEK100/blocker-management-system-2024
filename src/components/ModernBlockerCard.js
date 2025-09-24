import React, { useState } from 'react';
import {
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending_review: {
      icon: ClockIcon,
      label: 'Pending Review',
      className: 'status-pending'
    },
    assigned: {
      icon: UserIcon,
      label: 'Assigned',
      className: 'status-assigned'
    },
    completed: {
      icon: EyeIcon,
      label: 'Awaiting Verification',
      className: 'status-completed'
    },
    verified_complete: {
      icon: CheckCircleIconSolid,
      label: 'Verified Complete',
      className: 'status-verified'
    },
    rejected: {
      icon: XCircleIcon,
      label: 'Rejected',
      className: 'status-rejected'
    }
  };

  const config = statusConfig[status] || statusConfig.pending_review;
  const Icon = config.icon;

  return (
    <div className={`status-badge ${config.className}`}>
      <Icon className="h-4 w-4 mr-1" />
      {config.label}
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    high: { label: 'High', className: 'priority-high' },
    medium: { label: 'Medium', className: 'priority-medium' },
    low: { label: 'Low', className: 'priority-low' }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${config.className}`}>
      {config.label} Priority
    </span>
  );
};

const ModernBlockerCard = ({ blocker, onAction, user }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const canTakeAction = (action) => {
    switch (action) {
      case 'review':
        return ['main_contractor', 'company_owner', 'company_admin'].includes(user?.role)
               && blocker.status === 'pending_review';
      case 'complete':
        return blocker.assigned_to?.user_id === user?.id && blocker.status === 'assigned';
      case 'verify':
        return ['main_contractor', 'company_owner', 'company_admin'].includes(user?.role)
               && blocker.status === 'completed';
      default:
        return false;
    }
  };

  return (
    <div className="card card-hover mb-6 overflow-hidden animate-fade-in">
      {/* Card Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">
              {blocker.title}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={blocker.status} />
              <PriorityBadge priority={blocker.priority} />
              {blocker.type && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-construction-100 text-construction-800">
                  {blocker.type}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {blocker.photos && blocker.photos.length > 0 && (
              <div className="flex items-center text-success-600">
                <PhotoIcon className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">{blocker.photos.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center text-slate-600">
            <MapPinIcon className="h-4 w-4 mr-2 text-slate-400" />
            <span className="truncate">{blocker.location || 'No location'}</span>
          </div>
          <div className="flex items-center text-slate-600">
            <CalendarDaysIcon className="h-4 w-4 mr-2 text-slate-400" />
            <span>{new Date(blocker.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-slate-600">
            <UserIcon className="h-4 w-4 mr-2 text-slate-400" />
            <span className="truncate">{blocker.created_by?.full_name || 'Unknown'}</span>
          </div>
          {blocker.assigned_to && (
            <div className="flex items-center text-slate-600">
              <UserIcon className="h-4 w-4 mr-2 text-construction-400" />
              <span className="truncate font-medium text-construction-700">
                {blocker.assigned_to.full_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <p className="text-slate-700 leading-relaxed">
          {blocker.description || 'No description provided.'}
        </p>
      </div>

      {/* Photos Grid */}
      {blocker.photos && blocker.photos.length > 0 && (
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center mb-3">
            <PhotoIcon className="h-5 w-5 text-slate-500 mr-2" />
            <h4 className="font-semibold text-slate-900">
              Photos ({blocker.photos.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {blocker.photos.map((photo, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer hover:opacity-75 transition-opacity duration-200"
              >
                <img
                  src={photo.url || photo}
                  alt={`Blocker photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Details */}
      <div className="border-b border-slate-200">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-3 flex items-center justify-between text-slate-600 hover:bg-slate-50 transition-colors duration-200"
        >
          <span className="font-medium">Additional Details</span>
          {showDetails ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>

        {showDetails && (
          <div className="px-6 pb-6 space-y-4 animate-slide-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {blocker.estimated_duration && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Estimated Duration
                  </label>
                  <p className="text-slate-900">{blocker.estimated_duration}</p>
                </div>
              )}
              {blocker.due_date && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <p className="text-slate-900">
                    {new Date(blocker.due_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {blocker.materials_used && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Materials Used
                  </label>
                  <p className="text-slate-900">{blocker.materials_used}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status History */}
      {blocker.history && blocker.history.length > 0 && (
        <div className="border-b border-slate-200">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-6 py-3 flex items-center justify-between text-slate-600 hover:bg-slate-50 transition-colors duration-200"
          >
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Status History ({blocker.history.length})</span>
            </div>
            {showHistory ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>

          {showHistory && (
            <div className="px-6 pb-6">
              <div className="space-y-3">
                {blocker.history.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3 animate-fade-in">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-construction-500 mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">
                          {entry.action}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600">{entry.changed_by}</p>
                      {entry.comments && (
                        <p className="text-sm text-slate-700 mt-1 italic">
                          "{entry.comments}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-6 bg-slate-50">
        <div className="flex flex-wrap gap-3">
          {canTakeAction('review') && (
            <button
              onClick={() => onAction('review', blocker)}
              className="btn btn-primary"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Review & Assign
            </button>
          )}

          {canTakeAction('complete') && (
            <button
              onClick={() => onAction('complete', blocker)}
              className="btn btn-success"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Mark Complete
            </button>
          )}

          {canTakeAction('verify') && (
            <button
              onClick={() => onAction('verify', blocker)}
              className="btn btn-success"
            >
              <CheckCircleIconSolid className="h-4 w-4 mr-2" />
              Verify Complete
            </button>
          )}

          {blocker.status !== 'verified_complete' && (
            <button
              onClick={() => onAction('reject', blocker)}
              className="btn btn-danger"
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Reject
            </button>
          )}

          <button
            onClick={() => onAction('comment', blocker)}
            className="btn btn-outline"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernBlockerCard;