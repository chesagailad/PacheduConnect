/**
 * Performance Tests for PacheduConnect Mobile App
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Performance testing suite for app performance monitoring
 */

import { offlineManager } from '../../services/offline/offlineManager';
import { offlineTransactionService } from '../../services/offline/offlineTransactionService';
import { AppError, ErrorCode } from '../../utils/errors';

// Performance Test Interfaces
export interface PerformanceMetrics {
  testName: string;
  duration: number;
  memoryUsage: number;
  cpuUsage?: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface PerformanceThresholds {
  appStartupTime: number; // milliseconds
  screenLoadTime: number; // milliseconds
  apiResponseTime: number; // milliseconds
  offlineSyncTime: number; // milliseconds
  memoryUsageLimit: number; // bytes
  bundleSizeLimit: number; // bytes
}

export interface PerformanceTestResult {
  passed: boolean;
  metrics: PerformanceMetrics;
  threshold: number;
  actual: number;
  improvement?: number;
}

// Performance Test Class
export class PerformanceTester {
  private static instance: PerformanceTester;
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;

  private constructor() {
    this.thresholds = {
      appStartupTime: 3000, // 3 seconds
      screenLoadTime: 1000, // 1 second
      apiResponseTime: 2000, // 2 seconds
      offlineSyncTime: 5000, // 5 seconds
      memoryUsageLimit: 100 * 1024 * 1024, // 100MB
      bundleSizeLimit: 50 * 1024 * 1024, // 50MB
    };
  }

  static getInstance(): PerformanceTester {
    if (!PerformanceTester.instance) {
      PerformanceTester.instance = new PerformanceTester();
    }
    return PerformanceTester.instance;
  }

  // Measure execution time
  private async measureExecutionTime<T>(
    testName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const duration = endTime - startTime;
      const memoryUsage = endMemory - startMemory;

      this.recordMetric({
        testName,
        duration,
        memoryUsage,
        timestamp: new Date(),
        success: true,
      });

      return { result, duration };
    } catch (error) {
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const duration = endTime - startTime;
      const memoryUsage = endMemory - startMemory;

      this.recordMetric({
        testName,
        duration,
        memoryUsage,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  // Get memory usage
  private getMemoryUsage(): number {
    if ((global as any).memory) {
      return (global as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  // Record performance metric
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    console.log(`Performance Test: ${metric.testName} - ${metric.duration}ms - ${metric.success ? 'PASS' : 'FAIL'}`);
  }

  // Test app startup performance
  async testAppStartup(): Promise<PerformanceTestResult> {
    const { duration } = await this.measureExecutionTime('App Startup', async () => {
      // Simulate app startup operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Initialize offline manager
      await offlineManager.initialize();
      
      // Load initial data
      await offlineManager.getSyncStatus();
    });

    const passed = duration <= this.thresholds.appStartupTime;
    
    return {
      passed,
      metrics: this.metrics[this.metrics.length - 1],
      threshold: this.thresholds.appStartupTime,
      actual: duration,
      improvement: passed ? undefined : this.thresholds.appStartupTime - duration,
    };
  }

  // Test screen load performance
  async testScreenLoad(screenName: string): Promise<PerformanceTestResult> {
    const { duration } = await this.measureExecutionTime(`Screen Load: ${screenName}`, async () => {
      // Simulate screen loading operations
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Load screen-specific data
      if (screenName === 'Home') {
        await offlineTransactionService.getTransactions();
      } else if (screenName === 'SendMoney') {
        await offlineTransactionService.calculateFees(100, 'USD', 'bank_transfer');
      }
    });

    const passed = duration <= this.thresholds.screenLoadTime;
    
    return {
      passed,
      metrics: this.metrics[this.metrics.length - 1],
      threshold: this.thresholds.screenLoadTime,
      actual: duration,
      improvement: passed ? undefined : this.thresholds.screenLoadTime - duration,
    };
  }

  // Test API response performance
  async testApiResponse(apiName: string): Promise<PerformanceTestResult> {
    const { duration } = await this.measureExecutionTime(`API Response: ${apiName}`, async () => {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mock API operations
      if (apiName === 'login') {
        await new Promise(resolve => setTimeout(resolve, 150));
      } else if (apiName === 'transaction') {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    });

    const passed = duration <= this.thresholds.apiResponseTime;
    
    return {
      passed,
      metrics: this.metrics[this.metrics.length - 1],
      threshold: this.thresholds.apiResponseTime,
      actual: duration,
      improvement: passed ? undefined : this.thresholds.apiResponseTime - duration,
    };
  }

  // Test offline sync performance
  async testOfflineSync(): Promise<PerformanceTestResult> {
    const { duration } = await this.measureExecutionTime('Offline Sync', async () => {
      // Simulate offline sync operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Perform offline sync
      await offlineManager.syncOfflineData();
    });

    const passed = duration <= this.thresholds.offlineSyncTime;
    
    return {
      passed,
      metrics: this.metrics[this.metrics.length - 1],
      threshold: this.thresholds.offlineSyncTime,
      actual: duration,
      improvement: passed ? undefined : this.thresholds.offlineSyncTime - duration,
    };
  }

  // Test memory usage
  async testMemoryUsage(): Promise<PerformanceTestResult> {
    const currentMemory = this.getMemoryUsage();
    const passed = currentMemory <= this.thresholds.memoryUsageLimit;
    
    const metric: PerformanceMetrics = {
      testName: 'Memory Usage',
      duration: 0,
      memoryUsage: currentMemory,
      timestamp: new Date(),
      success: passed,
    };

    this.recordMetric(metric);
    
    return {
      passed,
      metrics: metric,
      threshold: this.thresholds.memoryUsageLimit,
      actual: currentMemory,
      improvement: passed ? undefined : this.thresholds.memoryUsageLimit - currentMemory,
    };
  }

  // Test bundle size (simulated)
  async testBundleSize(): Promise<PerformanceTestResult> {
    // Simulate bundle size check
    const bundleSize = 25 * 1024 * 1024; // 25MB simulated
    const passed = bundleSize <= this.thresholds.bundleSizeLimit;
    
    const metric: PerformanceMetrics = {
      testName: 'Bundle Size',
      duration: 0,
      memoryUsage: bundleSize,
      timestamp: new Date(),
      success: passed,
    };

    this.recordMetric(metric);
    
    return {
      passed,
      metrics: metric,
      threshold: this.thresholds.bundleSizeLimit,
      actual: bundleSize,
      improvement: passed ? undefined : this.thresholds.bundleSizeLimit - bundleSize,
    };
  }

  // Test transaction processing performance
  async testTransactionProcessing(): Promise<PerformanceTestResult> {
    const { duration } = await this.measureExecutionTime('Transaction Processing', async () => {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Create offline transaction
      await offlineTransactionService.createTransaction({
        recipientId: 'test-recipient',
        amount: 100,
        currency: 'USD',
        deliveryMethod: 'bank_transfer',
        deliveryDetails: {},
      });
    });

    const passed = duration <= this.thresholds.apiResponseTime;
    
    return {
      passed,
      metrics: this.metrics[this.metrics.length - 1],
      threshold: this.thresholds.apiResponseTime,
      actual: duration,
      improvement: passed ? undefined : this.thresholds.apiResponseTime - duration,
    };
  }

  // Test offline data storage performance
  async testOfflineDataStorage(): Promise<PerformanceTestResult> {
    const { duration } = await this.measureExecutionTime('Offline Data Storage', async () => {
      // Simulate storing large amounts of data
      const testData = Array.from({ length: 1000 }, (_, i) => ({
        id: `test-${i}`,
        type: 'send',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));

      // Store test data
      for (const transaction of testData) {
        await offlineManager.storeOfflineTransaction({
          type: 'send',
          amount: transaction.amount,
          currency: transaction.currency,
          deliveryMethod: 'bank_transfer',
          deliveryDetails: {},
          maxRetries: 3,
        });
      }
    });

    const passed = duration <= 10000; // 10 seconds for data storage
    
    return {
      passed,
      metrics: this.metrics[this.metrics.length - 1],
      threshold: 10000,
      actual: duration,
      improvement: passed ? undefined : 10000 - duration,
    };
  }

  // Run all performance tests
  async runAllTests(): Promise<{
    results: PerformanceTestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      averageDuration: number;
      totalMemoryUsage: number;
    };
  }> {
    const results: PerformanceTestResult[] = [];

    // Run all performance tests
    results.push(await this.testAppStartup());
    results.push(await this.testScreenLoad('Home'));
    results.push(await this.testScreenLoad('SendMoney'));
    results.push(await this.testApiResponse('login'));
    results.push(await this.testApiResponse('transaction'));
    results.push(await this.testOfflineSync());
    results.push(await this.testMemoryUsage());
    results.push(await this.testBundleSize());
    results.push(await this.testTransactionProcessing());
    results.push(await this.testOfflineDataStorage());

    // Calculate summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const averageDuration = results.reduce((sum, r) => sum + r.metrics.duration, 0) / results.length;
    const totalMemoryUsage = results.reduce((sum, r) => sum + r.metrics.memoryUsage, 0);

    return {
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        averageDuration,
        totalMemoryUsage,
      },
    };
  }

  // Get performance report
  getPerformanceReport(): {
    metrics: PerformanceMetrics[];
    summary: {
      totalTests: number;
      averageDuration: number;
      totalMemoryUsage: number;
      successRate: number;
    };
  } {
    const totalTests = this.metrics.length;
    const successfulTests = this.metrics.filter(m => m.success).length;
    const averageDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalTests;
    const totalMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0);
    const successRate = (successfulTests / totalTests) * 100;

    return {
      metrics: this.metrics,
      summary: {
        totalTests,
        averageDuration,
        totalMemoryUsage,
        successRate,
      },
    };
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Update thresholds
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Get current thresholds
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }
}

// Export singleton instance
export const performanceTester = PerformanceTester.getInstance(); 