/**
 * Connectivity Service
 * Monitors network status and handles automatic synchronization
 */

import offlineStorage from './offlineStorage';
import notificationService from './notificationService';

class ConnectivityService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Map();
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.retryDelay = 5000; // Start with 5 seconds
    this.maxRetryDelay = 60000; // Max 1 minute
    this.syncTimer = null;
    this.heartbeatInterval = null;
    this.apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

    this.initializeEventListeners();
    this.startHeartbeat();
  }

  initializeEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for visibility change (app comes back to foreground)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Listen for focus events
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
  }

  async handleOnline() {
    console.log('🌐 Network connection restored');
    this.isOnline = true;
    this.emit('connection-restored');

    // Reset retry delay on successful connection
    this.retryDelay = 5000;

    // Automatically start sync when connection is restored
    setTimeout(() => {
      this.triggerAutoSync();
    }, 1000); // Small delay to ensure connection is stable
  }

  handleOffline() {
    console.log('📡 Network connection lost');
    this.isOnline = false;
    this.emit('connection-lost');

    // Stop any ongoing sync
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }

  handleVisibilityChange() {
    if (!document.hidden && this.isOnline) {
      // App became visible and we're online - check for sync
      this.triggerAutoSync();
    }
  }

  handleWindowFocus() {
    if (this.isOnline) {
      // Window regained focus - check for sync
      this.triggerAutoSync();
    }
  }

  // Heartbeat to actively check connectivity
  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      const actuallyOnline = await this.checkRealConnectivity();

      if (actuallyOnline !== this.isOnline) {
        if (actuallyOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  async checkRealConnectivity() {
    if (!navigator.onLine) return false;

    try {
      // Try to reach a lightweight endpoint
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        timeout: 5000
      });
      return true;
    } catch (error) {
      // Fallback: try to reach a public endpoint
      try {
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          timeout: 5000
        });
        return true;
      } catch (fallbackError) {
        return false;
      }
    }
  }

  // Event system
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

  emit(eventType, data = null) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in connectivity callback:', error);
      }
    });
  }

  // Auto sync functionality
  async triggerAutoSync() {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    console.log('🔄 Triggering automatic sync...');

    try {
      await this.performSync();
    } catch (error) {
      console.error('Auto sync failed:', error);
      this.scheduleRetrySync();
    }
  }

  async performSync() {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.syncInProgress = true;
    this.emit('sync-start');

    try {
      // Get pending sync queue
      const syncQueue = await offlineStorage.getSyncQueue();

      if (syncQueue.length === 0) {
        console.log('No pending sync items');
        this.syncInProgress = false;
        this.emit('sync-complete', { itemsProcessed: 0 });
        return;
      }

      console.log(`🔄 Processing ${syncQueue.length} sync items...`);

      let processedCount = 0;
      let failedCount = 0;

      // Process high priority items first
      const prioritizedQueue = syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const item of prioritizedQueue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeSyncQueueItem(item.id);
          processedCount++;

          // Emit progress update
          this.emit('sync-progress', {
            processed: processedCount,
            total: syncQueue.length,
            current: item
          });

        } catch (error) {
          console.error('Failed to sync item:', item, error);
          failedCount++;

          // Increment retry count
          await offlineStorage.incrementRetryCount(item.id);

          // Remove item if max retries exceeded
          if (item.retryCount >= item.maxRetries) {
            console.warn('Max retries exceeded for item:', item);
            await offlineStorage.removeSyncQueueItem(item.id);
          }
        }
      }

      this.lastSyncTime = new Date().toISOString();
      await offlineStorage.setMetadata('lastSyncTime', this.lastSyncTime);

      console.log(`✅ Sync completed: ${processedCount} processed, ${failedCount} failed`);

      this.emit('sync-complete', {
        itemsProcessed: processedCount,
        itemsFailed: failedCount,
        timestamp: this.lastSyncTime
      });

      // If there were failures, schedule a retry
      if (failedCount > 0) {
        this.scheduleRetrySync();
      }

    } catch (error) {
      console.error('Sync process failed:', error);
      this.emit('sync-error', error);
      this.scheduleRetrySync();
    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncItem(item) {
    const { operation, data, entityType } = item;

    // Mock API calls - in real implementation, these would be actual API endpoints
    switch (operation) {
      case 'create':
        return this.createEntity(entityType, data);
      case 'update':
        return this.updateEntity(entityType, data);
      case 'delete':
        return this.deleteEntity(entityType, data.id);
      default:
        throw new Error(`Unknown sync operation: ${operation}`);
    }
  }

  // Mock API methods - replace with actual API calls
  async createEntity(entityType, data) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock success response
    console.log(`Created ${entityType}:`, data.id);

    // Update local storage to mark as synced
    switch (entityType) {
      case 'blocker':
        await offlineStorage.saveBlocker({ ...data, syncStatus: 'synced' });
        notificationService.emit('blocker-synced', data);
        break;
      case 'drawing':
        await offlineStorage.saveDrawing({ ...data, syncStatus: 'synced' });
        notificationService.emit('drawing-synced', data);
        break;
      case 'project':
        await offlineStorage.saveProject({ ...data, syncStatus: 'synced' });
        notificationService.emit('project-synced', data);
        break;
      case 'user':
        await offlineStorage.saveUser({ ...data, syncStatus: 'synced' });
        notificationService.emit('user-synced', data);
        break;
    }

    return { success: true, id: data.id };
  }

  async updateEntity(entityType, data) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Updated ${entityType}:`, data.id);

    // Update local storage
    switch (entityType) {
      case 'blocker':
        await offlineStorage.saveBlocker({ ...data, syncStatus: 'synced' });
        break;
      case 'drawing':
        await offlineStorage.saveDrawing({ ...data, syncStatus: 'synced' });
        break;
      case 'project':
        await offlineStorage.saveProject({ ...data, syncStatus: 'synced' });
        break;
      case 'user':
        await offlineStorage.saveUser({ ...data, syncStatus: 'synced' });
        break;
    }

    return { success: true, id: data.id };
  }

  async deleteEntity(entityType, id) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Deleted ${entityType}:`, id);

    // Remove from local storage
    switch (entityType) {
      case 'blocker':
        await offlineStorage.delete('blockers', id);
        break;
      case 'drawing':
        await offlineStorage.delete('drawings', id);
        break;
      case 'project':
        await offlineStorage.delete('projects', id);
        break;
      case 'user':
        await offlineStorage.delete('users', id);
        break;
    }

    return { success: true, id };
  }

  scheduleRetrySync() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    console.log(`⏰ Scheduling retry sync in ${this.retryDelay / 1000} seconds`);

    this.syncTimer = setTimeout(() => {
      this.triggerAutoSync();
    }, this.retryDelay);

    // Exponential backoff with jitter
    this.retryDelay = Math.min(
      this.retryDelay * 2 + Math.random() * 1000,
      this.maxRetryDelay
    );
  }

  // Manual sync trigger
  async manualSync() {
    console.log('📤 Manual sync triggered');
    this.emit('manual-sync-start');

    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    return this.performSync();
  }

  // Getters
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress
    };
  }

  async getSyncStats() {
    const queueCount = await offlineStorage.getCount('syncQueue');
    const storageInfo = await offlineStorage.getStorageInfo();

    return {
      pendingSyncItems: queueCount,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      storageInfo
    };
  }

  // Cleanup
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleWindowFocus);

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.listeners.clear();
  }
}

// Create singleton instance
const connectivityService = new ConnectivityService();

export default connectivityService;