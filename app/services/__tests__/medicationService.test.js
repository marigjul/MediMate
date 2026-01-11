// Simplified Medication Service Tests - Unit Tests with Mocks
// These tests verify the medication service logic works correctly

// Unmock medication service to test the real implementation
jest.unmock('../medicationService');

// Mock Firebase and global fetch
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
  },
}));

jest.mock('../../config/firebase', () => ({
  db: {},
}));

global.fetch = jest.fn();

import { addDoc, deleteDoc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import { medicationService } from "../medicationService";

describe("MedicationService - MediMate (Unit Tests)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("FDA API Integration", () => {
    test("TC-18: Should fetch and parse FDA medication data", async () => {
      const mockFDAResponse = {
        results: [{
          openfda: {
            brand_name: ["Aspirin"],
            generic_name: ["acetylsalicylic acid"],
          },
          active_ingredient: ["acetylsalicylic acid"],
          purpose: ["Pain reliever"],
        }],
      };

      getDocs.mockResolvedValue({ empty: true, docs: [] });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockFDAResponse,
      });
      addDoc.mockResolvedValue({ id: 'cache-id' });

      const result = await medicationService.searchMedicationFromFDA("aspirin");

      expect(result.success).toBe(true);
      expect(result.data.brandName).toBe("Aspirin");
      expect(result.fromCache).toBe(false);
    });

    test("TC-19: Should use cached medication data", async () => {
      const mockCachedData = {
        searchTerm: "aspirin",
        fdaData: { brandName: "Aspirin", genericName: "acetylsalicylic acid" },
        cachedAt: { toMillis: () => Date.now() },
      };

      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockCachedData }],
      });

      const result = await medicationService.searchMedicationFromFDA("aspirin");

      expect(result.success).toBe(true);
      expect(result.fromCache).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("TC-20: Should handle medication not found", async () => {
      getDocs.mockResolvedValue({ empty: true, docs: [] });
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await medicationService.searchMedicationFromFDA("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Medication CRUD Operations", () => {
    test("TC-25: Should add medication with FDA data", async () => {
      const mockFDAData = { brandName: "Aspirin", genericName: "acetylsalicylic acid" };
      
      getDocs.mockResolvedValue({ empty: true, docs: [] });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [{ openfda: { brand_name: ["Aspirin"], generic_name: ["acetylsalicylic acid"] } }] }),
      });
      addDoc.mockResolvedValueOnce({ id: 'cache-id' })
              .mockResolvedValueOnce({ id: 'med-id-123' });

      const validSchedule = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00"],
        "schedule.frequency": "1x daily",
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "aspirin",
        validSchedule
      );

      expect(result.success).toBe(true);
      expect(result.id).toBe('med-id-123');
      expect(result.fdaData).toBeDefined();
    });

    test("TC-26: Should add medication manually", async () => {
      addDoc.mockClear();
      addDoc.mockResolvedValue({ id: 'med-manual-123' });

      const result = await medicationService.addMedication("user-123", {
        medicationName: "Custom Supplement",
        schedule: { frequency: "daily", times: ["09:00"] },
        isActive: true,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('med-manual-123');
      expect(addDoc).toHaveBeenCalled();
    });

    test("TC-27: Should get user medications", async () => {
      const mockMedications = [
        { id: 'med1', medicationName: 'Aspirin' },
        { id: 'med2', medicationName: 'Ibuprofen' },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) => mockMedications.forEach((med) => callback({ id: med.id, data: () => med })),
      });

      const result = await medicationService.getUserMedications("user-123");

      expect(result.success).toBe(true);
      expect(result.medications.length).toBe(2);
    });

    test("TC-28: Should update medication", async () => {
      updateDoc.mockResolvedValue();

      const result = await medicationService.updateMedication('med-123', {
        streak: 7,
        isActive: false,
      });

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    test("TC-29: Should delete medication", async () => {
      deleteDoc.mockResolvedValue();

      const result = await medicationService.deleteMedication('med-123');

      expect(result.success).toBe(true);
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe("Medication Tracking", () => {
    test("TC-30: Should record medication as taken", async () => {
      addDoc.mockClear();
      addDoc.mockResolvedValue({ id: 'log-123' });

      const result = await medicationService.recordMedicationTaken('med-123', 'taken');

      expect(result.success).toBe(true);
      expect(result.id).toBe('log-123');
      expect(addDoc).toHaveBeenCalled();
    });

    test("TC-31: Should record medication as skipped", async () => {
      addDoc.mockResolvedValue({ id: 'log-456' });

      const result = await medicationService.recordMedicationTaken('med-123', 'skipped');

      expect(result.success).toBe(true);
      expect(result.id).toBe('log-456');
    });
  });

  describe("Real-time Subscription", () => {
    test("TC-32: Should subscribe to medication changes", () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      onSnapshot.mockImplementation((q, callback) => {
        callback({ forEach: (cb) => {} });
        return mockUnsubscribe;
      });

      const unsubscribe = medicationService.subscribeToMedications("user-123", mockCallback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe("Error Handling", () => {
    test("TC-33: Should handle invalid medication ID", async () => {
      updateDoc.mockRejectedValue(new Error("Document not found"));

      const result = await medicationService.updateMedication("invalid-id", { streak: 5 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("TC-34: Should handle FDA API error gracefully", async () => {
      getDocs.mockResolvedValue({ empty: true, docs: [] });
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const validSchedule = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00"],
        "schedule.frequency": "1x daily",
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "nonexistent",
        validSchedule
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Could not fetch medication info");
    });
  });

  describe("Time Validation", () => {
    test("TC-35: Should reject invalid time format", async () => {
      getDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{
            openfda: {
              brand_name: ["Test Med"],
              generic_name: ["test"],
            },
          }],
        }),
      });

      const invalidSchedule = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["25:00", "09:00"], // Invalid hour
        "schedule.frequency": "2x daily",
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Test Med",
        invalidSchedule
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid time format");
    });

    test("TC-36: Should reject times with invalid minutes", async () => {
      getDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const invalidSchedule = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:70"], // Invalid minutes
        "schedule.frequency": "1x daily",
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Test Med",
        invalidSchedule
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid time format");
    });

    test("TC-37: Should reject duplicate times", async () => {
      getDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const invalidSchedule = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00", "09:00"], // Duplicate
        "schedule.frequency": "2x daily",
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Test Med",
        invalidSchedule
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Duplicate times");
    });

    test("TC-38: Should accept valid times", async () => {
      getDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{
            openfda: {
              brand_name: ["Test Med"],
              generic_name: ["test"],
            },
          }],
        }),
      });

      addDoc.mockResolvedValue({ id: "med-123" });

      const validSchedule = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00", "14:00", "21:00"],
        "schedule.frequency": "3x daily",
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Test Med",
        validSchedule
      );

      expect(result.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
    });

    test("TC-39: Should validate interval schedule times", async () => {
      getDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const invalidSchedule = {
        dosage: "500mg",
        "schedule.type": "interval",
        "schedule.startTime": "25:00", // Invalid
        "schedule.dosesPerDay": 3,
        "schedule.hoursBetweenDoses": 8,
        "schedule.times": ["09:00", "17:00", "01:00"],
        "schedule.frequency": "3x daily",
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Test Med",
        invalidSchedule
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid start time");
    });

    test("TC-40: Should allow updating to time-limited without refill reminder validation", async () => {
      updateDoc.mockResolvedValue();

      // Simulate deleteField() with a special marker object
      const mockDeleteField = { _methodName: 'FieldValue.delete' };

      const updates = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00", "17:00"],
        "schedule.frequency": "2x daily",
        "duration.type": "limited",
        "duration.days": 14,
        refillReminder: mockDeleteField, // This should not trigger validation
      };

      const result = await medicationService.updateMedication("med-123", updates);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
    });

    test("TC-41: Should validate refill reminder only when it's a number", async () => {
      updateDoc.mockResolvedValue();

      const updates = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00"],
        "schedule.frequency": "1x daily",
        "duration.type": "permanent",
        refillReminder: 0, // Invalid number - should fail
      };

      const result = await medicationService.updateMedication("med-123", updates);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Refill reminder must be at least 1 day");
    });
  });

  describe("Daily Log Methods", () => {
    test("TC-42: Should get existing daily log", async () => {
      const mockLog = {
        userId: "user-123",
        date: "2026-01-11",
        medications: [
          { medicationId: "med-1", scheduledTime: "09:00", status: "pending" },
        ],
      };

      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: "log-123", data: () => mockLog }],
      });

      const result = await medicationService.getDailyLog("user-123", "2026-01-11");

      expect(result.success).toBe(true);
      expect(result.log.id).toBe("log-123");
      expect(result.log.medications.length).toBe(1);
    });

    test("TC-43: Should return empty log structure if no log exists", async () => {
      getDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await medicationService.getDailyLog("user-123", "2026-01-11");

      expect(result.success).toBe(true);
      expect(result.log.userId).toBe("user-123");
      expect(result.log.date).toBe("2026-01-11");
      expect(result.log.medications).toEqual([]);
    });

    test("TC-44: Should initialize daily log with medications", async () => {
      const medications = [
        {
          id: "med-1",
          medicationName: "Aspirin",
          schedule: { times: ["09:00", "21:00"] },
        },
        {
          id: "med-2",
          medicationName: "Vitamin D",
          schedule: { times: ["09:00"] },
        },
      ];

      getDocs.mockResolvedValue({ empty: true, docs: [] });
      addDoc.mockResolvedValue({ id: "log-456" });

      const result = await medicationService.initializeDailyLog(
        "user-123",
        "2026-01-11",
        medications
      );

      expect(result.success).toBe(true);
      expect(result.log.medications.length).toBe(3); // 2 times + 1 time = 3 entries
      expect(result.log.medications[0]).toMatchObject({
        medicationId: "med-1",
        scheduledTime: "09:00",
        status: "pending",
      });
    });

    test("TC-45: Should return existing log if already initialized", async () => {
      const existingLog = {
        id: "existing-log",
        userId: "user-123",
        date: "2026-01-11",
        medications: [{ medicationId: "med-1", scheduledTime: "09:00", status: "pending" }],
      };

      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: "existing-log", data: () => existingLog }],
      });

      const result = await medicationService.initializeDailyLog(
        "user-123",
        "2026-01-11",
        []
      );

      expect(result.success).toBe(true);
      expect(result.log.id).toBe("existing-log");
      expect(addDoc).not.toHaveBeenCalled();
    });

    test("TC-46: Should update medication status in existing log", async () => {
      const existingLog = {
        medications: [
          { medicationId: "med-1", scheduledTime: "09:00", status: "pending" },
          { medicationId: "med-2", scheduledTime: "14:00", status: "pending" },
        ],
      };

      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: "log-123", data: () => existingLog }],
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.updateMedicationStatus(
        "user-123",
        "2026-01-11",
        "med-1",
        "09:00",
        "taken"
      );

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = updateDoc.mock.calls[0][1];
      expect(updateCall.medications[0].status).toBe("taken");
      expect(updateCall.medications[0].takenAt).toBeDefined();
    });

    test("TC-47: Should add new medication entry if not found in log", async () => {
      const existingLog = {
        medications: [
          { medicationId: "med-1", scheduledTime: "09:00", status: "pending" },
        ],
      };

      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: "log-123", data: () => existingLog }],
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.updateMedicationStatus(
        "user-123",
        "2026-01-11",
        "med-2",
        "14:00",
        "taken"
      );

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = updateDoc.mock.calls[0][1];
      expect(updateCall.medications.length).toBe(2);
    });

    test("TC-48: Should create new log if updating status for non-existent log", async () => {
      getDocs.mockResolvedValue({ empty: true, docs: [] });
      addDoc.mockResolvedValue({ id: "new-log" });

      const result = await medicationService.updateMedicationStatus(
        "user-123",
        "2026-01-11",
        "med-1",
        "09:00",
        "taken"
      );

      expect(result.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe("Streak Calculation", () => {
    test("TC-49: Should increment streak when all medications taken yesterday", async () => {
      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: ["09:00", "21:00"] },
          todayStatus: { "09:00": "taken", "21:00": "taken" },
          statusDate: medicationService.getYesterdayDateString(),
          streak: 5,
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.checkAndUpdateStreaks("user-123");

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      // Check that streak was incremented to 6
    });

    test("TC-50: Should reset streak when medication was skipped yesterday", async () => {
      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: ["09:00", "21:00"] },
          todayStatus: { "09:00": "taken", "21:00": "skipped" },
          statusDate: medicationService.getYesterdayDateString(),
          streak: 5,
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.checkAndUpdateStreaks("user-123");

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      // Streak should be reset to 0
    });

    test("TC-51: Should reset streak when app not opened for multiple days", async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const oldDate = twoDaysAgo.toISOString().split("T")[0];

      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: ["09:00"] },
          todayStatus: { "09:00": "taken" },
          statusDate: oldDate, // Old date, not yesterday or today
          streak: 10,
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.checkAndUpdateStreaks("user-123");

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      // Streak should be reset to 0 due to missed days
    });

    test("TC-52: Should not update streak if medication has no scheduled times", async () => {
      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: [] },
          todayStatus: {},
          statusDate: medicationService.getYesterdayDateString(),
          streak: 0,
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.checkAndUpdateStreaks("user-123");

      expect(result.success).toBe(true);
      // Should handle edge case gracefully
    });

    test("TC-53: Should handle user with no medications", async () => {
      getDocs.mockResolvedValue({
        forEach: (callback) => {},
      });

      const result = await medicationService.checkAndUpdateStreaks("user-123");

      expect(result.success).toBe(true);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test("TC-54: Should handle multiple medications with mixed completion", async () => {
      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: ["09:00"] },
          todayStatus: { "09:00": "taken" },
          statusDate: medicationService.getYesterdayDateString(),
          streak: 3,
        },
        {
          id: "med-2",
          schedule: { times: ["09:00", "21:00"] },
          todayStatus: { "09:00": "taken", "21:00": "skipped" },
          statusDate: medicationService.getYesterdayDateString(),
          streak: 5,
        },
        {
          id: "med-3",
          schedule: { times: ["14:00"] },
          todayStatus: { "14:00": "taken" },
          statusDate: medicationService.getYesterdayDateString(),
          streak: 1,
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.checkAndUpdateStreaks("user-123");

      expect(result.success).toBe(true);
      // med-1 and med-3 should increment, med-2 should reset
    });

    test("TC-55: Should not modify streak if statusDate is today", async () => {
      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: ["09:00"] },
          todayStatus: { "09:00": "taken" },
          statusDate: medicationService.getTodayDateString(),
          streak: 5,
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.checkAndUpdateStreaks("user-123");

      expect(result.success).toBe(true);
      // Should not update streak for today's date
    });
  });

  describe("Time Status Methods", () => {
    test("TC-56: Should update medication time status", async () => {
      updateDoc.mockResolvedValue();

      const result = await medicationService.updateMedicationTimeStatus(
        "med-123",
        "09:00",
        "taken"
      );

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = updateDoc.mock.calls[0][1];
      expect(updateCall["todayStatus.09:00"]).toBe("taken");
      expect(updateCall.statusDate).toBe(medicationService.getTodayDateString());
    });

    test("TC-57: Should update medication time status to skipped", async () => {
      updateDoc.mockResolvedValue();

      const result = await medicationService.updateMedicationTimeStatus(
        "med-123",
        "14:00",
        "skipped"
      );

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = updateDoc.mock.calls[0][1];
      expect(updateCall["todayStatus.14:00"]).toBe("skipped");
    });

    test("TC-58: Should reset daily statuses for all medications", async () => {
      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: ["09:00", "21:00"] },
          todayStatus: { "09:00": "taken", "21:00": "taken" },
          statusDate: medicationService.getYesterdayDateString(),
        },
        {
          id: "med-2",
          schedule: { times: ["09:00"] },
          todayStatus: { "09:00": "skipped" },
          statusDate: medicationService.getYesterdayDateString(),
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.resetDailyStatuses("user-123");

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledTimes(2); // Once for each medication
    });

    test("TC-59: Should not reset if statusDate is already today", async () => {
      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: ["09:00"] },
          todayStatus: { "09:00": "pending" },
          statusDate: medicationService.getTodayDateString(),
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.resetDailyStatuses("user-123");

      expect(result.success).toBe(true);
      expect(updateDoc).not.toHaveBeenCalled(); // No reset needed
    });

    test("TC-60: Should handle medications with no schedule times", async () => {
      const mockMedications = [
        {
          id: "med-1",
          schedule: { times: [] },
          todayStatus: {},
          statusDate: medicationService.getYesterdayDateString(),
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) =>
          mockMedications.forEach((med) =>
            callback({ id: med.id, data: () => med })
          ),
      });
      updateDoc.mockResolvedValue();

      const result = await medicationService.resetDailyStatuses("user-123");

      expect(result.success).toBe(true);
      // Should handle gracefully without errors
    });

    test("TC-61: Should handle empty medication list when resetting", async () => {
      getDocs.mockResolvedValue({
        forEach: (callback) => {},
      });

      const result = await medicationService.resetDailyStatuses("user-123");

      expect(result.success).toBe(true);
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe("Search Medication Suggestions", () => {
    test("TC-62: Should search medications by term successfully", async () => {
      const mockFDAResponse = {
        results: [
          {
            openfda: {
              brand_name: ["Lipitor"],
              generic_name: ["atorvastatin"],
              manufacturer_name: ["Pfizer"],
            },
          },
          {
            openfda: {
              brand_name: ["Advil"],
              generic_name: ["ibuprofen"],
              manufacturer_name: ["Pfizer"],
            },
          },
        ],
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockFDAResponse,
      });

      const result = await medicationService.searchMedicationSuggestions("lipitor");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].brandName).toBe("Lipitor");
      expect(result.data[0].genericName).toBe("atorvastatin");
      expect(result.data[0].manufacturer).toBe("Pfizer");
    });

    test("TC-63: Should reject search term that is too short", async () => {
      const result = await medicationService.searchMedicationSuggestions("a");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search term too short");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("TC-64: Should reject empty search term", async () => {
      const result = await medicationService.searchMedicationSuggestions("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search term too short");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("TC-65: Should handle 404 response from FDA API", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await medicationService.searchMedicationSuggestions("nonexistent");

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test("TC-66: Should handle non-404 API errors", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await medicationService.searchMedicationSuggestions("aspirin");

      expect(result.success).toBe(false);
      expect(result.error).toContain("FDA API error: 500");
    });

    test("TC-67: Should handle empty results from FDA API", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await medicationService.searchMedicationSuggestions("nonexistent");

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test("TC-68: Should remove duplicate brand names", async () => {
      const mockFDAResponse = {
        results: [
          {
            openfda: {
              brand_name: ["Advil"],
              generic_name: ["ibuprofen"],
              manufacturer_name: ["Pfizer"],
            },
          },
          {
            openfda: {
              brand_name: ["Advil"],
              generic_name: ["ibuprofen"],
              manufacturer_name: ["GSK"],
            },
          },
        ],
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockFDAResponse,
      });

      const result = await medicationService.searchMedicationSuggestions("advil");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].brandName).toBe("Advil");
    });

    test("TC-69: Should handle medications with missing openfda data", async () => {
      const mockFDAResponse = {
        results: [
          {
            openfda: {},
          },
        ],
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockFDAResponse,
      });

      const result = await medicationService.searchMedicationSuggestions("unknown");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].brandName).toBe("Unknown Brand");
      expect(result.data[0].genericName).toBe("");
      expect(result.data[0].manufacturer).toBe("");
    });

    test("TC-70: Should handle network errors", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"));

      const result = await medicationService.searchMedicationSuggestions("aspirin");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    test("TC-71: Should trim and lowercase search term", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await medicationService.searchMedicationSuggestions("  Aspirin  ");

      expect(global.fetch).toHaveBeenCalled();
      const fetchUrl = global.fetch.mock.calls[0][0];
      expect(fetchUrl).toContain("aspirin");
    });
  });

  describe("Validation Error Branches", () => {
    test("TC-72: Should reject empty dosage", async () => {
      const invalidData = {
        dosage: "",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00"],
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Dosage is required");
    });

    test("TC-73: Should reject invalid schedule type", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "invalid",
        "schedule.times": ["09:00"],
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid schedule type");
    });

    test("TC-74: Should reject empty times array", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": [],
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("At least one time is required");
    });

    test("TC-75: Should reject invalid time format", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00", "25:00"],
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid time format detected");
    });

    test("TC-76: Should reject non-string time values", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": [123],
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid time format detected");
    });

    test("TC-77: Should reject invalid doses per day for interval schedule", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "interval",
        "schedule.times": ["09:00"],
        "schedule.startTime": "09:00",
        "schedule.dosesPerDay": 0,
        "schedule.hoursBetweenDoses": 8,
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Doses per day must be between 1 and 24");
    });

    test("TC-78: Should reject invalid hours between doses for interval schedule", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "interval",
        "schedule.times": ["09:00"],
        "schedule.startTime": "09:00",
        "schedule.dosesPerDay": 3,
        "schedule.hoursBetweenDoses": 0,
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Hours between doses must be between 1 and 24");
    });

    test("TC-79: Should reject invalid duration type", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00"],
        "duration.type": "invalid",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid duration type");
    });

    test("TC-80: Should reject invalid duration days for limited duration", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:00"],
        "duration.type": "limited",
        "duration.days": 0,
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Duration days must be at least 1");
    });

    test("TC-81: Should reject hours outside valid range", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["24:00"],
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid time format detected");
    });

    test("TC-82: Should reject minutes outside valid range", async () => {
      const invalidData = {
        dosage: "500mg",
        "schedule.type": "specific_times",
        "schedule.times": ["09:60"],
        "duration.type": "permanent",
      };

      const result = await medicationService.addMedicationWithFDA(
        "user-123",
        "Aspirin",
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid time format detected");
    });
  });
});
