// Firebase Configuration & Initialization with Automatic Fallbacks
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDAb7EhxCKi5gp9CqvpZwkvN5-urSI0iWM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tenbubble-3e1d3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tenbubble-3e1d3",
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
