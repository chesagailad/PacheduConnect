/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: SuperAdminSystemSettings - handles frontend functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  CogIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon,
  UserPlusIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { superAdminService, SystemSettings, SystemHealth } from '../services/superAdminService';
import LoadingSpinner from './LoadingSpinner';
import Button from './Button';

interface SuperAdminSystemSettingsProps {
  className?: string;
}

const SuperAdminSystemSettings: React.FC<SuperAdminSystemSettingsProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [health] = await Promise.all([
        superAdminService.getSystemHealth()
      ]);
      
      setSystemHealth(health);
      
      // Initialize default settings
      setSettings({
        kycAutoApproval: false,
        maxFileSize: 5,
        maintenanceMode: false,
        registrationEnabled: true,
        kycRequired: true
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await superAdminService.updateSystemSettings(settings);
      setSuccess('System settings updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    const mb = Math.round(bytes / 1024 / 1024);
    return `${mb}MB`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <div className="flex items-center space-x-2">
            <CogIcon className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">Administrative Controls</span>
          </div>
        </div>

        {/* System Health Overview */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center p-3 rounded-lg border">
              <div className={`p-2 rounded-full ${getStatusColor(systemHealth.system.database)}`}>
                <CheckCircleIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-600 capitalize">{systemHealth.system.database}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 rounded-lg border">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <WrenchScrewdriverIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Uptime</p>
                <p className="text-sm text-gray-600">{formatUptime(systemHealth.system.uptime)}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 rounded-lg border">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <DocumentCheckIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Memory</p>
                <p className="text-sm text-gray-600">{formatMemory(systemHealth.system.memory.heapUsed)}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 rounded-lg border">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <UserPlusIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Users (24h)</p>
                <p className="text-sm text-gray-600">+{systemHealth.metrics.last24h.newUsers}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-6">
          {/* KYC Settings */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              KYC Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">KYC Auto-Approval</label>
                    <p className="text-xs text-gray-500">Automatically approve KYC submissions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.kycAutoApproval || false}
                      onChange={(e) => handleSettingChange('kycAutoApproval', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">KYC Required</label>
                    <p className="text-xs text-gray-500">Require KYC for all users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.kycRequired || false}
                      onChange={(e) => handleSettingChange('kycRequired', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxFileSize || 5}
                    onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum file size for KYC document uploads</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              System Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                    <p className="text-xs text-gray-500">Temporarily disable user access</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode || false}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Registration Enabled</label>
                    <p className="text-xs text-gray-500">Allow new user registrations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.registrationEnabled || false}
                      onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                      <p className="text-xs text-yellow-700">
                        Changes to system settings will affect all users immediately. Please review carefully before saving.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button
              onClick={() => fetchSystemData()}
              variant="outline"
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSystemSettings; 