import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { medicationService } from "../../services/medicationService";
import MedicationConfirmScreen from "../prescriptions/MedicationConfirmScreen";

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockRoute = {
  params: {
    medicationName: "aspirin",
    brandName: "Aspirin",
    genericName: "acetylsalicylic acid",
    fdaData: { brandName: "Aspirin" },
    scheduleData: {
      dosage: "500mg",
      schedule: {
        type: "interval",
        startTime: "09:00",
        dosesPerDay: 2,
        hoursBetweenDoses: 8,
        times: ["09:00", "17:00"],
        frequency: "2x daily (every 8h)",
      },
      duration: {
        type: "permanent",
      },
      refillReminder: 30,
    },
  },
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
}));

// Mock medicationService
jest.mock("../../services/medicationService", () => ({
  medicationService: {
    searchMedicationFromFDA: jest.fn(),
    addMedicationWithFDA: jest.fn(),
    updateMedication: jest.fn(),
  },
}));

describe("MedicationConfirmScreen", () => {
  const mockUser = {
    uid: "test-user-123",
    displayName: "Test User",
    email: "test@example.com",
  };

  const mockAuthContextValue = {
    user: mockUser,
    loading: false,
    refreshUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.params = {
      medicationName: "aspirin",
      brandName: "Aspirin",
      genericName: "acetylsalicylic acid",
      fdaData: { brandName: "Aspirin" },
      scheduleData: {
        dosage: "500mg",
        schedule: {
          type: "interval",
          startTime: "09:00",
          dosesPerDay: 2,
          hoursBetweenDoses: 8,
          times: ["09:00", "17:00"],
          frequency: "2x daily (every 8h)",
        },
        duration: {
          type: "permanent",
        },
        refillReminder: 30,
      },
    };
  });

  const renderConfirmScreen = (authContextValue = mockAuthContextValue) => {
    return render(
      <AuthContext.Provider value={authContextValue as any}>
        <MedicationConfirmScreen />
      </AuthContext.Provider>
    );
  };

  describe("Initial Rendering", () => {
    it("TC-90: Should render page title", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("Review & Confirm")).toBeTruthy();
    });

    it("TC-91: Should display medication name", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("Aspirin")).toBeTruthy();
    });

    it("TC-92: Should display generic name", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("acetylsalicylic acid")).toBeTruthy();
    });

    it("TC-93: Should display dosage", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("500mg")).toBeTruthy();
    });

    it("TC-94: Should display schedule frequency", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("2x daily (every 8h)")).toBeTruthy();
    });

    it("TC-95: Should display schedule times", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("09:00, 17:00")).toBeTruthy();
    });

    it("TC-96: Should display duration", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("Ongoing (no end date)")).toBeTruthy();
    });

    it("TC-97: Should display refill reminder", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("Every 30 days")).toBeTruthy();
    });

    it("TC-98: Should render Confirm button", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("Add Medication")).toBeTruthy();
    });

    it("TC-99: Should render Edit button", () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("Edit Details")).toBeTruthy();
    });
  });

  describe("Edit Mode", () => {
    beforeEach(() => {
      (mockRoute.params as any).existingMedicationId = "med-123";
    });

    it('TC-100: Should show "Confirm Changes" title in edit mode', () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("Confirm Changes")).toBeTruthy();
    });

    it('TC-101: Should show "Save Changes" button in edit mode', () => {
      const { getByText } = renderConfirmScreen();
      expect(getByText("Save Changes")).toBeTruthy();
    });
  });

  describe("Form Submission - New Medication", () => {
    it("TC-102: Should add medication with FDA data", async () => {
      (
        medicationService.searchMedicationFromFDA as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { brandName: "Aspirin" },
      });
      (medicationService.addMedicationWithFDA as jest.Mock).mockResolvedValue({
        success: true,
        id: "new-med-123",
      });
      (medicationService.updateMedication as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { getByText } = renderConfirmScreen();

      const confirmButton = getByText("Add Medication");
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(medicationService.addMedicationWithFDA).toHaveBeenCalledWith(
          "test-user-123",
          "aspirin",
          expect.objectContaining({
            dosage: "500mg",
            'schedule.type': 'interval',
            'schedule.times': ["09:00", "17:00"],
            'schedule.frequency': "2x daily (every 8h)",
            'schedule.startTime': "09:00",
            'schedule.dosesPerDay': 2,
            'schedule.hoursBetweenDoses': 8,
            'duration.type': "permanent",
            refillReminder: 30,
          })
        );
      });
    });

    it("TC-103: Should add medication with all data in one call", async () => {
      (
        medicationService.searchMedicationFromFDA as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { brandName: "Aspirin" },
      });
      (medicationService.addMedicationWithFDA as jest.Mock).mockResolvedValue({
        success: true,
        id: "new-med-123",
      });

      const { getByText } = renderConfirmScreen();

      const confirmButton = getByText("Add Medication");
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(medicationService.addMedicationWithFDA).toHaveBeenCalled();
        expect(medicationService.updateMedication).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("PrescriptionsMain");
      });
    });

    it("TC-104: Should navigate to PrescriptionsMain after successful save", async () => {
      (
        medicationService.searchMedicationFromFDA as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { brandName: "Aspirin" },
      });
      (medicationService.addMedicationWithFDA as jest.Mock).mockResolvedValue({
        success: true,
        id: "new-med-123",
      });
      (medicationService.updateMedication as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { getByText } = renderConfirmScreen();

      const confirmButton = getByText("Add Medication");
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("PrescriptionsMain");
      });
    });

    it("TC-105: Should show error when user not logged in", async () => {
      const contextWithoutUser = {
        ...mockAuthContextValue,
        user: null as any,
      };

      const { getByText } = renderConfirmScreen(contextWithoutUser);

      const confirmButton = getByText("Add Medication");
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(
          getByText("You must be logged in to add medications")
        ).toBeTruthy();
      });
    });

    it("TC-106: Should show error when add medication fails", async () => {
      (
        medicationService.searchMedicationFromFDA as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { brandName: "Aspirin" },
      });
      (medicationService.addMedicationWithFDA as jest.Mock).mockResolvedValue({
        success: false,
        error: "Failed to add medication",
      });

      const { getByText } = renderConfirmScreen();

      const confirmButton = getByText("Add Medication");
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(getByText("Failed to add medication")).toBeTruthy();
      });
    });

    it("TC-107: Should include duration days for limited duration", async () => {
      (mockRoute.params.scheduleData.duration as any) = {
        type: "limited",
        days: 14,
      };
      (mockRoute.params.scheduleData as any).refillReminder = undefined;

      (
        medicationService.searchMedicationFromFDA as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { brandName: "Aspirin" },
      });
      (medicationService.addMedicationWithFDA as jest.Mock).mockResolvedValue({
        success: true,
        id: "new-med-123",
      });

      const { getByText } = renderConfirmScreen();

      const confirmButton = getByText("Add Medication");
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(medicationService.addMedicationWithFDA).toHaveBeenCalledWith(
          "test-user-123",
          "aspirin",
          expect.objectContaining({
            'duration.type': "limited",
            'duration.days': 14,
          })
        );
      });
    });
  });

  describe("Form Submission - Edit Mode", () => {
    beforeEach(() => {
      (mockRoute.params as any).existingMedicationId = "med-123";
    });

    it("TC-108: Should update existing medication", async () => {
      (medicationService.updateMedication as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { getByText } = renderConfirmScreen();

      const saveButton = getByText("Save Changes");
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(medicationService.updateMedication).toHaveBeenCalledWith(
          "med-123",
          expect.objectContaining({
            dosage: "500mg",
            refillReminder: 30,
          })
        );
      });
    });

    it("TC-109: Should navigate to PrescriptionsMain after successful update", async () => {
      (medicationService.updateMedication as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { getByText } = renderConfirmScreen();

      const saveButton = getByText("Save Changes");
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("PrescriptionsMain");
      });
    });

    it("TC-110: Should show error when update fails", async () => {
      (medicationService.updateMedication as jest.Mock).mockResolvedValue({
        success: false,
        error: "Update failed",
      });

      const { getByText } = renderConfirmScreen();

      const saveButton = getByText("Save Changes");
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText("Update failed")).toBeTruthy();
      });
    });
  });

  describe("Navigation", () => {
    it("TC-111: Should navigate back when Back button pressed", () => {
      const { getByText } = renderConfirmScreen();

      const backButton = getByText("Back");
      fireEvent.press(backButton);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it("TC-112: Should navigate back when Edit Schedule button pressed", () => {
      const { getByText } = renderConfirmScreen();

      const editButton = getByText("Edit Details");
      fireEvent.press(editButton);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("TC-113: Should show loading indicator while saving", async () => {
      (
        medicationService.searchMedicationFromFDA as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { brandName: "Aspirin" },
      });
      (medicationService.addMedicationWithFDA as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, id: "new-med-123" }), 100)
          )
      );
      (medicationService.updateMedication as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { getByText, getByTestId } = renderConfirmScreen();

      const confirmButton = getByText("Add Medication");
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(getByTestId("loading-indicator")).toBeTruthy();
      });
    });
  });

  describe("Edit Details Button", () => {
    it("TC-114: Should navigate back when Edit Details button is pressed", () => {
      const { getByText } = renderConfirmScreen();

      const editButton = getByText("Edit Details");
      fireEvent.press(editButton);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it("TC-115: Should have Edit Details button visible in new medication mode", () => {
      const { getByText } = renderConfirmScreen();

      expect(getByText("Edit Details")).toBeTruthy();
    });

    it("TC-116: Should have Edit Details button visible in edit mode", () => {
      (mockRoute.params as any).existingMedicationId = "med-123";

      const { getByText } = renderConfirmScreen();

      expect(getByText("Edit Details")).toBeTruthy();
    });
  });

  describe("Schedule Type Display", () => {
    it("TC-117: Should display interval schedule with frequency and times", () => {
      const { getByText } = renderConfirmScreen();

      expect(getByText("2x daily (every 8h)")).toBeTruthy();
      expect(getByText("09:00, 17:00")).toBeTruthy();
    });

    it("TC-118: Should display specific times schedule correctly", () => {
      (mockRoute.params.scheduleData.schedule as any) = {
        type: "specific_times",
        times: ["08:00", "14:00", "20:00"],
        frequency: "3x daily",
      };

      const { getByText } = renderConfirmScreen();

      expect(getByText("3x daily")).toBeTruthy();
      expect(getByText("08:00, 14:00, 20:00")).toBeTruthy();
    });

    it("TC-119: Should display interval schedule with multiple doses", () => {
      (mockRoute.params.scheduleData.schedule as any) = {
        type: "interval",
        startTime: "06:00",
        dosesPerDay: 4,
        hoursBetweenDoses: 6,
        times: ["06:00", "12:00", "18:00", "00:00"],
        frequency: "4x daily (every 6h)",
      };

      const { getByText } = renderConfirmScreen();

      expect(getByText("4x daily (every 6h)")).toBeTruthy();
      expect(getByText("06:00, 12:00, 18:00, 00:00")).toBeTruthy();
    });

    it("TC-120: Should display single dose interval schedule", () => {
      (mockRoute.params.scheduleData.schedule as any) = {
        type: "interval",
        startTime: "09:00",
        dosesPerDay: 1,
        hoursBetweenDoses: 24,
        times: ["09:00"],
        frequency: "Once daily",
      };

      const { getByText } = renderConfirmScreen();

      expect(getByText("Once daily")).toBeTruthy();
      expect(getByText("09:00")).toBeTruthy();
    });

    it("TC-121: Should display specific times with single time", () => {
      (mockRoute.params.scheduleData.schedule as any) = {
        type: "specific_times",
        times: ["21:00"],
        frequency: "Once daily",
      };

      const { getByText } = renderConfirmScreen();

      expect(getByText("Once daily")).toBeTruthy();
      expect(getByText("21:00")).toBeTruthy();
    });

    it("TC-122: Should handle schedule without frequency field", () => {
      (mockRoute.params.scheduleData.schedule as any) = {
        type: "specific_times",
        times: ["09:00", "21:00"],
      };

      const { getByText } = renderConfirmScreen();

      // Should still display times even without frequency
      expect(getByText("09:00, 21:00")).toBeTruthy();
    });
  });

  describe("Refill Reminder Display Logic", () => {
    it("TC-123: Should display refill reminder for permanent medication", () => {
      const { getByText } = renderConfirmScreen();

      expect(getByText("Every 30 days")).toBeTruthy();
    });

    it("TC-124: Should not display refill reminder for time-limited medication", () => {
      (mockRoute.params.scheduleData.duration as any) = {
        type: "limited",
        days: 14,
      };
      (mockRoute.params.scheduleData as any).refillReminder = undefined;

      const { queryByText } = renderConfirmScreen();

      expect(queryByText("Every 30 days")).toBeNull();
      expect(queryByText("Refill Reminder")).toBeNull();
    });

    it("TC-125: Should display different refill reminder values", () => {
      mockRoute.params.scheduleData.refillReminder = 60;

      const { getByText } = renderConfirmScreen();

      expect(getByText("Every 60 days")).toBeTruthy();
    });

    it("TC-126: Should display refill reminder at 7 days", () => {
      mockRoute.params.scheduleData.refillReminder = 7;

      const { getByText } = renderConfirmScreen();

      expect(getByText("Every 7 days")).toBeTruthy();
    });

    it("TC-127: Should not display refill reminder when not set for permanent medication", () => {
      (mockRoute.params.scheduleData as any).refillReminder = undefined;

      const { getByText, queryByText } = renderConfirmScreen();

      // Should show ongoing duration but not refill reminder
      expect(getByText("Ongoing (no end date)")).toBeTruthy();
      expect(queryByText(/Every.*days/)).toBeNull();
    });

    it("TC-128: Should display time-limited duration without refill reminder", () => {
      (mockRoute.params.scheduleData.duration as any) = {
        type: "limited",
        days: 10,
      };
      (mockRoute.params.scheduleData as any).refillReminder = undefined;

      const { getByText, queryByText } = renderConfirmScreen();

      // Should show duration but no refill reminder
      expect(getByText("10 days")).toBeTruthy();
      expect(queryByText("Refill Reminder")).toBeNull();
    });
  });

  describe("Complete Data Display", () => {
    it("TC-129: Should display all required fields for permanent medication", () => {
      const { getByText } = renderConfirmScreen();

      // Medication info
      expect(getByText("Aspirin")).toBeTruthy();
      expect(getByText("acetylsalicylic acid")).toBeTruthy();
      
      // Dosage
      expect(getByText("500mg")).toBeTruthy();
      
      // Schedule
      expect(getByText("2x daily (every 8h)")).toBeTruthy();
      expect(getByText("09:00, 17:00")).toBeTruthy();
      
      // Duration
      expect(getByText("Ongoing (no end date)")).toBeTruthy();
      
      // Refill
      expect(getByText("Every 30 days")).toBeTruthy();
    });

    it("TC-130: Should display all required fields for time-limited medication", () => {
      (mockRoute.params.scheduleData.duration as any) = {
        type: "limited",
        days: 14,
      };
      (mockRoute.params.scheduleData as any).refillReminder = undefined;

      const { getByText, queryByText } = renderConfirmScreen();

      // Medication info
      expect(getByText("Aspirin")).toBeTruthy();
      expect(getByText("acetylsalicylic acid")).toBeTruthy();
      
      // Dosage
      expect(getByText("500mg")).toBeTruthy();
      
      // Schedule
      expect(getByText("2x daily (every 8h)")).toBeTruthy();
      expect(getByText("09:00, 17:00")).toBeTruthy();
      
      // Duration (no refill for limited)
      expect(getByText("14 days")).toBeTruthy();
      expect(queryByText("Refill Reminder")).toBeNull();
    });
  });
});
