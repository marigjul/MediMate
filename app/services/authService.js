import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

export const authService = {
  // Register new user
  register: async (email, password, displayName) => {
    try {
      // Firebase automatically checks if email exists and throws error if it does
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userId = userCredential.user.uid;

      // Update profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Create user document in Firestore
      await setDoc(doc(db, "users", userId), {
        name: displayName || "",
        email: email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true, user: userCredential.user };
    } catch (error) {
      // Firebase returns 'auth/email-already-in-use' if email exists
      return { success: false, error: error.message };
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get user profile from Firestore
  getUserProfile: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return { success: true, userData: userDoc.data() };
      }
      return { success: false, error: "User profile not found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update user profile (name)
  updateUserProfile: async (userId, updates) => {
    try {
      const currentUser = auth.currentUser;

      // Update display name in Firebase Auth if provided
      if (updates.displayName) {
        await updateProfile(currentUser, { displayName: updates.displayName });
      }

      // Update Firestore document
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update user email
  updateUserEmail: async (newEmail, currentPassword) => {
    try {
      const currentUser = auth.currentUser;

      // Reauthenticate user before sensitive operation
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update email in Firebase Auth
      await updateEmail(currentUser, newEmail);

      // Update email in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        email: newEmail,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update user password
  updateUserPassword: async (currentPassword, newPassword) => {
    try {
      const currentUser = auth.currentUser;

      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },
};
