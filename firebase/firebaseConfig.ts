// Firebase configuration for Expo Go
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';

// Firebase configuration - Using values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDZWFmZ3kBHCJBW3HS4CmYuJcMIGjdEceU",
  authDomain: "fir-saathi-e3c0c.firebaseapp.com",
  projectId: "fir-saathi-e3c0c",
  storageBucket: "fir-saathi-e3c0c.appspot.com",
  messagingSenderId: "261701233351",
  appId: "1:261701233351:web:c5655984e4a9e5e540ece2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export collection references
const getCollection = (collectionName: string) => {
  return collection(db, collectionName);
};

export const sheltersCollection = getCollection('shelters');
export const ratingsCollection = getCollection('ratings');
export const safetyTipsCollection = getCollection('safetyTips');
export const alertsCollection = getCollection('alerts');

// Export the initialized instances
export { app, auth, db };