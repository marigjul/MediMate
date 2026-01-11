import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PrescriptionsScreen from '../screens/PrescriptionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MedicationConfirmScreen from '../screens/prescriptions/MedicationConfirmScreen';
import MedicationDetailScreen from '../screens/prescriptions/MedicationDetailScreen';
import MedicationScheduleScreen from '../screens/prescriptions/MedicationScheduleScreen';
import MedicationSearchScreen from '../screens/prescriptions/MedicationSearchScreen';
import MedicationViewScreen from '../screens/prescriptions/MedicationViewScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

// Import types
import type {
  AuthStackParamList,
  HomeStackParamList,
  MainTabParamList,
  PrescriptionsStackParamList,
  ProfileStackParamList,
  RootStackParamList,
} from '../types/navigation';

// Create navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const PrescriptionsStack = createNativeStackNavigator<PrescriptionsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Auth Navigator - shown when logged out
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

// Home Stack Navigator - nested screens from Home tab
function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="MedicationView" component={MedicationViewScreen} />
      <HomeStack.Screen name="MedicationSchedule" component={MedicationScheduleScreen} />
    </HomeStack.Navigator>
  );
}

// Prescriptions Stack Navigator - nested screens from Prescriptions tab
function PrescriptionsNavigator() {
  return (
    <PrescriptionsStack.Navigator screenOptions={{ headerShown: false }}>
      <PrescriptionsStack.Screen name="PrescriptionsMain" component={PrescriptionsScreen} />
      <PrescriptionsStack.Screen name="MedicationSearch" component={MedicationSearchScreen} />
      <PrescriptionsStack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
      <PrescriptionsStack.Screen name="MedicationSchedule" component={MedicationScheduleScreen} />
      <PrescriptionsStack.Screen name="MedicationConfirm" component={MedicationConfirmScreen} />
      <PrescriptionsStack.Screen name="MedicationView" component={MedicationViewScreen} />
    </PrescriptionsStack.Navigator>
  );
}

// Profile Stack Navigator - nested screens from Profile tab
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator - shown when logged in
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 80,
          paddingBottom: 15,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={28} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            // Navigate to the tab and reset its stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          },
        })}
      />
      <MainTab.Screen
        name="Prescriptions"
        component={PrescriptionsNavigator}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pill" size={28} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            // Navigate to the tab and reset its stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Prescriptions' }],
            });
          },
        })}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={28} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            // Navigate to the tab and reset its stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Profile' }],
            });
          },
        })}
      />
    </MainTab.Navigator>
  );
}

// Root Navigator - switches between Auth and Main based on auth state
export function RootNavigator() {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" testID="activity-indicator" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is logged in - show main app
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        // User is logged out - show auth screens
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
  },
});
