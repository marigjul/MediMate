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
});
