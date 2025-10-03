import React, { useState, useEffect } from 'react';
import {
  WifiIcon,
  CloudIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import connectivityService from '../lib/connectivityService';
import offlineDataService from '../lib/offlineDataService';

const OfflineIndicator = ({ className = '' }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    lastSyncTime: null
  });
  const [syncProgress, setSyncProgress] = useState(null);
  const [pendingSyncItems, setPendingSyncItems] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initialize status
    updateConnectionStatus();
    updateSyncStats();

    // Subscribe to connectivity events
    const unsubscribeConnection = connectivityService.subscribe('connection-restored', () => {
      updateConnectionStatus();
    });

    const unsubscribeOffline = connectivityService.subscribe('connection-lost', () => {
      updateConnectionStatus();
    });

    const unsubscribeSyncStart = connectivityService.subscribe('sync-start', () => {
      updateConnectionStatus();
      setSyncProgress({ processed: 0, total: 0 });
    });

    const unsubscribeSyncProgress = connectivityService.subscribe('sync-progress', (progress) => {
      setSyncProgress(progress);
    });

    const unsubscribeSyncComplete = connectivityService.subscribe('sync-complete', (result) => {
      updateConnectionStatus();
      setSyncProgress(null);
      updateSyncStats();

      // Show success notification briefly
      if (result.itemsProcessed > 0) {
        setTimeout(() => {
          setSyncProgress(null);
        }, 3000);
      }
    });

    const unsubscribeSyncError = connectivityService.subscribe('sync-error', () => {
      updateConnectionStatus();
      setSyncProgress(null);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeConnection();
      unsubscribeOffline();
      unsubscribeSyncStart();
      unsubscribeSyncProgress();
      unsubscribeSyncComplete();
      unsubscribeSyncError();
    };
  }, []);

  const updateConnectionStatus = () => {
    const status = connectivityService.getConnectionStatus();
    setConnectionStatus(status);
  };

  const updateSyncStats = async () => {
    try {
      const stats = await connectivityService.getSyncStats();
      setPendingSyncItems(stats.pendingSyncItems);
    } catch (error) {
      console.error('Failed to get sync stats:', error);
    }
  };

  const handleManualSync = async () => {
    if (!connectionStatus.isOnline || connectionStatus.syncInProgress) return;

    try {
      await offlineDataService.forceSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const getStatusInfo = () => {
    if (!connectionStatus.isOnline) {
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-amber-600 bg-amber-50',
        borderColor: 'border-amber-200',
        text: 'Offline',
        description: 'Working offline. Changes will sync when connection is restored.',
        showBadge: pendingSyncItems > 0,
        badgeText: pendingSyncItems.toString()
      };
    }

    if (connectionStatus.syncInProgress || syncProgress) {
      return {
        icon: ArrowPathIcon,
        color: 'text-blue-600 bg-blue-50',
        borderColor: 'border-blue-200',
        text: 'Syncing',
        description: syncProgress
          ? `Syncing ${syncProgress.processed}/${syncProgress.total} items...`
          : 'Synchronizing data...',
        showBadge: false,
        spinning: true
      };
    }

    if (pendingSyncItems > 0) {
      return {
        icon: CloudArrowUpIcon,
        color: 'text-emerald-600 bg-emerald-50',
        borderColor: 'border-emerald-200',
        text: 'Online',
        description: 'Connected. All changes are synced.',
        showBadge: false
      };
    }

    return {
      icon: CheckCircleIcon,
      color: 'text-emerald-600 bg-emerald-50',
      borderColor: 'border-emerald-200',
      text: 'Online',
      description: 'Connected. All changes are synced.',
      showBadge: false
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  // Compact indicator for mobile
  const CompactIndicator = () => (
    <div
      className={`relative inline-flex items-center px-2 py-1 rounded-full border ${statusInfo.borderColor} ${statusInfo.color} ${className}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <Icon
        className={`h-4 w-4 ${statusInfo.spinning ? 'animate-spin' : ''}`}
      />
      <span className="ml-1 text-xs font-medium">{statusInfo.text}</span>

      {statusInfo.showBadge && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {statusInfo.badgeText}
        </span>
      )}

      {/* Dropdown details */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">Connection Status</span>
              <span className={`text-sm ${connectionStatus.isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                {connectionStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="text-xs text-slate-600">
              {statusInfo.description}
            </div>

            {pendingSyncItems > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pending Changes</span>
                <span className="text-sm font-medium text-slate-900">{pendingSyncItems}</span>
              </div>
            )}

            {connectionStatus.lastSyncTime && (
              <div className="text-xs text-slate-500">
                Last sync: {new Date(connectionStatus.lastSyncTime).toLocaleTimeString()}
              </div>
            )}

            {syncProgress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Sync Progress</span>
                  <span>{syncProgress.processed}/{syncProgress.total}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${syncProgress.total > 0 ? (syncProgress.processed / syncProgress.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            )}

            {connectionStatus.isOnline && !connectionStatus.syncInProgress && pendingSyncItems > 0 && (
              <button
                onClick={handleManualSync}
                className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Full indicator for desktop
  const FullIndicator = () => (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${statusInfo.borderColor} ${statusInfo.color} ${className}`}>
      <Icon
        className={`h-5 w-5 ${statusInfo.spinning ? 'animate-spin' : ''}`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{statusInfo.text}</span>

          {statusInfo.showBadge && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {statusInfo.badgeText}
            </span>
          )}
        </div>

        <div className="text-xs opacity-75 truncate">
          {statusInfo.description}
        </div>
      </div>

      {syncProgress && (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-white bg-opacity-50 rounded-full h-1.5">
            <div
              className="bg-current h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${syncProgress.total > 0 ? (syncProgress.processed / syncProgress.total) * 100 : 0}%`
              }}
            />
          </div>
          <span className="text-xs font-medium">
            {syncProgress.processed}/{syncProgress.total}
          </span>
        </div>
      )}

      {connectionStatus.isOnline && !connectionStatus.syncInProgress && pendingSyncItems > 0 && (
        <button
          onClick={handleManualSync}
          className="text-xs px-2 py-1 bg-white bg-opacity-50 hover:bg-opacity-75 rounded transition-colors"
        >
          Sync
        </button>
      )}
    </div>
  );

  // Auto-hide when online and no pending items (for mobile)
  const shouldShowCompact = className.includes('sm:hidden') &&
    connectionStatus.isOnline &&
    !connectionStatus.syncInProgress &&
    pendingSyncItems === 0 &&
    !syncProgress;

  if (shouldShowCompact) return null;

  return (
    <>
      {/* Mobile version */}
      <div className="sm:hidden">
        <CompactIndicator />
      </div>

      {/* Desktop version */}
      <div className="hidden sm:block">
        <FullIndicator />
      </div>
    </>
  );
};

export default OfflineIndicator;