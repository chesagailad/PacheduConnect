/**
 * Offline Data Manager for PacheduConnect Mobile App
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Manages offline data storage with size limits and cleanup strategies
 */

import * as SecureStore from 'expo-secure-store';
import { AppError, ErrorCode } from '../../utils/errors';
import { offlineManager, OfflineTransaction } from './offlineManager';

// Offline Data Manager Interfaces
export interface StorageLimits {
  maxTotalSize: number; // bytes
  maxTransactionCount: number;
  maxTransactionAge: number; // days
  maxUserDataSize: number; // bytes
  maxKYCDataSize: number; // bytes
  maxSettingsSize: number; // bytes
}

export interface StorageUsage {
  totalSize: number;
  transactionCount: number;
  userDataSize: number;
  kycDataSize: number;
  settingsSize: number;
  availableSpace: number;
  usagePercentage: number;
}

export interface CleanupResult {
  removedTransactions: number;
  removedUserData: number;
  removedKYCData: number;
  removedSettings: number;
  freedSpace: number;
  newUsagePercentage: number;
}

export interface DataRetentionPolicy {
  transactionRetentionDays: number;
  userDataRetentionDays: number;
  kycDataRetentionDays: number;
  settingsRetentionDays: number;
  enableAutoCleanup: boolean;
  cleanupThreshold: number; // percentage
}

// Offline Data Manager Class
export class OfflineDataManager {
  private static instance: OfflineDataManager;
  private limits: StorageLimits;
  private retentionPolicy: DataRetentionPolicy;

  private constructor() {
    this.limits = {
      maxTotalSize: 100 * 1024 * 1024, // 100MB
      maxTransactionCount: 1000,
      maxTransactionAge: 30, // 30 days
      maxUserDataSize: 10 * 1024 * 1024, // 10MB
      maxKYCDataSize: 50 * 1024 * 1024, // 50MB
      maxSettingsSize: 1 * 1024 * 1024, // 1MB
    };

    this.retentionPolicy = {
      transactionRetentionDays: 30,
      userDataRetentionDays: 90,
      kycDataRetentionDays: 365,
      settingsRetentionDays: 365,
      enableAutoCleanup: true,
      cleanupThreshold: 80, // 80%
    };
  }

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  // Get current storage usage
  async getStorageUsage(): Promise<StorageUsage> {
    try {
      const offlineData = await offlineManager.getOfflineTransactions();
      
      // Calculate sizes (simulated)
      const transactionCount = offlineData.length;
      const transactionSize = this.calculateTransactionSize(offlineData);
      const userDataSize = await this.getUserDataSize();
      const kycDataSize = await this.getKYCDataSize();
      const settingsSize = await this.getSettingsSize();
      
      const totalSize = transactionSize + userDataSize + kycDataSize + settingsSize;
      const availableSpace = this.limits.maxTotalSize - totalSize;
      const usagePercentage = (totalSize / this.limits.maxTotalSize) * 100;

      return {
        totalSize,
        transactionCount,
        userDataSize,
        kycDataSize,
        settingsSize,
        availableSpace,
        usagePercentage,
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to get storage usage',
        'Please check your device storage'
      );
    }
  }

  // Calculate transaction size
  private calculateTransactionSize(transactions: OfflineTransaction[]): number {
    // Simulate size calculation based on transaction count and average size
    const averageTransactionSize = 1024; // 1KB per transaction
    return transactions.length * averageTransactionSize;
  }

  // Get user data size
  private async getUserDataSize(): Promise<number> {
    try {
      const userData = await offlineManager.getUserData();
      if (!userData) return 0;
      
      // Simulate size calculation
      return JSON.stringify(userData).length;
    } catch (error) {
      console.error('Failed to get user data size:', error);
      return 0;
    }
  }

  // Get KYC data size
  private async getKYCDataSize(): Promise<number> {
    try {
      const kycData = await offlineManager.getKYCData();
      if (!kycData) return 0;
      
      // Simulate size calculation
      return JSON.stringify(kycData).length;
    } catch (error) {
      console.error('Failed to get KYC data size:', error);
      return 0;
    }
  }

  // Get settings size
  private async getSettingsSize(): Promise<number> {
    try {
      const settings = await offlineManager.getSettings();
      if (!settings) return 0;
      
      // Simulate size calculation
      return JSON.stringify(settings).length;
    } catch (error) {
      console.error('Failed to get settings size:', error);
      return 0;
    }
  }

  // Check if storage is within limits
  async checkStorageLimits(): Promise<{
    withinLimits: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    try {
      const usage = await this.getStorageUsage();
      const violations: string[] = [];
      const recommendations: string[] = [];

      // Check total size limit
      if (usage.totalSize > this.limits.maxTotalSize) {
        violations.push(`Total storage size (${this.formatBytes(usage.totalSize)}) exceeds limit (${this.formatBytes(this.limits.maxTotalSize)})`);
        recommendations.push('Perform data cleanup to free up space');
      }

      // Check transaction count limit
      if (usage.transactionCount > this.limits.maxTransactionCount) {
        violations.push(`Transaction count (${usage.transactionCount}) exceeds limit (${this.limits.maxTransactionCount})`);
        recommendations.push('Remove old transactions to stay within limits');
      }

      // Check user data size limit
      if (usage.userDataSize > this.limits.maxUserDataSize) {
        violations.push(`User data size (${this.formatBytes(usage.userDataSize)}) exceeds limit (${this.formatBytes(this.limits.maxUserDataSize)})`);
        recommendations.push('Clear cached user data');
      }

      // Check KYC data size limit
      if (usage.kycDataSize > this.limits.maxKYCDataSize) {
        violations.push(`KYC data size (${this.formatBytes(usage.kycDataSize)}) exceeds limit (${this.formatBytes(this.limits.maxKYCDataSize)})`);
        recommendations.push('Remove old KYC documents');
      }

      // Check settings size limit
      if (usage.settingsSize > this.limits.maxSettingsSize) {
        violations.push(`Settings size (${this.formatBytes(usage.settingsSize)}) exceeds limit (${this.formatBytes(this.limits.maxSettingsSize)})`);
        recommendations.push('Reset app settings');
      }

      // Check usage percentage
      if (usage.usagePercentage > this.retentionPolicy.cleanupThreshold) {
        violations.push(`Storage usage (${usage.usagePercentage.toFixed(1)}%) exceeds cleanup threshold (${this.retentionPolicy.cleanupThreshold}%)`);
        recommendations.push('Enable automatic cleanup or perform manual cleanup');
      }

      const withinLimits = violations.length === 0;

      return {
        withinLimits,
        violations,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to check storage limits:', error);
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to check storage limits',
        'Please check your device storage'
      );
    }
  }

  // Perform data cleanup
  async performDataCleanup(): Promise<CleanupResult> {
    try {
      const beforeUsage = await this.getStorageUsage();
      let removedTransactions = 0;
      let removedUserData = 0;
      let removedKYCData = 0;
      let removedSettings = 0;

      // Clean up old transactions
      const transactions = await offlineManager.getOfflineTransactions();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicy.transactionRetentionDays);

      const oldTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate < cutoffDate && t.status !== 'pending' && t.status !== 'syncing';
      });

      // Remove old transactions (simulated)
      removedTransactions = oldTransactions.length;

      // Clean up old user data (simulated)
      const userData = await offlineManager.getUserData();
      if (userData && this.isDataOld(userData, this.retentionPolicy.userDataRetentionDays)) {
        removedUserData = 1;
        await offlineManager.storeUserData(null);
      }

      // Clean up old KYC data (simulated)
      const kycData = await offlineManager.getKYCData();
      if (kycData && this.isDataOld(kycData, this.retentionPolicy.kycDataRetentionDays)) {
        removedKYCData = 1;
        await offlineManager.storeKYCData(null);
      }

      // Clean up old settings (simulated)
      const settings = await offlineManager.getSettings();
      if (settings && this.isDataOld(settings, this.retentionPolicy.settingsRetentionDays)) {
        removedSettings = 1;
        await offlineManager.storeSettings(null);
      }

      const afterUsage = await this.getStorageUsage();
      const freedSpace = beforeUsage.totalSize - afterUsage.totalSize;

      return {
        removedTransactions,
        removedUserData,
        removedKYCData,
        removedSettings,
        freedSpace,
        newUsagePercentage: afterUsage.usagePercentage,
      };
    } catch (error) {
      console.error('Failed to perform data cleanup:', error);
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to perform data cleanup',
        'Please try again later'
      );
    }
  }

  // Check if data is old
  private isDataOld(data: any, retentionDays: number): boolean {
    if (!data || !data.lastUpdated) return false;
    
    const dataDate = new Date(data.lastUpdated);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    return dataDate < cutoffDate;
  }

  // Perform automatic cleanup if needed
  async performAutomaticCleanup(): Promise<{
    performed: boolean;
    result?: CleanupResult;
    reason?: string;
  }> {
    try {
      if (!this.retentionPolicy.enableAutoCleanup) {
        return { performed: false, reason: 'Automatic cleanup is disabled' };
      }

      const usage = await this.getStorageUsage();
      
      if (usage.usagePercentage > this.retentionPolicy.cleanupThreshold) {
        const result = await this.performDataCleanup();
        return { performed: true, result };
      }

      return { performed: false, reason: 'Storage usage is within acceptable limits' };
    } catch (error) {
      console.error('Failed to perform automatic cleanup:', error);
      return { performed: false, reason: 'Cleanup failed due to an error' };
    }
  }

  // Get storage recommendations
  async getStorageRecommendations(): Promise<{
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  }> {
    try {
      const usage = await this.getStorageUsage();
      const limits = await this.checkStorageLimits();
      
      const immediate: string[] = [];
      const shortTerm: string[] = [];
      const longTerm: string[] = [];

      // Immediate recommendations
      if (usage.usagePercentage > 90) {
        immediate.push('Critical: Storage is nearly full. Perform immediate cleanup.');
      }
      
      if (limits.violations.length > 0) {
        immediate.push(...limits.violations);
      }

      // Short-term recommendations
      if (usage.usagePercentage > 70) {
        shortTerm.push('Consider enabling automatic cleanup to manage storage usage.');
        shortTerm.push('Review and remove unnecessary cached data.');
      }

      if (usage.transactionCount > this.limits.maxTransactionCount * 0.8) {
        shortTerm.push('Monitor transaction count and consider cleanup soon.');
      }

      // Long-term recommendations
      longTerm.push('Implement data compression to reduce storage requirements.');
      longTerm.push('Consider cloud storage for non-critical data.');
      longTerm.push('Implement data archiving for historical transactions.');

      return { immediate, shortTerm, longTerm };
    } catch (error) {
      console.error('Failed to get storage recommendations:', error);
      return {
        immediate: ['Unable to analyze storage. Please check manually.'],
        shortTerm: [],
        longTerm: [],
      };
    }
  }

  // Update storage limits
  updateStorageLimits(newLimits: Partial<StorageLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  // Update retention policy
  updateRetentionPolicy(newPolicy: Partial<DataRetentionPolicy>): void {
    this.retentionPolicy = { ...this.retentionPolicy, ...newPolicy };
  }

  // Get current limits
  getStorageLimits(): StorageLimits {
    return { ...this.limits };
  }

  // Get current retention policy
  getRetentionPolicy(): DataRetentionPolicy {
    return { ...this.retentionPolicy };
  }

  // Format bytes to human readable format
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get storage health report
  async getStorageHealthReport(): Promise<{
    usage: StorageUsage;
    limits: StorageLimits;
    policy: DataRetentionPolicy;
    violations: string[];
    recommendations: string[];
    healthScore: number; // 0-100
  }> {
    try {
      const [usage, limitsCheck, recommendations] = await Promise.all([
        this.getStorageUsage(),
        this.checkStorageLimits(),
        this.getStorageRecommendations(),
      ]);

      // Calculate health score
      const healthScore = this.calculateHealthScore(usage, limitsCheck);

      return {
        usage,
        limits: this.limits,
        policy: this.retentionPolicy,
        violations: limitsCheck.violations,
        recommendations: [
          ...recommendations.immediate,
          ...recommendations.shortTerm,
          ...recommendations.longTerm,
        ],
        healthScore,
      };
    } catch (error) {
      console.error('Failed to get storage health report:', error);
      throw AppError.fromBusinessError(
        ErrorCode.STORAGE_ERROR,
        'Failed to get storage health report',
        'Please check your device storage'
      );
    }
  }

  // Calculate storage health score
  private calculateHealthScore(usage: StorageUsage, limitsCheck: { withinLimits: boolean; violations: string[] }): number {
    let score = 100;

    // Deduct points for usage percentage
    if (usage.usagePercentage > 90) score -= 40;
    else if (usage.usagePercentage > 80) score -= 20;
    else if (usage.usagePercentage > 70) score -= 10;

    // Deduct points for violations
    score -= limitsCheck.violations.length * 15;

    // Deduct points for high transaction count
    if (usage.transactionCount > this.limits.maxTransactionCount * 0.9) score -= 10;
    else if (usage.transactionCount > this.limits.maxTransactionCount * 0.8) score -= 5;

    return Math.max(0, score);
  }
}

// Export singleton instance
export const offlineDataManager = OfflineDataManager.getInstance(); 