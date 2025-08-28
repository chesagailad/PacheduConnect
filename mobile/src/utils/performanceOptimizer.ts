/**
 * Performance Optimizer for PacheduConnect Mobile App
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Bundle optimization and memory management utilities
 */

import { AppError, ErrorCode } from './errors';

// Performance Optimization Interfaces
export interface BundleAnalysis {
  totalSize: number;
  mainBundleSize: number;
  vendorBundleSize: number;
  assetSize: number;
  optimizationScore: number; // 0-100
  recommendations: string[];
}

export interface MemoryAnalysis {
  currentUsage: number;
  peakUsage: number;
  availableMemory: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface OptimizationConfig {
  maxBundleSize: number; // bytes
  maxMemoryUsage: number; // bytes
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableCompression: boolean;
}

// Performance Optimizer Class
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: OptimizationConfig;
  private memoryUsageHistory: number[] = [];
  private bundleSizeHistory: number[] = [];

  private constructor() {
    this.config = {
      maxBundleSize: 50 * 1024 * 1024, // 50MB
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      enableImageOptimization: true,
      enableCodeSplitting: true,
      enableTreeShaking: true,
      enableCompression: true,
    };
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Analyze bundle size
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    try {
      // Simulate bundle analysis
      const mainBundleSize = 15 * 1024 * 1024; // 15MB
      const vendorBundleSize = 20 * 1024 * 1024; // 20MB
      const assetSize = 10 * 1024 * 1024; // 10MB
      const totalSize = mainBundleSize + vendorBundleSize + assetSize;

      // Calculate optimization score
      const optimizationScore = this.calculateBundleOptimizationScore(totalSize);

      // Generate recommendations
      const recommendations = this.generateBundleRecommendations(totalSize, mainBundleSize, vendorBundleSize, assetSize);

      // Store history
      this.bundleSizeHistory.push(totalSize);
      if (this.bundleSizeHistory.length > 10) {
        this.bundleSizeHistory.shift();
      }

      return {
        totalSize,
        mainBundleSize,
        vendorBundleSize,
        assetSize,
        optimizationScore,
        recommendations,
      };
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw AppError.fromBusinessError(
        ErrorCode.PERFORMANCE_ERROR,
        'Failed to analyze bundle size',
        'Please check your build configuration'
      );
    }
  }

  // Analyze memory usage
  async analyzeMemoryUsage(): Promise<MemoryAnalysis> {
    try {
      // Get current memory usage
      const currentUsage = this.getCurrentMemoryUsage();
      const peakUsage = Math.max(...this.memoryUsageHistory, currentUsage);
      const availableMemory = this.getAvailableMemory();
      const memoryPressure = this.calculateMemoryPressure(currentUsage);

      // Generate recommendations
      const recommendations = this.generateMemoryRecommendations(currentUsage, memoryPressure);

      // Store history
      this.memoryUsageHistory.push(currentUsage);
      if (this.memoryUsageHistory.length > 20) {
        this.memoryUsageHistory.shift();
      }

      return {
        currentUsage,
        peakUsage,
        availableMemory,
        memoryPressure,
        recommendations,
      };
    } catch (error) {
      console.error('Memory analysis failed:', error);
      throw AppError.fromBusinessError(
        ErrorCode.PERFORMANCE_ERROR,
        'Failed to analyze memory usage',
        'Please check your device memory'
      );
    }
  }

  // Get current memory usage
  private getCurrentMemoryUsage(): number {
    if ((global as any).memory) {
      return (global as any).memory.usedJSHeapSize || 0;
    }
    return 50 * 1024 * 1024; // Default 50MB
  }

  // Get available memory
  private getAvailableMemory(): number {
    if ((global as any).memory) {
      const totalMemory = (global as any).memory.totalJSHeapSize || 0;
      const usedMemory = (global as any).memory.usedJSHeapSize || 0;
      return totalMemory - usedMemory;
    }
    return 100 * 1024 * 1024; // Default 100MB available
  }

  // Calculate memory pressure
  private calculateMemoryPressure(currentUsage: number): 'low' | 'medium' | 'high' | 'critical' {
    const usagePercentage = (currentUsage / this.config.maxMemoryUsage) * 100;

    if (usagePercentage < 50) return 'low';
    if (usagePercentage < 75) return 'medium';
    if (usagePercentage < 90) return 'high';
    return 'critical';
  }

  // Calculate bundle optimization score
  private calculateBundleOptimizationScore(totalSize: number): number {
    const maxSize = this.config.maxBundleSize;
    const usagePercentage = (totalSize / maxSize) * 100;

    if (usagePercentage <= 50) return 100;
    if (usagePercentage <= 75) return 75;
    if (usagePercentage <= 90) return 50;
    return 25;
  }

  // Generate bundle recommendations
  private generateBundleRecommendations(
    totalSize: number,
    mainBundleSize: number,
    vendorBundleSize: number,
    assetSize: number
  ): string[] {
    const recommendations: string[] = [];

    if (totalSize > this.config.maxBundleSize) {
      recommendations.push('Bundle size exceeds recommended limit. Consider code splitting and tree shaking.');
    }

    if (vendorBundleSize > mainBundleSize * 0.8) {
      recommendations.push('Vendor bundle is large. Consider removing unused dependencies.');
    }

    if (assetSize > totalSize * 0.3) {
      recommendations.push('Asset size is large. Consider image optimization and compression.');
    }

    if (mainBundleSize > 20 * 1024 * 1024) {
      recommendations.push('Main bundle is large. Consider lazy loading and dynamic imports.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Bundle size is within optimal range.');
    }

    return recommendations;
  }

  // Generate memory recommendations
  private generateMemoryRecommendations(
    currentUsage: number,
    memoryPressure: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const recommendations: string[] = [];

    switch (memoryPressure) {
      case 'critical':
        recommendations.push('Critical memory pressure detected. Implement immediate memory cleanup.');
        recommendations.push('Consider reducing image quality and clearing caches.');
        break;
      case 'high':
        recommendations.push('High memory pressure detected. Implement memory optimization strategies.');
        recommendations.push('Consider implementing virtual scrolling for large lists.');
        break;
      case 'medium':
        recommendations.push('Moderate memory usage. Monitor for potential optimization opportunities.');
        break;
      case 'low':
        recommendations.push('Memory usage is optimal.');
        break;
    }

    if (currentUsage > this.config.maxMemoryUsage * 0.8) {
      recommendations.push('Memory usage approaching limit. Consider implementing memory management.');
    }

    return recommendations;
  }

  // Optimize images
  async optimizeImages(): Promise<{
    originalSize: number;
    optimizedSize: number;
    savings: number;
    optimizationRatio: number;
  }> {
    try {
      // Simulate image optimization
      const originalSize = 5 * 1024 * 1024; // 5MB
      const optimizedSize = 2 * 1024 * 1024; // 2MB
      const savings = originalSize - optimizedSize;
      const optimizationRatio = (savings / originalSize) * 100;

      return {
        originalSize,
        optimizedSize,
        savings,
        optimizationRatio,
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw AppError.fromBusinessError(
        ErrorCode.PERFORMANCE_ERROR,
        'Failed to optimize images',
        'Please check your image assets'
      );
    }
  }

  // Implement code splitting
  async implementCodeSplitting(): Promise<{
    originalBundleCount: number;
    splitBundleCount: number;
    averageBundleSize: number;
    loadTimeImprovement: number;
  }> {
    try {
      // Simulate code splitting
      const originalBundleCount = 1;
      const splitBundleCount = 5;
      const averageBundleSize = 8 * 1024 * 1024; // 8MB per bundle
      const loadTimeImprovement = 40; // 40% improvement

      return {
        originalBundleCount,
        splitBundleCount,
        averageBundleSize,
        loadTimeImprovement,
      };
    } catch (error) {
      console.error('Code splitting failed:', error);
      throw AppError.fromBusinessError(
        ErrorCode.PERFORMANCE_ERROR,
        'Failed to implement code splitting',
        'Please check your build configuration'
      );
    }
  }

  // Implement tree shaking
  async implementTreeShaking(): Promise<{
    originalSize: number;
    treeShakenSize: number;
    removedCode: number;
    reductionPercentage: number;
  }> {
    try {
      // Simulate tree shaking
      const originalSize = 25 * 1024 * 1024; // 25MB
      const treeShakenSize = 18 * 1024 * 1024; // 18MB
      const removedCode = originalSize - treeShakenSize;
      const reductionPercentage = (removedCode / originalSize) * 100;

      return {
        originalSize,
        treeShakenSize,
        removedCode,
        reductionPercentage,
      };
    } catch (error) {
      console.error('Tree shaking failed:', error);
      throw AppError.fromBusinessError(
        ErrorCode.PERFORMANCE_ERROR,
        'Failed to implement tree shaking',
        'Please check your build configuration'
      );
    }
  }

  // Implement compression
  async implementCompression(): Promise<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    bandwidthSavings: number;
  }> {
    try {
      // Simulate compression
      const originalSize = 30 * 1024 * 1024; // 30MB
      const compressedSize = 12 * 1024 * 1024; // 12MB
      const compressionRatio = (compressedSize / originalSize) * 100;
      const bandwidthSavings = originalSize - compressedSize;

      return {
        originalSize,
        compressedSize,
        compressionRatio,
        bandwidthSavings,
      };
    } catch (error) {
      console.error('Compression failed:', error);
      throw AppError.fromBusinessError(
        ErrorCode.PERFORMANCE_ERROR,
        'Failed to implement compression',
        'Please check your build configuration'
      );
    }
  }

  // Memory cleanup
  async performMemoryCleanup(): Promise<{
    beforeCleanup: number;
    afterCleanup: number;
    freedMemory: number;
    cleanupEfficiency: number;
  }> {
    try {
      const beforeCleanup = this.getCurrentMemoryUsage();
      
      // Simulate memory cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear caches and unused objects
      this.clearUnusedCaches();
      this.clearUnusedObjects();
      
      const afterCleanup = this.getCurrentMemoryUsage();
      const rawFreed = beforeCleanup - afterCleanup;
      const freedMemory = Math.max(0, rawFreed);
      const cleanupEfficiency = beforeCleanup > 0 ? (freedMemory / beforeCleanup) * 100 : 0;

      return {
        beforeCleanup,
        afterCleanup,
        freedMemory,
        cleanupEfficiency,
      };
    } catch (error) {
      console.error('Memory cleanup failed:', error);
      throw AppError.fromBusinessError(
        ErrorCode.PERFORMANCE_ERROR,
        'Failed to perform memory cleanup',
        'Please try again later'
      );
    }
  }

  // Clear unused caches
  private clearUnusedCaches(): void {
    // Simulate cache clearing
    console.log('Clearing unused caches...');
  }

  // Clear unused objects
  private clearUnusedObjects(): void {
    // Simulate object clearing
    console.log('Clearing unused objects...');
  }

  // Get performance trends
  getPerformanceTrends(): {
    bundleSizeTrend: 'increasing' | 'decreasing' | 'stable';
    memoryUsageTrend: 'increasing' | 'decreasing' | 'stable';
    recommendations: string[];
  } {
    const bundleSizeTrend = this.calculateTrend(this.bundleSizeHistory);
    const memoryUsageTrend = this.calculateTrend(this.memoryUsageHistory);
    
    const recommendations: string[] = [];
    
    if (bundleSizeTrend === 'increasing') {
      recommendations.push('Bundle size is increasing. Monitor for new dependencies and assets.');
    }
    
    if (memoryUsageTrend === 'increasing') {
      recommendations.push('Memory usage is increasing. Check for memory leaks and optimization opportunities.');
    }

    return {
      bundleSizeTrend,
      memoryUsageTrend,
      recommendations,
    };
  }

  // Calculate trend from history
  private calculateTrend(history: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-3);
    const older = history.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  // Update configuration
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  // Run comprehensive optimization
  async runComprehensiveOptimization(): Promise<{
    bundleAnalysis: BundleAnalysis;
    memoryAnalysis: MemoryAnalysis;
    optimizationResults: {
      imageOptimization: any;
      codeSplitting: any;
      treeShaking: any;
      compression: any;
      memoryCleanup: any;
    };
    overallScore: number;
    recommendations: string[];
  }> {
    try {
      const [bundleAnalysis, memoryAnalysis, imageOptimization, codeSplitting, treeShaking, compression, memoryCleanup] = await Promise.all([
        this.analyzeBundleSize(),
        this.analyzeMemoryUsage(),
        this.optimizeImages(),
        this.implementCodeSplitting(),
        this.implementTreeShaking(),
        this.implementCompression(),
        this.performMemoryCleanup(),
      ]);

      const overallScore = this.calculateOverallScore(bundleAnalysis, memoryAnalysis);
      const recommendations = [
        ...bundleAnalysis.recommendations,
        ...memoryAnalysis.recommendations,
      ];

      return {
        bundleAnalysis,
        memoryAnalysis,
        optimizationResults: {
          imageOptimization,
          codeSplitting,
          treeShaking,
          compression,
          memoryCleanup,
        },
        overallScore,
        recommendations,
      };
    } catch (error) {
      console.error('Comprehensive optimization failed:', error);
      throw AppError.fromBusinessError(
        ErrorCode.PERFORMANCE_ERROR,
        'Failed to run comprehensive optimization',
        'Please check your configuration and try again'
      );
    }
  }

  // Calculate overall performance score
  private calculateOverallScore(bundleAnalysis: BundleAnalysis, memoryAnalysis: MemoryAnalysis): number {
    const bundleScore = bundleAnalysis.optimizationScore;
    const memoryScore = this.calculateMemoryScore(memoryAnalysis.memoryPressure);
    
    return (bundleScore + memoryScore) / 2;
  }

  // Calculate memory score
  private calculateMemoryScore(memoryPressure: 'low' | 'medium' | 'high' | 'critical'): number {
    switch (memoryPressure) {
      case 'low': return 100;
      case 'medium': return 75;
      case 'high': return 50;
      case 'critical': return 25;
      default: return 50;
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance(); 