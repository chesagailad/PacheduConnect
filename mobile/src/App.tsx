import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BiometricProvider } from './contexts/BiometricContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { RootNavigator } from './navigation/RootNavigator';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { SecurityProvider } from './contexts/SecurityContext';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <SafeAreaProvider>
              <NetworkProvider>
                <OfflineProvider>
                  <AuthProvider>
                    <BiometricProvider>
                      <NotificationProvider>
                        <AnalyticsProvider>
                          <SecurityProvider>
                            <ToastProvider>
                              <NavigationContainer>
                                <StatusBar style="auto" />
                                <RootNavigator />
                              </NavigationContainer>
                            </ToastProvider>
                          </SecurityProvider>
                        </AnalyticsProvider>
                      </NotificationProvider>
                    </BiometricProvider>
                  </AuthProvider>
                </OfflineProvider>
              </NetworkProvider>
            </SafeAreaProvider>
          </PaperProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
} 