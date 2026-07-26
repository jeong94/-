// Firebase Authentication Service (Google & Anonymous Auth)
import { auth, googleProvider, isFirebaseConfigured } from './config.js';
import { signInWithPopup, signInWithRedirect, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';

export async function loginWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase가 아직 설정되지 않았습니다. .env 환경변수를 확인해주세요.');
  }
  try {
    // Try Popup first
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.warn("Popup login failed, trying Redirect login fallback...", error);
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // Fallback to Redirect if popup blocked or closed
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function loginAnonymouslyUser() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase가 아직 설정되지 않았습니다.');
  }
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Anonymous Login Error:", error);
    throw error;
  }
}

export async function logoutUser() {
  if (!isFirebaseConfigured || !auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

export function subscribeAuthState(callback) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
