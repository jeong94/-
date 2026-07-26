// Firebase Firestore Service (User Profiles & Global Hall of Fame)
import { db, isFirebaseConfigured } from './config.js';
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export async function syncUserDataToFirestore(uid, userData) {
  if (!isFirebaseConfigured || !db || !uid) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, 'users', uid);

    const docData = {
      uid,
      nickname: userData.nickname || '꼬마 수학자',
      gold: userData.gold || 0,
      clears: userData.totalClears || 0,
      bossVictories: userData.bossVictories || 0,
      updatedAt: today
    };

    await setDoc(userRef, docData, { merge: true });

    // Also update global rankings document
    const rankRef = doc(db, 'rankings', uid);
    await setDoc(rankRef, {
      name: userData.nickname || '꼬마 수학자',
      gold: userData.gold || 0,
      clears: userData.totalClears || 0,
      date: today
    }, { merge: true });

  } catch (error) {
    console.error("Firestore sync error:", error);
  }
}

export async function fetchUserDataFromFirestore(uid) {
  if (!isFirebaseConfigured || !db || !uid) return null;

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error("Firestore fetch error:", error);
    return null;
  }
}

export async function fetchGlobalGoldRankings() {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const q = query(collection(db, 'rankings'), orderBy('gold', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    const rankings = [];
    querySnapshot.forEach((docSnap) => {
      rankings.push(docSnap.data());
    });
    return rankings.length > 0 ? rankings : null;
  } catch (error) {
    console.error("Firestore Gold Rankings fetch error:", error);
    return null;
  }
}

export async function fetchGlobalClearRankings() {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const q = query(collection(db, 'rankings'), orderBy('clears', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    const rankings = [];
    querySnapshot.forEach((docSnap) => {
      rankings.push(docSnap.data());
    });
    return rankings.length > 0 ? rankings : null;
  } catch (error) {
    console.error("Firestore Clear Rankings fetch error:", error);
    return null;
  }
}
