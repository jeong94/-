// Mini Game 1: 10 짝꿍 방울 터뜨리기 (Bubble Pop 10)
import { soundManager } from '../audio/soundManager.js';
import { spawnStarPop, spawnConfetti } from '../utils/confetti.js';

export class BubbleMatchGame {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete; // callback(score, goldEarned)
    this.timer = 25;
    this.timerInterval = null;
    this.score = 0;
    this.goldEarned = 0;
    this.pairsPopped = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.selectedBubble = null;
    this.bubbles = [];
  }

  start() {
    this.renderLayout();
    this.spawnInitialBubbles();
    this.startTimer();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="game-card bubble-game-card">
        <div class="game-header">
          <div class="game-header-nav">
            <button class="back-to-lobby-btn" id="bubble-back-lobby-top">🏠 로비로 돌아가기</button>
            <div class="game-title-badge">🟢 10 짝꿍 방울 터뜨리기</div>
          </div>
          <div class="game-stats">
            <div class="stat-pill timer-pill">⏱️ <span id="bubble-timer">25</span>초</div>
            <div class="stat-pill score-pill">⭐ <span id="bubble-score">0</span>점</div>
            <div class="stat-pill gold-pill">🪙 +<span id="bubble-gold">0</span></div>
          </div>
        </div>

        <div class="game-instruction">
          합해서 <strong>10</strong>이 되는 숫자 방울 2개를 찾아 터뜨려주세요!
        </div>

        <div class="combo-banner" id="bubble-combo-banner">콤보 x1!</div>

        <!-- Bubble Play Field -->
        <div class="bubble-field" id="bubble-field"></div>

        <button class="btn btn-secondary quit-btn" id="bubble-quit-btn">🏠 게임 나가기 (로비로)</button>
      </div>
    `;

    const handleExit = () => {
      soundManager.playPop();
      this.stop();
      this.onComplete(0, 0);
    };

    document.getElementById('bubble-back-lobby-top').addEventListener('click', handleExit);
    document.getElementById('bubble-quit-btn').addEventListener('click', handleExit);
  }

  spawnInitialBubbles() {
    const field = document.getElementById('bubble-field');
    field.innerHTML = '';
    this.bubbles = [];

    // Provide 12 bubbles (6 pairs summing to 10)
    const pairs = [
      [1, 9], [2, 8], [3, 7], [4, 6], [5, 5], [2, 8]
    ];

    const pool = pairs.flat().sort(() => Math.random() - 0.5);

    pool.forEach((val) => {
      this.createBubble(val);
    });
  }

  createBubble(numValue) {
    const field = document.getElementById('bubble-field');
    if (!field) return;

    const bubbleElem = document.createElement('div');
    bubbleElem.className = `bubble-item bubble-val-${numValue}`;
    bubbleElem.dataset.val = numValue;
    bubbleElem.dataset.id = Math.random().toString(36).substring(2, 9);
    
    bubbleElem.innerHTML = `
      <span class="bubble-num">${numValue}</span>
      <div class="bubble-shine"></div>
    `;

    bubbleElem.style.animationDelay = `${Math.random() * 2}s`;

    bubbleElem.addEventListener('click', (e) => this.handleBubbleClick(bubbleElem, numValue, e));
    field.appendChild(bubbleElem);
    this.bubbles.push(bubbleElem);
  }

  handleBubbleClick(bubbleElem, val, event) {
    soundManager.playPop();

    if (this.selectedBubble === bubbleElem) {
      bubbleElem.classList.remove('selected');
      this.selectedBubble = null;
      return;
    }

    if (!this.selectedBubble) {
      this.selectedBubble = bubbleElem;
      bubbleElem.classList.add('selected');
    } else {
      const prevVal = parseInt(this.selectedBubble.dataset.val);
      const prevElem = this.selectedBubble;
      
      if (prevVal + val === 10) {
        soundManager.playSuccess();
        const rect = bubbleElem.getBoundingClientRect();
        spawnStarPop(rect.left + rect.width / 2, rect.top, document.body);

        prevElem.classList.add('pop-success');
        bubbleElem.classList.add('pop-success');

        this.pairsPopped++;
        const addedScore = 100 * this.combo;
        const addedGold = 10 + (this.combo > 1 ? 5 : 0);

        this.score += addedScore;
        this.goldEarned += addedGold;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        this.updateUI();

        setTimeout(() => {
          prevElem.remove();
          bubbleElem.remove();
          this.selectedBubble = null;
          
          const newPair = this.getRandomTenPair();
          this.createBubble(newPair[0]);
          this.createBubble(newPair[1]);
        }, 300);

      } else {
        soundManager.playWrong();
        prevElem.classList.add('pop-wrong');
        bubbleElem.classList.add('pop-wrong');

        this.combo = 1;
        this.updateUI();

        setTimeout(() => {
          prevElem.classList.remove('selected', 'pop-wrong');
          bubbleElem.classList.remove('selected', 'pop-wrong');
          this.selectedBubble = null;
        }, 400);
      }
    }
  }

  getRandomTenPair() {
    const n = Math.floor(Math.random() * 9) + 1;
    return [n, 10 - n];
  }

  updateUI() {
    const scoreElem = document.getElementById('bubble-score');
    const goldElem = document.getElementById('bubble-gold');
    const comboElem = document.getElementById('bubble-combo-banner');

    if (scoreElem) scoreElem.innerText = this.score;
    if (goldElem) goldElem.innerText = this.goldEarned;
    if (comboElem) {
      comboElem.innerText = `콤보 x${this.combo}!`;
      comboElem.classList.add('bounce');
      setTimeout(() => comboElem.classList.remove('bounce'), 300);
    }
  }

  startTimer() {
    const timerElem = document.getElementById('bubble-timer');
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (timerElem) timerElem.innerText = this.timer;

      if (this.timer <= 0) {
        this.finishGame();
      }
    }, 1000);
  }

  stop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  finishGame() {
    this.stop();
    soundManager.playVictory();
    spawnConfetti(this.container, 50);

    this.container.innerHTML = `
      <div class="game-card result-card">
        <div class="result-header">
          <div class="result-badge">🎉 25초 종료!</div>
          <h2>10 짝꿍 방울 터뜨리기 성공!</h2>
        </div>

        <div class="result-stats">
          <div class="result-stat-box">
            <span class="label">터뜨린 짝꿍</span>
            <span class="value">${this.pairsPopped}쌍</span>
          </div>
          <div class="result-stat-box">
            <span class="label">최대 콤보</span>
            <span class="value">${this.maxCombo} Combo</span>
          </div>
          <div class="result-stat-box highlight">
            <span class="label">획득 골드</span>
            <span class="value">🪙 +${this.goldEarned} Gold</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary" id="bubble-restart-btn">🔄 다시 도전</button>
          <button class="btn btn-success" id="bubble-finish-btn">🏠 로비로 돌아가기</button>
        </div>
      </div>
    `;

    document.getElementById('bubble-restart-btn').addEventListener('click', () => {
      soundManager.playPop();
      this.start();
    });

    document.getElementById('bubble-finish-btn').addEventListener('click', () => {
      soundManager.playPop();
      this.onComplete(this.score, this.goldEarned);
    });
  }
}
