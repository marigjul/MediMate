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
});
