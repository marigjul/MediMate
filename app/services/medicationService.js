import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const FDA_API_URL = "https://api.fda.gov/drug/label.json";
const CACHE_DURATION_DAYS = 30;

export const medicationService = {
  // Search for medication in OpenFDA API with caching
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
          console.log("✅ Using cached FDA data");
          return { success: true, data: cachedData.fdaData, fromCache: true };
        }
      }

      // Step 2: If not in cache or outdated, fetch from FDA API
      console.log("🌐 Fetching from FDA API...");
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
      console.error("FDA API Error:", error);
      return { success: false, error: error.message };
    }
  },

  // Add medication with FDA data
  addMedicationWithFDA: async (userId, medicationName, scheduleData) => {
    try {
      // Fetch FDA data first
      const fdaResult = await medicationService.searchMedicationFromFDA(
        medicationName
      );

      if (!fdaResult.success) {
        return { success: false, error: "Could not fetch medication info" };
      }

      // Save medication with FDA data
      const docRef = await addDoc(collection(db, "medications"), {
        userId,
        medicationName: medicationName.toLowerCase(),
        fdaData: fdaResult.data,
        schedule: scheduleData,
        streak: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

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
};
