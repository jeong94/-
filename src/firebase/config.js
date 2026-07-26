// Firebase Configuration & Initialization with Automatic Domain Sanitization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Sanitize authDomain in case environment variable value was mistakenly set to placeholder text
let cleanAuthDomain = rawAuthDomain;
if (!cleanAuthDomain || cleanAuthDomain.includes('vite_firebase_auth_domain') || cleanAuthDomain.includes('VITE_') || !cleanAuthDomain.includes('.')) {
  cleanAuthDomain = "tenbubble-3e1d3.firebaseapp.com";
}

let cleanApiKey = rawApiKey;
if (!cleanApiKey || cleanApiKey.includes('your_') || cleanApiKey.includes('VITE_')) {
  cleanApiKey = "AIzaSyDAb7EhxCKi5gp9CqvpZwkvN5-urSI0iWM";
}

let cleanProjectId = rawProjectId;
if (!cleanProjectId || cleanProjectId.includes('your_') || cleanProjectId.includes('VITE_')) {
  cleanProjectId = "tenbubble-3e1d3";
}

const firebaseConfig = {
  apiKey: cleanApiKey,
  authDomain: cleanAuthDomain,
  projectId: cleanProjectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tenbubble-3e1d3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "184303178532",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:184303178532:web:3a04fc955adf2b929999b1"
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn("Firebase initialization error:", err);
  }
}

export { app, auth, db, googleProvider };
