import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";
import { medicationService } from "../../services/medicationService";
import { notificationService } from "../../services/notificationService";
import { AuthContext } from "../AuthContext";
import {
  MedicationNotificationProvider,
  useMedicationNotification,
} from "../MedicationNotificationContext";

// Mock services
jest.mock("../../services/medicationService", () => ({
  medicationService: {
    subscribeToMedications: jest.fn(),
  },
}));

jest.mock("../../services/notificationService", () => ({
  notificationService: {
    requestPermissions: jest.fn(),
    cancelAllNotifications: jest.fn(),
    scheduleGroupedNotification: jest.fn(),
    addNotificationResponseListener: jest.fn(),
    addNotificationReceivedListener: jest.fn(),
  },
}));

describe("MedicationNotificationContext", () => {
  const mockUser = {
    uid: "test-user-123",
    email: "test@example.com",
    displayName: "Test User",
  };

  const mockAuthContextValue = {
    user: mockUser,
    loading: false,
    refreshUser: jest.fn(),
  };

  const mockMedications = [
    {
      id: "med-1",
      medicationName: "Aspirin",
      dosage: "100mg",
      isActive: true,
      schedule: {
        times: ["08:00", "20:00"],
        dosage: "100mg",
      },
      fdaData: {
        brandName: "Bayer Aspirin",
      },
    },
    {
      id: "med-2",
      medicationName: "Vitamin D",
      dosage: "1000 IU",
      isActive: true,
      schedule: {
        times: ["08:00"],
        dosage: "1000 IU",
      },
      fdaData: {
        brandName: "Nature Made",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService.requestPermissions as jest.Mock).mockResolvedValue({
      success: true,
    });
    (notificationService.cancelAllNotifications as jest.Mock).mockResolvedValue(
      undefined
    );
    (
      notificationService.scheduleGroupedNotification as jest.Mock
    ).mockResolvedValue({
      success: true,
      notificationId: "notification-123",
    });
    (
      notificationService.addNotificationResponseListener as jest.Mock
    ).mockReturnValue({
      remove: jest.fn(),
    });
    (
      notificationService.addNotificationReceivedListener as jest.Mock
    ).mockReturnValue({
      remove: jest.fn(),
    });
  });

  const createWrapper = (authContextValue = mockAuthContextValue) => {
    return ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={authContextValue as any}>
        <MedicationNotificationProvider>
          {children}
        </MedicationNotificationProvider>
      </AuthContext.Provider>
    );
  };

  describe("MedicationNotificationProvider", () => {
    it("should request permissions on mount", async () => {
      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await waitFor(() => {
        expect(notificationService.requestPermissions).toHaveBeenCalled();
      });
    });

    it("should set permissionsGranted to true when permissions are granted", async () => {
      (notificationService.requestPermissions as jest.Mock).mockResolvedValue({
        success: true,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMedicationNotification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.permissionsGranted).toBe(true);
      });
    });

    it("should set permissionsGranted to false when permissions are denied", async () => {
      (notificationService.requestPermissions as jest.Mock).mockResolvedValue({
        success: false,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMedicationNotification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.permissionsGranted).toBe(false);
      });
    });

    it("should subscribe to medications when user is logged in", async () => {
      const unsubscribeMock = jest.fn();
      (medicationService.subscribeToMedications as jest.Mock).mockReturnValue(
        unsubscribeMock
      );

      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await waitFor(() => {
        expect(medicationService.subscribeToMedications).toHaveBeenCalledWith(
          "test-user-123",
          expect.any(Function)
        );
      });
    });

    it("should not subscribe to medications when user is not logged in", async () => {
      const noUserAuthContext: any = {
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      };

      const wrapper = createWrapper(noUserAuthContext);
      renderHook(() => useMedicationNotification(), { wrapper });

      await waitFor(() => {
        expect(medicationService.subscribeToMedications).not.toHaveBeenCalled();
      });
    });

    it("should unsubscribe from medications on unmount", async () => {
      const unsubscribeMock = jest.fn();
      (medicationService.subscribeToMedications as jest.Mock).mockReturnValue(
        unsubscribeMock
      );

      const wrapper = createWrapper();
      const { unmount } = renderHook(() => useMedicationNotification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(medicationService.subscribeToMedications).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it("should filter out inactive medications", async () => {
      let medicationCallback: any;
      (
        medicationService.subscribeToMedications as jest.Mock
      ).mockImplementation((userId, callback) => {
        medicationCallback = callback;
        return jest.fn();
      });

      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      const medicationsWithInactive = [
        ...mockMedications,
        {
          id: "med-3",
          medicationName: "Inactive Med",
          isActive: false,
          schedule: { times: ["12:00"] },
        },
      ];

      await act(async () => {
        medicationCallback(medicationsWithInactive);
      });

      // Wait for state update and notification scheduling
      await waitFor(() => {
        expect(
          notificationService.scheduleGroupedNotification
        ).toHaveBeenCalled();
      });

      // Should only schedule for active medications (2 medications with 2 unique times: 08:00, 20:00)
      expect(
        notificationService.scheduleGroupedNotification
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe("Notification Scheduling", () => {
    it("should cancel all notifications before scheduling new ones", async () => {
      let medicationCallback: any;
      (
        medicationService.subscribeToMedications as jest.Mock
      ).mockImplementation((userId, callback) => {
        medicationCallback = callback;
        return jest.fn();
      });

      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await act(async () => {
        medicationCallback(mockMedications);
      });

      await waitFor(() => {
        expect(notificationService.cancelAllNotifications).toHaveBeenCalled();
      });
    });

    it("should schedule grouped notifications for medications at the same time", async () => {
      let medicationCallback: any;
      (
        medicationService.subscribeToMedications as jest.Mock
      ).mockImplementation((userId, callback) => {
        medicationCallback = callback;
        return jest.fn();
      });

      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await act(async () => {
        medicationCallback(mockMedications);
      });

      await waitFor(() => {
        // Should schedule for 08:00 (both medications) and 20:00 (only Aspirin)
        expect(
          notificationService.scheduleGroupedNotification
        ).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: "med-1",
              medicationName: "Aspirin",
            }),
            expect.objectContaining({
              id: "med-2",
              medicationName: "Vitamin D",
            }),
          ]),
          "08:00"
        );

        expect(
          notificationService.scheduleGroupedNotification
        ).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: "med-1",
              medicationName: "Aspirin",
            }),
          ]),
          "20:00"
        );
      });
    });

    it("should not schedule notifications when permissions are not granted", async () => {
      (notificationService.requestPermissions as jest.Mock).mockResolvedValue({
        success: false,
      });

      let medicationCallback: any;
      (
        medicationService.subscribeToMedications as jest.Mock
      ).mockImplementation((userId, callback) => {
        medicationCallback = callback;
        return jest.fn();
      });

      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await act(async () => {
        medicationCallback(mockMedications);
      });

      // Wait a bit to ensure no scheduling happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(
        notificationService.scheduleGroupedNotification
      ).not.toHaveBeenCalled();
    });

    it("should not schedule notifications when no user is logged in", async () => {
      const noUserAuthContext: any = {
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      };

      const wrapper = createWrapper(noUserAuthContext);
      renderHook(() => useMedicationNotification(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(
        notificationService.scheduleGroupedNotification
      ).not.toHaveBeenCalled();
    });

    it("should not schedule notifications when medications array is empty", async () => {
      let medicationCallback: any;
      (
        medicationService.subscribeToMedications as jest.Mock
      ).mockImplementation((userId, callback) => {
        medicationCallback = callback;
        return jest.fn();
      });

      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await act(async () => {
        medicationCallback([]);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(
        notificationService.scheduleGroupedNotification
      ).not.toHaveBeenCalled();
    });

    it("should handle medications without schedule times", async () => {
      const medWithoutTimes = [
        {
          id: "med-3",
          medicationName: "No Schedule Med",
          isActive: true,
          schedule: {},
        },
      ];

      let medicationCallback: any;
      (
        medicationService.subscribeToMedications as jest.Mock
      ).mockImplementation((userId, callback) => {
        medicationCallback = callback;
        return jest.fn();
      });

      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await act(async () => {
        medicationCallback(medWithoutTimes);
      });

      await waitFor(() => {
        expect(notificationService.cancelAllNotifications).toHaveBeenCalled();
      });

      // Should not schedule any notifications
      expect(
        notificationService.scheduleGroupedNotification
      ).not.toHaveBeenCalled();
    });

    it("should include brand name and dosage in notification data", async () => {
      let medicationCallback: any;
      (
        medicationService.subscribeToMedications as jest.Mock
      ).mockImplementation((userId, callback) => {
        medicationCallback = callback;
        return jest.fn();
      });

      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await act(async () => {
        medicationCallback(mockMedications);
      });

      await waitFor(() => {
        expect(
          notificationService.scheduleGroupedNotification
        ).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              brandName: "Bayer Aspirin",
              dosage: "100mg",
            }),
          ]),
          expect.any(String)
        );
      });
    });
  });

  describe("Notification Listeners", () => {
    it("should add notification response listener on mount", async () => {
      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await waitFor(() => {
        expect(
          notificationService.addNotificationResponseListener
        ).toHaveBeenCalled();
      });
    });

    it("should add notification received listener on mount", async () => {
      const wrapper = createWrapper();
      renderHook(() => useMedicationNotification(), { wrapper });

      await waitFor(() => {
        expect(
          notificationService.addNotificationReceivedListener
        ).toHaveBeenCalled();
      });
    });

    it("should remove notification listeners on unmount", async () => {
      const responseRemoveMock = jest.fn();
      const receivedRemoveMock = jest.fn();

      (
        notificationService.addNotificationResponseListener as jest.Mock
      ).mockReturnValue({
        remove: responseRemoveMock,
      });
      (
        notificationService.addNotificationReceivedListener as jest.Mock
      ).mockReturnValue({
        remove: receivedRemoveMock,
      });

      const wrapper = createWrapper();
      const { unmount } = renderHook(() => useMedicationNotification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(
          notificationService.addNotificationResponseListener
        ).toHaveBeenCalled();
        expect(
          notificationService.addNotificationReceivedListener
        ).toHaveBeenCalled();
      });

      unmount();

      expect(responseRemoveMock).toHaveBeenCalled();
      expect(receivedRemoveMock).toHaveBeenCalled();
    });
  });

  describe("requestPermissions", () => {
    it("should call notificationService.requestPermissions", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useMedicationNotification(), {
        wrapper,
      });

      await act(async () => {
        await result.current.requestPermissions();
      });

      expect(notificationService.requestPermissions).toHaveBeenCalled();
    });

    it("should update permissionsGranted state on successful request", async () => {
      (notificationService.requestPermissions as jest.Mock).mockResolvedValue({
        success: true,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMedicationNotification(), {
        wrapper,
      });

      await act(async () => {
        await result.current.requestPermissions();
      });

      await waitFor(() => {
        expect(result.current.permissionsGranted).toBe(true);
      });
    });
  });

  describe("useMedicationNotification hook", () => {
    it("should throw error when used outside MedicationNotificationProvider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useMedicationNotification());
      }).toThrow(
        "useMedicationNotification must be used within MedicationNotificationProvider"
      );

      consoleSpy.mockRestore();
    });

    it("should return context value when used within provider", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useMedicationNotification(), {
        wrapper,
      });

      expect(result.current).toHaveProperty("permissionsGranted");
      expect(result.current).toHaveProperty("requestPermissions");
      expect(typeof result.current.requestPermissions).toBe("function");
    });
  });
});
