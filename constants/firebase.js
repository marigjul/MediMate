import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDO_fIgnUc5eb4HXYjyS0OsAGAAh91DzEI",
  authDomain: "medimate-2dfa0.firebaseapp.com",
  projectId: "medimate-2dfa0",
  storageBucket: "medimate-2dfa0.firebasestorage.app",
  messagingSenderId: "149120357986",
  appId: "1:149120357986:web:3806647473d49776a3a33b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

