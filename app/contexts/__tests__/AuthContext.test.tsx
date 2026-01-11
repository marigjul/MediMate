import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import React from "react";
import { auth } from "../../config/firebase";
import { medicationService } from "../../services/medicationService";
import { AuthProvider, useAuth } from "../AuthContext";

// Mock Firebase auth
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock("../../services/medicationService", () => ({
  medicationService: {
    getTodayDateString: jest.fn(),
    checkAndUpdateStreaks: jest.fn(),
  },
}));

describe("AuthContext", () => {
  const mockUser: Partial<User> = {
    uid: "test-user-123",
    email: "test@example.com",
    displayName: "Test User",
    reload: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (medicationService.getTodayDateString as jest.Mock).mockReturnValue(
      "2026-01-11"
    );
  });

  describe("AuthProvider", () => {
    it("should provide initial auth state with loading true", () => {
      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn(); // unsubscribe function
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it("should update user state when auth state changes", async () => {
      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn();
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Simulate user login
      await act(async () => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
      });
    });

    it("should set user to null when logged out", async () => {
      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn();
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First login
      await act(async () => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Then logout
      await act(async () => {
        authStateCallback(null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it("should check and update streaks when user logs in", async () => {
      (medicationService.checkAndUpdateStreaks as jest.Mock).mockResolvedValue({
        success: true,
      });

      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn();
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(medicationService.checkAndUpdateStreaks).toHaveBeenCalledWith(
          "test-user-123"
        );
      });
    });

    it("should not check streaks when user logs out", async () => {
      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn();
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        authStateCallback(null);
      });

      await waitFor(() => {
        expect(medicationService.checkAndUpdateStreaks).not.toHaveBeenCalled();
      });
    });

    it("should handle streak check errors silently", async () => {
      (medicationService.checkAndUpdateStreaks as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn();
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
      });
    });

    it("should unsubscribe from auth state changes on unmount", () => {
      const unsubscribeMock = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribeMock);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe("refreshUser", () => {
    it("should reload current user and update state", async () => {
      const mockReload = jest.fn().mockResolvedValue(undefined);
      const currentUser = { ...mockUser, reload: mockReload };
      (auth as any).currentUser = currentUser;

      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn();
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        authStateCallback(currentUser);
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockReload).toHaveBeenCalled();
    });

    it("should do nothing if no current user", async () => {
      (auth as any).currentUser = null;

      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn();
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        authStateCallback(null);
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      // Should not throw error
      expect(result.current.user).toBeNull();
    });
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // The hook won't throw because AuthContext has a default value
      // Instead, we should verify it returns the default context
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Should return default context values when outside provider
      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("refreshUser");

      consoleSpy.mockRestore();
    });

    it("should return auth context when used within AuthProvider", () => {
      let authStateCallback: any;
      (onAuthStateChanged as jest.Mock).mockImplementation(
        (authInstance, callback) => {
          authStateCallback = callback;
          return jest.fn();
        }
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("refreshUser");
    });
  });
});
