import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { medicationService } from '../services/medicationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

// Export for testing
export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastStreakCheck, setLastStreakCheck] = useState<string | null>(null);

  const refreshUser = async () => {
    // Force refresh the current user from Firebase
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    }
  };

  // Check and update streaks on a new day
  const checkStreaksIfNewDay = async (userId: string) => {
    const today = medicationService.getTodayDateString();
    
    // Only check once per day
    if (lastStreakCheck === today) {
      return;
    }

    try {
      console.log('Checking streaks for new day:', today);
      const result = await medicationService.checkAndUpdateStreaks(userId);
      if (result.success) {
        setLastStreakCheck(today);
        console.log('Streaks updated successfully');
      }
    } catch (error) {
      console.error('Error checking streaks:', error);
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Check streaks when user logs in or app starts with logged in user
      if (firebaseUser) {
        await checkStreaksIfNewDay(firebaseUser.uid);
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
