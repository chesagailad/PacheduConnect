import React, { createContext, useContext, ReactNode } from 'react';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

interface AnalyticsContextType {
  trackEvent: (event: AnalyticsEvent) => void;
  trackScreen: (screenName: string) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  setUserProperties: (properties: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const trackEvent = (event: AnalyticsEvent) => {
    // In a real app, this would send data to analytics services like Firebase, Mixpanel, etc.
    console.log('Analytics Event:', event);
  };

  const trackScreen = (screenName: string) => {
    console.log('Screen View:', screenName);
  };

  const trackError = (error: Error, context?: Record<string, any>) => {
    console.error('Analytics Error:', error, context);
  };

  const setUserProperties = (properties: Record<string, any>) => {
    console.log('User Properties:', properties);
  };

  const value: AnalyticsContextType = {
    trackEvent,
    trackScreen,
    trackError,
    setUserProperties,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}; 