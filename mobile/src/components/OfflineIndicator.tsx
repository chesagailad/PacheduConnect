import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../hooks/useOffline';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  onSyncPress?: () => void;
  style?: any;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = false,
  onSyncPress,
  style,
}) => {
  const {
    isOnline,
    syncStatus,
    isSyncing,
    syncOfflineData,
    error,
    clearError,
  } = useOffline();

  const handleSyncPress = async () => {
    if (onSyncPress) {
      onSyncPress();
      return;
    }

    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'You are currently offline. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isSyncing) {
      Alert.alert(
        'Sync in Progress',
        'Data synchronization is already in progress. Please wait.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await syncOfflineData();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.syncedTransactions} transactions.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sync Failed',
          `Failed to sync ${result.failedTransactions} transactions. ${result.errors.join(', ')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Sync Error',
        'An error occurred during synchronization. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#FF6B6B';
    if (isSyncing) return '#4ECDC4';
    if (syncStatus.pendingTransactions > 0) return '#FFA726';
    return '#4CAF50';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (syncStatus.pendingTransactions > 0) return `${syncStatus.pendingTransactions} pending`;
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'cloud-offline';
    if (isSyncing) return 'sync';
    if (syncStatus.pendingTransactions > 0) return 'cloud-upload';
    return 'cloud-done';
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    
    const lastSync = new Date(syncStatus.lastSyncTime);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isOnline && syncStatus.pendingTransactions === 0 && !showDetails) {
    return null; // Don't show indicator when everything is synced
  }

  return (
    <View style={[styles.container, style]}>
      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#FFF" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorClose}>
            <Ionicons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Status Indicator */}
      <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
        <View style={styles.statusContent}>
          <Ionicons name={getStatusIcon()} size={20} color="#FFF" />
          <Text style={styles.statusText}>{getStatusText()}</Text>
          
          {syncStatus.pendingTransactions > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{syncStatus.pendingTransactions}</Text>
            </View>
          )}
        </View>

        {/* Sync Button */}
        {syncStatus.pendingTransactions > 0 && isOnline && (
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={handleSyncPress}
            disabled={isSyncing}
          >
            <Ionicons
              name={isSyncing ? 'sync' : 'refresh'}
              size={16}
              color="#FFF"
              style={isSyncing && styles.rotatingIcon}
            />
            <Text style={styles.syncButtonText}>
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Details Section */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network Status:</Text>
            <Text style={[styles.detailValue, { color: isOnline ? '#4CAF50' : '#FF6B6B' }]}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Sync:</Text>
            <Text style={styles.detailValue}>{formatLastSync()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending Transactions:</Text>
            <Text style={styles.detailValue}>{syncStatus.pendingTransactions}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Transactions:</Text>
            <Text style={styles.detailValue}>{syncStatus.totalTransactions}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorBanner: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  errorClose: {
    padding: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  pendingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  rotatingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  detailsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
}); 