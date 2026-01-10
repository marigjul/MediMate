import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import { authService } from '../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const getErrorMessage = (error: string) => {
    // Convert Firebase error codes to user-friendly messages
    if (error.includes('auth/invalid-email')) {
      return 'Please enter a valid email address';
    }
    if (error.includes('auth/user-disabled')) {
      return 'This account has been disabled';
    }
    if (error.includes('auth/user-not-found')) {
      return 'No account found with this email';
    }
    if (error.includes('auth/wrong-password')) {
      return 'Incorrect password';
    }
    if (error.includes('auth/invalid-credential')) {
      return 'Invalid email or password';
    }
    if (error.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists';
    }
    if (error.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters';
    }
    if (error.includes('auth/too-many-requests')) {
      return 'Too many failed attempts. Please try again later';
    }
    return error;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (!result.success) {
        const errorMessage = getErrorMessage(result.error || '');
        setError(errorMessage);
        console.error('Login failed:', result.error);
      }
      // No need to navigate - AuthContext will handle it automatically
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await authService.register(email, password, name);
      if (!result.success) {
        const errorMessage = getErrorMessage(result.error || '');
        setError(errorMessage);
        console.error('Sign up failed:', result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>MediMate</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              {isSignUp ? 'Sign Up' : 'Login'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isSignUp ? 'password-new' : 'password'}
              editable={!loading}
            />

            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
              />
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={isSignUp ? handleSignUp : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Create Account' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={toggleMode}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                {isSignUp
                  ? 'Already have an account? Login'
                  : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  container: {
    flex: 1,
    backgroundColor: '#E0F2FE',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
  },
  card: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // @ts-ignore - outlineColor is web-only
    outlineColor: '#2563EB',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});
