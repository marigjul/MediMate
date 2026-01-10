import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from "../components/button";
import { Card, CardContent, CardHeader } from "../components/card";
import ConfirmationModal from "../components/ConfirmationModal";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import type { ProfileNavigationProp } from "../types/navigation";

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, refreshUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setLoggingOut(true);
    try {
      const result = await authService.logout();
      if (!result.success) {
        alert('Failed to logout. Please try again.');
        setLoggingOut(false);
      }
    } catch (error) {
      alert('An error occurred during logout.');
      setLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Page Header */}
        <Text style={styles.pageTitle}>Your Profile</Text>

        <View style={styles.header}>
          <Text style={styles.name}>{user?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Account Settings</Text>
          </CardHeader>
          <CardContent>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="person-outline" size={24} color="#374151" />
              <Text style={styles.menuText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </CardContent>
        </Card>

        <Button 
          variant="destructive"
          onPress={handleLogoutPress}
          style={styles.logoutButton}
          disabled={loggingOut}
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </View>

      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        destructive
      />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#E0F2FE",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
});
