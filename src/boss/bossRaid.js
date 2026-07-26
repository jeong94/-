// Boss Raid: 10 만들기 보스전 (Ten-Ten Slime Boss)
import { soundManager } from '../audio/soundManager.js';
import { spawnConfetti, spawnStarPop } from '../utils/confetti.js';
import { getUserData, saveUserData } from '../utils/storage.js';

export class BossRaidGame {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete; // callback(won, bossRewardGold, nextAction)
    this.bossHp = 100;
    this.playerHp = 100;
    this.currentQuestionIdx = 0;
    this.totalQuestions = 10;
    this.timer = 10;
    this.timerInterval = null;
    this.questionList = [];
    this.bossRewardGold = 200;
  }

  start() {
    const userData = getUserData();
    if (userData.gold < 50) {
      alert('골드가 부족합니다! 미니게임을 클리어하여 50 골드를 모아보세요 🪙');
      this.onComplete(false, 0, 'lobby');
      return;
    }

    userData.gold -= 50;
    saveUserData(userData);

    this.generate10Questions();
    this.renderLayout();
    this.loadQuestion(0);
  }

  generate10Questions() {
    this.questionList = [];
    for (let i = 1; i <= 10; i++) {
      const type = (i % 4);
      let text = '';
      let correct = 0;

      if (type === 1) {
        const a = Math.floor(Math.random() * 9) + 1;
        correct = 10 - a;
        text = `${a} + [ ? ] = 10`;
      } else if (type === 2) {
        const total = Math.floor(Math.random() * 8) + 11;
        correct = total - 10;
        text = `${total} - [ ? ] = 10`;
      } else if (type === 3) {
        const a = Math.floor(Math.random() * 5) + 1;
        const b = Math.floor(Math.random() * (9 - a)) + 1;
        correct = 10 - (a + b);
        text = `${a} + ${b} + [ ? ] = 10`;
      } else {
        const a = Math.floor(Math.random() * 8) + 1;
        correct = 10 - a;
        text = `[ ? ] + ${a} = 10`;
      }

      const optSet = new Set([correct]);
      while (optSet.size < 4) {
        let dummy = correct + (Math.floor(Math.random() * 7) - 3);
        if (dummy > 0 && dummy !== correct && dummy <= 20) {
          optSet.add(dummy);
        }
      }
      const options = Array.from(optSet).sort(() => Math.random() - 0.5);

      this.questionList.push({
        num: i,
        text,
        correct,
        options
      });
    }
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="game-card boss-game-card">
        <div class="boss-header">
          <div class="game-header-nav">
            <button class="back-to-lobby-btn" id="boss-back-lobby-top">🏠 로비로 돌아가기</button>
            <div class="boss-title-tag">👹 보스 레이드 스테이지</div>
          </div>
          <div class="boss-stage-progress">문제 <span id="boss-q-num">1</span> / 10</div>
        </div>

        <!-- Boss Visual Stage -->
        <div class="boss-stage-visual">
          <div class="boss-character" id="boss-character">
            <div class="boss-avatar">👑🟢</div>
            <div class="boss-name">슬라임 대장 텐텐</div>
            <div class="hp-bar-container">
              <div class="hp-bar-fill boss-hp-fill" id="boss-hp-bar" style="width: 100%;"></div>
            </div>
            <div class="hp-text"><span id="boss-hp-val">100</span> / 100 HP</div>
          </div>

          <!-- Player Status -->
          <div class="player-stage-status">
            <div class="player-name">🛡️ 나의 HP</div>
            <div class="hp-bar-container">
              <div class="hp-bar-fill player-hp-fill" id="player-hp-bar" style="width: 100%;"></div>
            </div>
            <div class="hp-text"><span id="player-hp-val">100</span> / 100 HP</div>
          </div>
        </div>

        <!-- Question Timer & Card -->
        <div class="boss-quiz-area">
          <div class="boss-timer-circle" id="boss-timer">10</div>
          <div class="boss-question-text" id="boss-q-text">1 + [ ? ] = 10</div>
        </div>

        <!-- Options -->
        <div class="boss-options-grid" id="boss-options-grid"></div>

        <button class="btn btn-secondary quit-btn" id="boss-quit-btn">🏠 게임 나가기 (로비로)</button>
      </div>
    `;

    const handleExit = () => {
      soundManager.playPop();
      this.stopTimer();
      this.onComplete(false, 0, 'lobby');
    };

    document.getElementById('boss-back-lobby-top').addEventListener('click', handleExit);
    document.getElementById('boss-quit-btn').addEventListener('click', handleExit);
  }

  loadQuestion(idx) {
    if (idx >= 10 || this.bossHp <= 0 || this.playerHp <= 0) {
      this.checkEndConditions();
      return;
    }

    this.currentQuestionIdx = idx;
    const q = this.questionList[idx];

    document.getElementById('boss-q-num').innerText = idx + 1;
    document.getElementById('boss-q-text').innerText = q.text;

    const optGrid = document.getElementById('boss-options-grid');
    optGrid.innerHTML = '';

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'boss-opt-btn';
      btn.innerText = opt;
      btn.addEventListener('click', (e) => this.handleAnswer(opt, btn, e));
      optGrid.appendChild(btn);
    });

    this.startQuestionTimer();
  }

  startQuestionTimer() {
    this.stopTimer();
    this.timer = 10;
    const timerElem = document.getElementById('boss-timer');
    if (timerElem) timerElem.innerText = this.timer;

    this.timerInterval = setInterval(() => {
      this.timer--;
      if (timerElem) timerElem.innerText = this.timer;

      if (this.timer <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  handleAnswer(chosenOpt, btnElem, event) {
    this.stopTimer();
    const q = this.questionList[this.currentQuestionIdx];
    const isCorrect = (chosenOpt === q.correct);

    const bossAvatar = document.getElementById('boss-character');

    if (isCorrect) {
      soundManager.playBossHit();
      const rect = btnElem.getBoundingClientRect();
      spawnStarPop(rect.left + rect.width / 2, rect.top, document.body);

      btnElem.classList.add('boss-opt-correct');
      if (bossAvatar) bossAvatar.classList.add('boss-hit-shake');

      this.bossHp = Math.max(0, this.bossHp - 10);
      this.updateHpBars();

      setTimeout(() => {
        if (bossAvatar) bossAvatar.classList.remove('boss-hit-shake');
        this.loadQuestion(this.currentQuestionIdx + 1);
      }, 500);

    } else {
      soundManager.playWrong();
      btnElem.classList.add('boss-opt-wrong');

      this.playerHp = Math.max(0, this.playerHp - 20);
      this.updateHpBars();

      setTimeout(() => {
        this.loadQuestion(this.currentQuestionIdx + 1);
      }, 500);
    }
  }

  handleTimeout() {
    this.stopTimer();
    soundManager.playWrong();

    this.playerHp = Math.max(0, this.playerHp - 20);
    this.updateHpBars();

    setTimeout(() => {
      this.loadQuestion(this.currentQuestionIdx + 1);
    }, 500);
  }

  updateHpBars() {
    const bossHpBar = document.getElementById('boss-hp-bar');
    const bossHpVal = document.getElementById('boss-hp-val');
    const playerHpBar = document.getElementById('player-hp-bar');
    const playerHpVal = document.getElementById('player-hp-val');

    if (bossHpBar) bossHpBar.style.width = `${this.bossHp}%`;
    if (bossHpVal) bossHpVal.innerText = this.bossHp;
    if (playerHpBar) playerHpBar.style.width = `${this.playerHp}%`;
    if (playerHpVal) playerHpVal.innerText = this.playerHp;
  }

  checkEndConditions() {
    this.stopTimer();
    const isVictory = (this.bossHp <= 0 || (this.currentQuestionIdx >= 10 && this.playerHp > 0));

    if (isVictory) {
      soundManager.playVictory();
      spawnConfetti(this.container, 70);

      const userData = getUserData();
      userData.gold += this.bossRewardGold;
      userData.bossVictories = (userData.bossVictories || 0) + 1;
      saveUserData(userData);

      this.container.innerHTML = `
        <div class="game-card result-card boss-win-card">
          <div class="result-header">
            <div class="result-badge win-badge">👑 보스 퇴치 성공!</div>
            <h2>슬라임 대장 텐텐을 물리쳤어요!</h2>
          </div>

          <div class="boss-victory-banner">
            <div class="trophy-icon">🏆</div>
            <p>10 만들기 연산 마스터 칭호 획득!</p>
          </div>

          <div class="result-stats">
            <div class="result-stat-box highlight">
              <span class="label">보스 클리어 보상</span>
              <span class="value">🪙 +${this.bossRewardGold} Gold</span>
            </div>
            <div class="result-stat-box">
              <span class="label">남은 나의 HP</span>
              <span class="value">❤️ ${this.playerHp} HP</span>
            </div>
          </div>

          <div class="result-actions">
            <button class="btn btn-primary" id="boss-hof-btn">🏆 명예의 전당 보기</button>
            <button class="btn btn-success" id="boss-lobby-btn">🏠 로비로 돌아가기</button>
          </div>
        </div>
      `;

      document.getElementById('boss-hof-btn').addEventListener('click', () => {
        soundManager.playPop();
        this.onComplete(true, this.bossRewardGold, 'hof');
      });

      document.getElementById('boss-lobby-btn').addEventListener('click', () => {
        soundManager.playPop();
        this.onComplete(true, this.bossRewardGold, 'lobby');
      });

    } else {
      soundManager.playWrong();

      this.container.innerHTML = `
        <div class="game-card result-card boss-fail-card">
          <div class="result-header">
            <div class="result-badge fail-badge">😢 아쉽게 패배...</div>
            <h2>슬라임 대장 텐텐의 체력이 남았어요!</h2>
          </div>

          <div class="boss-failure-msg">
            미니게임에서 연산을 좀 더 연습한 뒤 다시 도전해보세요!
          </div>

          <div class="result-actions">
            <button class="btn btn-primary" id="boss-retry-btn">🔄 다시 도전</button>
            <button class="btn btn-success" id="boss-lobby-btn">🏠 로비로 돌아가기</button>
          </div>
        </div>
      `;

      document.getElementById('boss-retry-btn').addEventListener('click', () => {
        soundManager.playPop();
        this.start();
      });

      document.getElementById('boss-lobby-btn').addEventListener('click', () => {
        soundManager.playPop();
        this.onComplete(false, 0, 'lobby');
      });
    }
  }
}
