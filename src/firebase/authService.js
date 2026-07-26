// Firebase Authentication Service (Google & Anonymous Auth)
import { auth, googleProvider, isFirebaseConfigured } from './config.js';
import { signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';

export async function loginWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase가 아직 설정되지 않았습니다. .env 환경변수를 확인해주세요.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Login Error:", error);
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
