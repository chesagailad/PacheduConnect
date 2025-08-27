import { apiClient } from './apiClient';
import { AppError, ErrorCode } from '../../utils/errors';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Notification Interfaces
export interface Notification {
  id: string;
  type: 'transaction' | 'kyc' | 'security' | 'promotional' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high';
}

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  userId: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  transactionNotifications: boolean;
  kycNotifications: boolean;
  securityNotifications: boolean;
  promotionalNotifications: boolean;
  systemNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  previewEnabled: boolean;
}

// Notification Service Class
export class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      // Configure notification behavior
      await this.configureNotifications();
      
      // Request permissions
      await this.requestPermissions();
      
      // Register for push notifications
      await this.registerForPushNotifications();
      
      // Set up notification handlers
      this.setupNotificationHandlers();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw AppError.fromServerError(error);
    }
  }

  // Configure notification behavior
  private async configureNotifications(): Promise<void> {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });
  }

  // Request notification permissions
  private async requestPermissions(): Promise<void> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw AppError.fromBusinessError(
          ErrorCode.FORBIDDEN,
          'Notification permission denied',
          'Please enable notifications in your device settings to receive important updates'
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Register for push notifications
  private async registerForPushNotifications(): Promise<void> {
    try {
      if (!Device.isDevice) {
        throw AppError.fromBusinessError(
          ErrorCode.VALIDATION_ERROR,
          'Push notifications not supported',
          'Push notifications are only available on physical devices'
        );
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });

      this.pushToken = token.data;

      // Register token with server
      await this.registerTokenWithServer(token.data);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Register push token with server
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register-token', {
        token,
        platform: Device.osName?.toLowerCase() || 'unknown',
        deviceId: Device.osInternalBuildId || 'unknown',
      });
    } catch (error) {
      console.error('Failed to register push token with server:', error);
      // Don't throw error as this is not critical for app functionality
    }
  }

  // Set up notification handlers
  private setupNotificationHandlers(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // You can add custom logic here, such as updating UI
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle notification response
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    if (data?.actionUrl) {
      // Navigate to specific screen based on actionUrl
      this.navigateToAction(data.actionUrl);
    }
  }

  // Navigate to action URL
  private navigateToAction(actionUrl: string): void {
    // This would typically use navigation service
    console.log('Navigate to:', actionUrl);
  }

  // Get all notifications
  async getNotifications(page: number = 1, limit: number = 20): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const response = await apiClient.get<{
        notifications: Notification[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/notifications?page=${page}&limit=${limit}`);

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      if (!notificationId) {
        throw AppError.fromValidationError('notificationId', 'Notification ID is required');
      }

      await apiClient.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.put('/notifications/mark-all-read');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      if (!notificationId) {
        throw AppError.fromValidationError('notificationId', 'Notification ID is required');
      }

      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get<NotificationPreferences>('/notifications/preferences');
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.put<NotificationPreferences>('/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get notification settings
  async getSettings(): Promise<NotificationSettings> {
    try {
      const response = await apiClient.get<NotificationSettings>('/notifications/settings');
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Update notification settings
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await apiClient.put<NotificationSettings>('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Send local notification
  async sendLocalNotification(notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: boolean;
    priority?: 'default' | 'normal' | 'high';
  }): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      throw AppError.fromBusinessError(
        ErrorCode.VALIDATION_ERROR,
        'Failed to send local notification',
        'Please try again'
      );
    }
  }

  // Schedule local notification
  async scheduleLocalNotification(notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    trigger: Notifications.NotificationTriggerInput;
  }): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: notification.trigger,
      });

      return notificationId;
    } catch (error) {
      throw AppError.fromBusinessError(
        ErrorCode.VALIDATION_ERROR,
        'Failed to schedule local notification',
        'Please try again'
      );
    }
  }

  // Cancel local notification
  async cancelLocalNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel local notification:', error);
    }
  }

  // Cancel all local notifications
  async cancelAllLocalNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all local notifications:', error);
    }
  }

  // Get push token
  getPushToken(): string | null {
    return this.pushToken;
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  // Open notification settings
  async openNotificationSettings(): Promise<void> {
    try {
      // Note: openNotificationSettingsAsync is not available in all Expo versions
      // This is a fallback implementation
      console.log('Opening notification settings...');
    } catch (error) {
      console.error('Failed to open notification settings:', error);
    }
  }

  // Test push notification
  async testPushNotification(): Promise<void> {
    try {
      await this.sendLocalNotification({
        title: 'Test Notification',
        body: 'This is a test notification from PacheduConnect',
        data: { type: 'test' },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 