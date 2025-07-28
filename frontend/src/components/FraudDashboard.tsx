/**
 * Fraud Dashboard Component
 * 
 * This component provides a comprehensive interface for monitoring and managing
 * fraud detection activities across the PacheduConnect platform.
 * 
 * Features:
 * - Real-time fraud alerts and notifications
 * - Risk score visualization and analytics
 * - Transaction monitoring and review interface
 * - Fraud pattern analysis and reporting
 * - Manual review and approval workflows
 * 
 * @author PacheduConnect Security Team
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  Users, 
  Activity,
  Eye,
  X,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';

/**
 * Fraud Alert Interface
 * Defines the structure of fraud alerts
 */
interface FraudAlert {
  id: string;
  transactionId: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: string[];
  action: 'BLOCK' | 'REVIEW' | 'APPROVE';
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  timestamp: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

/**
 * Fraud Analytics Interface
 * Defines the structure of fraud analytics data
 */
interface FraudAnalytics {
  totalAlerts: number;
  highRiskAlerts: number;
  mediumRiskAlerts: number;
  lowRiskAlerts: number;
  blockedTransactions: number;
  reviewedTransactions: number;
  approvedTransactions: number;
  averageRiskScore: number;
  topRiskFactors: Array<{ factor: string; count: number }>;
  alertsByHour: Array<{ hour: number; count: number }>;
  alertsByDay: Array<{ day: string; count: number }>;
}

/**
 * Fraud Dashboard Props Interface
 */
interface FraudDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'super_admin';
}

/**
 * Main Fraud Dashboard Component
 * 
 * Provides a comprehensive interface for fraud monitoring and management
 */
export default function FraudDashboard({ isOpen, onClose, userRole }: FraudDashboardProps) {
  // State management for fraud data
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [analytics, setAnalytics] = useState<FraudAnalytics | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Filter and search state
  const [filters, setFilters] = useState({
    riskLevel: 'ALL',
    status: 'ALL',
    dateRange: '24H'
  });
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Fetch Fraud Alerts from API
   * 
   * Retrieves fraud alerts from the backend API with filtering and pagination
   */
  const fetchFraudAlerts = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/fraud/alerts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fraud alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
      
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      // Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch Fraud Analytics from API
   * 
   * Retrieves fraud analytics and statistics from the backend
   */
  const fetchFraudAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/fraud/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fraud analytics');
      }

      const data = await response.json();
      setAnalytics(data);
      
    } catch (error) {
      console.error('Error fetching fraud analytics:', error);
    }
  };

  /**
   * Review Fraud Alert
   * 
   * Allows administrators to review and take action on fraud alerts
   * 
   * @param alertId - ID of the alert to review
   * @param action - Action to take (APPROVE, BLOCK, REVIEW)
   * @param notes - Optional notes for the review
   */
  const reviewAlert = async (alertId: string, action: 'APPROVE' | 'BLOCK' | 'REVIEW', notes?: string) => {
    try {
      const response = await fetch(`/api/admin/fraud/alerts/${alertId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action,
          notes,
          reviewedBy: 'current_user_id', // Replace with actual user ID
          reviewedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to review alert');
      }

      // Refresh alerts after review
      await fetchFraudAlerts();
      setSelectedAlert(null);
      
    } catch (error) {
      console.error('Error reviewing alert:', error);
    }
  };

  /**
   * Export Fraud Data
   * 
   * Exports fraud data for external analysis and reporting
   * 
   * @param format - Export format (CSV, JSON, PDF)
   */
  const exportFraudData = async (format: 'CSV' | 'JSON' | 'PDF') => {
    try {
      const response = await fetch('/api/admin/fraud/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          format,
          filters,
          dateRange: filters.dateRange
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export fraud data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraud_report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting fraud data:', error);
    }
  };

  /**
   * Get Risk Level Color
   * 
   * Returns the appropriate color for different risk levels
   * 
   * @param riskLevel - Risk level to get color for
   * @returns CSS color class
   */
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  /**
   * Get Risk Level Icon
   * 
   * Returns the appropriate icon for different risk levels
   * 
   * @param riskLevel - Risk level to get icon for
   * @returns Lucide React icon component
   */
  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM':
        return <Clock className="w-4 h-4" />;
      case 'LOW':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  /**
   * Filter Alerts
   * 
   * Filters alerts based on current filter criteria
   * 
   * @returns Filtered alerts array
   */
  const getFilteredAlerts = () => {
    return alerts.filter(alert => {
      // Risk level filter
      if (filters.riskLevel !== 'ALL' && alert.riskLevel !== filters.riskLevel) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'ALL' && alert.status !== filters.status) {
        return false;
      }
      
      // Search term filter
      if (searchTerm && !alert.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !alert.transactionId.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  /**
   * Initialize Real-time Updates
   * 
   * Sets up real-time updates for fraud alerts
   */
  useEffect(() => {
    if (isOpen) {
      // Initial data fetch
      fetchFraudAlerts();
      fetchFraudAnalytics();
      
      // Set up real-time refresh (every 30 seconds)
      const interval = setInterval(() => {
        fetchFraudAlerts();
        fetchFraudAnalytics();
      }, 30000);
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [isOpen]);

  /**
   * Cleanup on Component Unmount
   */
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Fraud Dashboard</h2>
                  <p className="text-sm text-gray-500">Real-time fraud monitoring and management</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchFraudAlerts()}
                  disabled={isLoading}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Analytics Overview */}
            {analytics && (
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600">High Risk Alerts</p>
                        <p className="text-2xl font-bold text-red-900">{analytics.highRiskAlerts}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-600">Medium Risk Alerts</p>
                        <p className="text-2xl font-bold text-yellow-900">{analytics.mediumRiskAlerts}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Low Risk Alerts</p>
                        <p className="text-2xl font-bold text-green-900">{analytics.lowRiskAlerts}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Avg Risk Score</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {(analytics.averageRiskScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filters.riskLevel}
                      onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="ALL">All Risk Levels</option>
                      <option value="HIGH">High Risk</option>
                      <option value="MEDIUM">Medium Risk</option>
                      <option value="LOW">Low Risk</option>
                    </select>
                    
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="ALL">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                    
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="24H">Last 24 Hours</option>
                      <option value="7D">Last 7 Days</option>
                      <option value="30D">Last 30 Days</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search by email or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
                  />
                  
                  <button
                    onClick={() => exportFraudData('CSV')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  <div className="space-y-4">
                    {getFilteredAlerts().map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg border ${getRiskLevelColor(alert.riskLevel)}`}>
                              {getRiskLevelIcon(alert.riskLevel)}
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-900">{alert.userEmail}</p>
                              <p className="text-sm text-gray-500">Transaction: {alert.transactionId}</p>
                              <p className="text-sm text-gray-500">
                                {alert.currency} {alert.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {(alert.riskScore * 100).toFixed(1)}% Risk
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                            
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(alert.riskLevel)}`}>
                              {alert.riskLevel}
                            </div>
                            
                            <Eye className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {getFilteredAlerts().length === 0 && (
                      <div className="text-center py-12">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No fraud alerts found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 