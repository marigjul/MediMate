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
} from "firebase/firestore";
import { db } from "../config/firebase";

export const medicationService = {
  // Add new medication
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

  // Record medication taken
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
