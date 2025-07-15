import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';

// Import your screens here
// import { LoginScreen } from '../screens/LoginScreen';
// import { RegisterScreen } from '../screens/RegisterScreen';
// import { DashboardScreen } from '../screens/DashboardScreen';
// import { SendMoneyScreen } from '../screens/SendMoneyScreen';
// import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isAuthenticated ? (
        // Authenticated stack
        <>
          {/* <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} /> */}
          <Stack.Screen name="Dashboard" component={() => null} />
        </>
      ) : (
        // Unauthenticated stack
        <>
          {/* <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} /> */}
          <Stack.Screen name="Login" component={() => null} />
        </>
      )}
    </Stack.Navigator>
  );
}; 