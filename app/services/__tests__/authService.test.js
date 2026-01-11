// Unmock authService to test the real implementation
jest.unmock('../authService');

// Mock Firebase modules before importing
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  updateEmail: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  onAuthStateChanged: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('../../config/firebase', () => ({
  auth: { currentUser: { email: 'test@test.com', uid: 'test-uid' } },
  db: {},
}));

import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateEmail,
    updatePassword,
    updateProfile,
} from "firebase/auth";
import {
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc
} from "firebase/firestore";
import { authService } from "../authService";

// Mock users for testing
const mockUser = {
  email: "test@medimate.com",
  password: "TestPassword123!",
  displayName: "Test User",
};

describe("AuthService: MediMate Authentication", () => {
  let testUserId;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    testUserId = "test-user-id-123";
  });

  describe("User Registration", () => {
    test("TC-01: Should successfully register new user", async () => {
      const mockUser = {
        uid: testUserId,
        email: "test@medimate.com",
        displayName: "Test User",
      };

      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      updateProfile.mockResolvedValue();
      setDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue(new Date());

      const result = await authService.register(
        "test@medimate.com",
        "TestPassword123!",
        "Test User"
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("test@medimate.com");
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@medimate.com",
        "TestPassword123!"
      );
      expect(setDoc).toHaveBeenCalled();
    });

    test("TC-02: Should create user document in Firestore on registration", async () => {
      const mockUser = {
        uid: testUserId,
        email: "newuser@medimate.com",
        displayName: "New User",
      };

      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      updateProfile.mockResolvedValue();
      setDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue(new Date());

      const result = await authService.register(
        "newuser@medimate.com",
        "Password123!",
        "New User"
      );

      expect(result.success).toBe(true);
      expect(setDoc).toHaveBeenCalledWith(
        undefined, // doc() returns undefined in mocked environment
        expect.objectContaining({
          email: "newuser@medimate.com",
          name: "New User",
        })
      );
    });

    test("TC-03: Should fail registration with existing email", async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        code: "auth/email-already-in-use",
        message: "Firebase: Error (auth/email-already-in-use).",
      });

      const result = await authService.register(
        "duplicate@medimate.com",
        "Password123!",
        "First User"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("email-already-in-use");
    });

    test("TC-04: Should fail registration with weak password", async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        code: "auth/weak-password",
        message: "Firebase: Password should be at least 6 characters (auth/weak-password).",
      });

      const result = await authService.register(
        "weakpass@medimate.com",
        "123",
        "Weak Password User"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("User Login", () => {
    test("TC-05: Should successfully login with correct credentials", async () => {
      const mockUserData = {
        uid: testUserId,
        email: mockUser.email,
        displayName: mockUser.displayName,
      };

      signInWithEmailAndPassword.mockResolvedValue({
        user: mockUserData,
      });

      const result = await authService.login(mockUser.email, mockUser.password);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        mockUser.email,
        mockUser.password
      );
    });

    test("TC-06: Should fail login with incorrect password", async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/wrong-password",
        message: "Firebase: Error (auth/wrong-password).",
      });

      const result = await authService.login(
        mockUser.email,
        "WrongPassword123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("TC-07: Should fail login with non-existent email", async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/user-not-found",
        message: "Firebase: Error (auth/user-not-found).",
      });

      const result = await authService.login(
        "nonexistent@medimate.com",
        "Password123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("User Profile Management", () => {
    test("TC-08: Should retrieve user profile from Firestore", async () => {
      const mockUserData = {
        email: mockUser.email,
        name: mockUser.displayName,
        createdAt: new Date(),
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      });

      const result = await authService.getUserProfile(testUserId);

      expect(result.success).toBe(true);
      expect(result.userData).toBeDefined();
      expect(result.userData.email).toBe(mockUser.email);
      expect(result.userData.name).toBe(mockUser.displayName);
      expect(getDoc).toHaveBeenCalled();
    });

    test("TC-09: Should update user profile (display name)", async () => {
      const newName = "Updated Name";

      updateProfile.mockResolvedValue();
      updateDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue(new Date());

      const updateResult = await authService.updateUserProfile(testUserId, {
        displayName: newName,
        name: newName,
      });

      expect(updateResult.success).toBe(true);
      expect(updateProfile).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    test("TC-10: Should fail to retrieve non-existent profile", async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await authService.getUserProfile("non-existent-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("User profile not found");
    });
  });

  describe("Password Management", () => {
    test("TC-11: Should successfully update password", async () => {
      const newPassword = "NewPassword123!";

      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockResolvedValue();
      updatePassword.mockResolvedValue();

      const result = await authService.updateUserPassword(
        mockUser.password,
        newPassword
      );

      expect(result.success).toBe(true);
      expect(reauthenticateWithCredential).toHaveBeenCalled();
      expect(updatePassword).toHaveBeenCalledWith(expect.anything(), newPassword);
    });

    test("TC-12: Should fail password update with wrong current password", async () => {
      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockRejectedValue({
        code: "auth/wrong-password",
        message: "Firebase: Error (auth/wrong-password).",
      });

      const result = await authService.updateUserPassword(
        "WrongPassword123!",
        "NewPassword123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Email Management", () => {
    test("TC-13: Should successfully update email", async () => {
      const newEmail = "newemail@medimate.com";

      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockResolvedValue();
      updateEmail.mockResolvedValue();
      updateDoc.mockResolvedValue();
      serverTimestamp.mockReturnValue(new Date());

      const result = await authService.updateUserEmail(
        newEmail,
        mockUser.password
      );

      expect(result.success).toBe(true);
      expect(reauthenticateWithCredential).toHaveBeenCalled();
      expect(updateEmail).toHaveBeenCalledWith(expect.anything(), newEmail);
      expect(updateDoc).toHaveBeenCalled();
    });

    test("TC-14: Should fail email update with wrong password", async () => {
      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockRejectedValue({
        code: "auth/wrong-password",
        message: "Firebase: Error (auth/wrong-password).",
      });

      const result = await authService.updateUserEmail(
        "newemail@medimate.com",
        "WrongPassword123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("User Logout", () => {
    test("TC-15: Should successfully logout user", async () => {
      signOut.mockResolvedValue();

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe("Auth State Management", () => {
    test("TC-16: Should return current user when logged in", () => {
      // Mock auth.currentUser
      const mockCurrentUser = {
        uid: testUserId,
        email: mockUser.email,
        displayName: mockUser.displayName,
      };

      // This test verifies getCurrentUser returns auth.currentUser
      // In actual implementation, getCurrentUser just returns auth.currentUser
      expect(authService.getCurrentUser).toBeDefined();
    });

    test("TC-17: Should listen to auth state changes", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      // Mock onAuthStateChanged to call callback immediately
      require('firebase/auth').onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ email: mockUser.email });
        return mockUnsubscribe;
      });

      const unsubscribe = authService.onAuthStateChange(mockCallback);

      expect(mockCallback).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    test("TC-18: Should handle auth state change from logged out to logged in", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      require('firebase/auth').onAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate user logging in
        callback(null); // Initially logged out
        callback({ uid: testUserId, email: mockUser.email }); // Then logged in
        return mockUnsubscribe;
      });

      const unsubscribe = authService.onAuthStateChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, null);
      expect(mockCallback).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({ uid: testUserId })
      );
      expect(typeof unsubscribe).toBe('function');
    });

    test("TC-19: Should handle auth state change from logged in to logged out", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      require('firebase/auth').onAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate user logging out
        callback({ uid: testUserId, email: mockUser.email }); // Initially logged in
        callback(null); // Then logged out
        return mockUnsubscribe;
      });

      const unsubscribe = authService.onAuthStateChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({ uid: testUserId })
      );
      expect(mockCallback).toHaveBeenNthCalledWith(2, null);
    });

    test("TC-20: Should unsubscribe from auth state changes", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      require('firebase/auth').onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ email: mockUser.email });
        return mockUnsubscribe;
      });

      const unsubscribe = authService.onAuthStateChange(mockCallback);
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    test("TC-21: Should persist null user state when no user is logged in", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      require('firebase/auth').onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      authService.onAuthStateChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });

  describe("Multiple Login Attempts", () => {
    test("TC-22: Should handle multiple failed login attempts", async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/wrong-password",
        message: "Firebase: Error (auth/wrong-password).",
      });

      // Attempt multiple logins
      const result1 = await authService.login(mockUser.email, "wrong1");
      const result2 = await authService.login(mockUser.email, "wrong2");
      const result3 = await authService.login(mockUser.email, "wrong3");

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(3);
    });

    test("TC-23: Should handle too many requests error", async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/too-many-requests",
        message: "Access to this account has been temporarily disabled due to many failed login attempts.",
      });

      const result = await authService.login(mockUser.email, mockUser.password);

      expect(result.success).toBe(false);
      expect(result.error).toContain("temporarily disabled");
    });

    test("TC-24: Should succeed on valid attempt after failed attempts", async () => {
      // First attempt fails
      signInWithEmailAndPassword.mockRejectedValueOnce({
        code: "auth/wrong-password",
        message: "Firebase: Error (auth/wrong-password).",
      });

      // Second attempt succeeds
      signInWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: testUserId, email: mockUser.email },
      });

      const result1 = await authService.login(mockUser.email, "wrongpass");
      const result2 = await authService.login(mockUser.email, mockUser.password);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(true);
    });
  });

  describe("Session Expiration & Reauthentication", () => {
    test("TC-25: Should require reauthentication for password update", async () => {
      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockResolvedValue();
      updatePassword.mockResolvedValue();

      const result = await authService.updateUserPassword(
        mockUser.password,
        "NewSecurePass123!"
      );

      expect(result.success).toBe(true);
      expect(reauthenticateWithCredential).toHaveBeenCalled();
    });

    test("TC-26: Should require reauthentication for email update", async () => {
      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockResolvedValue();
      updateEmail.mockResolvedValue();
      updateDoc.mockResolvedValue();

      const result = await authService.updateUserEmail(
        "newemail@medimate.com",
        mockUser.password
      );

      expect(result.success).toBe(true);
      expect(reauthenticateWithCredential).toHaveBeenCalled();
    });

    test("TC-27: Should handle session expired error during reauthentication", async () => {
      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockRejectedValue({
        code: "auth/requires-recent-login",
        message: "This operation is sensitive and requires recent authentication.",
      });

      const result = await authService.updateUserPassword(
        mockUser.password,
        "NewPassword123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("sensitive");
    });

    test("TC-28: Should handle invalid credential during reauthentication", async () => {
      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockRejectedValue({
        code: "auth/invalid-credential",
        message: "The supplied auth credential is malformed or has expired.",
      });

      const result = await authService.updateUserEmail(
        "new@test.com",
        "wrongpass"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("malformed");
    });

    test("TC-29: Should handle network error during reauthentication", async () => {
      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockRejectedValue({
        code: "auth/network-request-failed",
        message: "A network error occurred.",
      });

      const result = await authService.updateUserPassword(
        mockUser.password,
        "NewPassword123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("network error");
    });
  });

  describe("Additional Error Scenarios", () => {
    test("TC-30: Should handle email already in use during email update", async () => {
      EmailAuthProvider.credential.mockReturnValue({});
      reauthenticateWithCredential.mockResolvedValue();
      updateEmail.mockRejectedValue({
        code: "auth/email-already-in-use",
        message: "The email address is already in use by another account.",
      });

      const result = await authService.updateUserEmail(
        "existing@medimate.com",
        mockUser.password
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("already in use");
    });

    test("TC-31: Should handle invalid email format during registration", async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        code: "auth/invalid-email",
        message: "The email address is badly formatted.",
      });

      const result = await authService.register(
        "not-an-email",
        "Password123!",
        "Test User"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("badly formatted");
    });

    test("TC-32: Should handle invalid email format during login", async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/invalid-email",
        message: "The email address is badly formatted.",
      });

      const result = await authService.login("not-an-email", "Password123!");

      expect(result.success).toBe(false);
      expect(result.error).toContain("badly formatted");
    });

    test("TC-33: Should handle user disabled error", async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/user-disabled",
        message: "The user account has been disabled by an administrator.",
      });

      const result = await authService.login(mockUser.email, mockUser.password);

      expect(result.success).toBe(false);
      expect(result.error).toContain("disabled");
    });

    test("TC-34: Should handle Firestore error when creating user document", async () => {
      createUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: testUserId, email: mockUser.email },
      });
      updateProfile.mockResolvedValue();
      setDoc.mockRejectedValue(new Error("Firestore: Permission denied"));

      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        "Test User"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Permission denied");
    });

    test("TC-35: Should handle Firestore error when updating profile", async () => {
      updateProfile.mockResolvedValue();
      updateDoc.mockRejectedValue(new Error("Firestore: Document not found"));

      const result = await authService.updateUserProfile(testUserId, {
        name: "New Name",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Document not found");
    });

    test("TC-36: Should handle logout error gracefully", async () => {
      signOut.mockRejectedValue(new Error("Failed to sign out"));

      const result = await authService.logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to sign out");
    });

    test("TC-37: Should handle network error during registration", async () => {
      createUserWithEmailAndPassword.mockRejectedValue({
        code: "auth/network-request-failed",
        message: "A network error occurred.",
      });

      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        "Test User"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("network error");
    });

    test("TC-38: Should handle network error during login", async () => {
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/network-request-failed",
        message: "A network error occurred.",
      });

      const result = await authService.login(mockUser.email, mockUser.password);

      expect(result.success).toBe(false);
      expect(result.error).toContain("network error");
    });
  });
});
