// LocalStorage & State Management with Firebase Sync Support
import { syncUserDataToFirestore } from '../firebase/dbService.js';

const STORAGE_KEYS = {
  USER_DATA: '10game_user_data_v1',
  GOLD_RANKINGS: '10game_gold_rankings_v1',
  CLEAR_RANKINGS: '10game_clear_rankings_v1',
  CURRENT_UID: '10game_current_uid_v1'
};

const DEFAULT_NPC_GOLD_RANKINGS = [
  { name: '민트토끼 🐰', gold: 1250, date: '2026-07-20' },
  { name: '수학짱민우 👦', gold: 980, date: '2026-07-21' },
  { name: '10연승지후 ⚡', gold: 850, date: '2026-07-22' },
  { name: '연산대왕수아 👑', gold: 760, date: '2026-07-23' },
  { name: '초록새싹하은 🌱', gold: 640, date: '2026-07-24' },
  { name: '스피드도현 🏃', gold: 590, date: '2026-07-24' },
  { name: '숫자박사서준 🎓', gold: 480, date: '2026-07-25' },
  { name: '퐁퐁젤리유나 🍬', gold: 410, date: '2026-07-25' },
  { name: '짝꿍왕시우 🧩', gold: 330, date: '2026-07-25' },
  { name: '말랑슬라임 🟢', gold: 250, date: '2026-07-26' }
];

const DEFAULT_NPC_CLEAR_RANKINGS = [
  { name: '민트토끼 🐰', clears: 38, date: '2026-07-20' },
  { name: '수학짱민우 👦', clears: 29, date: '2026-07-21' },
  { name: '10연승지후 ⚡', clears: 25, date: '2026-07-22' },
  { name: '연산대왕수아 👑', clears: 21, date: '2026-07-23' },
  { name: '초록새싹하은 🌱', clears: 17, date: '2026-07-24' },
  { name: '스피드도현 🏃', clears: 14, date: '2026-07-24' },
  { name: '숫자박사서준 🎓', clears: 12, date: '2026-07-25' },
  { name: '퐁퐁젤리유나 🍬', clears: 9, date: '2026-07-25' },
  { name: '짝꿍왕시우 🧩', clears: 7, date: '2026-07-25' },
  { name: '말랑슬라임 🟢', clears: 4, date: '2026-07-26' }
];

export function getUserData() {
  const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!data) {
    const initial = {
      nickname: '꼬마 수학자',
      gold: 50,
      totalClears: 0,
      bossVictories: 0
    };
    saveUserData(initial);
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return { nickname: '꼬마 수학자', gold: 50, totalClears: 0, bossVictories: 0 };
  }
}

export function saveUserData(userData) {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  updateLeaderboards(userData);

  // Sync with Firestore if logged in
  const uid = localStorage.getItem(STORAGE_KEYS.CURRENT_UID);
  if (uid) {
    syncUserDataToFirestore(uid, userData);
  }
}

export function setCurrentUid(uid) {
  if (uid) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_UID, uid);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_UID);
  }
}

export function getCurrentUid() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_UID);
}

export function getGoldRankings() {
  const data = localStorage.getItem(STORAGE_KEYS.GOLD_RANKINGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.GOLD_RANKINGS, JSON.stringify(DEFAULT_NPC_GOLD_RANKINGS));
    return DEFAULT_NPC_GOLD_RANKINGS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_NPC_GOLD_RANKINGS;
  }
}

export function getClearRankings() {
  const data = localStorage.getItem(STORAGE_KEYS.CLEAR_RANKINGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CLEAR_RANKINGS, JSON.stringify(DEFAULT_NPC_CLEAR_RANKINGS));
    return DEFAULT_NPC_CLEAR_RANKINGS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_NPC_CLEAR_RANKINGS;
  }
}

export function updateLeaderboards(userData) {
  const today = new Date().toISOString().split('T')[0];
  
  let goldRanks = getGoldRankings();
  const existingGoldIdx = goldRanks.findIndex(r => r.name === userData.nickname);
  if (existingGoldIdx >= 0) {
    if (userData.gold > goldRanks[existingGoldIdx].gold) {
      goldRanks[existingGoldIdx].gold = userData.gold;
      goldRanks[existingGoldIdx].date = today;
    }
  } else {
    goldRanks.push({ name: userData.nickname, gold: userData.gold, date: today });
  }
  goldRanks.sort((a, b) => b.gold - a.gold);
  goldRanks = goldRanks.slice(0, 10);
  localStorage.setItem(STORAGE_KEYS.GOLD_RANKINGS, JSON.stringify(goldRanks));

  let clearRanks = getClearRankings();
  const existingClearIdx = clearRanks.findIndex(r => r.name === userData.nickname);
  if (existingClearIdx >= 0) {
    if (userData.totalClears > clearRanks[existingClearIdx].clears) {
      clearRanks[existingClearIdx].clears = userData.totalClears;
      clearRanks[existingClearIdx].date = today;
    }
  } else {
    clearRanks.push({ name: userData.nickname, clears: userData.totalClears, date: today });
  }
  clearRanks.sort((a, b) => b.clears - a.clears);
  clearRanks = clearRanks.slice(0, 10);
  localStorage.setItem(STORAGE_KEYS.CLEAR_RANKINGS, JSON.stringify(clearRanks));
}
