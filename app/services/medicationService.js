import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

const FDA_API_URL = "https://api.fda.gov/drug/label.json";
const CACHE_DURATION_DAYS = 30;

// Time validation utilities
const isValidTime = (time) => {
  if (!time || typeof time !== 'string') {
    return false;
  }
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(time)) {
    return false;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
};

const validateScheduleData = (scheduleData) => {
  const errors = [];
  
  // Validate dosage
  if (!scheduleData.dosage || typeof scheduleData.dosage !== 'string' || !scheduleData.dosage.trim()) {
    errors.push('Dosage is required');
  }
  
  // Validate schedule type
  if (!scheduleData['schedule.type'] || !['interval', 'specific_times'].includes(scheduleData['schedule.type'])) {
    errors.push('Invalid schedule type');
  }
  
  // Validate times array
  if (!scheduleData['schedule.times'] || !Array.isArray(scheduleData['schedule.times']) || scheduleData['schedule.times'].length === 0) {
    errors.push('At least one time is required');
  } else {
    // Validate each time
    const invalidTimes = scheduleData['schedule.times'].filter(time => !isValidTime(time));
    if (invalidTimes.length > 0) {
      errors.push(`Invalid time format detected: ${invalidTimes.join(', ')}. Times must be in HH:MM format (00:00 - 23:59)`);
    }
    
    // Check for duplicates
    const uniqueTimes = new Set(scheduleData['schedule.times']);
    if (uniqueTimes.size !== scheduleData['schedule.times'].length) {
      errors.push('Duplicate times are not allowed');
    }
  }
  
  // Validate interval-specific fields
  if (scheduleData['schedule.type'] === 'interval') {
    if (!isValidTime(scheduleData['schedule.startTime'])) {
      errors.push('Invalid start time format. Must be HH:MM (00:00 - 23:59)');
    }
    
    const dosesPerDay = scheduleData['schedule.dosesPerDay'];
    if (!dosesPerDay || !Number.isInteger(dosesPerDay) || dosesPerDay < 1 || dosesPerDay > 24) {
      errors.push('Doses per day must be between 1 and 24');
    }
    
    const hoursBetween = scheduleData['schedule.hoursBetweenDoses'];
    if (!hoursBetween || !Number.isInteger(hoursBetween) || hoursBetween < 1 || hoursBetween > 24) {
      errors.push('Hours between doses must be between 1 and 24');
    }
  }
  
  // Validate duration
  if (!scheduleData['duration.type'] || !['permanent', 'limited'].includes(scheduleData['duration.type'])) {
    errors.push('Invalid duration type');
  }
  
  if (scheduleData['duration.type'] === 'limited') {
    const days = scheduleData['duration.days'];
    if (!days || !Number.isInteger(days) || days < 1) {
      errors.push('Duration days must be at least 1');
    }
  }
  
  // Validate refill reminder if present and is a number (not deleteField or undefined)
  if (scheduleData.refillReminder !== undefined && 
      scheduleData.refillReminder !== null && 
      typeof scheduleData.refillReminder === 'number') {
    if (!Number.isInteger(scheduleData.refillReminder) || scheduleData.refillReminder < 1) {
      errors.push('Refill reminder must be at least 1 day');
    }
  }
  
  return errors;
};

export const medicationService = {
  // Search for multiple medication suggestions (for search screen)
  searchMedicationSuggestions: async (searchTerm) => {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: false, error: "Search term too short" };
      }

      const cleanTerm = searchTerm.trim().toLowerCase();

      // Search both brand_name and generic_name
      const searchQuery = `(openfda.brand_name:*${cleanTerm}* OR openfda.generic_name:*${cleanTerm}*)`;
      const encodedQuery = encodeURIComponent(searchQuery);

      const response = await fetch(
        `${FDA_API_URL}?search=${encodedQuery}&limit=20`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: [] };
        }
        throw new Error(`FDA API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return { success: true, data: [] };
      }

      // Transform to simpler format for search results
      const suggestions = data.results.map((result) => ({
        brandName: result.openfda?.brand_name?.[0] || "Unknown Brand",
        genericName: result.openfda?.generic_name?.[0] || "",
        manufacturer: result.openfda?.manufacturer_name?.[0] || "",
      }));

      // Remove duplicates based on brand name
      const uniqueSuggestions = suggestions.filter(
        (med, index, self) =>
          index === self.findIndex((m) => m.brandName === med.brandName)
      );

      return { success: true, data: uniqueSuggestions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Search for specific medication with full details and caching
  searchMedicationFromFDA: async (medicationName) => {
    try {
      // Step 1: Check if medication already exists in cache
      const q = query(
        collection(db, "medicationCache"),
        where("searchTerm", "==", medicationName.toLowerCase())
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const cachedData = snapshot.docs[0].data();
        const cacheAge = Date.now() - cachedData.cachedAt.toMillis();
        const maxAge = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;

        // If cache is newer than 30 days, return cached data
        if (cacheAge < maxAge) {
          return { success: true, data: cachedData.fdaData, fromCache: true };
        }
      }

      // Step 2: If not in cache or outdated, fetch from FDA API
      const response = await fetch(
        `${FDA_API_URL}?search=openfda.brand_name:"${medicationName}"&limit=1`
      );

      if (!response.ok) {
        throw new Error("Medication not found in FDA database");
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return { success: false, error: "Medication not found" };
      }

      const result = data.results[0];

      // Structure FDA data
      const fdaData = {
        brandName: result.openfda?.brand_name?.[0] || medicationName,
        genericName: result.openfda?.generic_name?.[0] || "",
        activeIngredient: result.active_ingredient?.[0] || "",
        purpose: result.purpose?.[0] || "",
        warnings: result.warnings || [],
        sideEffects: result.adverse_reactions || [],
        dosageAndAdministration: result.dosage_and_administration?.[0] || "",
        indicationsAndUsage: result.indications_and_usage?.[0] || "",
        doNotUse: result.do_not_use || [],
        askDoctor: result.ask_doctor || [],
        stopUse: result.stop_use || [],
      };

      // Step 3: Save to cache
      await addDoc(collection(db, "medicationCache"), {
        searchTerm: medicationName.toLowerCase(),
        fdaData: fdaData,
        cachedAt: Timestamp.now(),
      });

      return { success: true, data: fdaData, fromCache: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Add medication with FDA data
  addMedicationWithFDA: async (userId, medicationName, scheduleData) => {
    try {
      // Validate schedule data before proceeding
      const validationErrors = validateScheduleData(scheduleData);
      if (validationErrors.length > 0) {
        return { 
          success: false, 
          error: `Validation failed: ${validationErrors.join('; ')}` 
        };
      }

      // Fetch FDA data first
      const fdaResult = await medicationService.searchMedicationFromFDA(
        medicationName
      );

      if (!fdaResult.success) {
        return { success: false, error: "Could not fetch medication info" };
      }

      // Convert dot notation to nested structure for storage
      const scheduleForStorage = {
        type: scheduleData['schedule.type'],
        times: scheduleData['schedule.times'],
        frequency: scheduleData['schedule.frequency'],
      };

      console.log('scheduleData received:', JSON.stringify(scheduleData, null, 2));
      console.log('scheduleForStorage:', JSON.stringify(scheduleForStorage, null, 2));

      // Add interval-specific fields if present
      if (scheduleData['schedule.startTime']) {
        scheduleForStorage.startTime = scheduleData['schedule.startTime'];
      }
      if (scheduleData['schedule.dosesPerDay']) {
        scheduleForStorage.dosesPerDay = scheduleData['schedule.dosesPerDay'];
      }
      if (scheduleData['schedule.hoursBetweenDoses']) {
        scheduleForStorage.hoursBetweenDoses = scheduleData['schedule.hoursBetweenDoses'];
      }

      const durationForStorage = {
        type: scheduleData['duration.type'],
      };
      if (scheduleData['duration.days']) {
        durationForStorage.days = scheduleData['duration.days'];
      }

      // Initialize today's status for all scheduled times
      const today = medicationService.getTodayDateString();
      const todayStatus = {};
      if (scheduleData['schedule.times']) {
        scheduleData['schedule.times'].forEach(time => {
          todayStatus[time] = 'pending';
        });
      }

      // Build medication document
      const medicationDoc = {
        userId,
        medicationName: medicationName.toLowerCase(),
        fdaData: fdaResult.data,
        dosage: scheduleData.dosage,
        schedule: scheduleForStorage,
        duration: durationForStorage,
        streak: 0,
        isActive: true,
        todayStatus: todayStatus,
        statusDate: today,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add refill reminder if present
      if (scheduleData.refillReminder) {
        medicationDoc.refillReminder = scheduleData.refillReminder;
      }

      // Save medication with FDA data
      const docRef = await addDoc(collection(db, "medications"), medicationDoc);

      console.log('Saved medication document:', JSON.stringify(medicationDoc, null, 2));

      return {
        success: true,
        id: docRef.id,
        fdaData: fdaResult.data,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Add new medication manually
  addMedication: async (userId, medicationData) => {
    try {
      const docRef = await addDoc(collection(db, "medications"), {
        userId,
        ...medicationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get all medications for a user
  getUserMedications: async (userId) => {
    try {
      const q = query(
        collection(db, "medications"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const medications = [];
      querySnapshot.forEach((doc) => {
        medications.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, medications };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Listen to medication changes in real-time
  subscribeToMedications: (userId, callback) => {
    const q = query(
      collection(db, "medications"),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const medications = [];
      querySnapshot.forEach((doc) => {
        medications.push({ id: doc.id, ...doc.data() });
      });
      callback(medications);
    });
  },

  // Update medication
  updateMedication: async (medicationId, updates) => {
    try {
      // If updates contain schedule data, validate it
      if (updates.dosage || updates['schedule.type'] || updates['schedule.times']) {
        const validationErrors = validateScheduleData(updates);
        if (validationErrors.length > 0) {
          return { 
            success: false, 
            error: `Validation failed: ${validationErrors.join('; ')}` 
          };
        }
      }

      const medicationRef = doc(db, "medications", medicationId);
      await updateDoc(medicationRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete medication
  deleteMedication: async (medicationId) => {
    try {
      await deleteDoc(doc(db, "medications", medicationId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Record medication taken or skipped
  recordMedicationTaken: async (medicationId, status) => {
    try {
      const docRef = await addDoc(collection(db, "medicationLogs"), {
        medicationId,
        status, // 'taken' or 'skipped'
        timestamp: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update status for a specific medication time
  updateMedicationTimeStatus: async (medicationId, time, status) => {
    try {
      const today = medicationService.getTodayDateString();
      const medicationRef = doc(db, "medications", medicationId);
      
      // Update the todayStatus object for this specific time
      const updateData = {
        [`todayStatus.${time}`]: status,
        statusDate: today,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(medicationRef, updateData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Reset all medication statuses to pending for a new day
  resetDailyStatuses: async (userId) => {
    try {
      const today = medicationService.getTodayDateString();
      const medsResult = await medicationService.getUserMedications(userId);
      
      if (!medsResult.success) {
        return { success: false, error: 'Could not fetch medications' };
      }

      const updates = [];
      for (const med of medsResult.medications) {
        // Check if status needs to be reset (different day)
        if (med.statusDate !== today) {
          const todayStatus = {};
          if (med.schedule?.times) {
            med.schedule.times.forEach(time => {
              todayStatus[time] = 'pending';
            });
          }
          
          const medicationRef = doc(db, "medications", med.id);
          updates.push(
            updateDoc(medicationRef, {
              todayStatus,
              statusDate: today,
              updatedAt: serverTimestamp(),
            })
          );
        }
      }

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ========== Daily Medication Log Methods ==========

  // Get today's date in YYYY-MM-DD format
  getTodayDateString: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // Get yesterday's date in YYYY-MM-DD format
  getYesterdayDateString: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // Get or create daily log for a specific date
  getDailyLog: async (userId, date) => {
    try {
      const q = query(
        collection(db, "dailyLogs"),
        where("userId", "==", userId),
        where("date", "==", date)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        return {
          success: true,
          log: {
            id: snapshot.docs[0].id,
            ...docData,
          },
        };
      }

      // If no log exists for this date, return empty log structure
      return {
        success: true,
        log: {
          userId,
          date,
          medications: [],
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Initialize daily log with all medications for the day
  initializeDailyLog: async (userId, date, medications) => {
    try {
      // Check if log already exists
      const existingLog = await medicationService.getDailyLog(userId, date);
      if (existingLog.log && 'id' in existingLog.log && existingLog.log.id) {
        return { success: true, log: existingLog.log };
      }

      // Create new daily log with all scheduled medications
      const medicationEntries = [];
      medications.forEach((med) => {
        const times = med.schedule?.times || [];
        times.forEach((time) => {
          medicationEntries.push({
            medicationId: med.id,
            scheduledTime: time,
            status: "pending",
          });
        });
      });

      const docRef = await addDoc(collection(db, "dailyLogs"), {
        userId,
        date,
        medications: medicationEntries,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        log: {
          id: docRef.id,
          userId,
          date,
          medications: medicationEntries,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update medication status in daily log
  updateMedicationStatus: async (
    userId,
    date,
    medicationId,
    scheduledTime,
    status
  ) => {
    try {
      // Get the daily log
      const q = query(
        collection(db, "dailyLogs"),
        where("userId", "==", userId),
        where("date", "==", date)
      );
      const snapshot = await getDocs(q);

      let logId;
      let medications = [];

      if (!snapshot.empty) {
        // Log exists, update it
        logId = snapshot.docs[0].id;
        medications = snapshot.docs[0].data().medications || [];
      }

      // Find and update the specific medication entry
      const medIndex = medications.findIndex(
        (med) =>
          med.medicationId === medicationId &&
          med.scheduledTime === scheduledTime
      );

      if (medIndex >= 0) {
        // Update existing entry
        medications[medIndex] = {
          ...medications[medIndex],
          status,
          takenAt: status === "taken" ? new Date().toISOString() : null,
        };
      } else {
        // Add new entry
        medications.push({
          medicationId,
          scheduledTime,
          status,
          takenAt: status === "taken" ? new Date().toISOString() : null,
        });
      }

      if (logId) {
        // Update existing document
        const logRef = doc(db, "dailyLogs", logId);
        await updateDoc(logRef, {
          medications,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new document
        await addDoc(collection(db, "dailyLogs"), {
          userId,
          date,
          medications,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Check previous day's completion and update streaks
  checkAndUpdateStreaks: async (userId) => {
    try {
      const yesterday = medicationService.getYesterdayDateString();
      const today = medicationService.getTodayDateString();

      // Get all user medications
      const medsResult = await medicationService.getUserMedications(userId);
      if (!medsResult.success) {
        return { success: false, error: "Could not fetch medications" };
      }

      // Check each medication's completion status for yesterday
      const updates = [];
      for (const med of medsResult.medications) {
        const scheduledTimes = med.schedule?.times || [];
        
        // If statusDate is yesterday, check if all doses were taken
        if (med.statusDate === yesterday && med.todayStatus) {
          const allTaken = scheduledTimes.every((time) => {
            return med.todayStatus[time] === "taken";
          });

          const currentStreak = med.streak || 0;
          const newStreak = allTaken ? currentStreak + 1 : 0;

          if (newStreak !== currentStreak) {
            updates.push(
              medicationService.updateMedication(med.id, { streak: newStreak })
            );
          }
        } else if (med.statusDate !== today && med.statusDate !== yesterday) {
          // If status is from an older date (user didn't use app yesterday), reset streak
          if (med.streak !== 0) {
            updates.push(
              medicationService.updateMedication(med.id, { streak: 0 })
            );
          }
        }
      }

      // Execute all streak updates
      if (updates.length > 0) {
        await Promise.all(updates);
      }

      return {
        success: true,
        message: "Streaks updated successfully",
        processedDate: yesterday,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
