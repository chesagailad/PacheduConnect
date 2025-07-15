import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  registerForPushNotifications: () => Promise<void>;
  sendLocalNotification: (title: string, body: string) => Promise<void>;
  scheduleNotification: (title: string, body: string, trigger: any) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Failed to get push token for push notification!');
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
      
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const sendLocalNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null, // Send immediately
    });
  };

  const scheduleNotification = async (title: string, body: string, trigger: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger,
    });
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const value: NotificationContextType = {
    registerForPushNotifications,
    sendLocalNotification,
    scheduleNotification,
    cancelAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 