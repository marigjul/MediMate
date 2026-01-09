import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Auth Stack - screens available when logged out
export type AuthStackParamList = {
  Login: undefined;
};

// Main Tab Navigator - bottom tabs when logged in
export type MainTabParamList = {
  Home: undefined;
  Prescriptions: undefined;
  Profile: undefined;
};

// Home Stack - nested screens from Home tab
export type HomeStackParamList = {
  HomeMain: undefined;
  MedicationView: {
    medication: any;
  };
  MedicationSchedule: {
    medicationName: string;
    brandName: string;
    genericName?: string;
    fdaData?: any;
    existingMedication?: any;
  };
  // Add more home-related screens here
  // Example: MedicationDetails: { medicationId: string };
};

// Prescriptions Stack - nested screens from Prescriptions tab
export type PrescriptionsStackParamList = {
  PrescriptionsMain: undefined;
  MedicationSearch: undefined;
  MedicationDetail: {
    medicationName: string;
    brandName: string;
    genericName?: string;
  };
  MedicationSchedule: {
    medicationName: string;
    brandName: string;
    genericName?: string;
    fdaData?: any;
    existingMedication?: any;
  };
  MedicationConfirm: {
    medicationName: string;
    brandName: string;
    genericName?: string;
    fdaData: any;
    scheduleData: {
      dosage: string;
      schedule: {
        type?: 'interval' | 'specific_times';
        startTime?: string;
        dosesPerDay?: number;
        hoursBetweenDoses?: number;
        times: string[];
        frequency: string;
      };
      duration: {
        type: 'permanent' | 'limited';
        days?: number;
      };
      refillReminder?: number;
    };
    existingMedicationId?: string;
  };
  MedicationView: {
    medication: any;
  };
};

// Profile Stack - nested screens from Profile tab
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  // Add more profile-related screens here
};

// Root Stack - top level navigator that switches between auth and main app
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Navigation prop types for each screen
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type HomeNavigationProp = NativeStackNavigationProp<HomeStackParamList>;
export type PrescriptionsNavigationProp = NativeStackNavigationProp<PrescriptionsStackParamList>;
export type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Daily medication log types
export type MedicationStatus = 'pending' | 'taken' | 'missed';

export interface DailyMedicationLog {
  medicationId: string;
  scheduledTime: string;
  status: MedicationStatus;
  takenAt?: string; // ISO timestamp of when they actually took it
}

export interface DailyLog {
  userId: string;
  date: string; // YYYY-MM-DD format
  medications: DailyMedicationLog[];
  createdAt?: string;
  updatedAt?: string;
}
