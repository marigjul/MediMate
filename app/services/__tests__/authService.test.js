import { authService } from "../authService";
import { auth, db } from "../../config/firebase";
import {
  getDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

// Mock users for testing
const mockUser = {
  email: "test@medimate.com",
  password: "TestPassword123!",
  displayName: "Test User",
};

describe("AuthService: MediMate Authentication", () => {
  let testUserId;

  // Cleanup after each test
  afterEach(async () => {
    try {
      if (testUserId) {
        await authService.logout();
      }
    } catch (error) {
      console.log("Cleanup error:", error);
    }
  });

  describe("User Registration", () => {
    test("TC-01: Should successfully register new user", async () => {
      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        mockUser.displayName
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);

      testUserId = result.user.uid;
    });

    test("TC-02: Should create user document in Firestore on registration", async () => {
      const result = await authService.register(
        "newuser@medimate.com",
        "Password123!",
        "New User"
      );

      expect(result.success).toBe(true);
      testUserId = result.user.uid;

      // Verify Firestore document exists
      const userDoc = await getDoc(doc(db, "users", testUserId));
      expect(userDoc.exists()).toBe(true);

      const userData = userDoc.data();
      expect(userData.email).toBe("newuser@medimate.com");
      expect(userData.name).toBe("New User");
      expect(userData.createdAt).toBeDefined();
    });

    test("TC-03: Should fail registration with existing email", async () => {
      // Register first user
      await authService.register(
        "duplicate@medimate.com",
        "Password123!",
        "First User"
      );

      // Try to register with same email
      const result = await authService.register(
        "duplicate@medimate.com",
        "Password456!",
        "Second User"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("email-already-in-use");
    });

    test("TC-04: Should fail registration with weak password", async () => {
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
    beforeEach(async () => {
      // Create test user before login tests
      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        mockUser.displayName
      );
      testUserId = result.user.uid;
      await authService.logout();
    });

    test("TC-05: Should successfully login with correct credentials", async () => {
      const result = await authService.login(mockUser.email, mockUser.password);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
    });

    test("TC-06: Should fail login with incorrect password", async () => {
      const result = await authService.login(
        mockUser.email,
        "WrongPassword123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("TC-07: Should fail login with non-existent email", async () => {
      const result = await authService.login(
        "nonexistent@medimate.com",
        "Password123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("User Profile Management", () => {
    beforeEach(async () => {
      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        mockUser.displayName
      );
      testUserId = result.user.uid;
    });

    test("TC-08: Should retrieve user profile from Firestore", async () => {
      const result = await authService.getUserProfile(testUserId);

      expect(result.success).toBe(true);
      expect(result.userData).toBeDefined();
      expect(result.userData.email).toBe(mockUser.email);
      expect(result.userData.name).toBe(mockUser.displayName);
    });

    test("TC-09: Should update user profile (display name)", async () => {
      const newName = "Updated Name";

      const updateResult = await authService.updateUserProfile(testUserId, {
        displayName: newName,
        name: newName,
      });

      expect(updateResult.success).toBe(true);

      // Verify update in Firestore
      const profileResult = await authService.getUserProfile(testUserId);
      expect(profileResult.userData.name).toBe(newName);
      expect(profileResult.userData.updatedAt).toBeDefined();
    });

    test("TC-10: Should fail to retrieve non-existent profile", async () => {
      const result = await authService.getUserProfile("non-existent-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("User profile not found");
    });
  });

  describe("Password Management", () => {
    beforeEach(async () => {
      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        mockUser.displayName
      );
      testUserId = result.user.uid;
    });

    test("TC-11: Should successfully update password", async () => {
      const newPassword = "NewPassword123!";

      const result = await authService.updateUserPassword(
        mockUser.password,
        newPassword
      );

      expect(result.success).toBe(true);

      // Verify can login with new password
      await authService.logout();
      const loginResult = await authService.login(mockUser.email, newPassword);
      expect(loginResult.success).toBe(true);
    });

    test("TC-12: Should fail password update with wrong current password", async () => {
      const result = await authService.updateUserPassword(
        "WrongPassword123!",
        "NewPassword123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Email Management", () => {
    beforeEach(async () => {
      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        mockUser.displayName
      );
      testUserId = result.user.uid;
    });

    test("TC-13: Should successfully update email", async () => {
      const newEmail = "newemail@medimate.com";

      const result = await authService.updateUserEmail(
        newEmail,
        mockUser.password
      );

      expect(result.success).toBe(true);

      // Verify email updated in Firestore
      const profileResult = await authService.getUserProfile(testUserId);
      expect(profileResult.userData.email).toBe(newEmail);
    });

    test("TC-14: Should fail email update with wrong password", async () => {
      const result = await authService.updateUserEmail(
        "newemail@medimate.com",
        "WrongPassword123!"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("User Logout", () => {
    beforeEach(async () => {
      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        mockUser.displayName
      );
      testUserId = result.user.uid;
    });

    test("TC-15: Should successfully logout user", async () => {
      const result = await authService.logout();

      expect(result.success).toBe(true);

      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });

  describe("Auth State Management", () => {
    test("TC-16: Should return current user when logged in", async () => {
      const result = await authService.register(
        mockUser.email,
        mockUser.password,
        mockUser.displayName
      );
      testUserId = result.user.uid;

      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser.email).toBe(mockUser.email);
    });

    test("TC-17: Should listen to auth state changes", (done) => {
      const unsubscribe = authService.onAuthStateChange((user) => {
        if (user) {
          expect(user.email).toBe(mockUser.email);
          unsubscribe();
          done();
        }
      });

      authService
        .register(mockUser.email, mockUser.password, mockUser.displayName)
        .then((result) => {
          testUserId = result.user.uid;
        });
    });
  });
});
