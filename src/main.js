// Main Application Controller with Firebase Auth & Firestore Integration
import { getUserData, saveUserData, setCurrentUid } from './utils/storage.js';
import { soundManager } from './audio/soundManager.js';
import { loginWithGoogle, loginAnonymouslyUser, logoutUser, subscribeAuthState } from './firebase/authService.js';
import { fetchUserDataFromFirestore, syncUserDataToFirestore } from './firebase/dbService.js';
import { BubbleMatchGame } from './games/bubbleMatch.js';
import { BlockMatchGame } from './games/blockMatch.js';
import { SpeedQuizGame } from './games/speedQuiz.js';
import { BossRaidGame } from './boss/bossRaid.js';
import { HallOfFame } from './leaderboard/hallOfFame.js';

class App {
  constructor() {
    this.userData = getUserData();
    this.activeGame = null;
    this.currentUser = null;
  }

  init() {
    this.updateHeaderUI();
    this.bindEvents();
    this.initFirebaseAuth();
  }

  initFirebaseAuth() {
    subscribeAuthState(async (user) => {
      this.currentUser = user;
      const googleBtn = document.getElementById('google-login-btn');
      const anonBtn = document.getElementById('anon-login-btn');
      const userStatusPill = document.getElementById('user-status-pill');
      const displayNameElem = document.getElementById('user-display-name');

      if (user) {
        setCurrentUid(user.uid);

        // Hide login buttons, show user status pill
        if (googleBtn) googleBtn.classList.add('hidden');
        if (anonBtn) anonBtn.classList.add('hidden');
        if (userStatusPill) userStatusPill.classList.remove('hidden');

        const isAnon = user.isAnonymous;
        const name = isAnon ? '익명 플레이어 👤' : (user.displayName || '구글 사용자 🔍');
        if (displayNameElem) displayNameElem.innerText = name;

        // Try syncing remote Firestore user data
        const remoteData = await fetchUserDataFromFirestore(user.uid);
        if (remoteData) {
          this.userData.gold = Math.max(this.userData.gold, remoteData.gold || 0);
          this.userData.totalClears = Math.max(this.userData.totalClears, remoteData.clears || 0);
          if (remoteData.nickname && !isAnon) {
            this.userData.nickname = remoteData.nickname;
          }
          saveUserData(this.userData);
        } else {
          if (!isAnon && user.displayName) {
            this.userData.nickname = user.displayName;
          }
          syncUserDataToFirestore(user.uid, this.userData);
        }
        this.updateHeaderUI();

      } else {
        setCurrentUid(null);
        if (googleBtn) googleBtn.classList.remove('hidden');
        if (anonBtn) anonBtn.classList.remove('hidden');
        if (userStatusPill) userStatusPill.classList.add('hidden');
      }
    });
  }

  updateHeaderUI() {
    this.userData = getUserData();
    const goldElem = document.getElementById('lobby-gold-val');
    const clearsElem = document.getElementById('lobby-clears-val');

    if (goldElem) goldElem.innerText = this.userData.gold;
    if (clearsElem) clearsElem.innerText = this.userData.totalClears;
  }

  bindEvents() {
    // Google Login button
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        soundManager.playPop();
        try {
          await loginWithGoogle();
        } catch (err) {
          alert('구글 로그인 중 알림: ' + err.message);
        }
      });
    }

    // Anonymous Login button
    const anonBtn = document.getElementById('anon-login-btn');
    if (anonBtn) {
      anonBtn.addEventListener('click', async () => {
        soundManager.playPop();
        try {
          await loginAnonymouslyUser();
        } catch (err) {
          alert('익명 로그인 중 알림: ' + err.message);
        }
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        soundManager.playPop();
        await logoutUser();
      });
    }

    // Sound toggle button
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundManager.soundEnabled = !soundManager.soundEnabled;
        soundBtn.innerText = soundManager.soundEnabled ? '🔊' : '🔇';
      });
    }

    // Hall of Fame button
    const hofBtn = document.getElementById('hof-open-btn');
    if (hofBtn) {
      hofBtn.addEventListener('click', () => {
        soundManager.playPop();
        this.openHallOfFame();
      });
    }

    // Game 1 Start
    const game1Btn = document.getElementById('start-game-1');
    if (game1Btn) {
      game1Btn.addEventListener('click', () => {
        soundManager.playPop();
        this.startGame('bubble');
      });
    }

    // Game 2 Start
    const game2Btn = document.getElementById('start-game-2');
    if (game2Btn) {
      game2Btn.addEventListener('click', () => {
        soundManager.playPop();
        this.startGame('block');
      });
    }

    // Game 3 Start
    const game3Btn = document.getElementById('start-game-3');
    if (game3Btn) {
      game3Btn.addEventListener('click', () => {
        soundManager.playPop();
        this.startGame('speed');
      });
    }

    // Boss Raid Start
    const bossBtn = document.getElementById('start-boss-btn');
    if (bossBtn) {
      bossBtn.addEventListener('click', () => {
        soundManager.playPop();
        this.startBossRaid();
      });
    }
  }

  showLobbyView() {
    const lobbyView = document.getElementById('lobby-view');
    const stageView = document.getElementById('game-stage-view');

    if (lobbyView) lobbyView.classList.remove('hidden');
    if (stageView) {
      stageView.classList.add('hidden');
      stageView.innerHTML = '';
    }
    this.updateHeaderUI();
  }

  showStageView() {
    const lobbyView = document.getElementById('lobby-view');
    const stageView = document.getElementById('game-stage-view');

    if (lobbyView) lobbyView.classList.add('hidden');
    if (stageView) stageView.classList.remove('hidden');
  }

  startGame(gameType) {
    this.showStageView();
    const stageContainer = document.getElementById('game-stage-view');

    const handleMiniGameComplete = (score, goldEarned) => {
      if (goldEarned > 0) {
        this.userData.gold += goldEarned;
        this.userData.totalClears += 1;
        saveUserData(this.userData);
      }
      this.showLobbyView();
    };

    if (gameType === 'bubble') {
      this.activeGame = new BubbleMatchGame(stageContainer, handleMiniGameComplete);
    } else if (gameType === 'block') {
      this.activeGame = new BlockMatchGame(stageContainer, handleMiniGameComplete);
    } else if (gameType === 'speed') {
      this.activeGame = new SpeedQuizGame(stageContainer, handleMiniGameComplete);
    }

    this.activeGame.start();
  }

  startBossRaid() {
    this.showStageView();
    const stageContainer = document.getElementById('game-stage-view');

    const handleBossComplete = (won, rewardGold, nextAction) => {
      this.updateHeaderUI();

      if (nextAction === 'hof') {
        this.showLobbyView();
        this.openHallOfFame();
      } else {
        this.showLobbyView();
      }
    };

    const bossGame = new BossRaidGame(stageContainer, handleBossComplete);
    bossGame.start();
  }

  async openHallOfFame() {
    const container = document.getElementById('hof-modal-container');
    const hof = new HallOfFame(container, () => {
      container.innerHTML = '';
      this.updateHeaderUI();
    });
    await hof.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
