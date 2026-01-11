import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './app/contexts/AuthContext';
import { MedicationNotificationProvider } from './app/contexts/MedicationNotificationContext';
import { RootNavigator } from './app/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MedicationNotificationProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </MedicationNotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
