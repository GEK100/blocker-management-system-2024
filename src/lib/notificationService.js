/**
 * Notification Service for Cross-Interface Communication
 * Handles notifications between admin uploads and subcontractor interfaces
 */

import { subcontractorAPI } from './subcontractorAPI';
import { userManagementAPI } from './userManagementAPI';

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.notifications = [];
  }

  // Subscribe to notification events
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emit notification to all subscribers
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  // Notify subcontractors when drawings are uploaded
  async notifyDrawingUpload(drawingData) {
    try {
      // Get all subcontractors for the project
      const subcontractors = await this.getProjectSubcontractors(drawingData.projectId);

      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'drawing_upload',
        title: 'New Drawing Available',
        message: `New ${drawingData.category} drawing uploaded: ${drawingData.originalName}`,
        projectId: drawingData.projectId,
        drawingId: drawingData.id,
        createdAt: new Date().toISOString(),
        recipients: subcontractors.map(s => s.id),
        data: drawingData
      };

      // Store notification
      this.notifications.push(notification);

      // Emit to live subscribers
      this.emit('drawing_upload', notification);

      // Send to specific subcontractors
      subcontractors.forEach(subcontractor => {
        this.emit(`user_${subcontractor.id}`, notification);
      });

      console.log(`Drawing upload notification sent to ${subcontractors.length} subcontractors`);
      return notification;
    } catch (error) {
      console.error('Error sending drawing upload notification:', error);
      throw error;
    }
  }

  // Notify subcontractors when new users are added via field worker
  async notifyUserAddition(userData) {
    try {
      // Get all subcontractors in the same company
      const subcontractors = await this.getCompanySubcontractors(userData.companyId);

      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'user_addition',
        title: 'New Team Member Added',
        message: `${userData.name} (${userData.role}) has been added to the team`,
        companyId: userData.companyId,
        userId: userData.id,
        createdAt: new Date().toISOString(),
        recipients: subcontractors.map(s => s.id),
        data: userData
      };

      // Store notification
      this.notifications.push(notification);

      // Emit to live subscribers
      this.emit('user_addition', notification);

      // Send to specific subcontractors
      subcontractors.forEach(subcontractor => {
        this.emit(`user_${subcontractor.id}`, notification);
      });

      console.log(`User addition notification sent to ${subcontractors.length} subcontractors`);
      return notification;
    } catch (error) {
      console.error('Error sending user addition notification:', error);
      throw error;
    }
  }

  // Notify ALL subcontractors when main contractor issues a blocker
  async notifyBlockerToAllSubcontractors(blockerData) {
    try {
      // Get ALL subcontractors across all projects/companies
      const allSubcontractors = await this.getAllSubcontractors();

      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'blocker_assignment',
        title: 'New Blocker Issued',
        message: `Main contractor has issued a blocker: ${blockerData.title}`,
        projectId: blockerData.projectId,
        blockerId: blockerData.id,
        priority: blockerData.priority || 'medium',
        createdAt: new Date().toISOString(),
        recipients: allSubcontractors.map(s => s.id),
        data: blockerData
      };

      // Store notification
      this.notifications.push(notification);

      // Emit to live subscribers
      this.emit('blocker_assignment', notification);

      // Send to ALL subcontractors
      allSubcontractors.forEach(subcontractor => {
        this.emit(`user_${subcontractor.id}`, notification);
      });

      // Also add to their received blockers list
      this.assignBlockerToAllSubcontractors(blockerData, allSubcontractors);

      console.log(`Blocker notification sent to ${allSubcontractors.length} subcontractors`);
      return notification;
    } catch (error) {
      console.error('Error sending blocker notification:', error);
      throw error;
    }
  }

  // Get subcontractors for a specific project
  async getProjectSubcontractors(projectId) {
    try {
      const allUsers = await userManagementAPI.getUsers();
      return allUsers.filter(user =>
        ['subcontractor', 'subcontractor_manager'].includes(user.role) &&
        user.projects && user.projects.includes(projectId)
      );
    } catch (error) {
      // Fallback to mock data
      return this.getMockProjectSubcontractors(projectId);
    }
  }

  // Get all subcontractors in a company
  async getCompanySubcontractors(companyId) {
    try {
      const allUsers = await userManagementAPI.getUsers();
      return allUsers.filter(user =>
        ['subcontractor', 'subcontractor_manager'].includes(user.role) &&
        user.companyId === companyId
      );
    } catch (error) {
      // Fallback to mock data
      return this.getMockCompanySubcontractors(companyId);
    }
  }

  // Get ALL subcontractors across the platform
  async getAllSubcontractors() {
    try {
      const allUsers = await userManagementAPI.getUsers();
      return allUsers.filter(user =>
        ['subcontractor', 'subcontractor_manager'].includes(user.role)
      );
    } catch (error) {
      // Fallback to mock data
      return this.getMockAllSubcontractors();
    }
  }

  // Assign blocker to all subcontractors' received blockers list
  assignBlockerToAllSubcontractors(blockerData, subcontractors) {
    const assignment = {
      ...blockerData,
      assignedTo: 'all_subcontractors',
      assignmentType: 'broadcast',
      assignedAt: new Date().toISOString(),
      status: 'pending',
      subcontractorIds: subcontractors.map(s => s.id)
    };

    // Emit assignment event
    this.emit('blocker_assigned_to_all', assignment);
    return assignment;
  }

  // Get user's notifications
  getUserNotifications(userId, limit = 50) {
    return this.notifications
      .filter(notification =>
        notification.recipients.includes(userId) ||
        notification.type === 'blocker_assignment' // All blockers go to all subcontractors
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // Mark notification as read
  markAsRead(notificationId, userId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      if (!notification.readBy) {
        notification.readBy = [];
      }
      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
      }
    }
  }

  // Mock data fallbacks
  getMockProjectSubcontractors(projectId) {
    return [
      {
        id: 'sub1',
        name: 'Steel Works Ltd',
        email: 'contact@steelworks.com',
        role: 'subcontractor_manager',
        projects: [projectId],
        trade: 'Steel Fabrication'
      },
      {
        id: 'sub2',
        name: 'Electric Pro Services',
        email: 'info@electricpro.com',
        role: 'subcontractor',
        projects: [projectId],
        trade: 'Electrical'
      }
    ];
  }

  getMockCompanySubcontractors(companyId) {
    return [
      {
        id: 'sub1',
        name: 'Steel Works Ltd',
        email: 'contact@steelworks.com',
        role: 'subcontractor_manager',
        companyId: companyId,
        trade: 'Steel Fabrication'
      },
      {
        id: 'sub2',
        name: 'Electric Pro Services',
        email: 'info@electricpro.com',
        role: 'subcontractor',
        companyId: companyId,
        trade: 'Electrical'
      }
    ];
  }

  getMockAllSubcontractors() {
    return [
      {
        id: 'sub1',
        name: 'Steel Works Ltd',
        email: 'contact@steelworks.com',
        role: 'subcontractor_manager',
        trade: 'Steel Fabrication'
      },
      {
        id: 'sub2',
        name: 'Electric Pro Services',
        email: 'info@electricpro.com',
        role: 'subcontractor',
        trade: 'Electrical'
      },
      {
        id: 'sub3',
        name: 'Concrete Solutions',
        email: 'admin@concretesolutions.com',
        role: 'subcontractor',
        trade: 'Concrete Work'
      },
      {
        id: 'sub4',
        name: 'HVAC Masters',
        email: 'service@hvacmasters.com',
        role: 'subcontractor_manager',
        trade: 'HVAC'
      }
    ];
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;