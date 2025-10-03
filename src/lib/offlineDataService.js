/**
 * Offline-Aware Data Service
 * Provides unified API for data operations that work both online and offline
 */

import offlineStorage from './offlineStorage';
import connectivityService from './connectivityService';
import { blockerAPI, drawingAPI } from './multitenant-api';
import { subcontractorAPI } from './subcontractorAPI';
import { userManagementAPI } from './userManagementAPI';

class OfflineDataService {
  constructor() {
    this.isInitialized = false;
    this.initializeService();
  }

  async initializeService() {
    try {
      await offlineStorage.init();
      this.isInitialized = true;
      console.log('✅ Offline data service initialized');

      // Load initial data if we haven't synced recently
      const lastSyncTime = await offlineStorage.getMetadata('lastSyncTime');
      const hasOfflineData = await offlineStorage.hasOfflineData();

      if (!hasOfflineData && connectivityService.getConnectionStatus().isOnline) {
        console.log('📥 No offline data found, performing initial sync...');
        await this.performInitialDataLoad();
      }

    } catch (error) {
      console.error('Failed to initialize offline data service:', error);
    }
  }

  async performInitialDataLoad() {
    try {
      if (!connectivityService.getConnectionStatus().isOnline) return;

      // Load and cache essential data
      console.log('Loading initial data...');

      const [projects, drawings, blockers, users] = await Promise.all([
        this.loadProjectsFromAPI(),
        this.loadDrawingsFromAPI(),
        this.loadBlockersFromAPI(),
        this.loadUsersFromAPI()
      ]);

      // Save to offline storage
      await Promise.all([
        offlineStorage.bulkSaveProjects(projects),
        offlineStorage.bulkSaveDrawings(drawings),
        offlineStorage.bulkSaveBlockers(blockers),
        offlineStorage.bulkSaveUsers(users)
      ]);

      await offlineStorage.setMetadata('lastSyncTime', new Date().toISOString());
      await offlineStorage.setMetadata('initialDataLoaded', true);

      console.log('✅ Initial data loaded and cached offline');

    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  // API fallback methods
  async loadProjectsFromAPI() {
    try {
      // Mock project data - replace with actual API call
      return [
        {
          id: 'proj1',
          name: 'Downtown Office Complex',
          status: 'active',
          manager: 'John Smith',
          location: 'Downtown District'
        },
        {
          id: 'proj2',
          name: 'Residential Tower A',
          status: 'active',
          manager: 'Sarah Johnson',
          location: 'Riverside Complex'
        }
      ];
    } catch (error) {
      console.error('Failed to load projects from API:', error);
      return [];
    }
  }

  async loadDrawingsFromAPI() {
    try {
      return await drawingAPI.getDrawings() || [];
    } catch (error) {
      console.error('Failed to load drawings from API:', error);
      return [];
    }
  }

  async loadBlockersFromAPI() {
    try {
      return await blockerAPI.getBlockers() || [];
    } catch (error) {
      console.error('Failed to load blockers from API:', error);
      return [];
    }
  }

  async loadUsersFromAPI() {
    try {
      return await userManagementAPI.getUsers() || [];
    } catch (error) {
      console.error('Failed to load users from API:', error);
      return [];
    }
  }

  // Unified data operations that work offline/online

  // Blocker operations
  async getBlockers(projectId = null) {
    await this.ensureInitialized();

    try {
      return await offlineStorage.getBlockers(projectId);
    } catch (error) {
      console.error('Failed to get blockers from offline storage:', error);
      return [];
    }
  }

  async createBlocker(blockerData) {
    await this.ensureInitialized();

    const blocker = {
      ...blockerData,
      id: blockerData.id || `blocker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      entityType: 'blocker'
    };

    try {
      // Save to offline storage immediately
      await offlineStorage.saveBlocker(blocker);

      // Add to sync queue
      await offlineStorage.addToSyncQueue('create', blocker, 'high');

      console.log('✅ Blocker created offline:', blocker.id);

      // Try to sync immediately if online
      if (connectivityService.getConnectionStatus().isOnline) {
        connectivityService.triggerAutoSync();
      }

      return blocker;

    } catch (error) {
      console.error('Failed to create blocker offline:', error);
      throw error;
    }
  }

  async updateBlocker(blockerId, updates) {
    await this.ensureInitialized();

    try {
      const existingBlocker = await offlineStorage.get('blockers', blockerId);
      if (!existingBlocker) {
        throw new Error('Blocker not found');
      }

      const updatedBlocker = {
        ...existingBlocker,
        ...updates,
        lastModified: new Date().toISOString(),
        entityType: 'blocker'
      };

      await offlineStorage.saveBlocker(updatedBlocker);
      await offlineStorage.addToSyncQueue('update', updatedBlocker, 'high');

      console.log('✅ Blocker updated offline:', blockerId);

      if (connectivityService.getConnectionStatus().isOnline) {
        connectivityService.triggerAutoSync();
      }

      return updatedBlocker;

    } catch (error) {
      console.error('Failed to update blocker offline:', error);
      throw error;
    }
  }

  async deleteBlocker(blockerId) {
    await this.ensureInitialized();

    try {
      await offlineStorage.delete('blockers', blockerId);
      await offlineStorage.addToSyncQueue('delete', { id: blockerId, entityType: 'blocker' }, 'normal');

      console.log('✅ Blocker deleted offline:', blockerId);

      if (connectivityService.getConnectionStatus().isOnline) {
        connectivityService.triggerAutoSync();
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to delete blocker offline:', error);
      throw error;
    }
  }

  // Drawing operations
  async getDrawings(projectId = null) {
    await this.ensureInitialized();

    try {
      return await offlineStorage.getDrawings(projectId);
    } catch (error) {
      console.error('Failed to get drawings from offline storage:', error);
      return [];
    }
  }

  async saveDrawing(drawingData) {
    await this.ensureInitialized();

    const drawing = {
      ...drawingData,
      id: drawingData.id || `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uploadDate: drawingData.uploadDate || new Date().toISOString(),
      entityType: 'drawing'
    };

    try {
      await offlineStorage.saveDrawing(drawing);
      await offlineStorage.addToSyncQueue('create', drawing, 'normal');

      console.log('✅ Drawing saved offline:', drawing.id);

      if (connectivityService.getConnectionStatus().isOnline) {
        connectivityService.triggerAutoSync();
      }

      return drawing;

    } catch (error) {
      console.error('Failed to save drawing offline:', error);
      throw error;
    }
  }

  // Project operations
  async getProjects() {
    await this.ensureInitialized();

    try {
      return await offlineStorage.getProjects();
    } catch (error) {
      console.error('Failed to get projects from offline storage:', error);
      return [];
    }
  }

  async saveProject(projectData) {
    await this.ensureInitialized();

    const project = {
      ...projectData,
      id: projectData.id || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'project'
    };

    try {
      await offlineStorage.saveProject(project);
      await offlineStorage.addToSyncQueue('create', project, 'normal');

      console.log('✅ Project saved offline:', project.id);

      if (connectivityService.getConnectionStatus().isOnline) {
        connectivityService.triggerAutoSync();
      }

      return project;

    } catch (error) {
      console.error('Failed to save project offline:', error);
      throw error;
    }
  }

  // User operations
  async getUsers(companyId = null) {
    await this.ensureInitialized();

    try {
      return await offlineStorage.getUsers(companyId);
    } catch (error) {
      console.error('Failed to get users from offline storage:', error);
      return [];
    }
  }

  async saveUser(userData) {
    await this.ensureInitialized();

    const user = {
      ...userData,
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'user'
    };

    try {
      await offlineStorage.saveUser(user);
      await offlineStorage.addToSyncQueue('create', user, 'normal');

      console.log('✅ User saved offline:', user.id);

      if (connectivityService.getConnectionStatus().isOnline) {
        connectivityService.triggerAutoSync();
      }

      return user;

    } catch (error) {
      console.error('Failed to save user offline:', error);
      throw error;
    }
  }

  // Utility methods
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeService();
    }
  }

  async getOfflineStatus() {
    await this.ensureInitialized();

    const [storageInfo, syncStats, lastSyncTime] = await Promise.all([
      offlineStorage.getStorageInfo(),
      connectivityService.getSyncStats(),
      offlineStorage.getMetadata('lastSyncTime')
    ]);

    return {
      isOnline: connectivityService.getConnectionStatus().isOnline,
      storageInfo,
      syncStats,
      lastSyncTime,
      hasOfflineData: await offlineStorage.hasOfflineData()
    };
  }

  async clearOfflineData() {
    await this.ensureInitialized();
    await offlineStorage.clearAllData();
    console.log('🗑️ All offline data cleared');
  }

  // Manual sync triggers
  async forceSync() {
    await this.ensureInitialized();
    return connectivityService.manualSync();
  }

  // Event subscriptions for UI updates
  onConnectionChange(callback) {
    return connectivityService.subscribe('connection-restored', callback);
  }

  onSyncProgress(callback) {
    return connectivityService.subscribe('sync-progress', callback);
  }

  onSyncComplete(callback) {
    return connectivityService.subscribe('sync-complete', callback);
  }

  onSyncError(callback) {
    return connectivityService.subscribe('sync-error', callback);
  }
}

// Create singleton instance
const offlineDataService = new OfflineDataService();

export default offlineDataService;