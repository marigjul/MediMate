import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { AuthProvider } from './app/contexts/AuthContext';
import { RootNavigator } from './app/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
