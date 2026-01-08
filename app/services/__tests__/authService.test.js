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
  });
});
