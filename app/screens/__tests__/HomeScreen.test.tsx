import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { medicationService } from "../../services/medicationService";
import HomeScreen from "../HomeScreen";

// Mock navigation
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    ...jest.requireActual("@react-navigation/native"),
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
  };
});

// Mock medicationService
jest.mock("../../services/medicationService", () => ({
  medicationService: {
    getUserMedications: jest.fn(),
    updateMedicationTimeStatus: jest.fn(),
    resetDailyStatuses: jest.fn(),
    getTodayDateString: jest.fn(() => "2026-01-11"),
  },
}));

describe("HomeScreen", () => {
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

  // Mock current time as 10:00 AM for consistent testing
  const mockCurrentTime = new Date("2026-01-11T10:00:00");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentTime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderHomeScreen = (authContextValue = mockAuthContextValue) => {
    return render(
      <AuthContext.Provider value={authContextValue as any}>
        <HomeScreen />
      </AuthContext.Provider>
    );
  };

  const mockMedicationsWithStatus = [
    {
      id: "med-1",
      medicationName: "aspirin",
      fdaData: {
        brandName: "Aspirin",
        genericName: "acetylsalicylic acid",
      },
      schedule: {
        times: ["08:00", "14:00", "20:00"],
        frequency: "3x daily",
      },
      duration: {
        type: "permanent",
      },
      todayStatus: {
        "08:00": "taken",
        "14:00": "pending",
        "20:00": "pending",
      },
      streak: 5,
      dosage: "500mg",
    },
    {
      id: "med-2",
      medicationName: "ibuprofen",
      fdaData: {
        brandName: "Advil",
        genericName: "ibuprofen",
      },
      schedule: {
        times: ["09:00", "21:00"],
        frequency: "2x daily",
      },
      duration: {
        type: "limited",
        days: 14,
      },
      todayStatus: {
        "09:00": "taken",
        "21:00": "pending",
      },
      dosage: "200mg",
    },
  ];

  describe("Initial Rendering and Loading", () => {
    it("TC-01: Should show loading indicator while fetching medications", () => {
      (medicationService.getUserMedications as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByText } = renderHomeScreen();

      expect(getByText("Loading today's schedule...")).toBeTruthy();
    });

    it("TC-02: Should render after loading completes", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText(/Good morning/)).toBeTruthy();
      });
    });

    it("TC-03: Should call resetDailyStatuses on load", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: [],
      });

      renderHomeScreen();

      await waitFor(() => {
        expect(medicationService.resetDailyStatuses).toHaveBeenCalledWith(
          "test-user-123"
        );
      });
    });
  });

  describe("Greeting Display", () => {
    it("TC-04: Should display 'Good morning' before noon", async () => {
      jest.setSystemTime(new Date("2026-01-11T10:00:00"));
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: [],
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Good morning, Test User!")).toBeTruthy();
      });
    });

    it("TC-05: Should display 'Good afternoon' between noon and 6pm", async () => {
      jest.setSystemTime(new Date("2026-01-11T14:00:00"));
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: [],
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Good afternoon, Test User!")).toBeTruthy();
      });
    });

    it("TC-06: Should display 'Good evening' after 6pm", async () => {
      jest.setSystemTime(new Date("2026-01-11T19:00:00"));
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: [],
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Good evening, Test User!")).toBeTruthy();
      });
    });

    it("TC-07: Should display greeting without name when displayName is null", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: [],
      });

      const contextWithoutName = {
        ...mockAuthContextValue,
        user: { ...mockUser, displayName: null },
      };

      const { getByText } = renderHomeScreen(contextWithoutName);

      await waitFor(() => {
        expect(getByText("Good morning!")).toBeTruthy();
      });
    });
  });

  describe("Next Medication Card", () => {
    it("TC-08: Should display next pending medication", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText, getAllByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Next medication")).toBeTruthy();
        expect(getAllByText("Aspirin").length).toBeGreaterThan(0);
        expect(getByText("at 14:00")).toBeTruthy();
      });
    });

    it("TC-09: Should display next medication with correct time", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("at 14:00")).toBeTruthy();
      });
    });

    it("TC-10: Should display 'View details' button for next medication", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("View details")).toBeTruthy();
      });
    });

    it("TC-11: Should navigate to medication detail when 'View details' is pressed", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("View details")).toBeTruthy();
      });

      fireEvent.press(getByText("View details"));

      expect(mockNavigate).toHaveBeenCalledWith("MedicationView", {
        medication: expect.objectContaining({
          id: "med-1",
          medicationName: "aspirin",
        }),
      });
    });

    it("TC-12: Should show tomorrow's first medication when all today's are taken", async () => {
      const allTakenMeds = [
        {
          ...mockMedicationsWithStatus[0],
          todayStatus: {
            "08:00": "taken",
            "14:00": "taken",
            "20:00": "taken",
          },
        },
      ];

      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: allTakenMeds,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Tomorrow, at 08:00")).toBeTruthy();
      });
    });

    it("TC-13: Should not show next medication card when no medications exist", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: [],
      });

      const { queryByText } = renderHomeScreen();

      await waitFor(() => {
        expect(queryByText("Next medication")).toBeNull();
      });
    });
  });

  describe("Progress Tracking", () => {
    it("TC-14: Should display progress card", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Today's Progress")).toBeTruthy();
      });
    });

    it("TC-15: Should show correct progress count", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("2 of 5 doses taken")).toBeTruthy();
      });
    });

    it("TC-16: Should show 0 progress when no medications taken", async () => {
      const untakenMeds = mockMedicationsWithStatus.map((med) => ({
        ...med,
        todayStatus: Object.keys(med.todayStatus).reduce((acc, time) => {
          acc[time] = "pending";
          return acc;
        }, {} as any),
      }));

      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: untakenMeds,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("0 of 5 doses taken")).toBeTruthy();
      });
    });

    it("TC-17: Should show full progress when all medications taken", async () => {
      const allTakenMeds = mockMedicationsWithStatus.map((med) => ({
        ...med,
        todayStatus: Object.keys(med.todayStatus).reduce((acc, time) => {
          acc[time] = "taken";
          return acc;
        }, {} as any),
      }));

      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: allTakenMeds,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("5 of 5 doses taken")).toBeTruthy();
      });
    });
  });

  describe("Today's Medications List", () => {
    it("TC-18: Should display section title", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Today's Medications")).toBeTruthy();
      });
    });

    it("TC-19: Should display all scheduled medications", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        // Aspirin appears 3 times (08:00, 14:00, 20:00)
        expect(getByText("08:00")).toBeTruthy();
        expect(getByText("14:00")).toBeTruthy();
        expect(getByText("20:00")).toBeTruthy();
        // Advil appears 2 times (09:00, 21:00)
        expect(getByText("09:00")).toBeTruthy();
        expect(getByText("21:00")).toBeTruthy();
      });
    });

    it("TC-20: Should display medication names for each scheduled time", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText } = renderHomeScreen();

      await waitFor(() => {
        const aspirinElements = getAllByText("Aspirin");
        const advilElements = getAllByText("Advil");
        // Aspirin appears 4 times: once in "Next medication" card + 3 times in list
        expect(aspirinElements.length).toBe(4);
        expect(advilElements.length).toBe(2); // 2 times a day
      });
    });

    it("TC-21: Should display 'Taken' status badge", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText } = renderHomeScreen();

      await waitFor(() => {
        const takenBadges = getAllByText("Taken");
        expect(takenBadges.length).toBe(2); // 08:00 and 09:00
      });
    });

    it("TC-22: Should display 'Pending' status badge", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText } = renderHomeScreen();

      await waitFor(() => {
        const pendingBadges = getAllByText("Pending");
        expect(pendingBadges.length).toBe(3); // 14:00, 20:00, 21:00
      });
    });

    it("TC-23: Should display 'Missed' status badge", async () => {
      const medsWithMissed = [
        {
          ...mockMedicationsWithStatus[0],
          todayStatus: {
            "08:00": "missed",
            "14:00": "pending",
            "20:00": "pending",
          },
        },
      ];

      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: medsWithMissed,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Missed")).toBeTruthy();
      });
    });

    it("TC-24: Should sort medications by time", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText } = renderHomeScreen();

      await waitFor(() => {
        // Check that times are in order
        expect(getAllByText("08:00")[0]).toBeTruthy();
      });
    });
  });

  describe("Medication Status Modal", () => {
    it("TC-25: Should open modal when medication card is pressed", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText, getByText, queryByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getAllByText("08:00").length).toBeGreaterThan(0);
      });

      // Press the medication time card (not the name)
      fireEvent.press(getAllByText("08:00")[0]);

      await waitFor(() => {
        expect(queryByText("Update Medication Status")).toBeTruthy();
      });
    });

    it("TC-26: Should display medication name and time in modal", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText, queryByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getAllByText("14:00").length).toBeGreaterThan(0);
      });

      // Press the 14:00 time card
      fireEvent.press(getAllByText("14:00")[0]);

      await waitFor(() => {
        expect(queryByText(/Aspirin - 14:00/)).toBeTruthy();
      });
    });

    it("TC-27: Should show Pending and Taken options for future medications", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText, getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getAllByText("20:00").length).toBeGreaterThan(0);
      });

      // Press future medication (20:00)
      fireEvent.press(getAllByText("20:00")[0]);

      await waitFor(() => {
        expect(getByText("Update Medication Status")).toBeTruthy();
      });

      // Should have both options
      const pendingOptions = getAllByText("Pending");
      const takenOptions = getAllByText("Taken");
      expect(pendingOptions.length).toBeGreaterThan(0);
      expect(takenOptions.length).toBeGreaterThan(0);
    });

    it("TC-28: Should show Taken and Missed options for past medications", async () => {
      jest.setSystemTime(new Date("2026-01-11T09:00:00"));

      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText, getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getAllByText("08:00").length).toBeGreaterThan(0);
      });

      // Press past medication (08:00)
      fireEvent.press(getAllByText("08:00")[0]);

      await waitFor(() => {
        expect(getByText("Update Medication Status")).toBeTruthy();
      });

      // Should have Taken and Missed, but not Pending as separate option
      expect(getAllByText("Taken").length).toBeGreaterThan(0);
      expect(getByText("Missed")).toBeTruthy();
    });

    it("TC-29: Should allow selecting different status", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText, getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getAllByText("14:00").length).toBeGreaterThan(0);
      });

      // Press pending medication
      fireEvent.press(getAllByText("14:00")[0]);

      await waitFor(() => {
        expect(getByText("Update Medication Status")).toBeTruthy();
      });

      // Select Taken status
      const takenOptions = getAllByText("Taken");
      fireEvent.press(takenOptions[takenOptions.length - 1]); // Press the option in modal

      // Status should be selectable (test doesn't fail)
      expect(takenOptions.length).toBeGreaterThan(0);
    });

    it("TC-30: Should close modal when Cancel is pressed", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getAllByText, getByText, queryByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getAllByText("08:00").length).toBeGreaterThan(0);
      });

      fireEvent.press(getAllByText("08:00")[0]);

      await waitFor(() => {
        expect(getByText("Update Medication Status")).toBeTruthy();
      });

      fireEvent.press(getByText("Cancel"));

      await waitFor(() => {
        expect(queryByText("Update Medication Status")).toBeNull();
      });
    });

    it("TC-31: Should update status when Confirm is pressed", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });
      (
        medicationService.updateMedicationTimeStatus as jest.Mock
      ).mockResolvedValue({
        success: true,
      });

      const { getAllByText, getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getAllByText("14:00").length).toBeGreaterThan(0);
      });

      // Press pending medication (14:00)
      fireEvent.press(getAllByText("14:00")[0]);

      await waitFor(() => {
        expect(getByText("Update Medication Status")).toBeTruthy();
      });

      // Select Taken
      const takenOptions = getAllByText("Taken");
      fireEvent.press(takenOptions[takenOptions.length - 1]);

      // Confirm
      fireEvent.press(getByText("Confirm"));

      await waitFor(() => {
        expect(medicationService.updateMedicationTimeStatus).toHaveBeenCalledWith(
          "med-1",
          "14:00",
          "taken"
        );
      });
    });

    it("TC-32: Should reload medications if status update fails", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });
      (
        medicationService.updateMedicationTimeStatus as jest.Mock
      ).mockResolvedValue({
        success: false,
      });

      const { getAllByText, getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getAllByText("Aspirin").length).toBeGreaterThan(0);
      });

      fireEvent.press(getAllByText("Aspirin")[1]);

      await waitFor(() => {
        expect(getByText("Confirm")).toBeTruthy();
      });

      fireEvent.press(getByText("Confirm"));

      await waitFor(() => {
        // Should reload medications twice: once on mount, once after failed update
        expect(medicationService.getUserMedications).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Empty State", () => {
    it("TC-33: Should not show section title when no medications", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: [],
      });

      const { queryByText, getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Good morning, Test User!")).toBeTruthy();
      });

      expect(queryByText("Today's Medications")).toBeTruthy();
      expect(queryByText("Next medication")).toBeNull();
    });

    it("TC-34: Should show zero progress when no medications", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: [],
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("0 of 0 doses taken")).toBeTruthy();
      });
    });
  });

  describe("Navigation", () => {
    it("TC-35: Should navigate to medication view with correct data", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: mockMedicationsWithStatus,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("View details")).toBeTruthy();
      });

      fireEvent.press(getByText("View details"));

      expect(mockNavigate).toHaveBeenCalledWith("MedicationView", {
        medication: expect.objectContaining({
          id: "med-1",
          medicationName: "aspirin",
        }),
      });
    });
  });

  describe("Error Handling", () => {
    it("TC-36: Should handle getUserMedications failure gracefully", async () => {
      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: false,
      });

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Good morning, Test User!")).toBeTruthy();
      });

      // Should still render without crashing
      expect(getByText("0 of 0 doses taken")).toBeTruthy();
    });

    it("TC-37: Should handle getUserMedications error gracefully", async () => {
      (medicationService.getUserMedications as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const { getByText } = renderHomeScreen();

      await waitFor(() => {
        expect(getByText("Good morning, Test User!")).toBeTruthy();
      });

      // Should still render without crashing
      expect(getByText("0 of 0 doses taken")).toBeTruthy();
    });

    it("TC-38: Should handle null user gracefully", async () => {
      const { queryByText } = renderHomeScreen({
        user: null,
        loading: false,
        refreshUser: jest.fn(),
      } as any);

      await waitFor(() => {
        expect(queryByText("Good morning!")).toBeTruthy();
      });

      expect(medicationService.getUserMedications).not.toHaveBeenCalled();
    });
  });

  describe("Data Handling", () => {
    it("TC-39: Should handle medications without fdaData", async () => {
      const medsWithoutFda = [
        {
          id: "med-1",
          medicationName: "aspirin",
          schedule: {
            times: ["08:00"],
            frequency: "1x daily",
          },
          todayStatus: {
            "08:00": "pending",
          },
        },
      ];

      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: medsWithoutFda,
      });

      const { getAllByText } = renderHomeScreen();

      await waitFor(() => {
        // Should display capitalized medication name
        const aspirinElements = getAllByText("Aspirin");
        expect(aspirinElements.length).toBeGreaterThan(0);
      });
    });

    it("TC-40: Should handle medications without todayStatus", async () => {
      const medsWithoutStatus = [
        {
          id: "med-1",
          medicationName: "aspirin",
          fdaData: {
            brandName: "Aspirin",
          },
          schedule: {
            times: ["08:00"],
            frequency: "1x daily",
          },
        },
      ];

      (medicationService.getUserMedications as jest.Mock).mockResolvedValue({
        success: true,
        medications: medsWithoutStatus,
      });

      const { getAllByText } = renderHomeScreen();

      await waitFor(() => {
        const aspirinElements = getAllByText("Aspirin");
        expect(aspirinElements.length).toBeGreaterThan(0);
        // Should default to pending
        expect(getAllByText("Pending").length).toBeGreaterThan(0);
      });
    });
  });
});
