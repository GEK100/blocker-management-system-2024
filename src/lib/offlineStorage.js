/**
 * Offline Storage Service using IndexedDB
 * Provides reliable offline data storage and queuing for construction site use
 */

class OfflineStorage {
  constructor() {
    this.dbName = 'BlockerManagementDB';
    this.version = 1;
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores for different data types

        // Blockers store
        if (!db.objectStoreNames.contains('blockers')) {
          const blockersStore = db.createObjectStore('blockers', { keyPath: 'id' });
          blockersStore.createIndex('status', 'status', { unique: false });
          blockersStore.createIndex('projectId', 'projectId', { unique: false });
          blockersStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Drawings store
        if (!db.objectStoreNames.contains('drawings')) {
          const drawingsStore = db.createObjectStore('drawings', { keyPath: 'id' });
          drawingsStore.createIndex('projectId', 'projectId', { unique: false });
          drawingsStore.createIndex('category', 'category', { unique: false });
        }

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectsStore.createIndex('status', 'status', { unique: false });
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('role', 'role', { unique: false });
          usersStore.createIndex('companyId', 'companyId', { unique: false });
        }

        // Sync queue for pending operations
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('operation', 'operation', { unique: false });
          syncStore.createIndex('priority', 'priority', { unique: false });
        }

        // App metadata
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }

        console.log('IndexedDB schema created/updated');
      };
    });
  }

  // Generic CRUD operations
  async get(storeName, id) {
    await this.init();
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, indexName = null, indexValue = null) {
    await this.init();
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      let request;

      if (indexName && indexValue !== null) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    await this.init();
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    await this.init();
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    await this.init();
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Specific data operations
  async saveBlocker(blocker) {
    const enrichedBlocker = {
      ...blocker,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };
    return this.put('blockers', enrichedBlocker);
  }

  async getBlockers(projectId = null) {
    if (projectId) {
      return this.getAll('blockers', 'projectId', projectId);
    }
    return this.getAll('blockers');
  }

  async saveDrawing(drawing) {
    const enrichedDrawing = {
      ...drawing,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };
    return this.put('drawings', enrichedDrawing);
  }

  async getDrawings(projectId = null) {
    if (projectId) {
      return this.getAll('drawings', 'projectId', projectId);
    }
    return this.getAll('drawings');
  }

  async saveProject(project) {
    const enrichedProject = {
      ...project,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };
    return this.put('projects', enrichedProject);
  }

  async getProjects() {
    return this.getAll('projects');
  }

  async saveUser(user) {
    const enrichedUser = {
      ...user,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };
    return this.put('users', enrichedUser);
  }

  async getUsers(companyId = null) {
    if (companyId) {
      return this.getAll('users', 'companyId', companyId);
    }
    return this.getAll('users');
  }

  // Sync queue operations
  async addToSyncQueue(operation, data, priority = 'normal') {
    const queueItem = {
      operation, // 'create', 'update', 'delete'
      data,
      priority, // 'high', 'normal', 'low'
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      entityType: data.entityType || 'unknown', // 'blocker', 'drawing', 'project', 'user'
      entityId: data.id
    };

    await this.init();
    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => {
        console.log('Added to sync queue:', operation, data.entityType, data.id);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(priority = null) {
    await this.init();
    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      let request;

      if (priority) {
        const index = store.index('priority');
        request = index.getAll(priority);
      } else {
        // Get all sorted by timestamp (oldest first)
        const index = store.index('timestamp');
        request = index.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncQueueItem(id) {
    return this.delete('syncQueue', id);
  }

  async incrementRetryCount(queueItemId) {
    const item = await this.get('syncQueue', queueItemId);
    if (item) {
      item.retryCount = (item.retryCount || 0) + 1;
      item.lastRetry = new Date().toISOString();
      return this.put('syncQueue', item);
    }
  }

  // Metadata operations
  async setMetadata(key, value) {
    return this.put('metadata', { key, value, timestamp: new Date().toISOString() });
  }

  async getMetadata(key) {
    const result = await this.get('metadata', key);
    return result ? result.value : null;
  }

  // Bulk operations for initial data sync
  async bulkSaveBlockers(blockers) {
    for (const blocker of blockers) {
      await this.saveBlocker({ ...blocker, syncStatus: 'synced' });
    }
  }

  async bulkSaveDrawings(drawings) {
    for (const drawing of drawings) {
      await this.saveDrawing({ ...drawing, syncStatus: 'synced' });
    }
  }

  async bulkSaveProjects(projects) {
    for (const project of projects) {
      await this.saveProject({ ...project, syncStatus: 'synced' });
    }
  }

  async bulkSaveUsers(users) {
    for (const user of users) {
      await this.saveUser({ ...user, syncStatus: 'synced' });
    }
  }

  // Utility methods
  async getStorageInfo() {
    await this.init();
    const stores = ['blockers', 'drawings', 'projects', 'users', 'syncQueue'];
    const info = {};

    for (const storeName of stores) {
      const count = await this.getCount(storeName);
      info[storeName] = count;
    }

    return info;
  }

  async getCount(storeName) {
    await this.init();
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData() {
    await this.init();
    const stores = ['blockers', 'drawings', 'projects', 'users', 'syncQueue', 'metadata'];

    for (const storeName of stores) {
      await this.clear(storeName);
    }

    console.log('All offline data cleared');
  }

  // Check if we have offline data
  async hasOfflineData() {
    const info = await this.getStorageInfo();
    return Object.values(info).some(count => count > 0);
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorage();

export default offlineStorage;