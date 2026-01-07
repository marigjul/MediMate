import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/button';
import { Card, CardContent } from '../../components/card';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import type { ProfileNavigationProp } from '../../types/navigation';

export default function EditProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (!email.trim()) {
      setError('Email cannot be empty');
      return;
    }

    // Check if email or password is being changed
    const isChangingEmail = email !== user?.email;
    const isChangingPassword = newPassword.trim() !== '';

    // If changing email or password, current password is required
    if ((isChangingEmail || isChangingPassword) && !currentPassword) {
      setError('Current password is required to change email or password');
      return;
    }

    // If changing password, validate new password
    if (isChangingPassword) {
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      let hasError = false;

      // Update display name if changed
      if (name !== user?.displayName) {
        const result = await authService.updateUserProfile(user!.uid, {
          name: name,
          displayName: name,
        });
        
        if (!result.success) {
          setError(result.error || 'Failed to update name');
          hasError = true;
        }
      }

      // Update email if changed
      if (isChangingEmail && !hasError) {
        const result = await authService.updateUserEmail(email, currentPassword);
        
        if (!result.success) {
          setError(result.error || 'Failed to update email');
          hasError = true;
        }
      }

      // Update password if new password provided
      if (isChangingPassword && !hasError) {
        const result = await authService.updateUserPassword(currentPassword, newPassword);
        
        if (!result.success) {
          setError(result.error || 'Failed to update password');
          hasError = true;
        }
      }

      if (!hasError) {
        setSuccess('Profile updated successfully!');
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Refresh user data in context
        await refreshUser();
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <Card>
          <CardContent>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              editable={!loading}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Text style={styles.sectionDescription}>
              Leave blank if you don't want to change your password
            </Text>

            <Text style={styles.label}>Current Password *</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min 6 characters)"
              secureTextEntry
              autoComplete="password-new"
              editable={!loading}
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
              autoComplete="password-new"
              editable={!loading}
            />

            <Text style={styles.helperText}>
              * Required when changing email or password
            </Text>
          </CardContent>
        </Card>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        <Button 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            'Save Changes'
          )}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});
